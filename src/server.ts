import express from 'express';
import { json } from 'body-parser';
import { errorHandler } from './middleware/errorHandler';
import { registerRoutes } from './api/routes/routes';
import { loggerMiddleware } from './middleware/loggerMiddleware';

export async function startServer() {

    const app = express();
    app.use(json());

    registerRoutes(app); // Mount all API routes
    app.use(loggerMiddleware);
    app.use(errorHandler); // Centralized error handler

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Auth API running on ${PORT}`));
}
