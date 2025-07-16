# node-api-template

# Middleware Usage Guide

This document explains the setup and usage of the core Express middleware for the Auth API, following Clean Architecture and TypeScript best practices.

---

## Table of Contents

1. [Logger Middleware (`pino`)](#1-logger-middleware-pino)
2. [Error Handler Middleware](#2-error-handler-middleware)
3. [Authentication Middleware (`requireAuth`)](#3-authentication-middleware-requireauth)
4. [Refresh Token Middleware (`requireRefreshToken`)](#4-refresh-token-middleware-requirerefreshtoken)

---

## 1. Logger Middleware (`pino`)

**File:** `src/middleware/loggerMiddleware.ts`  
**Depends on:** `src/config/logger.ts`

### **Purpose**

- Logs every incoming HTTP request and its response, including method, URL, status, and timing.
- Logs are structured, fast, and suitable for cloud/enterprise deployments.
- Uses [pino](https://getpino.io/#/), a production-grade logger.

### **Setup**

1. **Install dependencies:**
    ```bash
    npm install pino pino-http
    npm install --save-dev @types/pino
    ```

2. **Register middleware in your server (before all routes):**
    ```typescript
    import { loggerMiddleware } from './middleware/loggerMiddleware';

    app.use(loggerMiddleware);
    ```

3. **Use logger in your code (optional):**
    ```typescript
    import logger from '../config/logger';
    logger.info('User registered', { userId: '...' });
    // Or from Express request context:
    req.log.info('Processing login', { email: req.body.email });
    ```

---

## 2. Error Handler Middleware

**File:** `src/middleware/errorHandler.ts`

### **Purpose**

- Catches all errors (sync/async) not handled by routes or other middleware.
- Logs the error (to console or logger).
- Returns a clean JSON error response (status, message).
- Prevents leaking internal details.

### **Setup**

1. **Register as the last middleware (after all routes):**
    ```typescript
    import { errorHandler } from './middleware/errorHandler';

    app.use(errorHandler);
    ```

2. **Usage in Controllers:**
    - Pass errors to the middleware via `next(err)` or let unhandled exceptions bubble up.

---

## 3. Authentication Middleware (`requireAuth`)

**File:** `src/middleware/requireAuth.ts`

### **Purpose**

- Protects routes by requiring a valid JWT access token.
- Decodes and verifies JWT using DI-resolved `IJwtService`.
- Optionally checks user roles (for RBAC).
- Adds the authenticated user's claims to `req.user`.

### **Setup & Usage**

1. **Add to protected routes:**
    ```typescript
    import { requireAuth } from '../middleware/requireAuth';

    app.get('/auth/userinfo', requireAuth(), ctrl.userInfo); // Any authenticated user

    app.get('/admin/users', requireAuth(['admin']), ctrl.listUsers); // Only admin role
    ```

2. **Access user in controllers:**
    ```typescript
    const user = req.user;
    ```

---

## 4. Refresh Token Middleware (`requireRefreshToken`)

**File:** `src/middleware/requireRefreshToken.ts`

### **Purpose**

- Protects endpoints that require a valid refresh token (e.g., `/auth/refresh`).
- Validates refresh token via DI-resolved `IJwtService` and `IRefreshTokenRepository`.
- Attaches decoded token payload to `req.user`.

### **Setup & Usage**

1. **Add to routes that expect refresh tokens (if needed):**
    ```typescript
    import { requireRefreshToken } from '../middleware/requireRefreshToken';

    app.post('/auth/refresh', requireRefreshToken(), ctrl.refreshToken);
    ```

2. **Access decoded token in controller:**
    ```typescript
    const user = req.user;
    ```

---

## Additional Notes

- **Order matters:** Always add `loggerMiddleware` first and `errorHandler` last.
- **Cookie support:** If using refresh tokens in cookies, enable `cookie-parser` middleware.
    ```bash
    npm install cookie-parser
    ```
    ```typescript
    import cookieParser from 'cookie-parser';
    app.use(cookieParser());
    ```

- **Customizing middlewares:**  
  You can extend all middlewares (e.g., custom error classes, request ID injection, advanced logging, etc.)

---

## Example Server Setup (Summary)

```typescript
import express from 'express';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import { errorHandler } from './middleware/errorHandler';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());
app.use(loggerMiddleware);

// ...register routes, attach requireAuth, requireRefreshToken, etc.

app.use(errorHandler); // Always last
```

---

## See Also

- [pino logging docs](https://getpino.io/#/)
- [Express error handling](https://expressjs.com/en/guide/error-handling.html)
- [JWT best practices](https://datatracker.ietf.org/doc/html/rfc7519)

---

**This guide will help your team understand, extend, and correctly use all middleware for a secure, scalable, and observable Node.js API.**

