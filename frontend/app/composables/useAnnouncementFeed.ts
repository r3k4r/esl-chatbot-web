import { toast } from 'vue-sonner'
import { useAuthStore } from '~~/stores/auth'
import type { AnnouncementItem } from '~/common/types/class-types'
import type { CommentDraft } from '~/common/types/task-types'

/**
 * A class's announcements: load (newest first, paged), post, edit, delete, comments on/off.
 * The backend enforces the rules; these flags only decide which controls to show:
 *   post + comments on/off — tutor of the class or admin (`canManage`)
 *   edit / delete / files  — the author or an admin
 *   nothing is written in an archived class
 */
export function useAnnouncementFeed(
  classId: Ref<string>,
  opts: { canManage: Ref<boolean>; isAdmin: Ref<boolean>; archived: Ref<boolean> },
) {
  const api = useAnnouncements()
  const meId = computed(() => useAuthStore().getUser?.id)

  const items = ref<AnnouncementItem[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const posting = ref(false)
  const busyId = ref<string | null>(null)
  const page = ref(1)
  const totalPages = ref(1)

  const canPost = computed(() => opts.canManage.value && !opts.archived.value)
  const canToggle = computed(() => opts.canManage.value && !opts.archived.value)
  const canEdit = (a: AnnouncementItem) => !opts.archived.value && (a.authorId === meId.value || opts.isAdmin.value)

  async function load(reset = true) {
    if (reset) page.value = 1
    loading.value = reset
    loadingMore.value = !reset
    const id = classId.value
    const res = await api.listAnnouncements(id, { page: page.value, limit: 15 })
    loading.value = false
    loadingMore.value = false
    if (id !== classId.value) return // another class was opened meanwhile
    if (!res.success || !res.data) { toast.error(res.message || 'Could not load announcements'); return }
    const fetched = res.data.data ?? []
    totalPages.value = res.data.meta?.totalPages ?? 1
    items.value = reset ? fetched : [...items.value, ...fetched]
  }

  async function loadMore() {
    if (page.value >= totalPages.value || loadingMore.value) return
    page.value++
    await load(false)
  }

  function replace(updated: AnnouncementItem) {
    items.value = items.value.map(a => (a.id === updated.id ? updated : a))
  }

  /** Returns true when posted, so the box can clear itself. */
  async function post(draft: CommentDraft): Promise<boolean> {
    if (posting.value) return false
    posting.value = true
    const res = await api.createAnnouncement(classId.value, draft.content, draft.files)
    posting.value = false
    if (!res.success || !res.data?.data) { toast.error(res.message || 'Could not post the announcement'); return false }
    items.value = [res.data.data, ...items.value]
    return true
  }

  /** Text change, removed files and new files, as one save. */
  async function edit(a: AnnouncementItem, draft: CommentDraft): Promise<boolean> {
    busyId.value = a.id
    try {
      for (const fileId of draft.removeAttachmentIds) {
        const r = await api.deleteAnnouncementFile(classId.value, a.id, fileId)
        if (!r.success) { toast.error(r.message || 'Could not remove a file'); return false }
      }
      if (draft.files.length) {
        const r = await api.addAnnouncementFiles(classId.value, a.id, draft.files)
        if (!r.success) { toast.error(r.message || 'Could not attach the files'); return false }
      }
      const res = await api.updateAnnouncement(classId.value, a.id, { content: draft.content })
      if (!res.success || !res.data?.data) { toast.error(res.message || 'Could not save your changes'); return false }
      replace(res.data.data)
      return true
    } finally {
      busyId.value = null
    }
  }

  async function setCommentsEnabled(a: AnnouncementItem, on: boolean) {
    busyId.value = a.id
    const res = await api.updateAnnouncement(classId.value, a.id, { commentsEnabled: on })
    busyId.value = null
    if (!res.success || !res.data?.data) { toast.error(res.message || 'Could not change comments'); return }
    replace(res.data.data)
    toast.success(on ? 'Comments turned on' : 'Comments turned off')
  }

  async function remove(a: AnnouncementItem) {
    const res = await api.deleteAnnouncement(classId.value, a.id)
    if (!res.success) { toast.error(res.message || 'Could not delete the announcement'); return }
    items.value = items.value.filter(x => x.id !== a.id)
    toast.success('Announcement deleted')
  }

  /** Keeps the card's comment count in step with its thread. */
  function setCommentCount(id: string, count: number) {
    items.value = items.value.map(a => (a.id === id ? { ...a, commentCount: count } : a))
  }

  const downloadFor = (announcementId: string) => (fileId: string) =>
    api.getAnnouncementFileDownload(classId.value, announcementId, fileId)

  watch(classId, () => load(true), { immediate: true })

  return {
    items, loading, loadingMore, posting, busyId, page, totalPages,
    canPost, canToggle, canEdit,
    load, loadMore, post, edit, setCommentsEnabled, remove, setCommentCount, downloadFor,
  }
}
