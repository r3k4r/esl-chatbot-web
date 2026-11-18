import { toast } from 'vue-sonner'
import { useAuthStore } from '~~/stores/auth'
import type { AnnouncementCommentItem, AnnouncementItem } from '~/common/types/class-types'

/**
 * Class comments under one announcement, loaded the first time the thread is opened.
 * Rules (the backend enforces them too): every member reads; students write only while
 * comments are on; only the author edits; author, tutor of the class or admin deletes;
 * nothing new in an archived class.
 */
export function useAnnouncementComments(
  classId: Ref<string>,
  announcement: Ref<AnnouncementItem>,
  opts: { canManage: Ref<boolean>; archived: Ref<boolean>; onCount: (count: number) => void },
) {
  const api = useAnnouncements()
  const meId = computed(() => useAuthStore().getUser?.id)

  const comments = ref<AnnouncementCommentItem[]>([])
  const loaded = ref(false)
  const loading = ref(false)
  const posting = ref(false)
  const savingId = ref<string | null>(null)

  const canComment = computed(() => !opts.archived.value && (opts.canManage.value || announcement.value.commentsEnabled))
  const canEdit = (c: AnnouncementCommentItem) => c.author.id === meId.value && canComment.value
  const canDelete = (c: AnnouncementCommentItem) => c.author.id === meId.value || opts.canManage.value

  function setComments(list: AnnouncementCommentItem[]) {
    comments.value = list
    opts.onCount(list.length)
  }

  async function load() {
    if (loaded.value || loading.value) return
    loading.value = true
    const res = await api.listAnnouncementComments(classId.value, announcement.value.id)
    loading.value = false
    if (!res.success || !res.data) { toast.error(res.message || 'Could not load comments'); return }
    loaded.value = true
    setComments(res.data.data ?? [])
  }

  async function post(content: string): Promise<boolean> {
    if (posting.value) return false
    posting.value = true
    const res = await api.postAnnouncementComment(classId.value, announcement.value.id, content)
    posting.value = false
    if (!res.success || !res.data?.data) { toast.error(res.message || 'Could not post your comment'); return false }
    setComments([...comments.value, res.data.data])
    return true
  }

  async function edit(id: string, content: string): Promise<boolean> {
    savingId.value = id
    const res = await api.updateAnnouncementComment(classId.value, announcement.value.id, id, content)
    savingId.value = null
    if (!res.success || !res.data?.data) { toast.error(res.message || 'Could not save your changes'); return false }
    const updated = res.data.data
    comments.value = comments.value.map(c => (c.id === id ? updated : c))
    return true
  }

  async function remove(id: string) {
    const res = await api.deleteAnnouncementComment(classId.value, announcement.value.id, id)
    if (!res.success) { toast.error(res.message || 'Could not delete the comment'); return }
    setComments(comments.value.filter(c => c.id !== id))
    toast.success('Comment deleted')
  }

  return { comments, loaded, loading, posting, savingId, canComment, canEdit, canDelete, load, post, edit, remove }
}
