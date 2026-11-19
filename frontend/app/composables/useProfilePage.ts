import { toast } from 'vue-sonner'
import { useProfile } from '~/composables/useProfile'
import { dailyGoalOf } from '~/common/data/practice-goals'
import { profileFormSchema, type ProfileFormValues } from '~/common/schemas/ProfileSchema'
import type { MyProfileData } from '~/common/types/profile-types'
import { joinPhone, splitPhone } from '~/lib/phone'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // the backend's avatar limit
const NONE = 'NONE'
const orNull = (v: string) => (v === NONE ? null : v)

function formFrom(p: MyProfileData | null): ProfileFormValues {
  const lp = p?.learnerProfile
  const phone = splitPhone(p?.phoneNumber)
  return {
    displayName: p?.displayName ?? '',
    phoneCode: phone.code,
    phoneLocal: phone.local,
    targetLevel: lp?.targetLevel ?? NONE,
    learningPurpose: lp?.learningPurpose ?? '',
    topics: Array.isArray(lp?.topicsOfInterest) ? [...lp.topicsOfInterest] : [],
    aiPersonality: lp?.aiPersonality ?? NONE,
    tutorAccent: lp?.tutorAccent ?? 'US',
    tutorVoice: lp?.tutorVoice ?? 'FEMALE',
    dailyGoal: dailyGoalOf(lp?.weeklyGoalMinutes),
    emailDigestEnabled: lp?.emailDigestEnabled ?? true,
  }
}

// The profile page: everything about the person in one place. It reads as plain information;
// "Edit profile" turns every section into fields at once; the header's Save stores them together.
// Staff (tutor/admin) only have the account part: the learning sections are a learner's.
export function useProfilePage() {
  const { profile, loading, fetchProfile, updateProfile, updateLearnerProfile, uploadAvatar, memberSince, planLabel, planColor, initials } = useProfile()
  const { isStaff } = useRole()
  const { voice } = useTutorVoice()

  const editing = ref(false)
  const saving = ref(false)
  const form = reactive<ProfileFormValues>(formFrom(null))
  const avatar = reactive({ file: null as File | null, preview: '', error: '' })

  function clearAvatar() {
    if (avatar.preview) URL.revokeObjectURL(avatar.preview)
    Object.assign(avatar, { file: null, preview: '', error: '' })
  }

  function startEdit() {
    Object.assign(form, formFrom(profile.value))
    editing.value = true
  }

  function cancel() {
    editing.value = false
    clearAvatar()
  }

  function pickAvatar(file: File) {
    clearAvatar()
    if (file.size > MAX_AVATAR_BYTES) {
      avatar.error = `This photo is ${(file.size / 1024 / 1024).toFixed(1)} MB. Choose one under 5 MB.`
      return
    }
    avatar.file = file
    avatar.preview = URL.createObjectURL(file)
  }

  /** Runs after the Form has validated. Stops at the first failed request and keeps the edits. */
  async function save() {
    if (saving.value || avatar.error) return
    saving.value = true
    const fail = (message: string | undefined, fallback: string) => {
      saving.value = false
      toast.error(message || fallback)
    }

    if (avatar.file) {
      const res = await uploadAvatar(avatar.file)
      if (!res.success) return fail(res.message, 'Could not upload your photo.')
    }
    const res = await updateProfile({ displayName: form.displayName.trim(), phoneNumber: joinPhone(form.phoneCode, form.phoneLocal) })
    if (!res.success) return fail(res.message, 'Could not save your profile.')

    if (!isStaff.value) {
      const lp = await updateLearnerProfile({
        targetLevel: orNull(form.targetLevel),
        learningPurpose: form.learningPurpose.trim() || null,
        topicsOfInterest: form.topics,
        aiPersonality: orNull(form.aiPersonality),
        tutorAccent: form.tutorAccent,
        tutorVoice: form.tutorVoice,
        weeklyGoalMinutes: form.dailyGoal * 7,
        emailDigestEnabled: form.emailDigestEnabled,
      })
      if (!lp.success) return fail(lp.message, 'Could not save your learning settings.')
      voice.value = { accent: form.tutorAccent, gender: form.tutorVoice } // the chat and Voice Lab pickers
    }

    saving.value = false
    editing.value = false
    clearAvatar()
    toast.success('Profile saved.')
  }

  onMounted(fetchProfile)
  onBeforeUnmount(clearAvatar)

  return {
    profile, loading, isStaff, memberSince, planLabel, planColor, initials,
    editing, saving, form, schema: profileFormSchema, avatar,
    startEdit, cancel, pickAvatar, save,
  }
}
