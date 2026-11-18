import type { StudentMistake } from '~/common/types/class-types'

// GET /tutor/dashboard — what needs the tutor next across their (non-archived) classes.
// "Active" = sent the AI tutor a message in the last 7 days.

export interface TutorClassHealth {
  id: string
  name: string
  students: number
  activeThisWeek: number
  /** % handed in over tasks past their deadline; null = no past deadlines yet */
  handInRate: number | null
  missing: number
  toReview: number
  /** Average skill of students who practise; null = nobody yet */
  avgSkill: number | null
}

export interface TutorReviewItem {
  submissionId: string
  taskId: string
  classId: string
  taskTitle: string
  className: string
  studentName: string
  handedInAt: string
}

export interface TutorDueItem {
  taskId: string
  classId: string
  title: string
  className: string
  deadline: string
  handedIn: number
  students: number
}

export interface TutorInactiveStudent {
  userId: string
  classId: string
  displayName: string
  avatarUrl: string | null
  className: string
  lastPracticeAt: string | null
}

export interface TutorDashboardData {
  totals: { classes: number; students: number; activeThisWeek: number; toReview: number; missing: number }
  needsYou: {
    toReview: TutorReviewItem[]
    dueSoon: TutorDueItem[]
    inactive: TutorInactiveStudent[]
    inactiveCount: number
  }
  classes: TutorClassHealth[]
  skills: { grammar: number; vocabulary: number; fluency: number; speaking: number; practisingStudents: number }
  commonMistakes: StudentMistake[]
}
