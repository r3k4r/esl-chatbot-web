import { toast } from 'vue-sonner'
import type { ClassStudentDetail } from '~/common/types/class-types'
import type { AddVocabularyInput } from '~/common/types/vocabulary-types'
import { assignGoalToStudent, type CreateGoalInput } from '~/composables/useGoals'

/**
 * State for /dashboard/classes/:id/students/:studentId (tutor of the class or admin).
 * The backend refuses everyone else; we send them back to the class's People tab.
 */
export function useClassStudentPage(classId: Ref<string>, studentId: Ref<string>) {
  const { getClass, getClassStudentDetail } = useClasses()
  const { assignVocabulary } = useVocabulary()
  const { setTitle, setTitleFor } = useBreadcrumbs()

  const student = ref<ClassStudentDetail | null>(null)
  const className = ref('')
  const loading = ref(true)
  const backTo = computed(() => `/dashboard/classes/${classId.value}?tab=people`)

  async function load() {
    loading.value = true
    const [s, c] = await Promise.all([getClassStudentDetail(classId.value, studentId.value), getClass(classId.value)])
    loading.value = false
    if (!s.success) {
      toast.error(s.message || 'Could not load this student')
      return navigateTo(c.success ? backTo.value : '/dashboard/classes', { replace: true })
    }
    student.value = (s.data as any)?.data ?? null
    className.value = (c.data as any)?.data?.className ?? ''
  }
  watch(studentId, load, { immediate: true })

  watch(className, n => setTitleFor(`/dashboard/classes/${classId.value}`, n), { immediate: true })
  watch(() => student.value?.displayName || student.value?.username, n => setTitle(n), { immediate: true })

  const name = computed(() => student.value?.displayName || student.value?.username || '')

  const assigningWord = ref(false)
  async function assignWord(input: AddVocabularyInput): Promise<boolean> {
    if (!student.value || assigningWord.value) return false
    assigningWord.value = true
    const res = await assignVocabulary(student.value.userId, input)
    assigningWord.value = false
    if (!res.success) {
      toast.error(res.status === 409 ? res.message || 'They already have that word.' : res.message || 'Could not assign the word')
      return false
    }
    toast.success(`"${input.word}" added to ${name.value}'s vocabulary.`)
    student.value = { ...student.value, vocabTotal: student.value.vocabTotal + 1 }
    return true
  }

  const assigningGoal = ref(false)
  async function assignGoal(input: CreateGoalInput): Promise<boolean> {
    if (!student.value || assigningGoal.value) return false
    assigningGoal.value = true
    const res = await assignGoalToStudent(student.value.userId, input)
    assigningGoal.value = false
    if (!res.success) { toast.error(res.message || 'Could not assign the goal'); return false }
    toast.success(`Goal assigned to ${name.value}.`)
    return true
  }

  return { student, className, loading, backTo, name, assigningWord, assigningGoal, assignWord, assignGoal }
}
