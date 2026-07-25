export type ThemePreference = 'light' | 'dark'

export interface MyLearnerProfile {
  id: string
  currentLevel: string | null
  targetLevel: string | null
  learningPurpose: string | null
  topicsOfInterest: string[]
  aiPersonality: string | null
  voiceSpeed: number
  autoSpeak: boolean
  uiLanguage: string
  theme: string
  weeklyGoalMinutes: number
  timezone: string
  emailDigestEnabled: boolean
}

export interface MyProfileData {
  id: string
  username: string
  email: string
  displayName: string
  avatarUrl: string | null
  phoneNumber: string | null
  role: 'STUDENT' | 'TUTOR' | 'ADMIN'
  isActive: boolean
  authProvider: 'LOCAL' | 'GOOGLE'
  createdAt: string
  updatedAt: string
  subscription: {
    plan: 'FREE' | 'GOLD' | 'PREMIUM'
    status: 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'PAST_DUE'
    currentPeriodEnd: string | null
  } | null
  learnerProfile: MyLearnerProfile | null
}

export interface UpdateProfileInput {
  displayName?: string
  phoneNumber?: string | null
}

export interface UpdateLearnerProfileInput {
  targetLevel?: string | null
  learningPurpose?: string | null
  topicsOfInterest?: string[]
  aiPersonality?: string | null
  voiceSpeed?: number
  autoSpeak?: boolean
  theme?: string
  weeklyGoalMinutes?: number
  timezone?: string
  emailDigestEnabled?: boolean
}
