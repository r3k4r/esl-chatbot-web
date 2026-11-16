import { describe, it, expect } from 'vitest'
import { PLAN_LIMITS, getLimits } from '~/common/data/plan-limits'
import { PLAN_META, PLAN_PRICES_IQD, type IntervalMonths } from '~/common/types/subscription-types'
import en from '../../../i18n/locales/en.json'

describe('PLAN_LIMITS', () => {
  // Mirrors the tier table in the root CLAUDE.md and backend sessions.service.ts.
  // If this fails, the frontend promises a budget the server refuses (or vice versa).
  it('matches the documented backend tier limits', () => {
    expect(PLAN_LIMITS).toEqual({
      FREE: { sessionsPerDay: 3, messagesPerSessionSoft: 20, messagesPerSessionHard: 30, messagesPerDayHard: 20 },
      GOLD: { sessionsPerDay: 15, messagesPerSessionSoft: 100, messagesPerSessionHard: 110, messagesPerDayHard: null },
      PREMIUM: { sessionsPerDay: 50, messagesPerSessionSoft: 150, messagesPerSessionHard: 160, messagesPerDayHard: null },
    })
  })

  it('uses a 10-message buffer between soft and hard caps', () => {
    for (const limits of Object.values(PLAN_LIMITS)) {
      expect(limits.messagesPerSessionHard - limits.messagesPerSessionSoft).toBe(10)
    }
  })

  it('getLimits falls back to FREE for a missing plan', () => {
    expect(getLimits(null)).toBe(PLAN_LIMITS.FREE)
    expect(getLimits(undefined)).toBe(PLAN_LIMITS.FREE)
    expect(getLimits('GOLD')).toBe(PLAN_LIMITS.GOLD)
  })
})

describe('PLAN_META', () => {
  it('agrees with PLAN_LIMITS on sessions and messages', () => {
    for (const plan of ['FREE', 'GOLD', 'PREMIUM'] as const) {
      expect(PLAN_META[plan].sessionsPerDay).toBe(PLAN_LIMITS[plan].sessionsPerDay)
      expect(PLAN_META[plan].msgsPerSession).toBe(PLAN_LIMITS[plan].messagesPerSessionSoft)
    }
  })
})

describe('PLAN_PRICES_IQD', () => {
  const intervals: IntervalMonths[] = [3, 6, 12]

  it.each(['GOLD', 'PREMIUM'] as const)('%s: longer intervals are never dearer per month', (plan) => {
    const prices = PLAN_PRICES_IQD[plan]
    let previousMonthly = prices[1]
    for (const months of intervals) {
      const monthly = prices[months] / months
      expect(monthly).toBeLessThanOrEqual(previousMonthly)
      previousMonthly = monthly
    }
  })

  it('PREMIUM costs more than GOLD at every interval', () => {
    for (const months of [1, ...intervals] as IntervalMonths[]) {
      expect(PLAN_PRICES_IQD.PREMIUM[months]).toBeGreaterThan(PLAN_PRICES_IQD.GOLD[months])
    }
  })

  it('landing-page monthly prices match the billing prices', () => {
    const toNumber = (s: string) => Number(s.replace(/[^\d]/g, ''))
    expect(toNumber(en.pricing.plans.gold.price)).toBe(PLAN_PRICES_IQD.GOLD[1])
    expect(toNumber(en.pricing.plans.premium.price)).toBe(PLAN_PRICES_IQD.PREMIUM[1])
  })
})
