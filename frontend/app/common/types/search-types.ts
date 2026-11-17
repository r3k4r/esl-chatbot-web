import type { UserRole } from '~/common/types/user-permissions'

// Mirrors the backend `GET /search` response (see backend search module).
// Generated source-of-truth types live in `types/api.ts` (SearchResults); these
// are the clean, non-optional shapes the UI works with.

export interface SearchUserResult {
  id: string
  displayName: string
  username: string
  email: string
  avatarUrl: string | null
  role: UserRole
}

export interface SearchClassResult {
  id: string
  className: string
  classCategory: string | null
}

export interface SearchVocabResult {
  id: string
  word: string
  definition: string
}

export interface SearchGoalResult {
  id: string
  description: string
  type: 'VOCABULARY' | 'SPEAKING' | 'GRAMMAR' | 'CONVERSATION' | 'STUDY_TIME'
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'CANCELLED'
}

export interface SearchSessionResult {
  id: string
  topic: string | null
  title: string | null
  startedAt: string
}

export interface GlobalSearchResults {
  query: string
  total: number
  results: {
    users: SearchUserResult[]
    classes: SearchClassResult[]
    vocabulary: SearchVocabResult[]
    goals: SearchGoalResult[]
    sessions: SearchSessionResult[]
  }
}

// The kinds of result group the palette renders, in display order.
export type SearchGroupKey = keyof GlobalSearchResults['results']
