import { toast } from 'vue-sonner'
import { useAuthStore } from '~~/stores/auth'
import type { ClassDetail } from '~/common/types/class-types'
import type { TaskItem } from '~/common/types/task-types'

/**
 * State for /dashboard/classes/:id/tasks/:taskId. The caller's class role comes from the
 * class (like the class page): tutors of the class and admins manage, students hand in.
 */
export function useTaskPage(classId: Ref<string>, taskId: Ref<string>) {
  const { getClass } = useClasses()
  const { getTask, updateTask, deleteTask } = useTasks()
  const { isAdmin } = useRole()
  const auth = useAuthStore()
  const { setTitle, setTitleFor } = useBreadcrumbs()

  const cls = ref<ClassDetail | null>(null)
  const task = ref<TaskItem | null>(null)
  const loading = ref(true)
  const busy = ref(false)
  const toggling = ref(false)

  const classPath = computed(() => `/dashboard/classes/${classId.value}`)
  const backTo = computed(() => `${classPath.value}?tab=tasks`)

  const myClassRole = computed(() =>
    cls.value?.members?.find(m => m.user.id === auth.getUser?.id)?.role ?? cls.value?.myRole)
  const archived = computed(() => cls.value?.archived ?? false)
  /** Students in the class (the "not handed in yet" count); undefined until the class loads */
  const studentCount = computed(() => cls.value?.members?.filter(m => m.role === 'STUDENT').length)
  const isStudent = computed(() => myClassRole.value === 'STUDENT' && !isAdmin.value)
  /** Tutor of this class or an admin, and the class is not archived */
  const canManage = computed(() => (myClassRole.value === 'TUTOR' || isAdmin.value) && !archived.value)

  async function load() {
    loading.value = true
    const [c, t] = await Promise.all([getClass(classId.value), getTask(taskId.value)])
    loading.value = false
    // 404 also means "not in this class": go back to somewhere the user can see.
    if (!t.success || !(t.data as any)?.data || (t.data as any).data.classId !== classId.value) {
      toast.error(t.message || 'Task not found')
      return navigateTo(c.success ? backTo.value : '/dashboard/classes', { replace: true })
    }
    task.value = (t.data as any).data
    if (c.success) cls.value = (c.data as any)?.data ?? null
  }

  watch(() => cls.value?.className, n => setTitleFor(classPath.value, n), { immediate: true })
  watch(() => task.value?.title, n => setTitle(n), { immediate: true })

  function onTaskUpdated(t: TaskItem) {
    task.value = t
  }

  async function toggleClosed() {
    if (!task.value || busy.value) return
    busy.value = true
    const closing = task.value.status === 'OPEN'
    const res = await updateTask(task.value.id, { closed: closing })
    busy.value = false
    if (!res.success) { toast.error(res.message || 'Could not update the task'); return }
    task.value = (res.data as any).data
    toast.success(closing ? 'Task closed. Students can no longer hand in.' : 'Task reopened.')
  }

  async function toggleComments(on: boolean) {
    if (!task.value || toggling.value) return
    toggling.value = true
    const res = await updateTask(task.value.id, { commentsEnabled: on })
    toggling.value = false
    if (!res.success) { toast.error(res.message || 'Could not change the comment setting'); return }
    task.value = (res.data as any).data
  }

  async function remove() {
    if (!task.value || busy.value) return
    busy.value = true
    const res = await deleteTask(task.value.id)
    busy.value = false
    if (!res.success) { toast.error(res.message || 'Could not delete the task'); return }
    toast.success('Task deleted.')
    await navigateTo(backTo.value, { replace: true })
  }

  watch(taskId, load, { immediate: true })

  return {
    cls, task, loading, busy, toggling, backTo, archived, isStudent, canManage, studentCount,
    onTaskUpdated, toggleClosed, toggleComments, remove,
  }
}
