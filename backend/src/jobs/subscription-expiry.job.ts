import { prisma } from "../config/database.ts";
import { logger } from "../config/index.ts";

export async function runSubscriptionExpiryJob(): Promise<void> {
  const now = new Date();

  try {
    // Mirror the lazy-downgrade logic in sessions.service.ts:createSession()
    const result = await prisma.subscription.updateMany({
      where: {
        status: "ACTIVE",
        plan: { not: "FREE" },
        currentPeriodEnd: { lt: now },
      },
      data: {
        plan: "FREE",
        currentPeriodEnd: null,
        currentPeriodStart: null,
        paymentProvider: null,
        externalCustomerId: null,
        externalSubscriptionId: null,
        // The cancellation has now taken effect — clear it so a future re-subscribe
        // doesn't inherit a stale "cancelling" state.
        cancelAtPeriodEnd: false,
      },
    });

    logger.info(`[cron:subscription-expiry] Downgraded ${result.count} expired subscription(s) to FREE`);
  } catch (err) {
    logger.error("[cron:subscription-expiry] Failed", { error: err });
  }
}
