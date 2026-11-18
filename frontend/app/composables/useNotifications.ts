import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '~~/stores/auth'
import type { Notification } from '~/common/model/notification'

interface ApiResponse<T> { success: boolean; message?: string; data: T; meta?: { total: number } }

export function useNotifications() {
  const authStore = useAuthStore()

  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const hasMore = ref(false)

  let socket: Socket | null = null

  // ── REST ──────────────────────────────────────────────────────────────────

  async function fetchUnreadCount() {
    const res = await useHttp<ApiResponse<Notification[]>>({
      method: 'GET',
      url: '/users/me/notifications?read=false&limit=1',
      requireAuth: true,
      showToast: false,
    })
    if (res.success && res.data?.meta) {
      unreadCount.value = res.data.meta.total
    }
  }

  async function fetchNotifications() {
    loading.value = true
    const res = await useHttp<ApiResponse<Notification[]>>({
      method: 'GET',
      url: '/users/me/notifications?limit=20',
      requireAuth: true,
      showToast: false,
    })
    if (res.success && res.data?.data) {
      notifications.value = res.data.data
      hasMore.value = (res.data.meta?.total ?? 0) > 20
      unreadCount.value = notifications.value.filter(n => !n.read).length
    }
    loading.value = false
  }

  async function markAllRead() {
    const res = await useHttp({
      method: 'PATCH',
      url: '/users/me/notifications/read-all',
      requireAuth: true,
      showToast: false,
    })
    if (res.success) {
      notifications.value = notifications.value.map(n => ({ ...n, read: true }))
      unreadCount.value = 0
    }
  }

  async function markOneRead(id: string) {
    const target = notifications.value.find(n => n.id === id)
    if (!target || target.read) return
    // Optimistic update — don't block navigation on PATCH result
    notifications.value = notifications.value.map(n => n.id === id ? { ...n, read: true } : n)
    unreadCount.value = Math.max(0, unreadCount.value - 1)
    await useHttp({
      method: 'PATCH',
      url: `/users/me/notifications/${id}/read`,
      requireAuth: true,
      showToast: false,
    })
  }

  // ── Socket ────────────────────────────────────────────────────────────────

  function connectSocket() {
    if (socket?.connected) return

    const configUrl = (useRuntimeConfig().public.baseUrl as string) || 'http://localhost:8000/api/v1'
    const origin = new URL(configUrl).origin
    const token = authStore.getAccessToken

    socket = io(`${origin}/notifications`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    })

    socket.on('notification:new', async (item: Notification) => {
      notifications.value.unshift(item)
      unreadCount.value++

      // Show toast notification
      const { toast } = await import('vue-sonner')
      const typeEmoji: Record<string, string> = {
        STREAK_MILESTONE: '🔥',
        GOAL_COMPLETED: '🎉',
        GOAL_ASSIGNED: '🎯',
        VOCABULARY_ASSIGNED: '📚',
        CLASS_ANNOUNCEMENT: '📢',
        TASK_ASSIGNED: '✅',
        TASK_SUBMITTED: '📝',
        ANNOUNCEMENT_COMMENT: '💬',
      }
      const emoji = typeEmoji[item.type] || '🔔'
      toast.success(`${emoji} ${item.message}`)
    })
  }

  function disconnectSocket() {
    socket?.disconnect()
    socket = null
  }

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchUnreadCount,
    fetchNotifications,
    markAllRead,
    markOneRead,
    connectSocket,
    disconnectSocket,
  }
}
