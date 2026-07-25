import { prisma } from "../config/database.ts";
import { logger } from "../config/index.ts";
import { resend } from "../config/resend.ts";
import { env, corsOrigins } from "../config/env.ts";
import { buildDigestHtml, formatWeekLabel, type SkillSnapshot } from "./weekly-digest.email.ts";

export interface DigestJobOptions {
  force?: boolean;
}

/**
 * Returns true when the given timezone's local time is Sunday, hour 8.
 * Falls back to UTC on any invalid IANA timezone string (free-text DB column).
 */
export function isLocalSundayDigestHour(timezone: string, now: Date): boolean {
  let tz = timezone;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = "UTC";
  }

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "short",
    hour: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hourRaw = parts.find((p) => p.type === "hour")?.value ?? "-1";
  const hour = parseInt(hourRaw, 10);

  return weekday === "Sun" && hour === 8;
}

/**
 * Compute today's UTC-midnight date anchor for a given timezone.
 * Uses the en-CA locale (YYYY-MM-DD) so we can Date.UTC-pin it, matching
 * the same pattern used in sessions.service.ts for progress tracking.
 */
function localTodayUtc(timezone: string, now: Date): Date {
  let tz = timezone;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
  } catch {
    tz = "UTC";
  }
  const dateStr = now.toLocaleDateString("en-CA", { timeZone: tz });
  const parts = dateStr.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Parse a skillSnapshot JSON value defensively.
 * Returns null if the shape is unexpected (avoids crashing on malformed DB data).
 */
function parseSkillSnapshot(raw: unknown): SkillSnapshot | null {
  if (
    raw !== null &&
    typeof raw === "object" &&
    typeof (raw as Record<string, unknown>).grammar === "number" &&
    typeof (raw as Record<string, unknown>).vocabulary === "number" &&
    typeof (raw as Record<string, unknown>).fluency === "number"
  ) {
    const r = raw as { grammar: number; vocabulary: number; fluency: number };
    return { grammar: r.grammar, vocabulary: r.vocabulary, fluency: r.fluency };
  }
  return null;
}

export async function runWeeklyDigestJob(opts: DigestJobOptions = {}): Promise<void> {
  const { force = false } = opts;

  if (!resend || !env.RESEND_API_KEY) {
    logger.warn("[cron:weekly-digest] RESEND_API_KEY not configured — skipping");
    return;
  }

  const now = new Date();
  // First CORS origin as fallback — CORS_ORIGIN may be a comma-separated list
  const appUrl = env.FRONTEND_URL ?? corsOrigins[0] ?? "http://localhost:3001";

  // ── 1. Find timezones whose local time is currently Sunday 08:xx ─────────────
  const allTimezones = await prisma.learnerProfile.groupBy({
    by: ["timezone"],
    where: { emailDigestEnabled: true },
  });

  const matchedTimezones = force
    ? allTimezones.map((r) => r.timezone)
    : allTimezones.map((r) => r.timezone).filter((tz) => isLocalSundayDigestHour(tz, now));

  if (matchedTimezones.length === 0) {
    logger.debug("[cron:weekly-digest] No timezones at local Sunday 08:00 — skipping");
    return;
  }

  logger.info(`[cron:weekly-digest] Processing ${matchedTimezones.length} timezone(s): ${matchedTimezones.join(", ")}`);

  let sent = 0;
  let failed = 0;

  // ── 2. Process each matching timezone separately (different date windows) ────
  for (const tz of matchedTimezones) {
    const today = localTodayUtc(tz, now);
    const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);

    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        emailVerified: true,
        role: "STUDENT",
        isInternal: false,
        learnerProfile: {
          is: {
            emailDigestEnabled: true,
            timezone: tz,
            ...(force
              ? {}
              : {
                  OR: [
                    { digestLastSentAt: null },
                    { digestLastSentAt: { lt: sixDaysAgo } },
                  ],
                }),
          },
        },
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        metrics: {
          select: {
            currentStreak: true,
            estimatedLevel: true,
            grammarSkill: true,
            vocabularySkill: true,
            fluencySkill: true,
          },
        },
        progress: {
          where: { date: { gte: weekStart, lte: today } },
          select: {
            studyMinutes: true,
            sessionsCount: true,
            messagesCount: true,
            vocabularyPracticed: true,
            skillSnapshot: true,
          },
          orderBy: { date: "asc" },
        },
        goals: {
          where: { status: "ACTIVE" },
          select: { description: true, progress: true, type: true },
          take: 3,
          orderBy: { lastProgressUpdate: "desc" },
        },
        _count: {
          select: {
            vocabularies: { where: { srsDue: { lte: today } } },
          },
        },
      },
    });

    for (const user of users) {
      try {
        const weeklyStudyMinutes = user.progress.reduce((acc, p) => acc + p.studyMinutes, 0);
        const weeklySessions = user.progress.reduce((acc, p) => acc + p.sessionsCount, 0);
        const weeklyMessages = user.progress.reduce((acc, p) => acc + p.messagesCount, 0);
        const weeklyVocabPracticed = user.progress.reduce((acc, p) => acc + p.vocabularyPracticed, 0);

        // Compute skill delta: compare earliest vs latest valid snapshot in the window
        const snapshots = user.progress
          .map((p) => parseSkillSnapshot(p.skillSnapshot))
          .filter((s): s is SkillSnapshot => s !== null);
        const earliest = snapshots[0];
        const skillDelta =
          snapshots.length >= 2 && earliest
            ? {
                grammar: earliest.grammar,
                vocabulary: earliest.vocabulary,
                fluency: earliest.fluency,
              }
            : null;

        const html = buildDigestHtml({
          displayName: user.displayName,
          weeklyStudyMinutes,
          weeklySessions,
          weeklyMessages,
          weeklyVocabPracticed,
          streak: user.metrics?.currentStreak ?? 0,
          activeGoals: user.goals,
          vocabDue: user._count.vocabularies,
          estimatedLevel: user.metrics?.estimatedLevel ?? null,
          grammarSkill: user.metrics?.grammarSkill ?? 0,
          vocabularySkill: user.metrics?.vocabularySkill ?? 0,
          fluencySkill: user.metrics?.fluencySkill ?? 0,
          skillDelta,
          appUrl,
        });

        const { error } = await resend.emails.send({
          from: env.EMAIL_FROM ?? "noreply@resend.dev",
          to: user.email,
          subject: `Your weekly Tutelage progress — ${formatWeekLabel(weekStart, today)}`,
          html,
        });

        if (error) throw new Error(`Resend: ${error.message}`);

        // Stamp only on confirmed success — a failed send must not block a retry
        await prisma.learnerProfile.update({
          where: { userId: user.id },
          data: { digestLastSentAt: now },
        });

        sent++;

        // Respect Resend's ~2 req/s limit (upgrade path: resend.batch.send for large lists)
        await new Promise((r) => setTimeout(r, 600));
      } catch (err) {
        logger.error(`[cron:weekly-digest] Failed to send to ${user.email}`, { error: err });
        failed++;
      }
    }
  }

  logger.info(`[cron:weekly-digest] Done — sent=${sent} failed=${failed}`);
}
