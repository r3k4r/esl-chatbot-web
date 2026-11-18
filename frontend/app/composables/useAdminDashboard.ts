import type { AdminDashboardData } from '~/common/types/admin-types'

export function useAdminDashboard() {
  const data = ref<AdminDashboardData | null>(null)
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
      data.value = res.data.data
      error.value = null
    } else {
      error.value = res.message || 'Failed to load the admin dashboard'
    }
    loading.value = false
  }

  return { data, loading, error, fetchAdminDashboard }
}
