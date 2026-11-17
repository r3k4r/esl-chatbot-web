import type {
  SessionListItem,
  SessionDetail,
  ChatMessage,
  MessageEvaluation,
  SessionEvaluation,
  SessionMode,
} from '~/common/types/chat-types'

interface ListResponse<T> {
  success: boolean
  message?: string
  data: T[]
  meta?: { page: number; limit: number; total: number; totalPages: number }
}
interface SingleResponse<T> {
  success: boolean
  message?: string
  data: T
}

interface SendMessageResult {
  userMessage: ChatMessage
  assistantMessage: ChatMessage
  evaluation: MessageEvaluation
}

export function useSessions() {
  async function listSessions(opts: { page?: number; limit?: number; active?: 'true' | 'false' } = {}) {
    const params = new URLSearchParams()
    if (opts.page) params.set('page', String(opts.page))
    if (opts.limit) params.set('limit', String(opts.limit))
    if (opts.active) params.set('active', opts.active)
    const qs = params.toString()
    const res = await useHttp<ListResponse<SessionListItem>>({
      method: 'GET',
      url: `/sessions${qs ? `?${qs}` : ''}`,
      requireAuth: true,
    })
    return res
  }

  async function createSession(body: { mode?: SessionMode; topic?: string | null } = {}) {
    return await useHttp<SingleResponse<SessionListItem>>({
      method: 'POST',
      url: '/sessions',
      body: { mode: body.mode ?? 'TEXT', topic: body.topic ?? null },
      requireAuth: true,
    })
  }

  async function getSession(id: string) {
    return await useHttp<SingleResponse<SessionDetail>>({
      method: 'GET',
      url: `/sessions/${id}`,
      requireAuth: true,
    })
  }

  async function endSession(id: string) {
    return await useHttp<SingleResponse<SessionListItem & { evaluation: SessionEvaluation }>>({
      method: 'POST',
      url: `/sessions/${id}/end`,
      requireAuth: true,
    })
  }

  async function updateSession(id: string, body: { title?: string; isPinned?: boolean }) {
    return await useHttp<SingleResponse<SessionListItem>>({
      method: 'PATCH',
      url: `/sessions/${id}`,
      body,
      requireAuth: true,
    })
  }

  /** Hides the chat from the learner's list; it still counts toward daily limits. */
  async function deleteSession(id: string) {
    return await useHttp<SingleResponse<null>>({
      method: 'DELETE',
      url: `/sessions/${id}`,
      requireAuth: true,
    })
  }

  async function sendMessage(sessionId: string, content: string, type: 'TEXT' | 'VOICE' = 'TEXT') {
    return await useHttp<SingleResponse<SendMessageResult>>({
      method: 'POST',
      url: `/sessions/${sessionId}/messages`,
      body: { content, type },
      requireAuth: true,
    })
  }

  async function listMessages(sessionId: string, opts: { page?: number; limit?: number } = {}) {
    const params = new URLSearchParams()
    if (opts.page) params.set('page', String(opts.page))
    if (opts.limit) params.set('limit', String(opts.limit))
    const qs = params.toString()
    return await useHttp<ListResponse<ChatMessage>>({
      method: 'GET',
      url: `/sessions/${sessionId}/messages${qs ? `?${qs}` : ''}`,
      requireAuth: true,
    })
  }

  return { listSessions, createSession, getSession, endSession, updateSession, deleteSession, sendMessage, listMessages }
}
