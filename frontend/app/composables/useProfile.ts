import type {
  MyProfileData,
  MyLearnerProfile,
  UpdateProfileInput,
  UpdateLearnerProfileInput,
} from '~/common/types/profile-types'

export type { MyProfileData, MyLearnerProfile, UpdateProfileInput, UpdateLearnerProfileInput }

interface ApiResponse<T> { success: boolean; message?: string; data: T }

export function useProfile() {
  const profile = ref<MyProfileData | null>(null)
  const loading = ref(false)
  const { syncFromProfile } = useTheme()

  async function fetchProfile() {
    loading.value = true
    const res = await useHttp<ApiResponse<MyProfileData>>({
      method: 'GET',
      url: '/users/me',
      requireAuth: true,
      showToast: false,
    })
    if (res.success && res.data?.data) {
      profile.value = res.data.data
      syncFromProfile(res.data.data.learnerProfile?.theme)
    }
    loading.value = false
    return res
  }

  async function updateProfile(input: UpdateProfileInput) {
    const res = await useHttp<ApiResponse<MyProfileData>>({
      method: 'PATCH',
      url: '/users/me',
      body: input,
      requireAuth: true,
      showToast: true,
    })
    if (res.success && res.data?.data) {
      profile.value = res.data.data
    }
    return res
  }

  async function updateLearnerProfile(input: UpdateLearnerProfileInput) {
    const res = await useHttp<ApiResponse<MyLearnerProfile>>({
      method: 'PATCH',
      url: '/users/me/learner-profile',
      body: input,
      requireAuth: true,
      showToast: true,
    })
    if (res.success && res.data?.data) {
      if (profile.value) profile.value = { ...profile.value, learnerProfile: res.data.data }
      syncFromProfile(res.data.data.theme)
    }
    return res
  }

  async function uploadAvatar(file: File) {
    const form = new FormData()
    form.append('avatar', file)
    const res = await useHttp<ApiResponse<{ avatarUrl: string }>>({
      method: 'POST',
      url: '/users/me/avatar',
      body: form,
      requireAuth: true,
      showToast: true,
    })
    if (res.success && res.data?.data && profile.value) {
      profile.value = { ...profile.value, avatarUrl: res.data.data.avatarUrl }
    }
    return res
  }

  const memberSince = computed(() => {
    if (!profile.value?.createdAt) return '—'
    return new Date(profile.value.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  })

  const planLabel = computed(() => {
    const plan = profile.value?.subscription?.plan
    if (plan === 'GOLD') return 'Gold'
    if (plan === 'PREMIUM') return 'Premium'
    return 'Free'
  })

  const planColor = computed(() => {
    const plan = profile.value?.subscription?.plan
    if (plan === 'PREMIUM') return 'bg-violet-500/15 text-violet-500'
    if (plan === 'GOLD') return 'bg-amber-500/15 text-amber-500'
    return 'bg-brand-primary/10 text-brand-primary'
  })

  const initials = computed(() => {
    const name = profile.value?.displayName || profile.value?.username || 'U'
    return name.charAt(0).toUpperCase()
  })

  const dailyGoalMins = computed(() => {
    const weekly = profile.value?.learnerProfile?.weeklyGoalMinutes ?? 210
    return Math.round(weekly / 7)
  })

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
    updateLearnerProfile,
    uploadAvatar,
    memberSince,
    planLabel,
    planColor,
    initials,
    dailyGoalMins,
  }
}
