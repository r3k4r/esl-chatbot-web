import type { User } from '~/common/model/user'

export type Plan = User['subscription']['plan']

/** A plan's name as people say it, and its badge colours. */
export const PLAN_BADGE: Record<Plan, { label: string; class: string }> = {
  FREE: { label: 'Free', class: 'bg-surface-raised text-text-muted' },
  GOLD: { label: 'Gold', class: 'bg-amber-500/15 text-amber-600 dark:text-amber-400' },
  PREMIUM: { label: 'Premium', class: 'bg-violet-500/15 text-violet-600 dark:text-violet-400' },
}

export interface PlanLimits {
  sessionsPerDay: number
  messagesPerSessionSoft: number
  messagesPerSessionHard: number
  messagesPerDayHard: number | null
}

// ⚠️ Must match the constants in backend/src/modules/sessions/sessions.service.ts
// (FREE/GOLD/PREMIUM_MAX_MESSAGES_PER_SESSION + SOFT_LIMIT_BUFFER = 10). There is no
// automatic sync — when they drift, the UI promises a budget the server refuses,
// which reads to the user as being blocked for no reason. FREE was 50/60 here while
// the backend enforced 20/30 (fixed 2026-07-31).
export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    sessionsPerDay: 3,
    messagesPerSessionSoft: 20,
    messagesPerSessionHard: 30,
    messagesPerDayHard: 20,
  },
  GOLD: {
    sessionsPerDay: 15,
    messagesPerSessionSoft: 100,
    messagesPerSessionHard: 110,
    messagesPerDayHard: null,
  },
  PREMIUM: {
    sessionsPerDay: 50,
    messagesPerSessionSoft: 150,
    messagesPerSessionHard: 160,
    messagesPerDayHard: null,
  },
}

export function getLimits(plan: Plan | undefined | null): PlanLimits {
  return PLAN_LIMITS[plan ?? 'FREE']
}
