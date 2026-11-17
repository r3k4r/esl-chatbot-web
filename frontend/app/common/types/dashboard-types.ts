// ─── Navigation ───────────────────────────────────────────────────────────────

import type { SvgBasedIconName } from "./iconsax-types"

export type DashboardNavId =
  | 'dashboard'
  | 'users'
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

// ─── Overview – Stat Cards ────────────────────────────────────────────────────

export interface StatCard {
  label: string
  value: string
  delta: string
  icon: string
}

// ─── Overview – Chart ─────────────────────────────────────────────────────────

export type ChartRange = '7d' | '30d' | 'All'

export interface ChartPoint {
  label: string
  value: number
}

// ─── Overview – Upcoming Lessons ──────────────────────────────────────────────

export interface UpcomingLesson {
  title: string
  tag: string
  minutes: number
  level: string
  icon: string
}

// ─── Overview – Recent Sessions ───────────────────────────────────────────────

export interface RecentSession {
  type: string
  topic: string
  time: string
  meta: string
  icon: string
}

// ─── Overview – Due Words ─────────────────────────────────────────────────────

export interface DueWord {
  word: string
  meaning: string
  due: string
}

// ─── Overview – Heatmap ───────────────────────────────────────────────────────

export type HeatWeek = number[] // length 7, values 0-7

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
