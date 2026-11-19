// Mirrors the `vocabularies` DB table (backend/prisma/schema.prisma → model Vocabulary).
// Plain type — no extra fields. API response shapes that extend this live in
// common/types/vocabulary-types.ts.

// MANUAL = added by the user · SESSION = detected by the AI chat · ASSIGNED = given by a tutor/admin
export type VocabSource = 'MANUAL' | 'SESSION' | 'ASSIGNED'

// The tutor/admin who assigned a word — present only when source === 'ASSIGNED'.
export type VocabAssigner = {
  id: string
  displayName: string
  role: 'STUDENT' | 'TUTOR' | 'ADMIN'
}

export type Vocabulary = {
  id: string
  userId: string
  word: string
  definition: string
  pronunciation: string | null
  example: string | null
  partOfSpeech: string | null
  difficulty: number // 1–5
  category: string | null
  srsInterval: number // days until next review
  srsDue: string // ISO date-time
  srsEase: number // SM-2 ease factor (1.3–2.5)
  reviewCount: number
  correctCount: number
  incorrectCount: number
  masteryLevel: number // 0=new, 1=seen, 2=learning, 3=familiar, 4=proficient, 5=mastered
  lastPracticed: string | null // ISO date-time
  source: VocabSource
  assignedByTutorId: string | null
  assignedByTutor: VocabAssigner | null
  // Set when the word came from a class word list (common/model/vocabulary-list.ts).
  listId: string | null
  list: { id: string; title: string } | null
  createdAt: string
  updatedAt: string
}
