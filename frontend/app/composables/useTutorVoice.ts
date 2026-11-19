import { toast } from 'vue-sonner'
import { DEFAULT_TUTOR_VOICE, tutorVoiceLabel } from '~/common/data/tutor-voice'
import type { MyLearnerProfile, MyProfileData, TutorVoiceChoice } from '~/common/types/profile-types'

interface ApiResponse<T> { success: boolean; message?: string; data: T }

// The student's tutor voice (accent + gender), shared by the chat and the Voice Lab pickers.
// Saved straight to the learner profile; the next spoken reply or call uses it.
export function useTutorVoice() {
  const voice = useState<TutorVoiceChoice>('tutor-voice', () => ({ ...DEFAULT_TUTOR_VOICE }))
  const saving = ref(false)

  /** Read the saved choice (again on every page, so a change in Settings is picked up). */
  async function load() {
    const res = await useHttp<ApiResponse<MyProfileData>>({ method: 'GET', url: '/users/me', requireAuth: true, showToast: false })
    const lp = res.data?.data?.learnerProfile
    if (res.success && lp) voice.value = { accent: lp.tutorAccent ?? 'US', gender: lp.tutorVoice ?? 'FEMALE' }
  }

  async function save(patch: Partial<TutorVoiceChoice>) {
    const before = voice.value
    const next = { ...before, ...patch }
    if (next.accent === before.accent && next.gender === before.gender) return
    voice.value = next
    saving.value = true
    const res = await useHttp<ApiResponse<MyLearnerProfile>>({
      method: 'PATCH',
      url: '/users/me/learner-profile',
      body: { tutorAccent: next.accent, tutorVoice: next.gender },
      requireAuth: true,
      showToast: false,
    })
    saving.value = false
    if (!res.success) {
      voice.value = before
      toast.error(res.message || 'Could not change the tutor voice.')
      return
    }
    toast.success(`Tutor voice: ${tutorVoiceLabel(next)}`)
  }

  return { voice, saving, load, save }
}
