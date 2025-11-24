import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to automatically parse ISO date strings to Date objects in request body
 * and adjust for IST timezone.
 * 
 * THE PROBLEM:
 * - Client sends dates like "2025-01-15T12:40" (IST local time)
 * - JavaScript parses this as local time
 * - Firestore stores it as UTC (converts 12:40 IST → 07:10 UTC)
 * - When read back, it becomes 12:40 IST again (correct!)
 * 
 * BUT: We want to preserve the exact time "12:40" as UTC in the database.
 * So we subtract the IST offset (5:30) before saving.
 */

const IST_OFFSET_MINUTES = 330; // 5 hours 30 minutes

export function dateParserMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = parseObjectDates(req.body);
  }
  next();
}

/**
 * Recursively parse date strings in an object to Date objects
 * and adjust for IST offset
 */
function parseObjectDates(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(parseObjectDates);
  }

  if (typeof obj === 'string') {
    // Check if string looks like an ISO date
    if (isISODateString(obj)) {
      try {
        const date = new Date(obj);
        if (isNaN(date.getTime())) return obj;
        
        // Subtract IST offset so that local time is preserved in UTC
        date.setMinutes(date.getMinutes() - IST_OFFSET_MINUTES);
        return date;
      } catch {
        return obj;
      }
    }
    return obj;
  }

  if (typeof obj === 'object') {
    const parsed: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        parsed[key] = parseObjectDates(obj[key]);
      }
    }
    return parsed;
  }

  return obj;
}

/**
 * Check if a string looks like an ISO date string
 */
function isISODateString(str: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?(Z)?)?$/;
  return isoDateRegex.test(str);
}
