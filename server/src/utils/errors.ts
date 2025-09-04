// src/utils/errors.ts
export class NotFoundError extends Error {
    status = 404;
    constructor(message = 'Not found') { super(message); }
}
export class AuthError extends Error {
    status = 401;
    constructor(message = 'Unauthorized') { super(message); }
}

export class AppError extends Error {
    status = 400;
    constructor(message: string, status = 400) { 
        super(message); 
        this.status = status;
    }
}
