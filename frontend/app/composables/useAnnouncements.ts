import type {
  AnnouncementCommentItem,
  AnnouncementFile,
  AnnouncementItem,
  ClassPaginationMeta,
} from '~/common/types/class-types'

interface Single<T> { success: boolean; message?: string; data: T }
interface Paged<T> { success: boolean; message?: string; data: T[]; meta: ClassPaginationMeta }

/** Raw API calls for a class's announcements, their files and comments. */
export function useAnnouncements() {
  const base = (classId: string) => `/classes/${classId}/announcements`
  const one = (classId: string, id: string) => `${base(classId)}/${id}`

  async function listAnnouncements(classId: string, params: { page?: number; limit?: number } = {}) {
    const query = new URLSearchParams()
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))
    const qs = query.toString()
    return await useHttp<Paged<AnnouncementItem>>({ method: 'GET', url: `${base(classId)}${qs ? `?${qs}` : ''}`, requireAuth: true })
  }

  async function createAnnouncement(classId: string, content: string, files: File[] = []) {
    let body: FormData | { content: string } = { content }
    if (files.length) {
      const form = new FormData()
      form.append('content', content)
      for (const f of files) form.append('files', f)
      body = form
    }
    return await useHttp<Single<AnnouncementItem>>({ method: 'POST', url: base(classId), body, requireAuth: true })
  }

  async function updateAnnouncement(classId: string, id: string, body: { content?: string; commentsEnabled?: boolean }) {
    return await useHttp<Single<AnnouncementItem>>({ method: 'PATCH', url: one(classId, id), body, requireAuth: true })
  }

  async function deleteAnnouncement(classId: string, id: string) {
    return await useHttp<Single<null>>({ method: 'DELETE', url: one(classId, id), requireAuth: true })
  }

  async function addAnnouncementFiles(classId: string, id: string, files: File[]) {
    const form = new FormData()
    for (const f of files) form.append('files', f)
    return await useHttp<Single<AnnouncementFile[]>>({ method: 'POST', url: `${one(classId, id)}/attachments`, body: form, requireAuth: true })
  }

  async function deleteAnnouncementFile(classId: string, id: string, fileId: string) {
    return await useHttp<Single<null>>({ method: 'DELETE', url: `${one(classId, id)}/attachments/${fileId}`, requireAuth: true })
  }

  async function getAnnouncementFileDownload(classId: string, id: string, fileId: string) {
    return await useHttp<Single<{ url: string; fileName: string }>>({
      method: 'GET',
      url: `${one(classId, id)}/attachments/${fileId}/download`,
      requireAuth: true,
    })
  }

  async function listAnnouncementComments(classId: string, id: string) {
    // shortcut: first 100 comments only, add "load more" if threads get longer
    return await useHttp<Paged<AnnouncementCommentItem>>({ method: 'GET', url: `${one(classId, id)}/comments?limit=100`, requireAuth: true })
  }

  async function postAnnouncementComment(classId: string, id: string, content: string) {
    return await useHttp<Single<AnnouncementCommentItem>>({ method: 'POST', url: `${one(classId, id)}/comments`, body: { content }, requireAuth: true })
  }

  async function updateAnnouncementComment(classId: string, id: string, commentId: string, content: string) {
    return await useHttp<Single<AnnouncementCommentItem>>({
      method: 'PATCH',
      url: `${one(classId, id)}/comments/${commentId}`,
      body: { content },
      requireAuth: true,
    })
  }

  async function deleteAnnouncementComment(classId: string, id: string, commentId: string) {
    return await useHttp<Single<null>>({ method: 'DELETE', url: `${one(classId, id)}/comments/${commentId}`, requireAuth: true })
  }

  return {
    listAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    addAnnouncementFiles,
    deleteAnnouncementFile,
    getAnnouncementFileDownload,
    listAnnouncementComments,
    postAnnouncementComment,
    updateAnnouncementComment,
    deleteAnnouncementComment,
  }
}
