// Voice Lab: a live call with Gemini Live (speech to speech), plus the shapes of its
// saved turns (POST /live/calls/:sessionId/turns). Pronunciation is GOLD/PREMIUM-only.

// A single per-word pronunciation flag from Azure (GOLD/PREMIUM only).
export interface VoicePronIssue {
  word: string
  issue: string
  suggestion: string
}

// Full pronunciation assessment — only present on GOLD/PREMIUM turns.
export interface VoicePronunciation {
  accuracyScore: number
  fluencyScore: number
  completenessScore: number
  prosodyScore: number | null // null on GOLD (basic), number on PREMIUM (full)
  overallScore: number
  issues: VoicePronIssue[]
}

// The skill breakdown of one answer (all plans).
export interface VoiceEvaluation {
  grammarScore: number
  vocabularyScore: number
  vocabularyLevel: string
  fluencyScore: number
  overallScore: number
  detectedCefrLevel: string
  feedback: string
}

// One exchange of the call. The tutor's greeting has no learner words and isn't saved.
export interface VoiceTurn {
  id: string
  transcript: string // what the learner said
  reply: string // what the tutor answered
  evaluation: VoiceEvaluation | null
  pronunciation: VoicePronunciation | null
  /** Scores are on their way. */
  scoring: boolean
}

// ─── Live call ────────────────────────────────────────────────────────────────

// idle → connecting → live → idle. Inside a live call, who is talking drives the orb.
export type CallPhase = 'idle' | 'connecting' | 'live'
export type CallSpeaker = 'none' | 'learner' | 'tutor'

// Why a call can't start (null = it can): unverified email, inactive plan, or a daily limit.
export type CallLock = 'verify' | 'inactive' | 'sessions' | 'messages' | null

// POST /live/calls
export interface LiveCallStart {
  sessionId: string
  token: string
  model: string
  expiresAt: string
}

// POST /live/calls/:sessionId/turns
export interface LiveTurnSaved {
  evaluation: VoiceEvaluation | null
  pronunciation: VoicePronunciation | null
  /** FREE messages left today; null = no cap. 0 = the call must end. */
  remainingMessages: number | null
}
