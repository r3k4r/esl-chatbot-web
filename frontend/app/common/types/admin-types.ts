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

export interface AdminDashboardData {
  users: {
    total: number
    byRole: { STUDENT: number; TUTOR: number; ADMIN: number }
  }
  subscriptions: { FREE: number; GOLD: number; PREMIUM: number }
  activeUsers: { daily: number; weekly: number }
  totalSessionsToday: number
  revenueByProvider: Record<string, number>
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
