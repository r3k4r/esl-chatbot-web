import type { FibSubscription } from "@prisma/client";

import { FibSubscribeError } from "../../lib/fib-client.ts";
import type { SubscriptionDetails } from "../../lib/fib-client.ts";
import { prisma } from "../../config/database.ts";
import { fib } from "../../config/fib.ts";
import { AppError } from "../../utils/AppError.ts";
import { env } from "../../config/env.ts";
import { logger } from "../../config/index.ts";
import { Sentry } from "../../config/sentry.ts";
import { deleteCache, cacheKeys } from "../../config/cache.ts";
import type {
  InitiateFibInput,
  InitiateFibResult,
  FibStatusResult,
  FibSubStatusType,
  PlanChangeType,
} from "./subscriptions.types.ts";

// ── Pricing table (IQD) — update when business owner confirms amounts ─────────
// These values are locked in at subscription creation time; changing them only
// affects new subscribers, not existing active FIB subscriptions.
const PLAN_AMOUNTS_IQD: Record<string, Record<number, number>> = {
  GOLD:    { 1: 25_000, 3: 70_000,  6: 130_000, 12: 250_000 },
  PREMIUM: { 1: 45_000, 3: 125_000, 6: 230_000, 12: 440_000 },
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Value of one day on a plan, derived from its 1-month price. Used to convert unused
// time on the current plan into days on the new one.
function dailyRateIQD(plan: string): number {
  const monthly = PLAN_AMOUNTS_IQD[plan]?.[1];
  return monthly ? monthly / 30 : 0;
}

/**
 * Days to carry over when a paid subscription is replaced by another one.
 *
 * One formula covers every case, which is why there is no scheduling machinery
 * (`pendingPlan`, delayed FIB start) anywhere in this module:
 *
 *  • renewal  (GOLD → GOLD)     — same daily rate, so remaining days carry across 1:1
 *  • upgrade  (GOLD → PREMIUM)  — cheaper days buy fewer expensive ones (15 GOLD days
 *                                 ≈ 12,500 IQD ≈ 8 PREMIUM days)
 *  • downgrade (PREMIUM → GOLD) — expensive days buy more cheap ones (15 PREMIUM days
 *                                 ≈ 22,500 IQD ≈ 27 GOLD days)
 *
 * Nobody loses money they already paid, and the new plan simply starts now.
 */
export function carryOverDays(
  currentPlan: string,
  currentPeriodEnd: Date | null,
  newPlan: string,
  now: Date,
): number {
  if (!currentPeriodEnd || currentPeriodEnd <= now) return 0;

  const newRate = dailyRateIQD(newPlan);
  if (newRate <= 0) return 0; // unknown/FREE target — nothing to convert into

  const remainingDays = (currentPeriodEnd.getTime() - now.getTime()) / DAY_MS;
  const unusedValue = remainingDays * dailyRateIQD(currentPlan);
  return Math.floor(unusedValue / newRate);
}

const PLAN_RANK: Record<string, number> = { FREE: 0, GOLD: 1, PREMIUM: 2 };

/**
 * Classify what buying `newPlan` does for a user, and how much unused time carries
 * over. Shared by initiate, resume and the pending endpoint so the UI always gets a
 * consistent answer.
 */
function describePlanChange(
  current: {
    plan: string;
    currentPeriodEnd: Date | null;
    paymentProvider: string | null;
    status: string;
  } | null,
  newPlan: string,
  now: Date,
): { changeType: PlanChangeType; carryOverDays: number } {
  const hasLivePaidPlan =
    current !== null &&
    current.status === "ACTIVE" &&
    current.plan !== "FREE" &&
    current.currentPeriodEnd !== null &&
    current.currentPeriodEnd > now &&
    // CASH/STRIPE are settled off-platform — never treated as carry-over material
    (current.paymentProvider === "FIB" || current.paymentProvider === null);

  if (!hasLivePaidPlan) return { changeType: "NEW", carryOverDays: 0 };

  const days = carryOverDays(current.plan, current.currentPeriodEnd, newPlan, now);
  const changeType: PlanChangeType =
    current.plan === newPlan
      ? "RENEWAL"
      : (PLAN_RANK[newPlan] ?? 0) > (PLAN_RANK[current.plan] ?? 0)
        ? "UPGRADE"
        : "DOWNGRADE";

  return { changeType, carryOverDays: days };
}

const INTERVAL_ISO: Record<number, string> = {
  1: "P1M",
  3: "P3M",
  6: "P6M",
  12: "P1Y",
};

// ─── Cancellation policy (single source of truth) ─────────────────────────────
//
// No refunds, but the user keeps the plan they already paid for until
// currentPeriodEnd — then the existing expiry paths (subscription-expiry cron +
// the lazy check in createSession) drop them to FREE and clear the flag.
//
// This MUST be shared by every path that can cancel, because a subscription can be
// cancelled from three directions: our own DELETE endpoint, a FIB-side cancellation
// (the user cancels in the FIB app), and a REJECTED recurring charge. When only the
// endpoint implemented the policy, cancelling in the FIB app instead of our UI
// silently wiped the remaining paid days.
function buildCancellationData(currentPeriodEnd: Date | null, now: Date) {
  const keepsPaidTime = currentPeriodEnd !== null && currentPeriodEnd > now;
  return keepsPaidTime
    ? {
        // Paid period still running — keep plan + status, just stop renewing.
        cancelAtPeriodEnd: true,
        paymentProvider: null,
        externalSubscriptionId: null,
      }
    : {
        // No paid time left (or no known end date) — downgrade now, otherwise a null
        // currentPeriodEnd would leave the plan active forever.
        plan: "FREE" as const,
        status: "ACTIVE" as const,
        cancelAtPeriodEnd: false,
        paymentProvider: null,
        externalSubscriptionId: null,
        currentPeriodEnd: now,
      };
}

// Push `activeUntil` forward when a recurring FIB charge has extended the paid
// period. Called on every sync where the FIB status did not change, which is exactly
// what a renewal looks like from our side (ACTIVE → ACTIVE, later activeUntil).
async function extendPaidPeriodIfRenewed(
  record: FibSubscription,
  details: SubscriptionDetails,
): Promise<void> {
  const isLive = details.status === "ACTIVE" || details.status === "TRIAL";
  if (!isLive || !details.activeUntil) return;

  const paidUntil = new Date(details.activeUntil);
  const sub = await prisma.subscription.findUnique({
    where: { userId: record.userId },
    select: {
      currentPeriodEnd: true,
      cancelAtPeriodEnd: true,
      plan: true,
      paymentProvider: true,
    },
  });

  // The user cancelled, so we already told FIB to stop charging. Don't resurrect the
  // subscription off a stale activeUntil — the cancellation must stick.
  if (sub?.cancelAtPeriodEnd) return;

  // Someone else owns this subscription now — an admin assigned a CASH/other plan on
  // top of it. Renewing would silently revert their decision, so leave it alone.
  if (sub && (sub.paymentProvider !== "FIB" || sub.plan !== record.plan)) {
    logger.warn("[fib] skipping renewal sync — subscription is no longer FIB-owned", {
      userId: record.userId,
      fibPlan: record.plan,
      currentPlan: sub.plan,
      currentProvider: sub.paymentProvider,
    });
    return;
  }

  // Only ever extend. Never pull the end date backwards off a stale read.
  if (sub?.currentPeriodEnd && paidUntil <= sub.currentPeriodEnd) return;

  const renewalData = {
    plan: record.plan,
    status: "ACTIVE" as const,
    paymentProvider: "FIB" as const,
    externalSubscriptionId: record.fibSubscriptionId,
    currentPeriodEnd: paidUntil,
  };
  await prisma.subscription.upsert({
    where: { userId: record.userId },
    update: renewalData,
    create: { userId: record.userId, ...renewalData },
  });
  await deleteCache(cacheKeys.authUser(record.userId));

  logger.info("[fib] recurring charge extended the paid period", {
    userId: record.userId,
    fibSubscriptionId: record.fibSubscriptionId,
    currentPeriodEnd: paidUntil.toISOString(),
  });
}

// ─── Shared status-sync helper ────────────────────────────────────────────────
// Used by getFibStatus, handleFibWebhook, and the reconciliation cron job to
// avoid duplicating the status-transition + subscription-update transaction.
export async function applyFibStatusChange(
  record: FibSubscription,
  details: SubscriptionDetails,
): Promise<void> {
  const incomingStatus = details.status as FibSubStatusType;
  if (record.fibStatus === incomingStatus) {
    // Status is unchanged — but FIB subscriptions RECUR (interval P1M/P3M/...), and a
    // renewal charge moves `activeUntil` forward without ever changing the status.
    // Returning early here meant our currentPeriodEnd went stale while FIB kept
    // charging, and the subscription-expiry sweep then downgraded a PAYING customer
    // to FREE. So always let a live subscription extend its paid period.
    await extendPaidPeriodIfRenewed(record, details);
    return;
  }

  const now = new Date();
  const isActivating = incomingStatus === "ACTIVE" || incomingStatus === "TRIAL";
  const isCancelling = incomingStatus === "CANCELLED" || incomingStatus === "REJECTED";

  // NOTE: these MUST be upserts, not updates. `update` throws P2025 when the user
  // has no Subscription row, which rolls back the whole transaction — leaving the
  // FibSubscription stuck at DRAFT even though FIB has already taken the money, and
  // the reconcile cron then fails identically every 15 min forever. A Subscription
  // row is only ever created at registration, so any gap (manual DB cleanup, a
  // half-failed signup, a future migration) silently costs a real payment.
  // Read once — the activate branch needs it to carry unused time over, and the
  // cancel branch needs currentPeriodEnd to apply the cancellation policy.
  const current = await prisma.subscription.findUnique({
    where: { userId: record.userId },
    select: {
      plan: true,
      currentPeriodEnd: true,
      paymentProvider: true,
      cancelAtPeriodEnd: true,
    },
  });

  // Upgrade / downgrade / re-subscribe: whatever the user already paid for and
  // hasn't used is converted into days on the plan they just bought, so switching
  // plans mid-period never costs them the remainder. See carryOverDays.
  //
  // `paymentProvider === null` is included deliberately: cancelling nulls the
  // provider while keeping plan + currentPeriodEnd, so that is exactly what a
  // re-subscribe-after-cancel looks like. CASH/STRIPE are excluded — those are
  // settled off-platform and Guard 1 in initiate already refuses to stack on them.
  let periodEnd = details.activeUntil ? new Date(details.activeUntil) : null;
  let carriedDays = 0;
  const carryEligible =
    current !== null &&
    current.plan !== "FREE" &&
    (current.paymentProvider === "FIB" || current.paymentProvider === null);

  if (isActivating && periodEnd && carryEligible) {
    carriedDays = carryOverDays(current.plan, current.currentPeriodEnd, record.plan, now);
    if (carriedDays > 0) {
      periodEnd = new Date(periodEnd.getTime() + carriedDays * DAY_MS);
      logger.info("[fib] carried unused time onto the new plan", {
        userId: record.userId,
        from: current.plan,
        to: record.plan,
        carriedDays,
        currentPeriodEnd: periodEnd.toISOString(),
      });
    }
  }

  const activatedData = {
    plan: record.plan,
    status: "ACTIVE" as const,
    paymentProvider: "FIB" as const,
    externalSubscriptionId: record.fibSubscriptionId,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
    // A fresh purchase clears any prior cancellation — otherwise the expiry sweep
    // would drop the plan they just paid for.
    cancelAtPeriodEnd: false,
  };
  // A FIB-side cancellation (user cancelled in the FIB app) or a REJECTED recurring
  // charge must honour the same policy as our own cancel endpoint — keep the paid
  // time, stop the renewal. Reading currentPeriodEnd first is what makes that possible.
  const cancelledData = isCancelling
    ? buildCancellationData(current?.currentPeriodEnd ?? null, now)
    : null;

  await prisma.$transaction([
    prisma.fibSubscription.update({
      where: { id: record.id },
      data: {
        fibStatus: incomingStatus,
        ...(isActivating && !record.activatedAt ? { activatedAt: now } : {}),
        ...(isCancelling && !record.cancelledAt ? { cancelledAt: now } : {}),
      },
    }),
    ...(isActivating
      ? [
          prisma.subscription.upsert({
            where: { userId: record.userId },
            update: activatedData,
            create: { userId: record.userId, ...activatedData },
          }),
        ]
      : isCancelling && cancelledData
        ? [
            prisma.subscription.upsert({
              where: { userId: record.userId },
              update: cancelledData,
              // A row can only be missing when there was no paid time to preserve, so
              // the create is always the plain downgraded state. Spelled out rather
              // than relying on schema defaults (status defaults to INACTIVE, which
              // would lock the user out of the FREE tier entirely).
              create: {
                userId: record.userId,
                plan: "FREE",
                status: "ACTIVE",
                ...cancelledData,
              },
            }),
          ]
        : []),
  ]);

  // Plan/status changed — the auth cache for this user is now stale
  if (isActivating || isCancelling) {
    await deleteCache(cacheKeys.authUser(record.userId));
  }

  // A plan change leaves the previous recurring subscription live at FIB, which would
  // keep charging alongside the new one. Retire it now — deliberately AFTER activation,
  // never before: cancelling up-front would strip a paying user's plan for a payment
  // that might never be completed.
  if (isActivating) {
    await retireSupersededFibSubscriptions(record);
  }
}

// Cancel any other live FIB subscription for this user — best effort. A failure here
// must not undo the activation that just succeeded, but it does mean a possible double
// charge, so it is reported rather than swallowed.
async function retireSupersededFibSubscriptions(active: FibSubscription): Promise<void> {
  const superseded = await prisma.fibSubscription.findMany({
    where: {
      userId: active.userId,
      id: { not: active.id },
      fibStatus: { in: ["ACTIVE", "TRIAL"] },
    },
  });
  if (superseded.length === 0) return;

  for (const old of superseded) {
    try {
      if (fib) await fib.cancelSubscription(old.fibSubscriptionId);
      await prisma.fibSubscription.update({
        where: { id: old.id },
        data: { fibStatus: "CANCELLED", cancelledAt: new Date() },
      });
      logger.info("[fib] retired superseded subscription after a plan change", {
        userId: active.userId,
        retired: old.fibSubscriptionId,
        replacedBy: active.fibSubscriptionId,
      });
    } catch (err) {
      logger.error("[fib] FAILED to retire superseded subscription — possible double charge", {
        userId: active.userId,
        retired: old.fibSubscriptionId,
        error: err instanceof Error ? err.message : String(err),
      });
      Sentry.withScope((scope) => {
        scope.setLevel("error");
        scope.setTag("fib.stage", "retire-superseded");
        scope.setContext("fib", {
          userId: active.userId,
          supersededId: old.fibSubscriptionId,
          replacedBy: active.fibSubscriptionId,
        });
        Sentry.captureException(err);
      });
    }
  }
}

function requireFib() {
  if (!fib) {
    throw new AppError(
      "FIB integration not configured. Set FIB_CLIENT_ID and FIB_CLIENT_SECRET in Infisical.",
      503,
    );
  }
  return fib;
}

// ─── Initiate ─────────────────────────────────────────────────────────────────

export async function initiateFibSubscription(
  userId: string,
  input: InitiateFibInput,
): Promise<InitiateFibResult> {
  const client = requireFib();
  const { plan, intervalMonths } = input;

  // Guard 1: another provider owns this subscription — those are settled off-platform,
  // so FIB must not layer on top of them.
  const existing = await prisma.subscription.findUnique({ where: { userId } });
  if (existing?.status === "ACTIVE") {
    if (existing.paymentProvider === "CASH") {
      throw new AppError(
        "Your subscription is managed by an admin (CASH). Contact support to change plans.",
        409,
      );
    }
    if (existing.paymentProvider === "STRIPE") {
      throw new AppError(
        "You have an active Stripe subscription. Cancel it before switching to FIB.",
        409,
      );
    }
    // FIB → FIB is allowed: upgrading, downgrading and re-subscribing after a cancel
    // are all legitimate. The only thing to refuse is buying the plan they already
    // have on a live auto-renewing subscription, which would just charge them twice
    // for the same thing.
    if (
      existing.paymentProvider === "FIB" &&
      existing.plan === plan &&
      !existing.cancelAtPeriodEnd
    ) {
      throw new AppError(
        existing.currentPeriodEnd
          ? `You are already on ${plan} and it renews automatically on ${existing.currentPeriodEnd.toISOString().slice(0, 10)}. There is nothing to pay right now.`
          : `You are already on ${plan}. There is nothing to pay right now.`,
        409,
      );
    }
  }

  // Guard 2: never allow two payable FIB subscriptions at once — each could
  // independently be paid and charge the user. But a pending DRAFT must not turn
  // into a dead end either: the user has to be able to get their QR back (resume)
  // or clear it, otherwise they are locked out of paying until it expires.
  const now = new Date();

  // What this purchase does for the user, and how much unused time rolls into it.
  // Computed once here so the DRAFT, the resumed payment and the pending endpoint
  // all describe the same thing.
  const planChange = describePlanChange(existing, plan, now);

  // Sweep expired DRAFTs. An unpaid DRAFT dies at FIB when validUntil passes, so
  // keeping it "pending" locally would block new attempts for no reason.
  await prisma.fibSubscription.updateMany({
    where: { userId, fibStatus: "DRAFT", validUntil: { lte: now } },
    data: { fibStatus: "CANCELLED", cancelledAt: now },
  });

  // A live FIB record is no longer a hard block — it is exactly what an upgrade or a
  // re-subscribe looks like. It is only a block when it matches the plan the user is
  // asking to buy AND their Subscription row hasn't synced yet (so Guard 1 couldn't
  // see it), which would otherwise let them pay twice for the same plan.
  const liveFib = await prisma.fibSubscription.findFirst({
    where: { userId, fibStatus: { in: ["ACTIVE", "TRIAL"] } },
    orderBy: { createdAt: "desc" },
    select: { id: true, plan: true },
  });
  if (liveFib && liveFib.plan === plan && !existing?.cancelAtPeriodEnd) {
    throw new AppError(
      `You are already on ${plan}. There is nothing to pay right now.`,
      409,
    );
  }

  const draft = await prisma.fibSubscription.findFirst({
    where: { userId, fibStatus: "DRAFT" },
    orderBy: { createdAt: "desc" },
  });

  if (draft) {
    if (!draft.qrCode) {
      // Created before the payment artifacts were persisted — its QR can never be
      // shown again, so it can only ever block. Discard it (it is unpaid; if it is
      // somehow paid later the webhook still activates the user) and issue a fresh one.
      await prisma.fibSubscription.update({
        where: { id: draft.id },
        data: { fibStatus: "CANCELLED", cancelledAt: now },
      });
    } else if (draft.plan === plan && draft.intervalMonths === intervalMonths) {
      // Same plan + interval → hand back the existing payment instead of creating a
      // second one at FIB. Makes this endpoint safely idempotent: "Subscribe" pressed
      // twice re-opens the same QR rather than erroring.
      return { ...toInitiateResult(draft, planChange), resumed: true };
    } else {
      // Different plan/interval — resuming would show the wrong amount, and creating
      // a second payment risks a double charge. Surface the pending one so the UI can
      // offer "resume it" or "cancel it and start over".
      throw new AppError(
        `You have a pending ${draft.plan} payment (${draft.intervalMonths} month${draft.intervalMonths === 1 ? "" : "s"}). Resume it or cancel it before starting a different plan.`,
        409,
        { pendingFib: toPendingSummary(draft) },
      );
    }
  }

  const amountIQD = PLAN_AMOUNTS_IQD[plan]?.[intervalMonths];
  if (!amountIQD) throw new AppError("Invalid plan or interval combination", 400);

  // Create subscription at FIB. NOTE: FIB *requires* both `description` and
  // `statusCallbackUrl` — omitting either returns a generic 400 INVALID_REQUEST
  // (verified against the FIB stage API). In production set FIB_WEBHOOK_URL to a
  // public HTTPS endpoint; in local dev we fall back to a localhost URL (FIB accepts
  // it but can't reach it — activation is detected via polling on GET .../status).
  const statusCallbackUrl =
    env.FIB_WEBHOOK_URL ??
    `http://localhost:${env.PORT}/api/v1/subscriptions/webhook/fib`;
  let fibSub: Awaited<ReturnType<typeof client.createSubscription>>;
  try {
    fibSub = await client.createSubscription({
      title: `Tutelage ${plan}`,
      description: `${plan} English learning plan`,
      amount: amountIQD,
      currency: "IQD",
      interval: INTERVAL_ISO[intervalMonths]!,
      expiresIn: "P1DT12H",
      statusCallbackUrl,
    });
  } catch (err) {
    if (err instanceof FibSubscribeError) {
      logger.error("[fib] createSubscription error", { status: err.statusCode, message: err.message });
      throw new AppError(`FIB error: ${err.message}`, 502);
    }
    throw err instanceof Error ? err : new Error(String(err));
  }

  await prisma.fibSubscription.create({
    data: {
      userId,
      fibSubscriptionId: fibSub.subscriptionId,
      plan,
      intervalMonths,
      amountIQD,
      fibStatus: "DRAFT",
      validUntil: new Date(fibSub.validUntil),
      // Persisted so the QR survives a reload / accidental navigation
      qrCode: fibSub.qrCode,
      readableCode: fibSub.readableCode,
      appLink: fibSub.appLink,
    },
  });

  return {
    fibSubscriptionId: fibSub.subscriptionId,
    readableCode: fibSub.readableCode,
    qrCode: fibSub.qrCode,
    appLink: fibSub.appLink,
    validUntil: fibSub.validUntil,
    plan,
    intervalMonths,
    amountIQD,
    changeType: planChange.changeType,
    carryOverDays: planChange.carryOverDays,
    resumed: false,
  };
}

// ─── Pending payment ──────────────────────────────────────────────────────────
//
// Lets the client recover an in-progress payment (page reload, closed dialog,
// deep link that navigated away). Returns null when there is nothing to resume.

export async function getPendingFibSubscription(
  userId: string,
): Promise<InitiateFibResult | null> {
  const now = new Date();

  // Same expiry sweep as initiate, so a dead DRAFT is never advertised as pending
  await prisma.fibSubscription.updateMany({
    where: { userId, fibStatus: "DRAFT", validUntil: { lte: now } },
    data: { fibStatus: "CANCELLED", cancelledAt: now },
  });

  const draft = await prisma.fibSubscription.findFirst({
    where: { userId, fibStatus: "DRAFT", qrCode: { not: null } },
    orderBy: { createdAt: "desc" },
  });
  if (!draft) return null;

  const current = await prisma.subscription.findUnique({ where: { userId } });
  const change = describePlanChange(current, draft.plan, now);

  return { ...toInitiateResult(draft, change), resumed: true };
}

// Rebuild the initiate payload from a stored row. Only called for rows that
// passed a `qrCode != null` check, so the non-null assertions are safe.
// The plan-change fields are recomputed by the caller against the *current*
// subscription rather than stored, so a resumed payment never shows a stale
// "+8 days" that the passage of time has since changed.
function toInitiateResult(
  record: FibSubscription,
  change: { changeType: PlanChangeType; carryOverDays: number },
): Omit<InitiateFibResult, "resumed"> {
  return {
    fibSubscriptionId: record.fibSubscriptionId,
    readableCode: record.readableCode ?? "",
    qrCode: record.qrCode!,
    appLink: record.appLink ?? "",
    validUntil: (record.validUntil ?? new Date()).toISOString(),
    plan: record.plan as Extract<typeof record.plan, "GOLD" | "PREMIUM">,
    intervalMonths: record.intervalMonths,
    amountIQD: record.amountIQD,
    changeType: change.changeType,
    carryOverDays: change.carryOverDays,
  };
}

function toPendingSummary(record: FibSubscription) {
  return {
    fibSubscriptionId: record.fibSubscriptionId,
    plan: record.plan,
    intervalMonths: record.intervalMonths,
    amountIQD: record.amountIQD,
    validUntil: record.validUntil?.toISOString() ?? null,
  };
}

// ─── Get status ───────────────────────────────────────────────────────────────

export async function getFibStatus(
  userId: string,
  fibSubscriptionId: string,
): Promise<FibStatusResult> {
  const client = requireFib();

  const record = await prisma.fibSubscription.findUnique({
    where: { fibSubscriptionId },
  });
  if (!record || record.userId !== userId) {
    throw new AppError("Subscription not found", 404);
  }

  let details: Awaited<ReturnType<typeof client.getSubscription>>;
  try {
    details = await client.getSubscription(fibSubscriptionId);
  } catch (err) {
    if (err instanceof FibSubscribeError) throw new AppError(`FIB error: ${err.message}`, 502);
    throw err instanceof Error ? err : new Error(String(err));
  }

  const incomingStatus = details.status as FibSubStatusType;

  await applyFibStatusChange(record, details);

  return {
    fibStatus: incomingStatus,
    plan: record.plan as Extract<typeof record.plan, "GOLD" | "PREMIUM">,
    intervalMonths: record.intervalMonths,
    amountIQD: record.amountIQD,
    activeUntil: details.activeUntil ? new Date(details.activeUntil) : null,
    lastPaymentAt: details.lastPaymentAt ? new Date(details.lastPaymentAt) : null,
  };
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export async function cancelFibSubscription(
  userId: string,
  fibSubscriptionId: string,
): Promise<void> {
  const client = requireFib();

  const record = await prisma.fibSubscription.findUnique({
    where: { fibSubscriptionId },
  });
  if (!record || record.userId !== userId) {
    throw new AppError("Subscription not found", 404);
  }
  if (record.fibStatus === "CANCELLED" || record.fibStatus === "REJECTED") {
    throw new AppError("Subscription is already cancelled", 409);
  }

  const now = new Date();

  // A locally-DRAFT subscription may ALREADY BE PAID: the user can scan the QR, pay,
  // and hit Cancel before FIB's callback lands (or while the webhook is retrying).
  // Discarding it blindly — as this used to — throws away a real payment: FIB keeps
  // the money, we mark it CANCELLED, and the reconcile cron skips it because it is
  // no longer DRAFT. So always ask FIB what actually happened before cancelling.
  if (record.fibStatus === "DRAFT") {
    let liveDetails: SubscriptionDetails | null = null;
    try {
      liveDetails = await client.getSubscription(fibSubscriptionId);
    } catch (err) {
      // Can't reach FIB — refuse rather than risk discarding a paid subscription.
      // The DRAFT expires on its own at FIB if it really was unpaid.
      logger.error("[fib] cancel: could not verify DRAFT status with FIB", {
        fibSubscriptionId,
        error: err instanceof Error ? err.message : String(err),
      });
      throw new AppError(
        "Could not reach FIB to confirm this payment's status. Please try again in a moment — " +
          "cancelling now could discard a payment that already went through.",
        503,
      );
    }

    // Paid in the meantime → activate instead of cancelling. The user keeps the plan
    // they just paid for; they can cancel it afterwards through the ACTIVE path.
    if (liveDetails.status === "ACTIVE" || liveDetails.status === "TRIAL") {
      await applyFibStatusChange(record, liveDetails);
      throw new AppError(
        "Your payment already went through, so this could not be cancelled — your plan is now active. " +
          "You can cancel it from your subscription settings.",
        409,
      );
    }

    // Genuinely unpaid → discard locally. FIB has nothing to cancel (cancelling a
    // real DRAFT returns ILLEGAL_SUBSCRIPTION_STATUS_TRANSITION), and the unpaid
    // DRAFT expires on its own at FIB.
    await prisma.fibSubscription.update({
      where: { id: record.id },
      data: { fibStatus: "CANCELLED", cancelledAt: now },
    });
    return;
  }

  // ACTIVE/TRIAL — stop future charges at FIB, but do NOT strip the plan now.
  try {
    await client.cancelSubscription(fibSubscriptionId);
  } catch (err) {
    if (err instanceof FibSubscribeError) throw new AppError(`FIB error: ${err.message}`, 502);
    throw err instanceof Error ? err : new Error(String(err));
  }

  // Apply the shared cancellation policy — see buildCancellationData. The downgrade
  // itself is handled later by the subscription-expiry cron and the lazy check in
  // createSession; here we only stop the renewal and record the intent.
  const sub = await prisma.subscription.findUnique({
    where: { userId },
    select: { currentPeriodEnd: true },
  });
  const cancellation = buildCancellationData(sub?.currentPeriodEnd ?? null, now);

  await prisma.$transaction([
    prisma.fibSubscription.update({
      where: { id: record.id },
      data: { fibStatus: "CANCELLED", cancelledAt: now },
    }),
    // upsert for the same reason activation does — a missing row must never make a
    // cancellation blow up mid-transaction.
    prisma.subscription.upsert({
      where: { userId },
      update: cancellation,
      create: { userId, plan: "FREE", status: "ACTIVE", ...cancellation },
    }),
  ]);
  await deleteCache(cacheKeys.authUser(userId));
}

// ─── Webhook ──────────────────────────────────────────────────────────────────
//
// Security note: FIB does not sign webhook payloads (no HMAC header), so we
// cannot verify the caller is FIB. Mitigation: we ALWAYS re-fetch from the FIB
// API before mutating any DB state — an attacker posting a spoofed callback
// cannot cause a state change that does not already exist in FIB's own records.
// TODO (hardening): once FIB discloses their static callback IP ranges,
// add an IP allowlist check here (FIB_WEBHOOK_IP_ALLOWLIST env var) so only
// FIB servers can trigger the re-verification call in the first place.

export async function handleFibWebhook(subscriptionId: string): Promise<void> {
  if (!fib) return; // FIB not configured — ignore

  const record = await prisma.fibSubscription.findUnique({
    where: { fibSubscriptionId: subscriptionId },
  });
  if (!record) return; // Unknown subscription — not ours

  // Always re-verify from FIB — never trust the webhook body alone
  let details: Awaited<ReturnType<typeof fib.getSubscription>>;
  try {
    details = await fib.getSubscription(subscriptionId);
  } catch {
    return; // FIB unreachable — skip; will reconcile on next poll or webhook retry
  }

  // applyFibStatusChange is idempotent — it returns early if status is unchanged.
  // Report failures LOUDLY: the caller (fibWebhookHandler) has already answered FIB
  // with 202 and swallows anything thrown here, so without this a failed activation
  // is completely invisible — the user has paid and silently received nothing.
  try {
    await applyFibStatusChange(record, details);
  } catch (err) {
    logger.error("[fib] webhook: failed to apply status change — user may have paid without activation", {
      fibSubscriptionId: subscriptionId,
      userId: record.userId,
      incomingStatus: details.status,
      error: err instanceof Error ? err.message : String(err),
    });
    Sentry.withScope((scope) => {
      scope.setLevel("error");
      scope.setTag("fib.stage", "webhook-apply");
      scope.setContext("fib", {
        fibSubscriptionId: subscriptionId,
        userId: record.userId,
        incomingStatus: details.status,
      });
      Sentry.captureException(err);
    });
    throw err;
  }
}
