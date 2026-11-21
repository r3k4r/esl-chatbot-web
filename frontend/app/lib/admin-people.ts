import type { AdminDashboardData, AdminPeopleRow } from '~/common/types/admin-types'
import { PLAN_BADGE } from '~/common/data/plan-limits'
import { daysAgo, formatMinutes, toneStyle } from '~/lib/progress'

// The admin dashboard's people lists as rows for Admin/AdminPeopleList.
type People = AdminDashboardData['people']
const ROLE = { STUDENT: 'Student', TUTOR: 'Teacher', ADMIN: 'Admin' } as const
const planBadge = (plan: keyof typeof PLAN_BADGE) => (plan === 'FREE' ? null : { text: PLAN_BADGE[plan].label, class: PLAN_BADGE[plan].class })

/** Newest accounts: role and when they joined; flags an account that never verified. */
export const newestRows = (p: People): AdminPeopleRow[] => p.newest.map((u) => ({
  id: u.id,
  name: u.name,
  meta: `${ROLE[u.role]} · joined ${daysAgo(u.joinedAt)}`,
  badge: !u.verified ? { text: 'Not verified', style: toneStyle('blocked') } : u.role === 'STUDENT' ? planBadge(u.plan) : null,
}))

/** Practised before, nothing in the last 7 days. */
export const quietRows = (p: People): AdminPeopleRow[] => p.goneQuiet.map((u) => ({
  id: u.id, name: u.name, meta: `Last practised ${daysAgo(u.lastPracticeAt)}`, badge: planBadge(u.plan),
}))

/** Most practice in the last 7 days. */
export const activeRows = (p: People): AdminPeopleRow[] => p.mostActive.map((u) => ({
  id: u.id, name: u.name, meta: `${formatMinutes(u.minutes)} · ${u.messages} message${u.messages === 1 ? '' : 's'}`, badge: planBadge(u.plan),
}))
