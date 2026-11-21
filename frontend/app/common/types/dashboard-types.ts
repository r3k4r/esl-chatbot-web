// ─── Navigation ───────────────────────────────────────────────────────────────

import type { SvgBasedIconName } from "./iconsax-types"

export type DashboardNavId =
  | 'dashboard'
  | 'users'
  | 'learning'
  | 'revenue'
  | 'chat'
  | 'voice'
  | 'vocab'
  | 'goals'
  | 'classes'
  | 'lessons'
  | 'profile'
  | 'billing'

export interface DashboardNavItem {
  id: DashboardNavId
  label: string
  icon: SvgBasedIconName
  badge?: number
  path: string
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface ChatSession {
  id: number | string
  title: string
  when: string
  active?: boolean
  pinned?: boolean
  preview: string
}

export interface ChatMessage {
  who: 'ai' | 'user'
  text: string
  time: string
  type?: 'TEXT' | 'VOICE'
  audioUrl?: string | null    // R2 URL for stored voice audio (TTS reply or user recording), from a fetched session
  audioBase64?: string | null  // TTS audio for AI voice replies, streamed live during a voice turn
  correction?: {
    original: string
    suggested: string
    why: string
  }
}

// ─── Voice Lab ────────────────────────────────────────────────────────────────
// Voice Lab types live in common/types/voice-types.ts (wired to the real
// /chat voice pipeline). The old hardcoded PhonemeScore was removed — the
// backend produces pronunciation assessment, not per-word phoneme grids.

// ─── Vocabulary ───────────────────────────────────────────────────────────────
// Vocabulary types moved to common/types/vocabulary-types.ts (wired to the real API).

// ─── Goals ────────────────────────────────────────────────────────────────────

export interface Goal {
  title: string
  progress: number
  due: string
  current: string
}

export interface Achievement {
  title: string
  description: string
  icon: string
  earned: boolean
  progress?: number
}

// ─── Lessons ─────────────────────────────────────────────────────────────────

export type LessonCategory = 'All' | 'Business' | 'Travel' | 'Grammar' | 'Real-life' | 'Pronunciation' | 'Exams'

export interface Lesson {
  title: string
  category: Exclude<LessonCategory, 'All'>
  minutes: number
  level: string
  popular?: boolean
}

// ─── Header breadcrumb ────────────────────────────────────────────────────────

export interface Breadcrumb {
  label: string
  /** Absent on the last crumb (the current page). */
  to?: string
}

// ─── Shared dashboard widgets ─────────────────────────────────────────────────

/** One number in the KeyFigures strip, with its comparison or a short hint */
export interface KeyFigure {
  label: string
  value: string | number
  hint?: string
  /** Shows "+3 vs last week" when both are given */
  now?: number
  before?: number
  /** For counts where going up is bad (e.g. missing work) */
  upIsBad?: boolean
}

/** One bar in SkillBars; null value = no data yet */
export interface SkillRow { key: string; value: number | null; help?: string }
