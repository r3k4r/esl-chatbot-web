import type { TutorDashboardData } from '~/common/types/tutor-types'

export function useTutorDashboard() {
  const data = ref<TutorDashboardData | null>(null)
  const loading = ref(false)
  // Kept until the next answer arrives, so a retry keeps the error screen (spinning button) up.
  const error = ref<string | null>(null)

  async function fetchTutorDashboard() {
    loading.value = true
    const res = await useHttp<{ success: boolean; data: TutorDashboardData }>({
      method: 'GET',
      url: '/tutor/dashboard',
      requireAuth: true,
      showToast: false,
    })
    if (res.success && res.data?.data) {
      data.value = res.data.data
      error.value = null
    } else {
      error.value = res.message || 'Failed to load the tutor dashboard'
    }
    loading.value = false
  }

  return { data, loading, error, fetchTutorDashboard }
}
