import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle date serialization in responses
 * 
 * THE FLOW:
 * 1. Firestore stores dates as UTC (e.g., 07:10 UTC for 12:40 IST)
 * 2. Firestore .toDate() creates JavaScript Date object (represents 07:10 UTC internally)
 * 3. We need to add IST offset back to get the time components the user expects
 * 4. Format as ISO without Z so client interprets as local time
 * 
 * Example:
 * - Stored in Firestore: 07:10 UTC (which is 12:40 IST)
 * - Read as Date: represents 07:10 UTC
 * - Add IST offset: 07:10 + 5:30 = 12:40
 * - Send to client: "2025-12-07T12:40:00.000" (no Z)
 * - Client displays: 12:40 IST ✓
 */

const IST_OFFSET_MINUTES = 330; // 5 hours 30 minutes

export function dateSerializerMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalJson = res.json.bind(res);
  
  res.json = function(body: any) {
    if (body && typeof body === 'object') {
      body = serializeDates(body);
    }
    return originalJson(body);
  };
  
  next();
}

/**
 * Recursively convert Date objects to ISO strings without Z suffix
 * Add IST offset so the time represents IST local time
 */
function serializeDates(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (obj instanceof Date) {
    // Add IST offset to get back to IST time
    const adjusted = new Date(obj);
    adjusted.setMinutes(adjusted.getMinutes() + IST_OFFSET_MINUTES);
    
    // Format as ISO but without Z, using UTC components of adjusted date
    const year = adjusted.getUTCFullYear();
    const month = String(adjusted.getUTCMonth() + 1).padStart(2, '0');
    const day = String(adjusted.getUTCDate()).padStart(2, '0');
    const hours = String(adjusted.getUTCHours()).padStart(2, '0');
    const minutes = String(adjusted.getUTCMinutes()).padStart(2, '0');
    const seconds = String(adjusted.getUTCSeconds()).padStart(2, '0');
    const ms = String(adjusted.getUTCMilliseconds()).padStart(3, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeDates);
  }

  if (typeof obj === 'object') {
    const serialized: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        serialized[key] = serializeDates(obj[key]);
      }
    }
    return serialized;
  }

  return obj;
}
