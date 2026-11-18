import type { SkillSnapshot } from '~/common/types/class-types'
import type { SvgBasedIconName } from '~/common/types/iconsax-types'

// GET /dashboard/overview — the learner's home dashboard. "Today" and "this week" are the
// learner's own calendar days (their profile time zone).

export interface LearnerToday {
  /** YYYY-MM-DD */
  date: string
  minutes: number
  dailyGoalMinutes: number
  /** 0 once a whole day was missed */
  streak: number
  longestStreak: number
}

export interface LearnerWeek {
  /** Monday → Sunday; minutes null for days still to come */
  days: { date: string; minutes: number | null }[]
  minutes: number
  weeklyGoalMinutes: number
}

export interface LearnerSkills extends SkillSnapshot {
  selfLevel: string | null
  targetLevel: string | null
}

export interface LearnerVocab {
  total: number
  due: number
  mastered: number
  /** Added in the last 7 days */
  addedThisWeek: number
  dueWords: { word: string; definition: string }[]
}

export interface LearnerTask {
  id: string
  classId: string
  className: string
  title: string
  deadline: string | null
  state: 'ASSIGNED' | 'MISSING'
}

export interface LearnerGoal {
  id: string
  type: string
  description: string
  target: number
  progress: number
  targetDate: string | null
}

export interface LearnerActivity {
  /** 12 Monday-start weeks of minutes per day, oldest first; null = still to come */
  weeks: (number | null)[][]
  firstDay: string
  activeDays: number
}

export interface LearnerRecentChat {
  id: string
  title: string | null
  topic: string | null
  mode: 'TEXT' | 'VOICE'
  startedAt: string
  messageCount: number
  /** null while the chat is still open */
  score: number | null
}

export interface DashboardOverviewData {
  today: LearnerToday
  week: LearnerWeek
  skills: LearnerSkills
  vocab: LearnerVocab
  tasks: LearnerTask[]
  goals: LearnerGoal[]
  activity: LearnerActivity
  recentChats: LearnerRecentChat[]
}

/** The one thing the dashboard suggests doing next */
export interface LearnerNextStep {
  title: string
  detail: string
  action: string
  to: string
  icon: 'TaskSquare' | 'Book1' | 'Messages' | 'TickCircle'
}

/** One of the four stat cards under the learner's greeting */
export interface LearnerStat {
  label: string
  value: string
  sub: string
  icon: SvgBasedIconName
}
