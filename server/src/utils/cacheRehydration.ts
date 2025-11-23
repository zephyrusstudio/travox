/**
 * Utility functions for rehydrating domain objects from cached data
 * Ensures that objects retain their prototype chain and methods after JSON serialization/deserialization
 */

/**
 * Rehydrate a domain object from cached plain data
 * @param data - The plain object data from cache
 * @param prototype - The prototype to restore (e.g., Customer.prototype)
 * @param dateFields - Array of field names that should be converted to Date objects
 * @returns Properly rehydrated domain object with methods
 */
export function rehydrateObject<T>(
  data: any,
  prototype: any,
  dateFields: string[] = []
): T {
  const obj = Object.create(prototype);
  const rehydrated: any = { ...data };

  // Convert date fields
  dateFields.forEach(field => {
    if (data[field]) {
      rehydrated[field] = new Date(data[field]);
    }
  });

  return Object.assign(obj, rehydrated);
}

/**
 * Rehydrate an array of domain objects from cached plain data
 * @param dataArray - Array of plain object data from cache
 * @param prototype - The prototype to restore
 * @param dateFields - Array of field names that should be converted to Date objects
 * @returns Array of properly rehydrated domain objects with methods
 */
export function rehydrateArray<T>(
  dataArray: any[],
  prototype: any,
  dateFields: string[] = []
): T[] {
  return dataArray.map(data => rehydrateObject<T>(data, prototype, dateFields));
}

/**
 * Common date fields used across domain objects
 */
export const COMMON_DATE_FIELDS = {
  timestamps: ['createdAt', 'updatedAt', 'archivedAt'],
  booking: ['bookingDate', 'travelStartDate', 'travelEndDate', 'createdAt', 'updatedAt', 'archivedAt'],
  pax: ['dob', 'createdAt', 'updatedAt'],
  segment: ['depAt', 'arrAt', 'checkIn', 'checkOut', 'createdAt', 'updatedAt'],
  itinerary: ['createdAt', 'updatedAt'],
  payment: ['createdAt', 'updatedAt', 'archivedAt'],
  user: ['lastLoginAt', 'createdAt', 'updatedAt']
};
