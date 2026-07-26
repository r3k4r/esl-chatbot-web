import type { Plan } from "@prisma/client";

export type FibSubStatusType =
  | "DRAFT"
  | "TRIAL"
  | "ACTIVE"
  | "REJECTED"
  | "CANCELLED";

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
