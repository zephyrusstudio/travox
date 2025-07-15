// src/middleware/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { AuthError, NotFoundError } from '../utils/errors';

/**
 * Express error handling middleware.
 * Catches all errors (sync/async), logs them, and responds with a safe error message.
 * Extendable for custom error types, validation errors, etc.
 */
export function errorHandler(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
) {
    // Log the error (could be replaced with Winston/Pino/Sentry, etc.)
    console.error(`[Error] ${req.method} ${req.url}:`, err);

    // You can expand this with custom error classes for finer control
    // Example: handle validation, auth, domain, and generic errors differently

    let status = 500;
    let message = 'Something went wrong';

    if (err instanceof NotFoundError || err instanceof AuthError) {
        status = err.status;
        message = err.message;
    }

    if (err.status) {
        status = err.status;
    }
    if (typeof err === 'string') {
        message = err;
    } else if (err.message) {
        message = err.message;
    }

    // For validation errors (e.g., from Zod/class-validator), you might do:
    if (err.name === 'ValidationError' && err.errors) {
        status = 400;
        message = err.errors.map((e: any) => e.msg || e.message).join(', ');
    }

    res.status(status).json({ message });
}
