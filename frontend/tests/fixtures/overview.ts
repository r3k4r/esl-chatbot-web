import type { DashboardOverviewData } from '../../app/common/types/dashboard-overview-types'

/** Fixed "now" every overview fixture is relative to (tests freeze the clock here). A Monday. */
export const FIXTURE_NOW = new Date('2026-06-15T12:00:00.000Z')
const at = (minutesFromNow: number) => new Date(FIXTURE_NOW.getTime() + minutesFromNow * 60_000).toISOString()
const day = (offset: number) => new Date(Date.UTC(2026, 5, 15 + offset)).toISOString().slice(0, 10)

/** Student dashboard overview — mirrors GET /dashboard/overview. */
export const overviewFixture: DashboardOverviewData = {
  today: { date: day(0), minutes: 12, dailyGoalMinutes: 20, streak: 6, longestStreak: 9 },
  week: {
    days: Array.from({ length: 7 }, (_, i) => ({ date: day(i), minutes: i === 0 ? 12 : null })),
    minutes: 12,
    weeklyGoalMinutes: 140,
  },
  skills: {
    grammar: 72, vocabulary: 64, fluency: 58, speaking: 81,
    basedOnMessages: 40, basedOnSpoken: 9, level: 'B1',
    selfLevel: 'A2', targetLevel: 'B2',
  },
  vocab: {
    total: 120, due: 4, mastered: 35, addedThisWeek: 6,
    dueWords: [
      { word: 'resilient', definition: 'able to recover quickly' },
      { word: 'meticulous', definition: 'very careful about detail' },
    ],
  },
  tasks: [
    { id: 't1', classId: 'c1', className: 'English B1 Evening', title: 'Write about your weekend', deadline: at(60 * 24 * 5), state: 'ASSIGNED' },
  ],
  goals: [
    { id: 'g1', type: 'SPEAKING', description: 'Hold a 5-minute conversation', target: 5, progress: 40, targetDate: null },
  ],
  activity: {
    // 12 Monday-start weeks; the last week has only today so far.
    weeks: Array.from({ length: 12 }, (_, w) => Array.from({ length: 7 }, (_, d) => (w === 11 ? (d === 0 ? 12 : null) : ((w + d) % 4) * 8))),
    firstDay: day(-77),
    activeDays: 60,
  },
  recentChats: [
    { id: 's1', title: 'Ordering coffee', topic: 'Food', mode: 'VOICE', startedAt: at(-30), messageCount: 12, score: null },
    { id: 's2', title: null, topic: null, mode: 'TEXT', startedAt: at(-60 * 26), messageCount: 8, score: 75 },
  ],
}
