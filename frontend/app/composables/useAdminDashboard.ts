import type { AdminDashboardData } from '~/common/types/admin-types'

export function useAdminDashboard() {
  const raw = ref<AdminDashboardData | null>(null)
  const loading = ref(false)
  // Kept until the next answer arrives, so a retry keeps the error screen (spinning button) up.
  const error = ref<string | null>(null)

  async function fetchAdminDashboard() {
    loading.value = true
    const res = await useHttp<{ success: boolean; data: AdminDashboardData }>({
      method: 'GET',
      url: '/admin/dashboard',
      requireAuth: true,
      showToast: false,
    })
    if (res.success && res.data?.data) {
      raw.value = res.data.data
      error.value = null
    } else {
      error.value = res.message || 'Failed to load the admin dashboard'
    }
    loading.value = false
  }

  const totalUsers = computed(() => raw.value?.users.total ?? 0)
  const usersByRole = computed(() => raw.value?.users.byRole ?? { STUDENT: 0, TUTOR: 0, ADMIN: 0 })
  const subscriptions = computed(() => raw.value?.subscriptions ?? { FREE: 0, GOLD: 0, PREMIUM: 0 })
  const activeUsers = computed(() => raw.value?.activeUsers ?? { daily: 0, weekly: 0 })
  const sessionsToday = computed(() => raw.value?.totalSessionsToday ?? 0)
  const revenueByProvider = computed(() => raw.value?.revenueByProvider ?? {})

  return {
    loading,
    error,
    fetchAdminDashboard,
    totalUsers,
    usersByRole,
    subscriptions,
    activeUsers,
    sessionsToday,
    revenueByProvider,
  }
}
