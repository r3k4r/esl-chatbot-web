import { toast } from 'vue-sonner'
import { useAuthStore } from '~~/stores/auth'
import { useVocabulary } from '~/composables/useVocabulary'
import { wordListSchema, WORD_LIST_MAX, type WordListFormValues } from '~/common/schemas/WordListSchema'
import type { ClassDetail, ClassMember } from '~/common/types/class-types'
import { wordListLabel } from '~/common/types/vocabulary-types'

/** "borrow, kitchen\nget up" → ["borrow", "kitchen", "get up"]: one row per word, no repeats. */
export function parseWords(raw: string): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const part of raw.split(/[\n,;]+/)) {
    const word = part.trim().replace(/\s+/g, ' ')
    if (!word || word.length > 100 || seen.has(word.toLowerCase())) continue
    seen.add(word.toLowerCase())
    out.push(word)
  }
  return out
}

type WordRow = WordListFormValues['words'][number]


// Assign a word list to a class, or (with a listId) edit one. A plain form: one row per word,
// the teacher writes the meanings or lets the AI fill the empty ones, and the form is
// checked only when it is submitted. When editing, the list's words can be changed but not
// removed; new rows are added words.
export function useAssignWordsPage(classId: string, listId?: string) {
  const router = useRouter()
  const authStore = useAuthStore()
  const { isAdmin } = useRole()
  const { getClass } = useClasses()
  const { enrichWords, createClassWordList, listClassWordLists, updateClassWordList } = useVocabulary()
  const editing = !!listId
  // Row keys only. A counter, not crypto.randomUUID (missing on plain-http LAN addresses), and
  // per page so the first row gets the same key on the server and in the browser.
  let seq = 0
  const rowId = () => `w${seq++}`
  const newRow = (word = ''): WordRow => ({ id: rowId(), word, definition: '', example: '', partOfSpeech: '' })

  const cls = ref<ClassDetail | null>(null)
  const loading = ref(true)
  const listStudents = ref(0)
  const students = computed<ClassMember[]>(() =>
    (cls.value?.members ?? []).filter((m) => m.role === 'STUDENT').sort((a, b) => a.user.displayName.localeCompare(b.user.displayName)),
  )

  const form = reactive<WordListFormValues>({ title: '', words: [newRow()], mode: 'ALL', picked: [] })
  const schema = computed(() => wordListSchema(editing ? null : students.value.length))

  // ─── Rows ──────────────────────────────────────────────────────────────────
  function addRow() {
    form.words.push(newRow())
  }

  function removeRow(id: string) {
    form.words = form.words.filter((r) => r.id !== id || r.locked)
    if (!form.words.length) form.words.push(newRow())
  }

  /** Pasting "kitchen, recipe, boil" into one Word box makes one row per word. */
  function pasteWords(id: string, text: string): boolean {
    const words = parseWords(text)
    if (words.length < 2) return false
    const at = form.words.findIndex((r) => r.id === id)
    if (at < 0) return false
    const taken = new Set(form.words.map((r) => r.word.trim().toLowerCase()))
    const fresh = words.filter((w) => !taken.has(w.toLowerCase()))
    if (!fresh.length) return true
    form.words[at]!.word = fresh[0]!
    form.words.splice(at + 1, 0, ...fresh.slice(1, WORD_LIST_MAX - form.words.length + 1).map(newRow))
    return true
  }

  // ─── AI ────────────────────────────────────────────────────────────────────
  const filling = ref(false)

  /** Fill the empty meaning, example and part of speech of every row that has a word. */
  async function fillWithAi() {
    const rows = form.words.filter((r) => r.word.trim() && (!r.definition.trim() || !r.example.trim() || !r.partOfSpeech))
    if (!rows.length) {
      toast.message(form.words.some((r) => r.word.trim()) ? 'Every word already has its meaning and example.' : 'Type the words first.')
      return
    }
    filling.value = true
    const res = await enrichWords(rows.map((r) => r.word.trim()))
    filling.value = false
    if (!res.success || !res.data?.data) { toast.error(res.message || 'The AI helper is busy. Try again in a moment.'); return }
    const cards = new Map(res.data.data.map((c) => [c.word.toLowerCase(), c]))
    for (const r of rows) {
      const c = cards.get(r.word.trim().toLowerCase())
      if (!c) continue
      if (!r.definition.trim()) r.definition = c.definition
      if (!r.example.trim()) r.example = c.example
      if (!r.partOfSpeech) r.partOfSpeech = c.partOfSpeech
    }
  }

  function togglePick(id: string) {
    form.picked = form.picked.includes(id) ? form.picked.filter((p) => p !== id) : [...form.picked, id]
  }

  // ─── Submit (runs after the form is valid) ─────────────────────────────────
  const submitting = ref(false)
  const payloadWords = () => form.words.map((r) => ({
    word: r.word.trim(),
    definition: r.definition.trim(),
    example: r.example.trim() || undefined,
    partOfSpeech: r.partOfSpeech || undefined,
  }))
  const back = () => router.push(`/dashboard/classes/${classId}?tab=vocabulary`)

  async function submit() {
    if (submitting.value) return
    submitting.value = true
    if (editing) {
      const res = await updateClassWordList(classId, listId!, { title: form.title.trim(), words: payloadWords() })
      submitting.value = false
      if (!res.success || !res.data?.data) { toast.error(res.message || 'Could not save the list.'); return }
      const d = res.data.data
      toast.success('List saved.', {
        description: d.addedWords ? `${d.addedWords} new ${d.addedWords === 1 ? 'word' : 'words'} sent to ${d.studentCount} ${d.studentCount === 1 ? 'student' : 'students'}.` : undefined,
      })
      return back()
    }
    const res = await createClassWordList(classId, {
      title: form.title.trim(),
      words: payloadWords(),
      target: { mode: form.mode, studentIds: form.mode === 'ALL' ? [] : form.picked },
    })
    submitting.value = false
    if (!res.success || !res.data?.data) { toast.error(res.message || 'Could not assign the words.'); return }
    const d = res.data.data
    toast.success(`Assigned ${d.wordCount} ${d.wordCount === 1 ? 'word' : 'words'} to ${d.studentCount} ${d.studentCount === 1 ? 'student' : 'students'}.`, {
      description: d.skipped ? `${d.skipped} were already in a student's list and kept their progress.` : undefined,
    })
    back()
  }

  // ─── Load ──────────────────────────────────────────────────────────────────
  const { setTitleFor } = useBreadcrumbs()
  onMounted(async () => {
    const res = await getClass(classId)
    const detail = res.data?.data as ClassDetail | undefined
    const me = detail?.members.find((m) => m.user.id === authStore.getUser?.id)?.role ?? detail?.myRole
    if (!res.success || !detail || detail.archived || (me !== 'TUTOR' && !isAdmin.value)) {
      router.replace(`/dashboard/classes/${classId}`)
      return
    }
    if (editing) {
      const lists = await listClassWordLists(classId)
      const list = lists.data?.data?.find((l) => l.id === listId)
      if (!list) { back(); return }
      form.title = list.title
      form.words = list.words.map((w) => ({ id: rowId(), locked: true, word: w.word, definition: w.definition, example: w.example ?? '', partOfSpeech: w.partOfSpeech ?? '' }))
      listStudents.value = list.studentCount
      setTitleFor(`/dashboard/classes/${classId}/vocabulary/${listId}`, wordListLabel(list))
    }
    cls.value = detail
    loading.value = false
    setTitleFor(`/dashboard/classes/${classId}`, detail.className)
  })

  return {
    cls, loading, students, editing, listStudents,
    form, schema, filling, submitting,
    addRow, removeRow, pasteWords, fillWithAi, togglePick, submit, back,
    MAX_WORDS: WORD_LIST_MAX,
  }
}
