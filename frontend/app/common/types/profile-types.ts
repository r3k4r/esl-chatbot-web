export type ThemePreference = 'light' | 'dark'

/** The tutor's voice when it speaks (chat voice replies, Voice Lab) and the English it writes. */
export type TutorAccent = 'US' | 'GB'
export type TutorVoiceGender = 'FEMALE' | 'MALE'
export interface TutorVoiceChoice {
  accent: TutorAccent
  gender: TutorVoiceGender
}

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
  tutorAccent: TutorAccent
  tutorVoice: TutorVoiceGender
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
  tutorAccent?: TutorAccent
  tutorVoice?: TutorVoiceGender
}
