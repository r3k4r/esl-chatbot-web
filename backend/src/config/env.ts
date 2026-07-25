import { z } from "zod/v4";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(8000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  DATABASE_URL: z.string(),

  REDIS_URL: z.string().default("redis://localhost:6379"),

  JWT_ACCESS_SECRET: z.string(),
  JWT_ACCESS_EXPIRES: z.string().default("15m"),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES: z.string().default("7d"),

  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().email().optional(),

  // Resend — optional; email features return 503 if not set
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Google OAuth — optional; Google login routes return 503 if not set
  GOOGLE_CLIENT_ID: z.string().optional(),

  // FIB Subscription API — optional; FIB features return 503 if not set
  FIB_CLIENT_ID: z.string().optional(),
  FIB_CLIENT_SECRET: z.string().optional(),
  FIB_ENV: z.enum(["stage", "prod"]).default("stage"),
  // Public HTTPS URL FIB POSTs status changes to (omit in local dev — use polling instead)
  FIB_WEBHOOK_URL: z.string().url().optional(),

  // AI Providers — optional; AI features return 503 if not set
  OPENAI_API_KEY: z.string().optional(),   // PREMIUM tier LLM (GPT-5 mini) + TTS (TTS-1-HD)
  GEMINI_API_KEY: z.string().optional(),   // Dev + FREE + GOLD tier LLM (Gemini)
  AZURE_SPEECH_KEY: z.string().optional(), // FREE + GOLD TTS (Neural) + GOLD + PREMIUM STT + Pronunciation
  AZURE_SPEECH_REGION: z.string().optional(),
  DEEPGRAM_API_KEY: z.string().optional(), // Dev + FREE STT (Nova-3, $200 signup credit)

  // Cloudflare R2 — optional; audio/avatar uploads fall back to local disk in dev or throw in prod
  // All five vars must be set together for R2 to activate.
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),

  // Comma-separated list of allowed browser origins,
  // e.g. "https://app.example.com,http://localhost:3001"
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  // Public URL of the frontend app — used in digest emails as the CTA link.
  // Falls back to CORS_ORIGIN if unset (fine for single-origin setups).
  FRONTEND_URL: z.string().url().optional(),

  // Sentry — optional; error reporting disabled if not set (always off in dev/test)
  SENTRY_DSN: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

// In production, if FIB credentials are configured, a public HTTPS webhook URL is required.
// Without it the fallback is http://localhost:... which FIB cannot reach — subscriptions
// would never activate via webhook and users would be stuck with a DRAFT status forever.
if (
  parsed.data.NODE_ENV === "production" &&
  parsed.data.FIB_CLIENT_ID &&
  !parsed.data.FIB_WEBHOOK_URL
) {
  console.error(
    "[env] FIB_WEBHOOK_URL is required in production when FIB_CLIENT_ID is set. " +
      "Set it to the public HTTPS URL of your /api/v1/subscriptions/webhook/fib endpoint.",
  );
  process.exit(1);
}

export const env = parsed.data;

// CORS_ORIGIN parsed into an array for the cors middleware and Socket.io.
// Native mobile apps are unaffected by CORS — this only gates browsers.
export const corsOrigins = env.CORS_ORIGIN.split(",")
  .map((o) => o.trim())
  .filter(Boolean);
