export type SessionMode = 'TEXT' | 'VOICE'
export type MessageRole = 'USER' | 'ASSISTANT'
export type MessageType = 'TEXT' | 'VOICE'
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface SessionListItem {
  id: string
  mode: SessionMode
  topic: string | null
  /** AI-given name (first reply), renamable. Null until then. */
  title: string | null
  isPinned: boolean
  summary: string | null
  startedAt: string
  endedAt: string | null
  durationSeconds: number | null
  messageCount: number
  averageScore: number | null
  createdAt: string
}

export interface MessageEvaluation {
  grammarScore: number
  grammarErrors?: Array<{
    error: string
    correction: string
    rule?: string
    severity?: 'minor' | 'major' | 'critical'
  }>
  vocabularyScore: number
  vocabularyLevel: CefrLevel
  fluencyScore: number
  pronunciationScore?: number | null
  overallScore: number
  detectedCefrLevel: CefrLevel
  corrections?: Array<{
    original: string
    corrected: string
    explanation: string
  }>
  feedback?: string
}

export interface SessionEvaluation {
  topicsCovered?: string[]
  avgGrammarScore: number
  avgVocabularyScore: number
  avgFluencyScore: number
  avgOverallScore: number
  detectedCefrLevel: CefrLevel
  strengths?: string[]
  weaknesses?: string[]
  recommendations?: string[]
  newVocabulary?: string[]
  totalUserMessages: number
  totalUserWords: number
}

export interface ChatMessage {
  id: string
  role: MessageRole
  type: MessageType
  content: string
  wordCount?: number | null
  audioUrl?: string | null
  audioDurationSec?: number | null
  createdAt: string
  evaluation?: MessageEvaluation | null
  // client-only:
  pending?: boolean
  streaming?: boolean
}

export interface SessionDetail extends SessionListItem {
  userId?: string
  messages: ChatMessage[]
  evaluation: SessionEvaluation | null
}

/** GET /sessions/usage — can a conversation (chat or call) start right now? */
export interface SessionUsage {
  plan: 'FREE' | 'GOLD' | 'PREMIUM'
  active: boolean
  sessionsToday: number
  sessionsPerDay: number
  messagesToday: number
  /** FREE only; null = no daily message cap. */
  messagesPerDay: number | null
  canStart: boolean
  reason: 'INACTIVE' | 'SESSION_LIMIT' | 'MESSAGE_LIMIT' | null
  resetsInSeconds: number
}

/** One line of the landing page's animated chat (Pages/Home/ChatMockup). */
export interface ChatMockupMessage {
  who: 'user' | 'ai'
  text: string
  /** sent or answered as a voice message (shows a player) */
  voice?: boolean
  /** the tutor's correction under a learner message: [before, the fixed words, after] */
  fix?: [string, string, string]
}
