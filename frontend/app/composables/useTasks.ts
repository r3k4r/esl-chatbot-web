import type { TaskItem, TaskSubmissionItem, ClassPaginationMeta, TaskAttachment, TaskCommentItem, CommentDraft } from '~/common/types/task-types'

export type { TaskItem, TaskSubmissionItem }

// ─── Response wrappers ────────────────────────────────────────────────────────

interface SingleResponse<T> { success: boolean; message?: string; data: T }
interface ListResponse<T> { success: boolean; message?: string; data: T[] }
interface PaginatedResponse<T> {
  success: boolean
  message?: string
  data: T[]
  meta: ClassPaginationMeta
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useTasks() {

  async function listClassTasks(classId: string, params?: { page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.limit) query.set('limit', String(params.limit))
    const qs = query.toString()
    return await useHttp<PaginatedResponse<TaskItem>>({
      method: 'GET',
      url: `/classes/${classId}/tasks${qs ? `?${qs}` : ''}`,
      requireAuth: true,
    })
  }

  async function getTask(taskId: string) {
    return await useHttp<SingleResponse<TaskItem>>({
      method: 'GET',
      url: `/tasks/${taskId}`,
      requireAuth: true,
    })
  }

  async function createTask(classId: string, body: { title: string; description: string; deadline?: string | null }) {
    return await useHttp<SingleResponse<TaskItem>>({
      method: 'POST',
      url: `/classes/${classId}/tasks`,
      body,
      requireAuth: true,
    })
  }

  async function updateTask(taskId: string, body: { title?: string; description?: string; deadline?: string | null; closed?: boolean; commentsEnabled?: boolean }) {
    return await useHttp<SingleResponse<TaskItem>>({
      method: 'PATCH',
      url: `/tasks/${taskId}`,
      body,
      requireAuth: true,
    })
  }

  async function deleteTask(taskId: string) {
    return await useHttp<{ success: boolean; message?: string }>({
      method: 'DELETE',
      url: `/tasks/${taskId}`,
      requireAuth: true,
    })
  }

  /** Hand in: text, a link and/or files (multipart). */
  async function submitTask(taskId: string, work: { content?: string; fileUrl?: string; files?: File[] }) {
    const form = new FormData()
    if (work.content) form.append('content', work.content)
    if (work.fileUrl) form.append('fileUrl', work.fileUrl)
    for (const f of work.files ?? []) form.append('files', f)
    return await useHttp<SingleResponse<TaskSubmissionItem>>({
      method: 'POST',
      url: `/tasks/${taskId}/submissions`,
      body: form,
      requireAuth: true,
    })
  }

  async function listSubmissions(taskId: string) {
    return await useHttp<ListResponse<TaskSubmissionItem>>({
      method: 'GET',
      url: `/tasks/${taskId}/submissions`,
      requireAuth: true,
    })
  }

  async function giveFeedback(taskId: string, submissionId: string, feedback: string) {
    return await useHttp<SingleResponse<TaskSubmissionItem>>({
      method: 'PATCH',
      url: `/tasks/${taskId}/submissions/${submissionId}/feedback`,
      body: { feedback },
      requireAuth: true,
    })
  }

  // ── Comments + files (multipart) ──────────────────────────────────────────

  function draftForm(draft: Partial<CommentDraft>) {
    const form = new FormData()
    if (draft.content !== undefined) form.append('content', draft.content)
    if (draft.removeAttachmentIds?.length) form.append('removeAttachmentIds', draft.removeAttachmentIds.join(','))
    for (const f of draft.files ?? []) form.append('files', f)
    return form
  }

  async function listComments(taskId: string) {
    // shortcut: first 100 comments only, add "load more" if a task's thread gets longer
    return await useHttp<PaginatedResponse<TaskCommentItem>>({
      method: 'GET',
      url: `/tasks/${taskId}/comments?limit=100`,
      requireAuth: true,
    })
  }

  async function postComment(taskId: string, draft: CommentDraft) {
    return await useHttp<SingleResponse<TaskCommentItem>>({
      method: 'POST',
      url: `/tasks/${taskId}/comments`,
      body: draftForm(draft),
      requireAuth: true,
    })
  }

  async function updateComment(taskId: string, commentId: string, draft: CommentDraft) {
    return await useHttp<SingleResponse<TaskCommentItem>>({
      method: 'PATCH',
      url: `/tasks/${taskId}/comments/${commentId}`,
      body: draftForm(draft),
      requireAuth: true,
    })
  }

  async function deleteComment(taskId: string, commentId: string) {
    return await useHttp<{ success: boolean; message?: string }>({
      method: 'DELETE',
      url: `/tasks/${taskId}/comments/${commentId}`,
      requireAuth: true,
    })
  }

  async function addTaskFiles(taskId: string, files: File[]) {
    return await useHttp<ListResponse<TaskAttachment>>({
      method: 'POST',
      url: `/tasks/${taskId}/attachments`,
      body: draftForm({ files }),
      requireAuth: true,
    })
  }

  async function deleteTaskFile(taskId: string, attachmentId: string) {
    return await useHttp<{ success: boolean; message?: string }>({
      method: 'DELETE',
      url: `/tasks/${taskId}/attachments/${attachmentId}`,
      requireAuth: true,
    })
  }

  /** A 5-minute link that saves the file under its own name (the plain fileUrl opens inline). */
  async function getTaskFileDownload(taskId: string, attachmentId: string) {
    return await useHttp<SingleResponse<{ url: string; fileName: string }>>({
      method: 'GET',
      url: `/tasks/${taskId}/attachments/${attachmentId}/download`,
      requireAuth: true,
    })
  }

  return {
    getTaskFileDownload,
    listComments,
    postComment,
    updateComment,
    deleteComment,
    addTaskFiles,
    deleteTaskFile,
    listClassTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    submitTask,
    listSubmissions,
    giveFeedback,
  }
}
