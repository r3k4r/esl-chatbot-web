import type { TutorAccent, TutorVoiceGender } from './profile-types'
import type { StudentMistake } from './class-types'
import type { TutorClassHealth } from './tutor-types'

export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN'
export type SubStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELLED' | 'PAST_DUE'
export type PlanId = 'FREE' | 'GOLD' | 'PREMIUM'
export type PaymentProvider = 'CASH' | 'FIB' | 'STRIPE'
export type IntervalMonths = 1 | 3 | 6 | 12

// ── User list item (GET /users) ───────────────────────────────────────────────

export interface AdminLearnerProfile {
  id: string
  currentLevel: string | null
  targetLevel: string | null
  learningPurpose: string | null
  topicsOfInterest: string[]
  aiPersonality: string | null
  voiceSpeed: number
  autoSpeak: boolean
  theme: string
  weeklyGoalMinutes: number
  timezone: string
  emailDigestEnabled?: boolean
  tutorAccent?: TutorAccent
  tutorVoice?: TutorVoiceGender
}

export interface AdminUserGoal {
  id: string
  type: string
  description: string
  target: number
  difficulty: string | null
  status: string
  progress: number
  startDate: string
  targetDate: string | null
  completedDate: string | null
  createdAt: string
  assignedByTutor: { id: string; displayName: string } | null
}

export interface AdminUserVocab {
  id: string
  word: string
  definition: string
  partOfSpeech: string | null
  masteryLevel: number
  source: string
  srsInterval: number
  reviewCount: number
  correctCount: number
  incorrectCount: number
  lastPracticed: string | null
  createdAt: string
  assignedByTutor: { id: string; displayName: string } | null
}

export interface AdminUserSession {
  id: string
  mode: string
  topic: string | null
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  messageCount: number
  evaluation: {
    avgOverallScore: number
    avgGrammarScore: number
    avgVocabularyScore: number
    avgFluencyScore: number
    detectedCefrLevel: string
    strengths: string[]
    weaknesses: string[]
  } | null
}

export interface AdminUserProgress {
  date: string
  sessionsCount: number
  studyMinutes: number
  messagesCount: number
  wordsTyped: number
  vocabularyPracticed: number
  goalsAdvanced: number
}

export interface AdminUserTaskSubmission {
  id: string
  content: string | null
  feedback: string | null
  feedbackAt: string | null
  createdAt: string
  task: {
    id: string
    title: string
    description: string
    deadline: string | null
    status: string
    class: { id: string; className: string }
  }
}

export interface AdminFibSubscription {
  id: string
  plan: string
  intervalMonths: number
  amountIQD: number
  fibStatus: string
  activatedAt: string | null
  cancelledAt: string | null
  createdAt: string
}

export interface AdminUserItem {
  id: string
  username: string
  email: string
  displayName: string
  avatarUrl: string | null
  isActive: boolean
  role: UserRole
  phoneNumber: string | null
  createdAt: string
  // Optional detail-view fields (only present on GET /users/:id)
  authProvider?: string
  emailVerified?: boolean
  emailVerifiedAt?: string | null
  updatedAt?: string
  subscription: {
    plan: PlanId
    status: SubStatus
    currentPeriodEnd: string | null
    currentPeriodStart?: string | null
    paymentProvider?: PaymentProvider | null
    monthlyTtsUsage?: number
  } | null
  learnerProfile?: AdminLearnerProfile | null
  metrics?: {
    totalStudyTimeMinutes: number
    totalWordsTyped: number
    currentStreak: number
    longestStreak: number
    lastStudyDate: string | null
    estimatedLevel: string | null
    grammarSkill: number
    vocabularySkill: number
    fluencySkill: number
    speakingSkill: number
  } | null
  classUsers?: {
    id: string
    role: UserRole
    class: {
      id: string
      className: string
      classCode: string
      classStatus: string
    }
  }[]
  goals?: AdminUserGoal[]
  vocabularies?: AdminUserVocab[]
  sessions?: AdminUserSession[]
  progress?: AdminUserProgress[]
  taskSubmissions?: AdminUserTaskSubmission[]
  fibSubscriptions?: AdminFibSubscription[]
}

export interface AdminUserListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ── Admin dashboard stats (GET /admin/dashboard) ─────────────────────────────

/** GET /admin/dashboard. Weeks are rolling 7 days compared with the 7 before. */
export interface AdminDashboardData {
  users: { total: number; students: number; tutors: number; admins: number; newThisWeek: number; newLastWeek: number }
  /** Active = sent the AI tutor a message in the window */
  activity: { active24h: number; activeThisWeek: number; activeLastWeek: number; messagesThisWeek: number; messagesLastWeek: number }
  /** Students: signed up → verified → practised → paying now */
  funnel: { signedUp: number; verified: number; practised: number; paying: number }
  /** Paid plans only while their period hasn't ended */
  plans: { FREE: number; GOLD: number; PREMIUM: number; expiredNotDowngraded: number }
  revenue: {
    /** FIB money from subscriptions activated this month (renewals aren't stored) */
    fibThisMonthIQD: number
    fibThisMonthCount: number
    fibLastMonthIQD: number
    payingByProvider: Record<string, number>
  }
  expiringSoon: { userId: string; name: string; plan: 'FREE' | 'GOLD' | 'PREMIUM'; endsAt: string; cancelling: boolean }[]
  /** Messages to the AI tutor in the last 7 days, by the sender's plan */
  aiUsage: { FREE: number; GOLD: number; PREMIUM: number }
  attention: { unverifiedOver24h: number; fibPaymentsStuck: number }
  people: {
    newest: { id: string; name: string; username: string; role: UserRole; verified: boolean; plan: PlanId; joinedAt: string }[]
    /** Most practice minutes in the last 7 days */
    mostActive: { id: string; name: string; minutes: number; messages: number; plan: PlanId }[]
    /** Practised before, not in the last 7 days; most recently quiet first */
    goneQuiet: { id: string; name: string; lastPracticeAt: string; plan: PlanId }[]
    goneQuietCount: number
  }
  /** Every class that isn't archived, biggest first (same numbers as the tutor dashboard) */
  classes: AdminClassRow[]
  /** Last 30 UTC days, oldest first */
  trend: { date: string; signUps: number; activeLearners: number; messages: number }[]
  learning: {
    skills: { grammar: number; vocabulary: number; fluency: number; speaking: number; practisingStudents: number }
    /** Students by the level the AI hears; NONE = not measured yet */
    levels: Record<string, number>
    commonMistakes: StudentMistake[]
    /** Conversations started in the last 7 days */
    modes: { chat: number; voice: number; voiceMinutes: number }
    heavyUsers: { id: string; name: string; messages: number; plan: PlanId }[]
  }
}

export type AdminClassRow = TutorClassHealth & { teacher: { id: string; name: string } | null }

/** One row in an admin people list (Admin/AdminPeopleList) */
export interface AdminPeopleRow {
  id: string
  name: string
  meta: string
  badge?: { text: string; class?: string; style?: string } | null
}

// ── Patch user (PATCH /admin/users/:id) ──────────────────────────────────────

export interface PatchUserInput {
  role?: UserRole
  isActive?: boolean
}

// ── Assign subscription (PUT /admin/users/:id/subscription) ──────────────────

export interface AssignSubscriptionInput {
  plan: PlanId
  durationMonths?: IntervalMonths
  endDate?: string
  paymentProvider?: PaymentProvider
}
