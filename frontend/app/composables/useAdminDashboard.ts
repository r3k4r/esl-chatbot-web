import type { AdminDashboardData } from '~/common/types/admin-types'

// One answer feeds three admin pages (Dashboard, Learning, Revenue). It's shared state, so moving
// between them shows the last numbers at once while a fresh copy loads.
export function useAdminDashboard() {
  const data = useState<AdminDashboardData | null>('admin-dashboard', () => null)
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
