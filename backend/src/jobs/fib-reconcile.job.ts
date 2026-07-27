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

  // Two cases, both of which cost the user real money if a webhook is missed:
  //
  //  1. DRAFT that hasn't expired — the user paid but the DRAFT → ACTIVE callback
  //     never landed, so they have no plan.
  //  2. ACTIVE/TRIAL whose paid period is about to lapse — FIB subscriptions RECUR,
  //     and a renewal charge moves `activeUntil` without changing the status, so no
  //     webhook fires. Left unchecked, the expiry sweep downgrades a paying customer.
  //     Scoped to subs near (or past) their period end so this stays a handful of
  //     rows per run rather than every active subscriber every 15 minutes.
  const renewalWindow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const pending = await prisma.fibSubscription.findMany({
    where: {
      OR: [
        { fibStatus: "DRAFT", validUntil: { gt: now } },
        // Cancelled DRAFTs that were never activated, still inside their FIB validity
        // window. THIS IS THE MONEY-SAFETY CASE: a user can pay and hit Cancel before
        // FIB has updated its own status, so the pre-cancel check still sees DRAFT and
        // we discard it. Without re-checking here, that payment is gone forever —
        // nothing else ever looks at a CANCELLED row. If FIB later reports ACTIVE,
        // applyFibStatusChange activates the plan and the user gets what they paid for.
        {
          fibStatus: "CANCELLED",
          activatedAt: null,
          validUntil: { gt: now },
        },
        {
          fibStatus: { in: ["ACTIVE", "TRIAL"] },
          user: {
            subscription: {
              cancelAtPeriodEnd: false, // cancelled ones are meant to lapse
              // NULL must be included explicitly: `lt` never matches NULL in SQL, so
              // a live sub whose activation returned no activeUntil would otherwise be
              // invisible here forever — the one case that can't self-heal.
              OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { lt: renewalWindow } }],
            },
          },
        },
      ],
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
