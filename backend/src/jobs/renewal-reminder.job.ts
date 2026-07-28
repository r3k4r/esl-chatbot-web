import { prisma } from "../config/database.ts";
import { logger } from "../config/index.ts";
import { resend } from "../config/resend.ts";
import { env, corsOrigins } from "../config/env.ts";
import { Sentry } from "../config/sentry.ts";
import { buildRenewalReminderHtml } from "./renewal-reminder.email.ts";

// How many days before the charge the reminder goes out.
const REMIND_DAYS_BEFORE = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Warn users before a recurring FIB charge.
 *
 * FIB subscriptions recur, so someone who bought one month and forgot is charged
 * again with no warning — the most likely source of a complaint or chargeback.
 *
 * ── Why there is no `renewalReminderSentAt` column ──────────────────────────
 * Dedup is structural rather than stored. The job runs once daily and selects the
 * 24-hour slice of subscriptions whose period ends in exactly REMIND_DAYS_BEFORE
 * days, so each subscription falls inside that window on exactly one daily run.
 * A stored flag would add a migration for no behavioural gain at this scale.
 *
 * Two consequences to know about:
 *  - If the job misses a whole day (container down at the scheduled hour), that
 *    day's cohort is skipped rather than caught up later. A missed reminder is a
 *    soft failure; a double reminder is the one users would complain about.
 *  - It assumes a single instance running the cron (Render Starter = 1). If the
 *    service is ever scaled out, add the column and dedup on it.
 */
export async function runRenewalReminderJob(): Promise<void> {
  if (!resend) {
    logger.warn("[cron:renewal-reminder] RESEND_API_KEY not set — skipping");
    return;
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + REMIND_DAYS_BEFORE * DAY_MS);
  const windowEnd = new Date(windowStart.getTime() + DAY_MS);

  const due = await prisma.subscription.findMany({
    where: {
      status: "ACTIVE",
      plan: { not: "FREE" },
      // Only FIB auto-renews. CASH is admin-managed and STRIPE isn't wired up, so
      // neither produces a charge the user needs warning about.
      paymentProvider: "FIB",
      // Already cancelled → no charge is coming, so a "you'll be charged" email
      // would be actively wrong.
      cancelAtPeriodEnd: false,
      currentPeriodEnd: { gte: windowStart, lt: windowEnd },
    },
    select: {
      userId: true,
      plan: true,
      currentPeriodEnd: true,
      user: {
        select: { email: true, displayName: true, isActive: true, isInternal: true },
      },
    },
  });

  if (due.length === 0) return;

  logger.info(`[cron:renewal-reminder] ${due.length} subscription(s) renewing in ${REMIND_DAYS_BEFORE} days`);

  const billingUrl = `${env.FRONTEND_URL ?? corsOrigins[0] ?? ""}/dashboard/billing`;
  let sent = 0;
  let failed = 0;

  for (const sub of due) {
    // Deactivated accounts get nothing; internal/stealth accounts are excluded from
    // every fan-out (see the isInternal contract in backend/CLAUDE.md).
    if (!sub.user.isActive || sub.user.isInternal) continue;

    try {
      const { error } = await resend.emails.send({
        from: env.EMAIL_FROM ?? "noreply@resend.dev",
        to: sub.user.email,
        subject: `Your Tutelage ${sub.plan} plan renews in ${REMIND_DAYS_BEFORE} days`,
        html: buildRenewalReminderHtml({
          displayName: sub.user.displayName,
          plan: sub.plan,
          renewsOn: sub.currentPeriodEnd!, // non-null by the query's date filter
          billingUrl,
        }),
      });
      // The Resend SDK RETURNS { error } rather than throwing — an unchecked call
      // silently counts a failed send as a success (this bit the digest job once).
      if (error) throw new Error(`Resend: ${error.message}`);
      sent++;
    } catch (err) {
      failed++;
      logger.error("[cron:renewal-reminder] Failed to send", {
        userId: sub.userId,
        error: err instanceof Error ? err.message : String(err),
      });
      Sentry.withScope((scope) => {
        scope.setLevel("warning");
        scope.setTag("job", "renewal-reminder");
        Sentry.captureException(err);
      });
    }
  }

  logger.info(`[cron:renewal-reminder] sent=${sent} failed=${failed}`);
}
