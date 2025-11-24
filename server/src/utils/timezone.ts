/**
 * Timezone Utility Functions
 * 
 * This module provides utilities to handle the IST/UTC conversion properly.
 * 
 * THE PROBLEM:
 * - Client is in India (IST = UTC+5:30)
 * - User enters "12:40" in browser (datetime-local input) → browser treats this as 12:40 local time
 * - Server receives this as a Date object, which represents 12:40 IST internally
 * - When we save to Firestore using Timestamp.fromDate(), it converts to UTC → stores as 07:10 UTC
 * - When we read back using timestamp.toDate(), it converts back to local → reads as 12:40 IST again
 * 
 * THE SOLUTION:
 * - Middleware handles timezone conversion at the boundary layer
 * - dateParserMiddleware: Subtracts IST offset on incoming dates
 * - dateSerializerMiddleware: Adds IST offset on outgoing dates
 * 
 * This way "12:40 IST" → stored as "12:40 UTC" → reads back as "12:40 IST"
 */

const IST_OFFSET_MINUTES = 330; // 5 hours 30 minutes

/**
 * Gets the current date/time
 * @returns Current Date
 */
export function getCurrentISTDate(): Date {
  return new Date();
}

/**
 * Convert a Date from IST to UTC by subtracting the IST offset
 * Use this when saving dates to Firestore via Timestamp.fromDate()
 * 
 * Example: 12:40 IST → 12:40 UTC (stored) → 12:40 IST (displayed)
 */
export function toUTCPreservingLocal(date: Date): Date {
  const adjusted = new Date(date);
  adjusted.setMinutes(adjusted.getMinutes() - IST_OFFSET_MINUTES);
  return adjusted;
}

/**
 * Convert a Date from UTC to IST by adding the IST offset
 * Use this when reading dates from Firestore via timestamp.toDate()
 * 
 * Example: 12:40 UTC (stored) → 12:40 IST (displayed)
 */
export function fromUTCPreservingLocal(date: Date): Date {
  const adjusted = new Date(date);
  adjusted.setMinutes(adjusted.getMinutes() + IST_OFFSET_MINUTES);
  return adjusted;
}

