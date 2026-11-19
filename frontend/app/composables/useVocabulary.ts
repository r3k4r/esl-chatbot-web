import type {
  VocabularyItem,
  VocabularyStats,
  ReviewResult,
  AddVocabularyInput,
  UpdateVocabularyInput,
  ListVocabularyParams,
  ReviewQuality,
  VocabPaginationMeta,
  WordCardDraft,
  ClassWordList,
  ClassWordListCreated,
  CreateClassWordListInput,
  UpdateClassWordListInput,
} from '~/common/types/vocabulary-types'

export type {
  VocabularyItem,
  VocabularyStats,
  ReviewResult,
  AddVocabularyInput,
  UpdateVocabularyInput,
  ListVocabularyParams,
}

// ─── Response wrappers ────────────────────────────────────────────────────────

interface ListResponse<T> { success: boolean; message?: string; data: T[] }
interface PaginatedResponse<T> { success: boolean; message?: string; data: T[]; meta: VocabPaginationMeta }
interface SingleResponse<T> { success: boolean; message?: string; data: T }

// ─── Composable ───────────────────────────────────────────────────────────────

export function useVocabulary() {

  function listVocabulary(params?: ListVocabularyParams) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    if (params?.due) query.set('due', params.due)
    if (params?.source) query.set('source', params.source)
    if (params?.listId) query.set('listId', params.listId)
    if (params?.category) query.set('category', params.category)
    if (params?.search) query.set('search', params.search)
    const qs = query.toString()
    return useHttp<PaginatedResponse<VocabularyItem>>({
      method: 'GET',
      url: `/vocabulary${qs ? `?${qs}` : ''}`,
      requireAuth: true,
    })
  }

  function getStats() {
    return useHttp<SingleResponse<VocabularyStats>>({
      method: 'GET',
      url: '/vocabulary/stats',
      requireAuth: true,
    })
  }

  function getDueCards() {
    return useHttp<ListResponse<VocabularyItem>>({
      method: 'GET',
      url: '/vocabulary/due',
      requireAuth: true,
    })
  }

  function addVocabulary(input: AddVocabularyInput) {
    return useHttp<SingleResponse<VocabularyItem>>({
      method: 'POST',
      url: '/vocabulary',
      body: input,
      requireAuth: true,
    })
  }

  // Tutor/admin: assign a word to a student (POST /vocabulary with assignedToUserId).
  function assignVocabulary(studentId: string, input: AddVocabularyInput) {
    return useHttp<SingleResponse<VocabularyItem>>({
      method: 'POST',
      url: '/vocabulary',
      body: { ...input, assignedToUserId: studentId },
      requireAuth: true,
    })
  }

  function getVocabularyById(id: string) {
    return useHttp<SingleResponse<VocabularyItem>>({
      method: 'GET',
      url: `/vocabulary/${id}`,
      requireAuth: true,
    })
  }

  function updateVocabulary(id: string, input: UpdateVocabularyInput) {
    return useHttp<SingleResponse<VocabularyItem>>({
      method: 'PATCH',
      url: `/vocabulary/${id}`,
      body: input,
      requireAuth: true,
    })
  }

  function deleteVocabulary(id: string) {
    return useHttp({
      method: 'DELETE',
      url: `/vocabulary/${id}`,
      requireAuth: true,
    })
  }

  function reviewVocabulary(id: string, quality: ReviewQuality) {
    return useHttp<SingleResponse<ReviewResult>>({
      method: 'POST',
      url: `/vocabulary/${id}/review`,
      body: { quality },
      requireAuth: true,
    })
  }

  /** Tutor/admin: the AI writes meaning, example and part of speech (Kurdish A1–B1 learners). */
  function enrichWords(words: string[]) {
    return useHttp<ListResponse<WordCardDraft>>({ method: 'POST', url: '/vocabulary/enrich', body: { words }, requireAuth: true, showToast: false })
  }

  function listClassWordLists(classId: string) {
    return useHttp<ListResponse<ClassWordList>>({ method: 'GET', url: `/classes/${classId}/vocabulary-lists`, requireAuth: true, showToast: false })
  }

  function createClassWordList(classId: string, input: CreateClassWordListInput) {
    return useHttp<SingleResponse<ClassWordListCreated>>({ method: 'POST', url: `/classes/${classId}/vocabulary-lists`, body: input, requireAuth: true, showToast: false })
  }

  function updateClassWordList(classId: string, listId: string, input: UpdateClassWordListInput) {
    return useHttp<SingleResponse<ClassWordList & { addedWords: number }>>({ method: 'PATCH', url: `/classes/${classId}/vocabulary-lists/${listId}`, body: input, requireAuth: true, showToast: false })
  }

  return {
    enrichWords,
    updateClassWordList,
    listClassWordLists,
    createClassWordList,
    listVocabulary,
    getStats,
    getDueCards,
    addVocabulary,
    assignVocabulary,
    getVocabularyById,
    updateVocabulary,
    deleteVocabulary,
    reviewVocabulary,
  }
}
