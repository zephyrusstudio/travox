import { json } from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import path from "path";
import { registerRoutes } from "./api/routes";
import { dateParserMiddleware } from "./middleware/dateParser";
import { errorHandler } from "./middleware/errorHandler";
import { loggerMiddleware } from "./middleware/loggerMiddleware";

export async function startServer() {
  const app = express();

  // CORS middleware for frontend testing
  app.use(
    cors({
      origin: ["http://localhost:8080", "http://127.0.0.1:8080", "file://"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
    })
  );

  // Basic middleware
  app.use(json());
  app.use(dateParserMiddleware); // Parse date strings to Date objects
  app.use(cookieParser());
  app.use(loggerMiddleware);

  // CORS middleware for frontend testing
  app.use(
    cors({
      origin: [
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "file://",
      ],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-refresh-token"],
    })
  );

  // Basic middleware
  app.use(json());
  app.use(cookieParser());
  app.use(loggerMiddleware);

  // Health check endpoints
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      service: "TMS API",
      version: "1.0.0",
    });
  });

  app.get("/ping", (req, res) => {
    res.status(200).json({ message: "pong" });
  });

  // Serve auth test frontend
  app.use(
    "/auth-test-fe",
    express.static(path.join(__dirname, "../auth-test-fe"))
  );

  // API routes
  registerRoutes(app);

  // Error handler should be last
  app.use(errorHandler);

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`TMS API running on http://localhost:${PORT}`);
    console.log(`Health check available at http://localhost:${PORT}/health`);
    console.log(`Ping endpoint available at http://localhost:${PORT}/ping`);
  });
}
