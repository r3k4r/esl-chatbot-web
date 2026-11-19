import { toast } from 'vue-sonner'
import type {
  VocabularyItem,
  VocabularyStats,
  ReviewQuality,
  SrsRating,
} from '~/common/types/vocabulary-types'
import { RATING_QUALITY } from '~/common/types/vocabulary-types'

export function useVocabPage() {
  const {
    listVocabulary,
    getStats,
    getDueCards,
    deleteVocabulary,
    reviewVocabulary,
  } = useVocabulary()

  // ─── State ─────────────────────────────────────────────────────────────────
  const loading = ref(true)
  const stats = ref<VocabularyStats | null>(null)

  const dueCards = ref<VocabularyItem[]>([])
  const reviewIndex = ref(0)
  const reviewing = ref(false)

  const words = ref<VocabularyItem[]>([])
  const wordsTotal = ref(0)
  const listLoading = ref(false)

  const search = ref('')
  const sourceFilter = ref<'ALL' | 'MANUAL' | 'SESSION' | 'ASSIGNED'>('ALL')
  // One of the teacher's word lists (picked from a word's list chip), or every word.
  const listFilter = ref<{ id: string; title: string } | null>(null)

  // ─── Derived ───────────────────────────────────────────────────────────────
  const currentCard = computed(() => dueCards.value[reviewIndex.value] ?? null)
  const reviewDone = computed(() => dueCards.value.length > 0 && reviewIndex.value >= dueCards.value.length)
  const dueCount = computed(() => stats.value?.dueToday ?? dueCards.value.length)

  // ─── Loaders ───────────────────────────────────────────────────────────────
  async function loadStats() {
    const res = await getStats()
    if (res.success && res.data?.data) stats.value = res.data.data
  }

  async function loadDue() {
    const res = await getDueCards()
    if (res.success && res.data?.data) {
      dueCards.value = res.data.data
      reviewIndex.value = 0
    }
  }

  async function loadWords() {
    listLoading.value = true
    const res = await listVocabulary({
      limit: 50,
      search: search.value.trim() || undefined,
      source: sourceFilter.value === 'ALL' ? undefined : sourceFilter.value,
      listId: listFilter.value?.id,
    })
    listLoading.value = false
    if (res.success && res.data?.data) {
      words.value = res.data.data
      wordsTotal.value = res.data.meta?.total ?? res.data.data.length
    }
  }

  async function loadAll() {
    loading.value = true
    await Promise.all([loadStats(), loadDue(), loadWords()])
    loading.value = false
  }

  // refetch the list when filters change (debounced search)
  let searchHandle: ReturnType<typeof setTimeout> | null = null
  watch(search, () => {
    if (searchHandle) clearTimeout(searchHandle)
    searchHandle = setTimeout(loadWords, 300)
  })
  watch([sourceFilter, listFilter], loadWords)

  // ─── Review flow ─────────────────────────────────────────────────────────────
  async function rate(rating: SrsRating) {
    const card = currentCard.value
    if (!card || reviewing.value) return
    const quality: ReviewQuality = RATING_QUALITY[rating]

    reviewing.value = true
    const res = await reviewVocabulary(card.id, quality)
    reviewing.value = false

    if (!res.success) {
      toast.error(res.message || 'Could not save review')
      return
    }
    // Advance to the next card; refresh stats so the "Learned/Due" counters track
    reviewIndex.value += 1
    loadStats()
  }

  function restartReview() {
    loadDue()
  }

  // Words come from the teacher (ASSIGNED) or the AI tutor (SESSION); students don't add them.
  // ─── Delete word ─────────────────────────────────────────────────────────────
  async function removeWord(item: VocabularyItem) {
    const res = await deleteVocabulary(item.id)
    if (!res.success) {
      toast.error(res.message || 'Could not delete word')
      return
    }
    words.value = words.value.filter((w) => w.id !== item.id)
    wordsTotal.value = Math.max(0, wordsTotal.value - 1)
    dueCards.value = dueCards.value.filter((w) => w.id !== item.id)
    toast.success(`"${item.word}" removed.`)
    loadStats()
  }

  onMounted(loadAll)

  return {
    // state
    loading,
    stats,
    dueCards,
    reviewIndex,
    reviewing,
    words,
    wordsTotal,
    listLoading,
    search,
    sourceFilter,
    listFilter,
    // derived
    currentCard,
    reviewDone,
    dueCount,
    // actions
    rate,
    restartReview,
    removeWord,
    loadWords,
  }
}
