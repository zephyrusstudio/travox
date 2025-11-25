import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to automatically parse ISO date strings to Date objects in request body
 * 
 * THE CORRECT UNDERSTANDING:
 * - Client sends "2025-12-07T12:40" meaning 12:40 IST (user's local time)
 * - We need to create a Date object that represents 12:40 IST
 * - JavaScript Date internally stores UTC timestamp
 * - When Firestore stores it, it should be 07:10 UTC (12:40 IST - 5:30 offset)
 * - When Firestore console displays it in IST, it shows 12:40 IST ✓
 * 
 * So we parse "2025-12-07T12:40" as LOCAL time components (IST), which creates
 * a Date that internally represents 07:10 UTC.
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
        // Client sends "2025-12-07T12:40" meaning 12:40 IST
        // We need to parse this explicitly as UTC to avoid server timezone issues
        
        // Extract date/time components
        const match = obj.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{3}))?)?)?/);
        if (!match) return obj;
        
        const [, year, month, day, hours = '0', minutes = '0', seconds = '0', ms = '0'] = match;
        
        // Create date using UTC components, then subtract IST offset
        // Example: 12:40 IST → parse as 12:40 UTC → subtract 5:30 → 07:10 UTC
        const date = new Date(Date.UTC(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          parseInt(hours),
          parseInt(minutes),
          parseInt(seconds),
          parseInt(ms)
        ));
        
        if (isNaN(date.getTime())) return obj;
        
        // Subtract IST offset to convert IST to UTC
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
