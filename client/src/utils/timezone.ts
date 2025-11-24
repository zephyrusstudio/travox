/**
 * Timezone Utility Functions (Client-side)
 * 
 * This module provides utilities to handle dates consistently in IST.
 * Since the browser is in IST timezone, we avoid unnecessary conversions.
 * 
 * Key principle: datetime-local inputs and Date objects work in the browser's
 * local timezone (IST in this case), so we preserve that representation.
 */

/**
 * Gets the current date/time
 * @returns Current Date
 */
export function getCurrentISTDate(): Date {
  return new Date();
}

/**
 * Parses a date string from form input treating it as local (IST) time
 * @param dateString - Date string (YYYY-MM-DD or YYYY-MM-DDTHH:mm from datetime-local input)
 * @returns Date object representing the local time
 */
export function parseISTDate(dateString: string): Date {
  // If it's just a date (YYYY-MM-DD), treat it as local midnight
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }
  
  // If it's a datetime-local format (YYYY-MM-DDTHH:mm), parse as local time
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(dateString)) {
    const [datePart, timePart] = dateString.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hours, minutes] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes, 0, 0);
  }
  
  // For ISO strings or other formats, parse directly
  return new Date(dateString);
}

/**
 * Formats a Date to ISO string for server transmission
 * For datetime-local values, we want to preserve the local time components
 * So we format as ISO but represent the local time, not UTC
 * @param date - Date to format
 * @returns ISO-like string representing local time
 */
export function toISTISOString(date: Date): string {
  // Get local time components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  
  // Format as ISO but without Z (indicating it's local time, not UTC)
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Formats a Date to YYYY-MM-DD for date inputs
 * @param date - Date to format
 * @returns Date string in YYYY-MM-DD format
 */
export function toISTDateString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISTDate(date) : date;
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Formats a Date to YYYY-MM-DDTHH:mm for datetime-local inputs
 * @param date - Date to format
 * @returns Datetime string in YYYY-MM-DDTHH:mm format
 */
export function toISTDateTimeLocalString(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISTDate(date) : date;
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Formats a Date to display format in local timezone
 * @param date - Date to format (Date object or string)
 * @returns Formatted date string (e.g., "24 Nov, 2025")
 */
export function formatISTDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISTDate(date) : date;
  
  return dateObj.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/**
 * Formats a Date to display format with time in local timezone
 * @param date - Date to format (Date object or string)
 * @returns Formatted datetime string (e.g., "24 Nov, 2025, 2:30 PM")
 */
export function formatISTDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISTDate(date) : date;
  
  return dateObj.toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}
