/**
 * Utility functions for handling data unmasking
 */

import { Request } from 'express';

/**
 * Checks if the request includes the unmask parameter set to true
 * @param req Express request object
 * @returns boolean indicating whether to return unmasked data
 */
export function shouldUnmask(req: Request): boolean {
  const unmaskParam = req.query.unmask;
  return unmaskParam === 'true';
}

/**
 * Base interface for objects that can provide both masked and unmasked responses
 */
export interface MaskableResponse {
  toApiResponse(unmask?: boolean): any;
}