import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to automatically parse ISO date strings to Date objects in request body
 * This handles the common case where frontend sends dates as ISO strings
 * but backend expects Date objects
 */
export function dateParserMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.body && typeof req.body === 'object') {
    req.body = parseObjectDates(req.body);
  }
  next();
}

/**
 * Recursively parse date strings in an object to Date objects
 * Recognizes ISO date strings and converts them to Date objects
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
      const date = new Date(obj);
      return isNaN(date.getTime()) ? obj : date;
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
 * Matches formats like: 2025-09-05T10:00:00.000Z, 2025-09-05T10:00:00Z, 2025-09-05
 */
function isISODateString(str: string): boolean {
  // Basic check for ISO date format
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  return isoDateRegex.test(str);
}
