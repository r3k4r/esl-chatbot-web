import type { DashboardOverviewData } from '../../app/common/types/dashboard-overview-types'

/** Fixed "now" every overview fixture is relative to (tests freeze the clock here). */
export const FIXTURE_NOW = new Date('2026-06-15T12:00:00.000Z')
const at = (minutesFromNow: number) => new Date(FIXTURE_NOW.getTime() + minutesFromNow * 60_000).toISOString()

/** Student dashboard overview — mirrors GET /dashboard/overview. */
export const overviewFixture: DashboardOverviewData = {
  greetingHero: { streak: 6, doneMins: 12, goalMins: 25, dueVocabCount: 4 },
  statCards: {
    wordsMastered: 1240,
    wordsMasteredWeekDelta: 18,
    practiceTimeMinutes: 185,
    practiceTimeThisMonthMinutes: 45,
    pronunciationScore: 82,
    pronunciationDelta: -3,
    currentLevel: 'B1',
    levelPct: 40,
  },
  vocabChart: {
    points: [
      { label: 'May 18', value: 1180 },
      { label: 'May 25', value: 1200 },
      { label: 'Jun 1', value: 1222 },
      { label: 'Jun 8', value: 1240 },
    ],
    totalWords: 1240,
    growthPct: 5,
  },
  nextUp: {
    primary: { id: 'g1', type: 'SPEAKING', description: 'Hold a 5-minute conversation', target: 5, progress: 40, difficulty: 'HARD', targetDate: null },
    others: [
      { id: 'g2', type: 'VOCABULARY', description: 'Learn 20 travel words', target: 20, progress: 10, difficulty: null, targetDate: null },
      { id: 'g3', type: 'UNKNOWN_TYPE', description: 'Custom goal', target: 1, progress: 0, difficulty: 'EASY', targetDate: null },
    ],
  },
  activityHeatmap: {
    weeks: Array.from({ length: 12 }, (_, w) => Array.from({ length: 7 }, (_, d) => (w + d) % 4)),
    activePct: 64,
    recentSessions: [
      { id: 's1', mode: 'VOICE', topic: 'Ordering coffee', startedAt: at(-30), durationSeconds: 600, messageCount: 12, avgOverallScore: 70, avgPronunciationScore: 88 },
      { id: 's2', mode: 'TEXT', topic: null, startedAt: at(-60 * 26), durationSeconds: 300, messageCount: 8, avgOverallScore: 75, avgPronunciationScore: null },
      { id: 's3', mode: 'TEXT', topic: 'Job interview', startedAt: at(-60 * 24 * 3), durationSeconds: null, messageCount: 3, avgOverallScore: null, avgPronunciationScore: null },
    ],
  },
  dueWords: {
    words: [
      { word: 'resilient', definition: 'able to recover quickly', srsDue: at(-5) },
      { word: 'meticulous', definition: 'very careful about detail', srsDue: at(40) },
      { word: 'candid', definition: 'honest and direct', srsDue: at(60 * 5) },
      { word: 'eloquent', definition: 'fluent and persuasive', srsDue: at(60 * 24) },
      { word: 'pragmatic', definition: 'dealing with things sensibly', srsDue: at(60 * 24 * 4) },
    ],
    totalDue: 4,
    levelPct: 40,
  },
}
