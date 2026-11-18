import type { Class, ClassUser, Announcement, AnnouncementAttachment, AnnouncementComment } from '~/common/model/class'
import type { User } from '~/common/model/user'

// ─── API list / detail shapes (extend the base model) ────────────────────────

export interface ClassMember extends Pick<ClassUser, 'id' | 'role'> {
  user: Pick<User, 'id' | 'username' | 'displayName' | 'avatarUrl'>
}

export interface ClassItem extends Omit<Class, 'classCodeRefreshedAt' | 'createdById' | 'updatedAt'> {
  memberCount: number
  myRole?: 'STUDENT' | 'TUTOR' | 'ADMIN'
}

export interface ClassDetail extends ClassItem {
  members: ClassMember[]
}

export interface AdminClassItem extends Omit<Class, 'classCodeRefreshedAt' | 'createdById' | 'updatedAt'> {
  memberCount: number
}

// ─── Student monitoring ───────────────────────────────────────────────────────

/** How a student is doing with this class's tasks */
export interface TaskRecord {
  total: number
  /** Includes late and reviewed hand-ins */
  handedIn: number
  late: number
  /** Past the deadline and not handed in */
  missing: number
  reviewed: number
}

export type StudentTaskState = 'ASSIGNED' | 'MISSING' | 'CLOSED' | 'HANDED_IN' | 'LATE' | 'REVIEWED'

export interface StudentTaskItem {
  id: string
  title: string
  deadline: string | null
  taskStatus: 'OPEN' | 'CLOSED'
  state: StudentTaskState
  handedInAt: string | null
}

export interface StudentMistake {
  rule: string
  count: number
  example: { said: string; better: string } | null
}

/** Averages of the student's latest 40 scored chat messages; null = no data yet */
export interface SkillSnapshot {
  grammar: number | null
  vocabulary: number | null
  fluency: number | null
  /** Pronunciation on spoken messages; null until they use voice chat */
  speaking: number | null
  basedOnMessages: number
  basedOnSpoken: number
  /** Most common CEFR level the AI gave their latest messages */
  level?: string | null
}

export interface ClassStudentSummary {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  joinedAt: string
  currentLevel: string | null
  targetLevel: string | null
  currentStreak: number
  estimatedLevel: string | null
  totalStudyTimeMinutes: number
  grammarSkill: number
  vocabularySkill: number
  fluencySkill: number
  /** 0 = no voice practice yet */
  speakingSkill: number
  /** Last message to the AI tutor; null = never practised */
  lastPracticeAt: string | null
  tasks: TaskRecord
  vocabTotal: number
  vocabDueToday: number
}

export interface ClassStudentDetail {
  userId: string
  username: string
  displayName: string
  avatarUrl: string | null
  joinedAt: string
  learnerProfile: {
    currentLevel: string | null
    targetLevel: string | null
    learningPurpose: string | null
    topicsOfInterest: string[]
    weeklyGoalMinutes: number
    timezone: string | null
    aiPersonality: string | null
  } | null
  metrics: {
    currentStreak: number
    longestStreak: number
    estimatedLevel: string | null
    totalStudyTimeMinutes: number
    grammarSkill: number
    vocabularySkill: number
    fluencySkill: number
    speakingSkill: number
    lastStudyDate: string | null
  } | null
  vocabTotal: number
  vocabDueToday: number
  skills: SkillSnapshot
  practice: {
    lastPracticeAt: string | null
    /** Chats with at least one message */
    chats: number
    totalStudyTimeMinutes: number
    currentStreak: number
    longestStreak: number
  }
  tasks: StudentTaskItem[]
  taskSummary: TaskRecord
  /** Most frequent grammar mistakes in the last 30 days */
  mistakes: StudentMistake[]
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export interface ClassAnalytics {
  classId: string
  className: string
  studentCount: number
  /** Averages over students who have practised (0 = nobody yet) */
  averageSkills: { grammar: number; vocabulary: number; fluency: number; speaking: number }
  /** Students with at least one scored message */
  practisingStudents: number
  mostCommonGrammarErrors: { error: string; count: number }[]
  vocabularyCoverage: number
}

// ─── Announcements ────────────────────────────────────────────────────────────

export type AnnouncementFile = Pick<AnnouncementAttachment, 'id' | 'fileName' | 'fileUrl' | 'mimeType' | 'size' | 'createdAt'>

export interface AnnouncementItem extends Announcement {
  author: Pick<User, 'id' | 'displayName' | 'avatarUrl'>
  attachments: AnnouncementFile[]
  commentCount: number
}

/** Text-only class comment under an announcement */
export interface AnnouncementCommentItem extends Pick<AnnouncementComment, 'id' | 'announcementId' | 'content' | 'editedAt' | 'createdAt'> {
  author: Pick<User, 'id' | 'displayName' | 'avatarUrl'> & { classRole: 'TUTOR' | 'STUDENT' | 'ADMIN' }
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface ClassPaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}
