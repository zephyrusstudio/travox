import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to adjust dates in response body by adding IST offset
 * 
 * This reverses the adjustment made in dateParserMiddleware:
 * - Dates stored in DB as UTC (12:40 UTC)
 * - Add IST offset (+5:30) when sending to client
 * - Client receives 18:10 as Date object, but displays as 12:40 IST
 * 
 * Wait, this won't work because Firestore already converts to local time...
 * 
 * Actually, let me think through this more carefully:
 * 1. Client sends "2025-01-15T12:40" (IST)
 * 2. dateParser subtracts 5:30 → Date object represents "07:10"
 * 3. Firestore saves via Timestamp.fromDate() → stores as 07:10 UTC
 * 4. Firestore reads via .toDate() → Returns Date representing 07:10 UTC → displays as 12:40 IST (CORRECT!)
 * 
 * So we DON'T need a response middleware! The dateParser alone fixes it.
 */

const IST_OFFSET_MINUTES = 330; // 5 hours 30 minutes

export function dateSerializerMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    if (body && typeof body === 'object') {
      body = adjustDatesInObject(body);
    }
    return originalJson(body);
  };
  
  next();
}

/**
 * Recursively adjust Date objects in response by adding IST offset
 */
function adjustDatesInObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    const adjusted = new Date(obj);
    adjusted.setMinutes(adjusted.getMinutes() + IST_OFFSET_MINUTES);
    return adjusted;
  }

  if (Array.isArray(obj)) {
    return obj.map(adjustDatesInObject);
  }

  if (typeof obj === 'object') {
    const adjusted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        adjusted[key] = adjustDatesInObject(obj[key]);
      }
    }
    return adjusted;
  }

  return obj;
}
