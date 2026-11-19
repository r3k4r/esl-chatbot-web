// API response shapes + UI types for the vocabulary page.
// The base table shape lives in common/model/vocabulary.ts.

import type { Vocabulary, VocabSource } from '~/common/model/vocabulary'

// ─── API: list item ───────────────────────────────────────────────────────────
// The list/due/get/add/update endpoints all return the full Vocabulary row.
export type VocabularyItem = Vocabulary

// ─── API: GET /vocabulary/stats ──────────────────────────────────────────────
export interface VocabularyStats {
  total: number
  dueToday: number
  learnedThisWeek: number
  byMasteryLevel: {
    new: number // masteryLevel 0
    seen: number // masteryLevel 1
    learning: number // masteryLevel 2
    familiar: number // masteryLevel 3
    proficient: number // masteryLevel 4
    mastered: number // masteryLevel 5
  }
}

// ─── API: POST /vocabulary/:id/review response ───────────────────────────────
export interface ReviewResult {
  id: string
  word: string
  srsInterval: number
  srsDue: string
  srsEase: number
  masteryLevel: number
  reviewCount: number
  correctCount: number
  incorrectCount: number
  lastPracticed: string
}

// ─── API: request shapes ──────────────────────────────────────────────────────
export interface AddVocabularyInput {
  word: string
  definition: string
  pronunciation?: string
  example?: string
  partOfSpeech?: string
  difficulty?: number // 1–5, default 1
  category?: string
  // Tutor/admin only: assign to a student instead of adding to your own list.
  assignedToUserId?: string
}

// Source attribution shown in the vocabulary list ("who added this word?").
import type { VocabAssigner } from '~/common/model/vocabulary'
import type { SvgBasedIconName } from '~/common/types/iconsax-types'
export interface VocabSourceLabel {
  label: string            // e.g. "You", "AI Chat", "Sarah · Tutor"
  icon: SvgBasedIconName   // Iconsax name
}
export type { VocabAssigner }

export interface UpdateVocabularyInput {
  definition?: string
  pronunciation?: string | null
  example?: string | null
  partOfSpeech?: string | null
  difficulty?: number
  category?: string | null
}

export interface ListVocabularyParams {
  page?: number
  limit?: number
  due?: 'true' | 'false'
  source?: VocabSource
  listId?: string
  category?: string
  search?: string
}

// ─── Class word lists (tutor/admin) ───────────────────────────────────────────

// One card of a list: written by the teacher, or filled by POST /vocabulary/enrich.
export interface WordCardDraft {
  word: string
  definition: string
  example: string
  partOfSpeech: string
}

// Who gets a list: every student, only the chosen ones, or everyone except them.
export type WordListTargetMode = 'ALL' | 'ONLY' | 'EXCEPT'

// POST /classes/:classId/vocabulary-lists
export interface CreateClassWordListInput {
  title: string
  words: { word: string; definition: string; example?: string; partOfSpeech?: string }[]
  target: { mode: WordListTargetMode; studentIds: string[] }
}
export interface ClassWordListCreated {
  id: string
  title: string
  createdAt: string
  wordCount: number
  studentCount: number
  added: number
  skipped: number
}

// PATCH /classes/:classId/vocabulary-lists/:listId — rename, fix cards, add words (never removes)
export interface UpdateClassWordListInput {
  title?: string
  words?: CreateClassWordListInput['words']
}

/** A list's name, or its words when it has none (words given on their own). */
export function wordListLabel(list: Pick<ClassWordList, 'title' | 'words'>): string {
  if (list.title) return list.title
  const words = list.words.map((w) => w.word)
  return words.length > 3 ? `${words.slice(0, 3).join(', ')} +${words.length - 3}` : words.join(', ')
}

// GET /classes/:classId/vocabulary-lists
export interface ClassWordList {
  id: string
  title: string
  createdAt: string
  createdBy: { id: string; displayName: string } | null
  words: { word: string; definition: string; example: string | null; partOfSpeech: string | null }[]
  studentCount: number
  practisedPct: number
  masteredPct: number
}

// SM-2 quality rating: 0=blackout … 5=perfect recall
export type ReviewQuality = 0 | 1 | 2 | 3 | 4 | 5

// Flashcard "Again / Hard / Good / Easy" → SM-2 quality
export type SrsRating = 'Again' | 'Hard' | 'Good' | 'Easy'

export const RATING_QUALITY: Record<SrsRating, ReviewQuality> = {
  Again: 0,
  Hard: 1,
  Good: 3,
  Easy: 5,
}

// masteryLevel (0–5) → human label, used for the per-card progress indicator
export const MASTERY_LABEL: Record<number, string> = {
  0: 'New',
  1: 'Seen',
  2: 'Learning',
  3: 'Familiar',
  4: 'Proficient',
  5: 'Mastered',
}

export interface VocabPaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

// ─── Source attribution ("who added this word?") ──────────────────────────────
// Maps a vocabulary item to a human label + icon describing where it came from.
//  - ASSIGNED → the tutor/admin's name + role (e.g. "Sarah · Tutor")
//  - SESSION  → "AI Chat"
//  - MANUAL   → "You"
export function vocabSourceLabel(
  item: Pick<Vocabulary, 'source' | 'assignedByTutor'>,
): VocabSourceLabel {
  if (item.source === 'ASSIGNED' && item.assignedByTutor) {
    const roleLabel = item.assignedByTutor.role === 'ADMIN' ? 'Admin' : 'Tutor'
    return { label: `${item.assignedByTutor.displayName} · ${roleLabel}`, icon: 'Teacher' }
  }
  if (item.source === 'SESSION') return { label: 'AI Chat', icon: 'Magicpen' }
  return { label: 'You', icon: 'User' }
}
