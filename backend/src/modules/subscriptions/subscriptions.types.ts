import type { Plan } from "@prisma/client";

export type FibSubStatusType =
  | "DRAFT"
  | "TRIAL"
  | "ACTIVE"
  | "REJECTED"
  | "CANCELLED";

/** NEW = no paid plan right now · RENEWAL = same plan again (only offered once the
 *  current one is cancelled/lapsing) · UPGRADE/DOWNGRADE = switching tier mid-period. */
export type PlanChangeType = "NEW" | "RENEWAL" | "UPGRADE" | "DOWNGRADE";

export type InitiateFibInput = {
  plan: Extract<Plan, "GOLD" | "PREMIUM">;
  intervalMonths: 1 | 3 | 6 | 12;
};

export type InitiateFibResult = {
  fibSubscriptionId: string;
  readableCode: string;
  qrCode: string;
  appLink: string;
  validUntil: string;
  /** Echoed back so a resumed payment can be rendered with its own plan/price —
   *  which may differ from whatever the client currently has selected. */
  plan: Extract<Plan, "GOLD" | "PREMIUM">;
  intervalMonths: number;
  amountIQD: number;
  /** What this purchase does relative to the plan the user is on right now. */
  changeType: PlanChangeType;
  /** Days of unused time on the current plan that will be added on top of this one
   *  when it activates (0 when there is nothing to carry over). */
  carryOverDays: number;
  /** True when this is an existing pending payment being handed back rather than
   *  a newly created one (repeat "Subscribe" click, or GET /fib/pending). */
  resumed: boolean;
};

export type FibStatusResult = {
  fibStatus: FibSubStatusType;
  plan: Extract<Plan, "GOLD" | "PREMIUM">;
  intervalMonths: number;
  amountIQD: number;
  activeUntil: Date | null;
  lastPaymentAt: Date | null;
};
