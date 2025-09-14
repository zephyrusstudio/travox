# TMS Backend API

# Project Architecture Overview

This document describes the overall architecture and folder structure of the Travel Management System (TMS) API microservice.  
It follows **Clean/Hexagonal Architecture**, best practices for Node.js and TypeScript, and is designed for scalability, modularity, testability, and ease of maintenance.

## Features

- **Authentication & Authorization** - Google OAuth integration with JWT tokens
- **Customer Management** - CRUD operations for customer data
- **Vendor Management** - Service provider management
- **Booking Management** - Travel booking lifecycle management
- **Payment Tracking** - Financial transaction management
- **Account Management** - Banking and payment account setup
- **File Management** - Document upload/download with Google Drive integration
- **Audit Logging** - Complete activity tracking
- **Multi-tenancy** - Organization-based data isolation

---

## High-Level Structure

```
/src
  /api                # HTTP controllers, route definitions, request/response mappers
  /application        # Use cases, business logic orchestration
  /domain             # Core entities, value objects, domain services, interfaces
  /infrastructure     # External adapters: DB, cache, 3rd party APIs, JWT, etc.
  /config             # App configs, DI container, env management
  /middleware         # Express middleware (auth, logger, error handler, etc.)
  /utils              # Shared utilities, constants, type guards, mappers
  server.ts           # App bootstrap, DI, express setup
  index.ts            # Main entry (calls server.ts, handles process signals)
```

---

## Quick Start & API Testing

### Running the Server

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Server will be available at http://localhost:3000
```

### API Testing Options

#### 1. Postman Collection (Recommended)
Complete Postman collection with authentication flow and all endpoints:

```bash
# Import these files into Postman:
- postman/TMS_Complete_API_Collection.json
- postman/TMS_Local_Environment.json
```

See [`postman/README.md`](./postman/README.md) for detailed setup instructions.

#### 2. Auth Test Frontend
Simple frontend for Google authentication and endpoint testing:

```bash
cd auth-test-fe
python3 -m http.server 8080
# Open http://localhost:8080
```

#### 3. Direct API Testing
All endpoints require authentication except `/health` and `/ping`:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Authenticate with Google (requires valid idToken)
curl -X POST http://localhost:3000/auth/google \
  -H "Content-Type: application/json" \
  -d '{"idToken": "your_google_id_token"}'

# Use returned accessToken for authenticated requests
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer your_access_token"
```

### Key Features
- **Org-Scoped Operations**: All operations automatically scoped to user's organization
- **Google OIDC Authentication**: Secure authentication with Google
- **Role-Based Access Control**: Owner, Admin, OPS, Finance, Agent, Viewer roles
- **Audit Logging**: Automatic tracking of all important operations
- **Cross-Org Protection**: Users cannot access other organizations' data

---

## Folder Responsibilities

### `/api`

- **Responsibility:**  
  Contains all HTTP-specific logic: Express route handlers (controllers), request/response mapping, and route registration.
- **Best Practice:**  
  No business logic—controllers only delegate to application use cases.
- **Example:**  
  - `controllers/AuthController.ts`
  - `routes.ts` (registers routes)

---

### `/application`

- **Responsibility:**  
  Contains application/business use cases (e.g., GoogleLogin, LogoutUser, RefreshToken), orchestrating the flow between domain logic and infrastructure.
- **Best Practice:**  
  No framework/infra dependencies; interacts via interfaces.
- **Example:**  
  - `GoogleLogin.ts`
  - `LogoutUser.ts`

---

### `/domain`

- **Responsibility:**  
  The heart of business logic: entities, aggregates, value objects, domain services, and **interfaces** for repositories/services (e.g., `IUserRepository`, `IJwtService`).
- **Best Practice:**  
  Pure TypeScript—no imports from infrastructure or frameworks. 100% testable.
- **Example:**  
  - `User.ts` (entity)
  - `IUserRepository.ts`
  - `IJwtService.ts`

---

### `/infrastructure`

- **Responsibility:**  
  Implements the **interfaces** defined in `domain/`, connecting to real external services like databases (PostgreSQL, Redis), 3rd party APIs (email/SMS), JWT, etc.
- **Best Practice:**  
  Swappable implementations, easily mockable for tests, no business logic here.
- **Example:**  
  - `repositories/UserRepositoryFirestore.ts`
  - `services/JwtService.ts`
  - `services/GoogleOidcService.ts`

---

### `/config`

- **Responsibility:**  
  Application configuration, dependency injection (using `tsyringe` or `inversify`), and environment variable management.
- **Best Practice:**  
  All services and repositories are registered here for DI.
- **Example:**  
  - `container.ts` (DI setup)
  - `logger.ts` (Pino logger configuration)

---

### `/middleware`

- **Responsibility:**  
  Express middleware for cross-cutting concerns:
    - Logging (request/response)
    - Authentication (`requireAuth`)
    - Refresh token validation
    - Error handling (`errorHandler`)
- **Example:**  
  - `loggerMiddleware.ts`
  - `requireAuth.ts`
  - `requireRefreshToken.ts`
  - `errorHandler.ts`

---

### `/jobs`

- **Responsibility:**  
  Background jobs, scheduled tasks, async event handlers, message bus/event bus listeners (if needed).
- **Example:**  
  - `sendWelcomeEmailJob.ts`

---

### `/utils`

- **Responsibility:**  
  Reusable utility functions, type guards, constants, data mappers, etc.
- **Example:**  
  - `googleAuth.ts`
  - `validateEmail.ts`

---

### `/tests`

- **Responsibility:**  
  All unit, integration, and end-to-end tests. Mirrors the `src/` structure for easy mapping between implementation and tests.
- **Best Practice:**  
  Separate directories for unit and integration tests, and use coverage tools for quality.

---

### `server.ts` and `index.ts`

- **`server.ts`:**  
  Application bootstrap—sets up Express app, middleware, routes, DI, etc.

- **`index.ts`:**  
  Entry point—starts the server, manages signals (e.g., graceful shutdown).

---

## Clean Architecture Principles Applied

- **Separation of concerns:**  
  Domain logic is completely isolated from frameworks and infrastructure.
- **Dependency inversion:**  
  Application and domain depend on interfaces, not concrete implementations.
- **Testability:**  
  Pure business logic can be tested independently of Express, DB, or external APIs.
- **Extensibility:**  
  New features, interfaces, or external adapters can be added without breaking core logic.
- **Cloud-native and scalable:**  
  Stateless services, ready for containerization, auto-scaling, and cloud deployment.

---

## Example File Tree

```
src/
│
├── api/
│   ├── controllers/
│   │   └── AuthController.ts
│   └── routes.ts
├── application/
│   ├── GoogleLogin.ts
│   └── LogoutUser.ts
├── domain/
│   ├── User.ts
│   ├── IUserRepository.ts
│   ├── IJwtService.ts
│   └── ...
├── infrastructure/
│   ├── repositories/
│   │   └── UserRepositoryFirestore.ts
│   ├── services/
│   │   └── JwtService.ts
│   └── ...
├── config/
│   ├── container.ts
│   └── logger.ts
├── middleware/
│   ├── loggerMiddleware.ts
│   ├── errorHandler.ts
│   ├── requireAuth.ts
│   └── requireRefreshToken.ts
├── utils/
├── jobs/
├── tests/
├── server.ts
└── index.ts
```

---

## Summary

This architecture ensures your codebase is **modular, testable, maintainable, scalable, and ready for cloud deployment**. Each folder has a clear, single responsibility, and the system is ready for rapid feature addition and team scaling.

---

**For more detailed examples, explanations, or onboarding guides, just ask!**




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

