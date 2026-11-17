import { toast } from 'vue-sonner'
import { useAuthStore } from '~~/stores/auth'
import type { CommentDraft, TaskCommentItem, TaskItem } from '~/common/types/task-types'

/**
 * Class comments on one task: load, post, edit, delete. The backend enforces who may
 * do what; `canComment` / `canEdit` / `canDelete` only decide which controls to show.
 */
export function useTaskComments(
  task: Ref<TaskItem | null>,
  opts: { canManage: Ref<boolean>; archived: Ref<boolean> },
) {
  const { listComments, postComment, updateComment, deleteComment } = useTasks()
  const auth = useAuthStore()
  const meId = computed(() => auth.getUser?.id)

  const comments = ref<TaskCommentItem[]>([])
  const loading = ref(false)
  const posting = ref(false)
  const savingId = ref<string | null>(null)

  /** Students write only while the tutor has comments on; nobody writes in an archived class. */
  const canComment = computed(() =>
    !!task.value && !opts.archived.value && (opts.canManage.value || task.value.commentsEnabled))

  const canEdit = (c: TaskCommentItem) => c.author.id === meId.value && canComment.value
  const canDelete = (c: TaskCommentItem) => c.author.id === meId.value || opts.canManage.value

  watch(() => task.value?.id, async (id) => {
    comments.value = []
    if (!id) return
    loading.value = true
    const res = await listComments(id)
    loading.value = false
    if (id !== task.value?.id) return // another task was opened meanwhile
    if (!res.success) { toast.error(res.message || 'Could not load comments'); return }
    comments.value = (res.data as any)?.data ?? []
  }, { immediate: true })

  /** Returns true when the comment was posted, so the box can clear itself. */
  async function post(draft: CommentDraft): Promise<boolean> {
    if (!task.value || posting.value) return false
    posting.value = true
    const res = await postComment(task.value.id, draft)
    posting.value = false
    if (!res.success) { toast.error(res.message || 'Could not post your comment'); return false }
    comments.value = [...comments.value, (res.data as any).data]
    return true
  }

  async function edit(id: string, draft: CommentDraft): Promise<boolean> {
    if (!task.value) return false
    savingId.value = id
    const res = await updateComment(task.value.id, id, draft)
    savingId.value = null
    if (!res.success) { toast.error(res.message || 'Could not save your changes'); return false }
    const updated = (res.data as any).data as TaskCommentItem
    comments.value = comments.value.map(c => c.id === id ? updated : c)
    return true
  }

  async function remove(id: string) {
    if (!task.value) return
    const res = await deleteComment(task.value.id, id)
    if (!res.success) { toast.error(res.message || 'Could not delete the comment'); return }
    comments.value = comments.value.filter(c => c.id !== id)
    toast.success('Comment deleted')
  }

  return { comments, loading, posting, savingId, canComment, canEdit, canDelete, post, edit, remove }
}
