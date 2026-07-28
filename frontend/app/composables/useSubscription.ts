import type {
  InitiateFibResult,
  FibStatusResult,
  FibPaymentRecord,
  UserSubscriptionDetail,
  PlanId,
  IntervalMonths,
} from '~/common/types/subscription-types'

interface SingleResponse<T> { success: boolean; message?: string; data: T }

export function useSubscription() {

  async function getMySubscription() {
    return await useHttp<SingleResponse<UserSubscriptionDetail>>({
      method: 'GET',
      url: '/users/me/subscription',
      requireAuth: true,
    })
  }

  async function initiateFib(plan: 'GOLD' | 'PREMIUM', intervalMonths: IntervalMonths) {
    return await useHttp<SingleResponse<InitiateFibResult>>({
      method: 'POST',
      url: '/subscriptions/initiate-fib',
      body: { plan, intervalMonths },
      requireAuth: true,
    })
  }

  // Recovers an in-progress payment (closed dialog, page reload, deep link that
  // navigated away). `data` is null when there is nothing pending.
  async function getPendingFib() {
    return await useHttp<SingleResponse<InitiateFibResult | null>>({
      method: 'GET',
      url: '/subscriptions/fib/pending',
      requireAuth: true,
    })
  }

  async function getFibStatus(subscriptionId: string) {
    return await useHttp<SingleResponse<FibStatusResult>>({
      method: 'GET',
      url: `/subscriptions/fib/${subscriptionId}/status`,
      requireAuth: true,
    })
  }

  // No id: the backend resolves the caller's subscription itself (preferring the
  // LIVE one), so a stale externalSubscriptionId can never leave a user unable to
  // cancel. Use ONLY for "cancel my current plan".
  async function cancelFib() {
    return await useHttp({
      method: 'DELETE',
      url: '/subscriptions/fib',
      requireAuth: true,
    })
  }

  // Targets one SPECIFIC payment. The pending-payment card MUST use this: the no-id
  // variant prefers the live subscription, so pressing "Cancel payment" on an unpaid
  // draft was cancelling the user's active plan instead — and the draft survived,
  // resurrecting the card on every refresh.
  async function cancelFibById(subscriptionId: string) {
    return await useHttp({
      method: 'DELETE',
      url: `/subscriptions/fib/${subscriptionId}`,
      requireAuth: true,
    })
  }

  async function listFibPayments() {
    return await useHttp<SingleResponse<FibPaymentRecord[]>>({
      method: 'GET',
      url: '/subscriptions/fib/payments',
      requireAuth: true,
    })
  }

  return { getMySubscription, initiateFib, getPendingFib, getFibStatus, cancelFib, cancelFibById, listFibPayments }
}
