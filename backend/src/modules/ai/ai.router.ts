import { Router } from "express";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { env } from "../../config/env.ts";
import { generateAIResponse } from "./ai.service.ts";
import { asyncHandler } from "../../utils/asyncHandler.ts";
import type { Plan } from "@prisma/client";

const router = Router();
const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Dev-only AI test page ─────────────────────────────────────────────────────
// GET  /api/v1/ai/test   → interactive HTML test page
// POST /api/v1/ai/test   → call generateAIResponse() directly, returns AIResponse
// Disabled in production. 
if (env.NODE_ENV !== "production") {
  router.get("/test", (_req, res) => {
    // Override Helmet's strict CSP — this dev page needs CDN Tailwind + inline scripts
    res.setHeader(
      "Content-Security-Policy",
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
        "script-src-elem 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
        "script-src-attr 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
        "img-src 'self' data:",
        "connect-src 'self'",
      ].join("; "),
    );
    const html = readFileSync(join(__dirname, "ai-test.html"), "utf-8");
    res.setHeader("Content-Type", "text/html");
    res.send(html);
  });

  router.post(
    "/test",
    asyncHandler(async (req, res) => {
      const { message, plan = "FREE", learner = null, history = [] } = req.body as {
        message: string;
        plan: Plan;
        learner: { currentLevel: string; targetLevel: string; learningPurpose: string; aiPersonality: string } | null;
        history: { role: string; content: string }[];
      };

      if (!message || typeof message !== "string") {
        res.status(400).json({ success: false, message: "message is required" });
        return;
      }

      const validPlans: Plan[] = ["FREE", "GOLD", "PREMIUM"];
      const resolvedPlan: Plan = validPlans.includes(plan) ? plan : "FREE";

      const result = await generateAIResponse(message, history, learner, resolvedPlan);

      // Expose which provider/model was used (dev convenience)
      const isDev = env.NODE_ENV === "development";
      const providerMeta = {
        provider: isDev
          ? "gemini"
          : resolvedPlan === "PREMIUM"
            ? "openai"
            : "gemini",
        model: isDev
          ? "gemini-flash-latest (dev)"
          : resolvedPlan === "FREE"
            ? "gemini-flash-lite-latest"
            : resolvedPlan === "GOLD"
              ? "gemini-flash-latest"
              : "gpt-5-mini",
      };

      res.json({
        success: true,
        message: "AI response generated",
        data: result,
        meta: providerMeta,
      });
    }),
  );
}

export default router;
