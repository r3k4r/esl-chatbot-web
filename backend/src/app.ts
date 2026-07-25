import express, { type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { globalLimiter } from "./middlewares/rateLimits.ts";
import swaggerUi from "swagger-ui-express";

import { env, corsOrigins, swaggerSpec, logger } from "./config/index.ts";
import { errorHandler } from "./middlewares/errorHandler.ts";
import { notFound } from "./middlewares/notFound.ts";
import v1Router from "./routes/v1/index.ts";

const app = express();

// Trust first proxy hop so req.ip reflects the real client IP behind Render / Cloudflare
app.set("trust proxy", 1);

// Security
app.use(helmet());
app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(globalLimiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan("combined", {
  stream: { write: (message: string) => logger.info(message.trim()) },
}));

// API docs — dev only (never expose in prod; CSP removed because global helmet sets it before route-level can clear it)
if (env.NODE_ENV !== "production") {
  app.use("/api-docs", (_req: Request, res: Response, next: NextFunction) => { res.removeHeader("Content-Security-Policy"); next(); }, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  // Serve locally-uploaded avatars (fallback when R2 is not configured in dev)
  app.use("/uploads/avatars", express.static("uploads/avatars"));
}

// Routes
app.use("/api/v1", v1Router);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
