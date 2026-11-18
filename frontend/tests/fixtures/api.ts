/**
 * Deterministic API payloads shared by the unit tests and the e2e mock API.
 * Shapes are typed against the app's own types, so a backend contract change
 * that the frontend adopts shows up here as a type error.
 */
import type { User } from '../../app/common/model/user'
import type { Goal } from '../../app/common/model/goal'
import type { Notification } from '../../app/common/model/notification'
import type { SessionListItem, SessionDetail, ChatMessage } from '../../app/common/types/chat-types'
import type { VocabularyItem, VocabularyStats } from '../../app/common/types/vocabulary-types'
import type {
  ClassItem, ClassDetail, AdminClassItem, ClassStudentSummary, ClassStudentDetail, ClassAnalytics, AnnouncementItem, AnnouncementCommentItem,
} from '../../app/common/types/class-types'
import type { TaskItem, TaskSubmissionItem, TaskCommentItem, TaskAttachment } from '../../app/common/types/task-types'
import type { MyProfileData } from '../../app/common/types/profile-types'
import type { UserSubscriptionDetail, FibPaymentRecord } from '../../app/common/types/subscription-types'
import type { AdminDashboardData, AdminUserItem } from '../../app/common/types/admin-types'
import type { TutorDashboardData } from '../../app/common/types/tutor-types'
import type { GlobalSearchResults } from '../../app/common/types/search-types'

export { overviewFixture } from './overview'

const T = '2026-06-15T09:00:00.000Z'
const DAY = 86_400_000
const daysFrom = (n: number) => new Date(Date.now() + n * DAY).toISOString()

// ── Accounts ────────────────────────────────────────────────────────────────
// Usernames match the backend seed (backend/prisma/seed.ts); password is `password123`.

export type Persona = 'student' | 'free' | 'tutor' | 'admin'
export const PASSWORD = 'password123'

export const USERS: Record<Persona, User> = {
  student: { id: 'u-student', username: 'student_ali', email: 'ali@tutelage.test', displayName: 'Ali Hassan', role: 'STUDENT', avatarUrl: '', isActive: true, emailVerified: true, subscription: { plan: 'PREMIUM', status: 'ACTIVE' } },
  free: { id: 'u-free', username: 'student_yuki', email: 'yuki@tutelage.test', displayName: 'Yuki Tanaka', role: 'STUDENT', avatarUrl: '', isActive: true, emailVerified: true, subscription: { plan: 'FREE', status: 'ACTIVE' } },
  tutor: { id: 'u-tutor', username: 'tutor_sarah', email: 'sarah@tutelage.test', displayName: 'Sarah Miller', role: 'TUTOR', avatarUrl: '', isActive: true, emailVerified: true, subscription: { plan: 'FREE', status: 'ACTIVE' } },
  admin: { id: 'u-admin', username: 'admin_main', email: 'admin@tutelage.test', displayName: 'Admin Main', role: 'ADMIN', avatarUrl: '', isActive: true, emailVerified: true, subscription: { plan: 'FREE', status: 'ACTIVE' } },
}

export const tokenFor = (p: Persona) => `e2e-${p}`
export const refreshFor = (p: Persona) => `e2e-refresh-${p}`
export const personaFromToken = (token?: string | null): Persona | null => {
  const p = token?.replace(/^Bearer\s+/i, '').replace(/^e2e-/, '')
  return p && p in USERS ? (p as Persona) : null
}

export function profileFor(p: Persona): MyProfileData {
  const u = USERS[p]
  return {
    id: u.id, username: u.username, email: u.email, displayName: u.displayName, avatarUrl: null, phoneNumber: null,
    role: u.role, isActive: true, authProvider: 'LOCAL', createdAt: T, updatedAt: T,
    subscription: { plan: u.subscription.plan, status: 'ACTIVE', currentPeriodEnd: u.subscription.plan === 'FREE' ? null : daysFrom(20) },
    learnerProfile: u.role === 'STUDENT'
      ? { id: `lp-${p}`, currentLevel: 'B1', targetLevel: 'C1', learningPurpose: 'WORK', topicsOfInterest: ['travel', 'business'], aiPersonality: 'FRIENDLY', voiceSpeed: 1, autoSpeak: false, uiLanguage: 'en', theme: 'light', weeklyGoalMinutes: 150, timezone: 'Asia/Baghdad', emailDigestEnabled: true }
      : null,
  }
}

export function subscriptionFor(p: Persona): UserSubscriptionDetail {
  const plan = USERS[p].subscription.plan
  return { plan, status: 'ACTIVE', currentPeriodEnd: plan === 'FREE' ? null : daysFrom(20), paymentProvider: plan === 'FREE' ? null : 'CASH', externalSubscriptionId: null, cancelAtPeriodEnd: false }
}

export const fibPayments: FibPaymentRecord[] = [
  { fibSubscriptionId: 'fib-1', plan: 'GOLD', intervalMonths: 1, amountIQD: 25000, fibStatus: 'ACTIVE', wasCharged: true, awaitingConfirmation: false, createdAt: T, activatedAt: T, cancelledAt: null, validUntil: daysFrom(20) },
]

// ── Learning data (student) ─────────────────────────────────────────────────

export const sessions: SessionListItem[] = [
  { id: 'sess-1', mode: 'TEXT', topic: 'Ordering coffee', title: 'Ordering Coffee', isPinned: false, summary: 'Practised café vocabulary.', startedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(), endedAt: null, durationSeconds: null, messageCount: 6, averageScore: 78, createdAt: T },
  { id: 'sess-2', mode: 'VOICE', topic: 'Job interview', title: null, isPinned: false, summary: null, startedAt: new Date(Date.now() - 3 * DAY).toISOString(), endedAt: new Date(Date.now() - 3 * DAY + 600_000).toISOString(), durationSeconds: 600, messageCount: 4, averageScore: 71, createdAt: T },
]

export const messages: ChatMessage[] = [
  { id: 'm1', role: 'USER', type: 'TEXT', content: 'I would like a large coffee, please.', wordCount: 7, createdAt: T, evaluation: { grammarScore: 90, vocabularyScore: 80, vocabularyLevel: 'B1', fluencyScore: 85, overallScore: 85, detectedCefrLevel: 'B1', grammarErrors: [], corrections: [], feedback: 'Polite and clear.' } },
  { id: 'm2', role: 'ASSISTANT', type: 'TEXT', content: '<p>Great order! Would you like milk with that?</p>', createdAt: T, evaluation: null },
]

export const sessionDetail = (id: string): SessionDetail => ({ ...(sessions.find((s) => s.id === id) ?? sessions[0]!), id, userId: 'u-student', messages, evaluation: null })

export const sentMessage = (content: string) => ({
  userMessage: { id: `m-${Date.now()}`, role: 'USER' as const, type: 'TEXT' as const, content, createdAt: new Date().toISOString(), evaluation: null },
  assistantMessage: { id: `a-${Date.now()}`, role: 'ASSISTANT' as const, type: 'TEXT' as const, content: '<p>[mock AI] Nice sentence! Tell me more.</p>', createdAt: new Date().toISOString(), evaluation: null },
  evaluation: messages[0]!.evaluation!,
})

const vocab = (i: number, word: string, definition: string, extra: Partial<VocabularyItem> = {}): VocabularyItem => ({
  id: `v${i}`, userId: 'u-student', word, definition, pronunciation: null, example: `She was ${word}.`, partOfSpeech: 'adjective', difficulty: 2, category: 'general',
  srsInterval: 1, srsDue: daysFrom(-1), srsEase: 2.5, reviewCount: 2, correctCount: 2, incorrectCount: 0, masteryLevel: 2, lastPracticed: T,
  source: 'MANUAL', assignedByTutorId: null, assignedByTutor: null, createdAt: T, updatedAt: T, ...extra,
})

export const vocabulary: VocabularyItem[] = [
  vocab(1, 'resilient', 'able to recover quickly'),
  vocab(2, 'meticulous', 'very careful about detail', { source: 'SESSION' }),
  vocab(3, 'candid', 'honest and direct', { source: 'ASSIGNED', assignedByTutorId: 'u-tutor', assignedByTutor: { id: 'u-tutor', displayName: 'Sarah Miller', role: 'TUTOR' }, srsDue: daysFrom(3), masteryLevel: 4 }),
]

export const vocabularyStats: VocabularyStats = { total: 3, dueToday: 2, learnedThisWeek: 1, byMasteryLevel: { new: 0, seen: 0, learning: 2, familiar: 0, proficient: 1, mastered: 0 } }

export const goals: Goal[] = [
  { id: 'g1', userId: 'u-student', assignedByTutorId: null, type: 'VOCABULARY', description: 'Learn 50 travel words', target: 50, difficulty: 'MEDIUM', status: 'ACTIVE', progress: 40, actionPlan: '10 words a week', startDate: T, targetDate: daysFrom(30), completedDate: null, lastProgressUpdate: T, createdAt: T, updatedAt: T, assignedByTutor: null },
  { id: 'g2', userId: 'u-student', assignedByTutorId: 'u-tutor', type: 'SPEAKING', description: 'Hold a 5-minute conversation', target: 5, difficulty: 'HARD', status: 'COMPLETED', progress: 100, actionPlan: null, startDate: T, targetDate: null, completedDate: T, lastProgressUpdate: T, createdAt: T, updatedAt: T, assignedByTutor: { id: 'u-tutor', displayName: 'Sarah Miller', avatarUrl: null } },
]

export const metrics = { currentStreak: 6, longestStreak: 12, totalStudyTimeMinutes: 185, totalWordsTyped: 2400, estimatedLevel: 'B1', grammarSkill: 72, vocabularySkill: 68, fluencySkill: 70, speakingSkill: 64, lastStudyDate: T }

export const notifications: Notification[] = [
  { id: 'n1', userId: 'u-student', type: 'GOAL_ASSIGNED', message: 'Sarah assigned you a new goal', read: false, data: { goalId: 'g2' }, createdAt: T },
  { id: 'n2', userId: 'u-student', type: 'CLASS_ANNOUNCEMENT', message: 'New announcement in English B1', read: true, data: { classId: 'c1' }, createdAt: T },
]

// ── Classes ─────────────────────────────────────────────────────────────────

const classBase = { classCode: 'ENGB1X', classCategory: 'General English', classStatus: 'ACTIVE' as const, archived: false, archivedAt: null, classCodeBlocked: false, classCodeExpiresAt: null, classCodeRefreshIntervalSeconds: null, createdAt: T, joinedAt: T }

export const classes: ClassItem[] = [
  { ...classBase, id: 'c1', className: 'English B1 Evening', memberCount: 3, myRole: 'STUDENT' },
  { ...classBase, id: 'c2', className: 'Business English', classCode: 'BIZ77Q', memberCount: 2, myRole: 'STUDENT' },
]

export const adminClasses: AdminClassItem[] = classes.map(({ myRole: _r, ...c }) => c)

export function classDetail(id: string, viewer: Persona): ClassDetail {
  const base = classes.find((c) => c.id === id) ?? classes[0]!
  return {
    ...base,
    id,
    myRole: viewer === 'tutor' ? 'TUTOR' : viewer === 'admin' ? 'ADMIN' : 'STUDENT',
    members: [
      { id: 'cu1', role: 'TUTOR', user: { id: 'u-tutor', username: 'tutor_sarah', displayName: 'Sarah Miller', avatarUrl: '' } },
      { id: 'cu2', role: 'STUDENT', user: { id: 'u-student', username: 'student_ali', displayName: 'Ali Hassan', avatarUrl: '' } },
      { id: 'cu3', role: 'STUDENT', user: { id: 'u-free', username: 'student_yuki', displayName: 'Yuki Tanaka', avatarUrl: '' } },
    ],
  }
}

export const classStudents: ClassStudentSummary[] = [
  { userId: 'u-student', username: 'student_ali', displayName: 'Ali Hassan', avatarUrl: null, joinedAt: T, currentLevel: 'B1', targetLevel: 'C1', currentStreak: 6, estimatedLevel: 'B1', totalStudyTimeMinutes: 185, grammarSkill: 72, vocabularySkill: 68, fluencySkill: 70, speakingSkill: 64, lastPracticeAt: T, tasks: { total: 2, handedIn: 1, late: 0, missing: 1, reviewed: 0 }, vocabTotal: 3, vocabDueToday: 2 },
  { userId: 'u-free', username: 'student_yuki', displayName: 'Yuki Tanaka', avatarUrl: null, joinedAt: T, currentLevel: 'A2', targetLevel: 'B2', currentStreak: 1, estimatedLevel: 'A2', totalStudyTimeMinutes: 40, grammarSkill: 0, vocabularySkill: 0, fluencySkill: 0, speakingSkill: 0, lastPracticeAt: null, tasks: { total: 2, handedIn: 0, late: 0, missing: 0, reviewed: 0 }, vocabTotal: 12, vocabDueToday: 5 },
]

export const classStudentDetail = (userId: string): ClassStudentDetail => {
  const s = classStudents.find((x) => x.userId === userId) ?? classStudents[0]!
  return {
    userId: s.userId, username: s.username, displayName: s.displayName, avatarUrl: null, joinedAt: T,
    learnerProfile: { currentLevel: s.currentLevel, targetLevel: s.targetLevel, learningPurpose: 'WORK', topicsOfInterest: ['travel'], weeklyGoalMinutes: 150, timezone: 'Asia/Baghdad', aiPersonality: 'FRIENDLY' },
    metrics: { ...metrics, estimatedLevel: s.estimatedLevel },
    vocabTotal: s.vocabTotal, vocabDueToday: s.vocabDueToday,
    skills: s.lastPracticeAt
      ? { grammar: 72, vocabulary: 68, fluency: 70, speaking: 64, basedOnMessages: 40, basedOnSpoken: 6 }
      : { grammar: null, vocabulary: null, fluency: null, speaking: null, basedOnMessages: 0, basedOnSpoken: 0 },
    practice: { lastPracticeAt: s.lastPracticeAt, chats: s.lastPracticeAt ? 9 : 0, totalStudyTimeMinutes: s.totalStudyTimeMinutes, currentStreak: s.currentStreak, longestStreak: 8 },
    tasks: [
      { id: 't1', title: 'Describe your weekend', deadline: daysFrom(5), taskStatus: 'OPEN', state: 'HANDED_IN', handedInAt: T },
      { id: 't2', title: 'Past tense quiz', deadline: daysFrom(-2), taskStatus: 'CLOSED', state: 'MISSING', handedInAt: null },
    ],
    taskSummary: s.tasks,
    mistakes: s.lastPracticeAt ? [{ rule: 'Past simple of irregular verbs', count: 6, example: { said: 'I buyed bread', better: 'I bought bread' } }] : [],
  }
}

export const classAnalytics = (id: string): ClassAnalytics => ({
  classId: id, className: 'English B1 Evening', studentCount: 2,
  averageSkills: { grammar: 62, vocabulary: 58, fluency: 60, speaking: 55 },
  practisingStudents: 1,
  mostCommonGrammarErrors: [{ error: 'Subject-verb agreement', count: 7 }, { error: 'Article usage', count: 4 }],
  vocabularyCoverage: 54,
})

export const announcements: AnnouncementItem[] = [
  {
    id: 'an1', classId: 'c1', authorId: 'u-tutor', content: 'Welcome to the class! Homework is due Friday.',
    commentsEnabled: true, editedAt: null, createdAt: T, commentCount: 1, attachments: [],
    author: { id: 'u-tutor', displayName: 'Sarah Miller', avatarUrl: '' },
  },
]

export const announcementComments: AnnouncementCommentItem[] = [
  { id: 'ac1', announcementId: 'an1', content: 'Is it the worksheet from Monday?', editedAt: null, createdAt: T, author: { id: 'u-student', displayName: 'Ali Hassan', avatarUrl: '', classRole: 'STUDENT' } },
]

const author = { id: 'u-tutor', displayName: 'Sarah Miller', avatarUrl: '' }
const worksheet: TaskAttachment = { id: 'ta1', taskId: 't1', commentId: null, submissionId: null, uploadedById: 'u-tutor', fileName: 'weekend-worksheet.pdf', fileUrl: 'https://files.tutelage.test/tasks/t1/ws.pdf', mimeType: 'application/pdf', size: 48_213, createdAt: T }
// A 1×1 PNG as a data URL, so the image viewer has something real to show offline.
const photo: TaskAttachment = { id: 'ta2', taskId: 't1', commentId: null, submissionId: null, uploadedById: 'u-tutor', fileName: 'park-photo.png', fileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', mimeType: 'image/png', size: 70, createdAt: T }
export const tasks: TaskItem[] = [
  { id: 't1', classId: 'c1', createdById: 'u-tutor', title: 'Describe your weekend', description: 'Write 150 words about your weekend.', deadline: daysFrom(5), status: 'OPEN', closedAt: null, commentsEnabled: true, commentCount: 2, attachments: [worksheet, photo], createdAt: T, updatedAt: T, createdBy: author, submissionCount: 1, mySubmission: null },
  { id: 't2', classId: 'c1', createdById: 'u-tutor', title: 'Past tense quiz', description: 'Answer the ten questions.', deadline: null, status: 'CLOSED', closedAt: T, commentsEnabled: false, commentCount: 0, attachments: [], createdAt: T, updatedAt: T, createdBy: author, submissionCount: 2, mySubmission: null },
]

export const taskComments: TaskCommentItem[] = [
  { id: 'tc1', taskId: 't1', content: 'Use the past simple, please.', editedAt: null, createdAt: T, author: { ...author, classRole: 'TUTOR' }, attachments: [] },
  { id: 'tc2', taskId: 't1', content: 'Can I write about Sunday only?', editedAt: null, createdAt: T, author: { id: 'u-student', displayName: 'Ali Hassan', avatarUrl: '', classRole: 'STUDENT' }, attachments: [] },
]

export const submissions: TaskSubmissionItem[] = [
  { id: 'sub1', taskId: 't1', studentId: 'u-student', content: 'On Saturday I visited my grandmother.', fileUrl: null, feedback: null, feedbackAt: null, createdAt: T, updatedAt: T, student: { id: 'u-student', displayName: 'Ali Hassan', avatarUrl: '' }, attachments: [] },
]

// ── Staff dashboards ───────────────────────────────────────────────────────

export const tutorDashboard: TutorDashboardData = {
  totals: { classes: 2, students: 5, activeThisWeek: 3, toReview: 1, missing: 2 },
  needsYou: {
    toReview: [{ submissionId: 'sub1', taskId: 't1', classId: 'c1', taskTitle: 'Write about your weekend', className: 'English B1 Evening', studentName: 'Ali Hassan', handedInAt: T }],
    dueSoon: [{ taskId: 't1', classId: 'c1', title: 'Write about your weekend', className: 'English B1 Evening', deadline: daysFrom(3), handedIn: 1, students: 3 }],
    inactive: [{ userId: 'u-free', classId: 'c1', displayName: 'Yuki Tanaka', avatarUrl: null, className: 'English B1 Evening', lastPracticeAt: null }],
    inactiveCount: 2,
  },
  classes: [
    { id: 'c1', name: 'English B1 Evening', students: 3, activeThisWeek: 2, handInRate: 67, missing: 2, toReview: 1, avgSkill: 66 },
    { id: 'c2', name: 'Business English', students: 2, activeThisWeek: 1, handInRate: null, missing: 0, toReview: 0, avgSkill: null },
  ],
  skills: { grammar: 62, vocabulary: 58, fluency: 60, speaking: 55, practisingStudents: 3 },
  commonMistakes: [{ rule: 'Past simple of irregular verbs', count: 7, example: { said: 'I goed home', better: 'I went home' } }],
}

export const adminDashboard: AdminDashboardData = {
  users: { total: 128, students: 118, tutors: 8, admins: 2, newThisWeek: 9, newLastWeek: 6 },
  activity: { active24h: 34, activeThisWeek: 77, activeLastWeek: 80, messagesThisWeek: 2140, messagesLastWeek: 1900 },
  funnel: { signedUp: 118, verified: 96, practised: 80, paying: 38 },
  plans: { FREE: 80, GOLD: 25, PREMIUM: 13, expiredNotDowngraded: 1 },
  revenue: { fibThisMonthIQD: 1250000, fibThisMonthCount: 5, fibLastMonthIQD: 900000, payingByProvider: { CASH: 20, FIB: 18 } },
  expiringSoon: [{ userId: 'u-student', name: 'Ali Hassan', plan: 'GOLD', endsAt: daysFrom(4), cancelling: false }],
  aiUsage: { FREE: 600, GOLD: 1000, PREMIUM: 540 },
  attention: { unverifiedOver24h: 3, fibPaymentsStuck: 0 },
}

export const adminUsers: AdminUserItem[] = (Object.keys(USERS) as Persona[]).map((p) => {
  const u = USERS[p]
  return {
    id: u.id, username: u.username, email: u.email, displayName: u.displayName, avatarUrl: null, isActive: true, role: u.role, phoneNumber: null, createdAt: T,
    subscription: { plan: u.subscription.plan, status: 'ACTIVE', currentPeriodEnd: u.subscription.plan === 'FREE' ? null : daysFrom(20) },
  }
})

export const adminUserDetail = (id: string): AdminUserItem => {
  const base = adminUsers.find((u) => u.id === id) ?? adminUsers[0]!
  return {
    ...base, authProvider: 'LOCAL', emailVerified: true, emailVerifiedAt: T, updatedAt: T,
    learnerProfile: { id: 'lp', currentLevel: 'B1', targetLevel: 'C1', learningPurpose: 'WORK', topicsOfInterest: ['travel'], aiPersonality: 'FRIENDLY', voiceSpeed: 1, autoSpeak: false, theme: 'light', weeklyGoalMinutes: 150, timezone: 'Asia/Baghdad' },
    metrics, classUsers: [{ id: 'cu2', role: 'STUDENT', class: { id: 'c1', className: 'English B1 Evening', classCode: 'ENGB1X', classStatus: 'ACTIVE' } }],
    goals: [], vocabularies: [], sessions: [], progress: [], taskSubmissions: [], fibSubscriptions: [],
  }
}

export const searchResults = (q: string): GlobalSearchResults => ({
  query: q, total: 2,
  results: {
    users: [], classes: [{ id: 'c1', className: 'English B1 Evening', classCategory: 'General English' }],
    vocabulary: [{ id: 'v1', word: 'resilient', definition: 'able to recover quickly' }], goals: [], sessions: [],
  },
})

export const agreement = { version: '1.0', effectiveDate: '2026-01-01', text: 'Terms of Service (test copy). Be kind and learn English.' }
