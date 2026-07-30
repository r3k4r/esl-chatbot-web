import { prisma } from "../config/database.ts";
import { fib } from "../config/fib.ts";
import { logger } from "../config/index.ts";
import { Sentry } from "../config/sentry.ts";
import {
  applyFibStatusChange,
  PAYMENT_RECOVERY_WINDOW_DAYS,
} from "../modules/subscriptions/subscriptions.service.ts";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * How long we keep asking FIB about a payment that never activated.
 *
 * Deliberately NOT tied to `validUntil`. It used to be, and that was a money-losing
 * bug: `validUntil` is only 36 hours out (`expiresIn: P1DT12H`), so every recovery
 * path went blind at hour 36 — and FIB can confirm a payment on day 2, leaving
 * nothing watching for it. Defined in the subscriptions service so the UI's
 * "still being checked" wording can't drift from what this job actually does.
 */
const RECOVERY_WINDOW_DAYS = PAYMENT_RECOVERY_WINDOW_DAYS;

/**
 * Records younger than this are re-checked on EVERY run (every 15 min); older ones
 * only on the hourly sweep. Almost all drafts are abandoned QRs that will never be
 * paid, so polling all of them every 15 minutes for a week is mostly wasted calls
 * against FIB. The fresh tier keeps the minutes-after-payment window — the one that
 * actually matters for user experience — at full resolution.
 */
const FRESH_HOURS = 2;

/** A payment unconfirmed this long is worth a human look. */
const STALE_ALERT_HOURS = 24;

/**
 * Reconcile FIB subscriptions against the FIB API.
 *
 * The safety net for everything asynchronous about FIB: missed webhooks, slow
 * settlement, and renewals that never fire a callback. Runs every 15 minutes;
 * no-op when FIB credentials are not configured.
 */
export async function runFibReconcileJob(): Promise<void> {
  if (!fib) return;

  const now = new Date();
  const recoveryCutoff = new Date(now.getTime() - RECOVERY_WINDOW_DAYS * DAY_MS);
  const freshCutoff = new Date(now.getTime() - FRESH_HOURS * HOUR_MS);

  // The */15 cron lands on :00, :15, :30, :45 — so minutes < 15 is exactly one run
  // per hour. Used only to throttle cost, never to decide correctness: the fresh
  // tier is checked on every run regardless.
  const isHourlySweep = now.getUTCMinutes() < 15;

  // Renewal charges move `activeUntil` without changing status, so no webhook fires.
  // Scoped to subscriptions at or near their period end to keep this a handful of
  // rows rather than every active subscriber, every run.
  const renewalWindow = new Date(now.getTime() + 2 * DAY_MS);

  const pending = await prisma.fibSubscription.findMany({
    where: {
      OR: [
        // ── Money-safety case: paid but never activated ────────────────────────
        // Covers both a DRAFT whose activation callback never arrived, and a record
        // the user cancelled locally before FIB caught up (cancelling asks FIB
        // first, but FIB answers DRAFT for hours, so the answer can be wrong).
        // REJECTED is excluded — that is FIB's definitive "this payment failed".
        {
          fibStatus: { in: ["DRAFT", "CANCELLED"] },
          activatedAt: null,
          createdAt: { gt: isHourlySweep ? recoveryCutoff : freshCutoff },
        },
        // ── Renewal case: live subscription whose paid period is running out ───
        {
          fibStatus: { in: ["ACTIVE", "TRIAL"] },
          user: {
            subscription: {
              cancelAtPeriodEnd: false, // cancelled ones are meant to lapse
              // NULL must be listed explicitly: `lt` never matches NULL in SQL, so a
              // live sub whose activation returned no activeUntil would otherwise be
              // invisible here forever — the one case that cannot self-heal.
              OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { lt: renewalWindow } }],
            },
          },
        },
      ],
    },
  });

  if (pending.length === 0) return;

  logger.info(`[cron:fib-reconcile] Checking ${pending.length} FIB subscription(s)`);

  let synced = 0;
  let activated = 0;

  for (const record of pending) {
    try {
      const details = await fib.getSubscription(record.fibSubscriptionId);
      const changed = details.status !== record.fibStatus;

      await applyFibStatusChange(record, details);

      if (changed) {
        synced++;
        // A late confirmation recovering a payment we had already written off is
        // exactly what this job exists for — make it visible in the logs.
        if (
          (details.status === "ACTIVE" || details.status === "TRIAL") &&
          record.activatedAt === null
        ) {
          activated++;
          const ageHours = Math.round((now.getTime() - record.createdAt.getTime()) / HOUR_MS);
          logger.info("[cron:fib-reconcile] Late payment recovered", {
            fibSubscriptionId: record.fibSubscriptionId,
            userId: record.userId,
            hoursAfterCreation: ageHours,
            wasLocallyCancelled: record.fibStatus === "CANCELLED",
          });
        }
      }

      // Alert once per stuck payment, when it crosses the stale threshold. The
      // one-hour band matches the hourly sweep, so each record falls inside it on
      // exactly one run — no repeating alert for the same payment.
      if (isHourlySweep && details.status === "DRAFT") {
        const age = now.getTime() - record.createdAt.getTime();
        const crossedJustNow =
          age > STALE_ALERT_HOURS * HOUR_MS && age <= (STALE_ALERT_HOURS + 1) * HOUR_MS;
        if (crossedJustNow) {
          logger.warn("[cron:fib-reconcile] Payment still unconfirmed after 24h", {
            fibSubscriptionId: record.fibSubscriptionId,
            userId: record.userId,
          });
          Sentry.withScope((scope) => {
            scope.setLevel("warning");
            scope.setTag("fib.stage", "stale-draft");
            scope.setContext("fib", {
              fibSubscriptionId: record.fibSubscriptionId,
              userId: record.userId,
              hoursUnconfirmed: STALE_ALERT_HOURS,
            });
            Sentry.captureMessage("FIB payment unconfirmed 24h after creation");
          });
        }
      }
    } catch (err) {
      // This is the last safety net for a paid-but-not-activated subscription. If it
      // keeps failing, someone's money is gone and they have no plan — so it goes to
      // Sentry, not just the log, where it would repeat unnoticed every 15 minutes.
      logger.error("[cron:fib-reconcile] Failed to reconcile subscription", {
        fibSubscriptionId: record.fibSubscriptionId,
        userId: record.userId,
        error: err,
      });
      Sentry.withScope((scope) => {
        scope.setLevel("error");
        scope.setTag("fib.stage", "reconcile");
        scope.setContext("fib", {
          fibSubscriptionId: record.fibSubscriptionId,
          userId: record.userId,
        });
        Sentry.captureException(err);
      });
    }
  }

  if (synced > 0) {
    logger.info(`[cron:fib-reconcile] Synced ${synced} subscription(s), ${activated} late activation(s)`);
  }
}
