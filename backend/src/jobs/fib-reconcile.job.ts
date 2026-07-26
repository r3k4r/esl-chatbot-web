import { prisma } from "../config/database.ts";
import { fib } from "../config/fib.ts";
import { logger } from "../config/index.ts";
import { Sentry } from "../config/sentry.ts";
import { applyFibStatusChange } from "../modules/subscriptions/subscriptions.service.ts";

// Reconcile non-terminal FIB subscriptions against the FIB API.
// Safety net for missed webhooks — e.g. server was down when FIB posted the callback.
// Runs every 15 minutes; no-op when FIB credentials are not configured.
export async function runFibReconcileJob(): Promise<void> {
  if (!fib) return;

  const now = new Date();

  // Only DRAFT subscriptions that haven't expired yet — TRIAL/ACTIVE are handled
  // by the webhook or by the daily expiry job; we focus on the common case of a
  // user who paid but the webhook missed the DRAFT → ACTIVE transition.
  const pending = await prisma.fibSubscription.findMany({
    where: {
      fibStatus: "DRAFT",
      validUntil: { gt: now },
    },
  });

  if (pending.length === 0) return;

  logger.info(`[cron:fib-reconcile] Checking ${pending.length} pending FIB subscription(s)`);

  let synced = 0;
  for (const record of pending) {
    try {
      const details = await fib.getSubscription(record.fibSubscriptionId);
      await applyFibStatusChange(record, details);
      if (details.status !== record.fibStatus) synced++;
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
    logger.info(`[cron:fib-reconcile] Synced ${synced} subscription(s)`);
  }
}
