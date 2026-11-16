import type { TutorDashboardData } from '~/common/types/tutor-types'

export function useTutorDashboard() {
  const raw = ref<TutorDashboardData | null>(null)
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
      raw.value = res.data.data
      error.value = null
    } else {
      error.value = res.message || 'Failed to load the tutor dashboard'
    }
    loading.value = false
  }

  const classes = computed(() => raw.value?.classes ?? { total: 0, active: 0 })
  const students = computed(() => raw.value?.students ?? { total: 0, activeToday: 0, activeThisWeek: 0 })
  const skills = computed(() => raw.value?.skills ?? { avgGrammar: 0, avgVocabulary: 0, avgFluency: 0, avgSpeaking: 0 })
  const sessionsToday = computed(() => raw.value?.sessionsToday ?? 0)
  const recentActivity = computed(() => raw.value?.recentActivity ?? [])

  return {
    loading,
    error,
    fetchTutorDashboard,
    classes,
    students,
    skills,
    sessionsToday,
    recentActivity,
  }
}
