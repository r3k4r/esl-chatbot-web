import type { Subscription, FibSubscription } from '~/common/model/subscription'

export type { Subscription, FibSubscription }

// ─── Plan metadata ────────────────────────────────────────────────────────────

export type PlanId = 'FREE' | 'GOLD' | 'PREMIUM'
export type IntervalMonths = 1 | 3 | 6 | 12

export interface PlanMeta {
  id: PlanId
  name: string
  color: string
  features: string[]
  sessionsPerDay: number
  msgsPerSession: number
  model: string
}

export const PLAN_META: Record<PlanId, PlanMeta> = {
  FREE: {
    id: 'FREE',
    name: 'Free',
    color: 'var(--text-muted)',
    features: ['3 sessions/day', '20 msgs/session', 'Gemini Flash-Lite', 'Basic vocabulary SRS'],
    sessionsPerDay: 3,
    msgsPerSession: 20,
    model: 'Gemini 2.5 Flash-Lite',
  },
  GOLD: {
    id: 'GOLD',
    name: 'Gold',
    color: '#f59e0b',
    features: ['15 sessions/day', '100 msgs/session', 'Gemini Flash', 'Full vocabulary SRS', 'Progress analytics'],
    sessionsPerDay: 15,
    msgsPerSession: 100,
    model: 'Gemini 2.5 Flash',
  },
  PREMIUM: {
    id: 'PREMIUM',
    name: 'Premium',
    color: 'var(--color-brand-primary)',
    features: ['50 sessions/day', '150 msgs/session', 'GPT-5 mini', 'Full vocabulary SRS', 'Advanced analytics', 'Priority voice TTS'],
    sessionsPerDay: 50,
    msgsPerSession: 150,
    model: 'GPT-5 mini',
  },
}

export const INTERVAL_LABELS: Record<IntervalMonths, string> = {
  1: '1 month',
  3: '3 months',
  6: '6 months',
  12: '1 year',
}

// Prices in IQD — must stay in sync with backend PLAN_AMOUNTS_IQD
export const PLAN_PRICES_IQD: Record<'GOLD' | 'PREMIUM', Record<IntervalMonths, number>> = {
  GOLD:    { 1: 25_000,  3: 70_000,  6: 130_000, 12: 250_000 },
  PREMIUM: { 1: 45_000,  3: 125_000, 6: 230_000, 12: 440_000 },
}

// ─── API response shapes ──────────────────────────────────────────────────────

export interface InitiateFibResult {
  fibSubscriptionId: string
  readableCode: string
  qrCode: string       // base64 PNG data URL
  appLink: string      // deep link for FIB mobile app
  validUntil: string   // ISO-8601
  plan: 'GOLD' | 'PREMIUM'      // the payment's own plan — a resumed payment may
  intervalMonths: IntervalMonths // differ from what the user currently has selected
  amountIQD: number
  changeType: PlanChangeType    // what this purchase does to the current plan
  carryOverDays: number         // unused days rolled onto the new plan on activation
  resumed: boolean     // true = existing pending payment handed back, not a new one
}

// NEW = no paid plan · RENEWAL = same plan again (offered once the current one is
// cancelled/lapsing) · UPGRADE/DOWNGRADE = switching tier mid-period.
export type PlanChangeType = 'NEW' | 'RENEWAL' | 'UPGRADE' | 'DOWNGRADE'

// Sent by the backend on a 409 from POST /subscriptions/initiate-fib when a
// payment for a DIFFERENT plan/interval is already awaiting payment.
export interface PendingFibSummary {
  fibSubscriptionId: string
  plan: 'GOLD' | 'PREMIUM'
  intervalMonths: IntervalMonths
  amountIQD: number
  validUntil: string | null
}

export interface FibStatusResult {
  fibStatus: FibSubscription['fibStatus']
  plan: 'GOLD' | 'PREMIUM'
  intervalMonths: IntervalMonths
  amountIQD: number
  activeUntil: string | null
  lastPaymentAt: string | null
}

// One row of FIB payment history. `wasCharged` is the only reliable "did money move"
// signal — a DRAFT is a QR that was never paid, and a CANCELLED row with no
// activation was abandoned before payment.
export interface FibPaymentRecord {
  fibSubscriptionId: string
  plan: 'GOLD' | 'PREMIUM'
  intervalMonths: IntervalMonths
  amountIQD: number
  fibStatus: FibSubscription['fibStatus']
  wasCharged: boolean
  createdAt: string
  activatedAt: string | null
  cancelledAt: string | null
  validUntil: string | null
}

export interface UserSubscriptionDetail {
  plan: PlanId
  status: Subscription['status']
  currentPeriodEnd: string | null
  paymentProvider: Subscription['paymentProvider']
  externalSubscriptionId: string | null
  // Cancelled but still inside the paid period: the plan stays fully active until
  // currentPeriodEnd, then drops to FREE. No refunds, so don't offer Cancel again.
  cancelAtPeriodEnd?: boolean
}
