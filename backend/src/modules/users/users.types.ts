import type { Role, Plan, SubStatus, ClassStatus, AuthProvider, AiPersonality, GoalType, GoalStatus, GoalDifficulty, VocabSource, SessionMode, PaymentProvider } from "@prisma/client";

export interface UserListItem {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  isActive: boolean;
  role: Role;
  phoneNumber: string | null;
  createdAt: Date;
  subscription: {
    plan: Plan;
    status: SubStatus;
    currentPeriodEnd: Date | null;
  } | null;
}

export interface UserDetail extends UserListItem {
  updatedAt: Date;
  authProvider: AuthProvider;
  emailVerified: boolean;
  emailVerifiedAt: Date | null;
  learnerProfile: {
    id: string;
    currentLevel: string | null;
    targetLevel: string | null;
    learningPurpose: string | null;
    weeklyGoalMinutes: number;
    timezone: string;
    uiLanguage: string;
    theme: string;
    emailDigestEnabled: boolean;
    topicsOfInterest: unknown;
    aiPersonality: AiPersonality | null;
    voiceSpeed: number;
    autoSpeak: boolean;
  } | null;
  subscription: {
    id: string;
    plan: Plan;
    status: SubStatus;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    paymentProvider: PaymentProvider | null;
    monthlyTtsUsage: number;
  } | null;
  metrics: {
    id: string;
    totalStudyTimeMinutes: number;
    totalWordsTyped: number;
    currentStreak: number;
    longestStreak: number;
    lastStudyDate: Date | null;
    estimatedLevel: string | null;
    grammarSkill: number;
    vocabularySkill: number;
    fluencySkill: number;
    speakingSkill: number;
  } | null;
  classUsers: {
    id: string;
    role: Role;
    class: {
      id: string;
      className: string;
      classCode: string;
      classStatus: ClassStatus;
    };
  }[];
  goals: {
    id: string;
    type: GoalType;
    description: string;
    target: number;
    difficulty: GoalDifficulty | null;
    status: GoalStatus;
    progress: number;
    startDate: Date;
    targetDate: Date | null;
    completedDate: Date | null;
    createdAt: Date;
    assignedByTutor: { id: string; displayName: string } | null;
  }[];
  vocabularies: {
    id: string;
    word: string;
    definition: string;
    partOfSpeech: string | null;
    masteryLevel: number;
    source: VocabSource;
    srsInterval: number;
    srsDue: Date | null;
    reviewCount: number;
    correctCount: number;
    incorrectCount: number;
    lastPracticed: Date | null;
    createdAt: Date;
    assignedByTutor: { id: string; displayName: string } | null;
  }[];
  sessions: {
    id: string;
    mode: SessionMode;
    topic: string | null;
    startedAt: Date;
    endedAt: Date | null;
    durationSeconds: number | null;
    messageCount: number;
    evaluation: {
      avgOverallScore: number;
      avgGrammarScore: number;
      avgVocabularyScore: number;
      avgFluencyScore: number;
      detectedCefrLevel: string;
      strengths: string[];
      weaknesses: string[];
    } | null;
  }[];
  progress: {
    date: Date;
    sessionsCount: number;
    studyMinutes: number;
    messagesCount: number;
    wordsTyped: number;
    vocabularyPracticed: number;
    goalsAdvanced: number;
  }[];
  taskSubmissions: {
    id: string;
    content: string | null;
    feedback: string | null;
    feedbackAt: Date | null;
    createdAt: Date;
    task: {
      id: string;
      title: string;
      description: string;
      deadline: Date | null;
      status: string;
      class: { id: string; className: string };
    };
  }[];
  fibSubscriptions: {
    id: string;
    plan: Plan;
    intervalMonths: number;
    amountIQD: number;
    fibStatus: string;
    activatedAt: Date | null;
    cancelledAt: Date | null;
    createdAt: Date;
  }[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardData {
  todayProgress: {
    sessionsCount: number;
    studyMinutes: number;
    messagesCount: number;
    wordsTyped: number;
    vocabularyPracticed: number;
    goalsAdvanced: number;
  };
  metrics: {
    currentStreak: number;
    longestStreak: number;
    totalStudyTimeMinutes: number;
    estimatedLevel: string | null;
    grammarSkill: number;
    vocabularySkill: number;
    fluencySkill: number;
    speakingSkill: number;
  };
  activeGoalsCount: number;
  vocabDueTodayCount: number;
  lastSession: {
    id: string;
    topic: string | null;
    endedAt: Date | null;
    durationSeconds: number | null;
    evaluation: {
      avgOverallScore: number;
      detectedCefrLevel: string;
    } | null;
  } | null;
}

// ─── Self-profile ──────────────────────────────────────────────────────────────

export interface MyProfile {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
  role: Role;
  isActive: boolean;
  authProvider: AuthProvider;
  createdAt: Date;
  updatedAt: Date;
  subscription: {
    plan: Plan;
    status: SubStatus;
    currentPeriodEnd: Date | null;
  } | null;
  learnerProfile: {
    id: string;
    currentLevel: string | null;
    targetLevel: string | null;
    learningPurpose: string | null;
    topicsOfInterest: unknown;
    aiPersonality: AiPersonality | null;
    voiceSpeed: number;
    autoSpeak: boolean;
    uiLanguage: string;
    theme: string;
    weeklyGoalMinutes: number;
    timezone: string;
    emailDigestEnabled: boolean;
  } | null;
}
