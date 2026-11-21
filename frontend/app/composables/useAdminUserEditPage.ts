import { toast } from 'vue-sonner'
import { useAdmin } from '~/composables/useAdmin'
import { dailyGoalOf } from '~/common/data/practice-goals'
import { adminUserFormSchema, type AdminUserFormValues } from '~/common/schemas/ProfileSchema'
import type { AdminUserItem, UserRole } from '~/common/types/admin-types'
import { joinPhone, splitPhone } from '~/lib/phone'

const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // the backend's avatar limit
const NONE = 'NONE'
const orNull = (v: string) => (v === NONE ? null : v)

function formFrom(u: AdminUserItem | null): AdminUserFormValues {
  const lp = u?.learnerProfile
  const phone = splitPhone(u?.phoneNumber)
  return {
    displayName: u?.displayName ?? '',
    phoneCode: phone.code,
    phoneLocal: phone.local,
    currentLevel: lp?.currentLevel ?? NONE,
    targetLevel: lp?.targetLevel ?? NONE,
    learningPurpose: lp?.learningPurpose ?? '',
    topics: Array.isArray(lp?.topicsOfInterest) ? [...lp.topicsOfInterest] : [],
    aiPersonality: lp?.aiPersonality ?? NONE,
    // Not on the admin endpoint; carried so the shared schema validates.
    tutorAccent: lp?.tutorAccent ?? 'US',
    tutorVoice: lp?.tutorVoice ?? 'FEMALE',
    dailyGoal: dailyGoalOf(lp?.weeklyGoalMinutes),
    emailDigestEnabled: lp?.emailDigestEnabled ?? true,
  }
}

// An admin editing one account (pages/dashboard/users/[id]/profile.vue), shaped like the learner's
// own profile page: one form, one Save in the header (photo → account → learning, stops on the
// first failure and keeps the edits). Role and ban/unban apply at once, as they did before.
export function useAdminUserEditPage(userId: Ref<string>) {
  const router = useRouter()
  const { getUser, patchUser, adminUpdateProfile, adminUploadAvatar, adminUpdateLearnerProfile } = useAdmin()
  const { setTitle } = useBreadcrumbs()

  const user = ref<AdminUserItem | null>(null)
  const loading = ref(true)
  const saving = ref(false)
  const form = reactive<AdminUserFormValues>(formFrom(null))
  const avatar = reactive({ file: null as File | null, preview: '', error: '' })
  const toggling = ref(false)
  const roleOpen = ref(false)
  const roleSaving = ref(false)

  const isStudent = computed(() => user.value?.role === 'STUDENT')
  const detailPath = computed(() => `/dashboard/users/${userId.value}`)
  watch(() => user.value?.displayName || user.value?.username, setTitle, { immediate: true })

  async function load() {
    loading.value = true
    const res = await getUser(userId.value)
    if (res.success && res.data?.data) {
      user.value = res.data.data
      Object.assign(form, formFrom(res.data.data))
    }
    loading.value = false
  }

  function clearAvatar() {
    if (avatar.preview) URL.revokeObjectURL(avatar.preview)
    Object.assign(avatar, { file: null, preview: '', error: '' })
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

  /** Runs after the Form has validated. */
  async function save() {
    if (!user.value || saving.value || avatar.error) return
    const id = user.value.id
    saving.value = true
    const fail = (message: string | undefined, fallback: string) => {
      saving.value = false
      toast.error(message || fallback)
    }

    if (avatar.file) {
      const res = await adminUploadAvatar(id, avatar.file)
      if (!res.success) return fail(res.message, 'Could not upload the photo.')
    }
    const res = await adminUpdateProfile(id, { displayName: form.displayName.trim(), phoneNumber: joinPhone(form.phoneCode, form.phoneLocal) })
    if (!res.success) return fail(res.message, 'Could not save the account details.')

    if (isStudent.value) {
      const lp = await adminUpdateLearnerProfile(id, {
        currentLevel: orNull(form.currentLevel),
        targetLevel: orNull(form.targetLevel),
        learningPurpose: form.learningPurpose.trim() || null,
        topicsOfInterest: form.topics,
        aiPersonality: orNull(form.aiPersonality),
        weeklyGoalMinutes: form.dailyGoal * 7,
      })
      if (!lp.success) return fail(lp.message, 'Could not save the learning settings.')
    }

    saving.value = false
    clearAvatar()
    toast.success('Profile saved.')
    router.push(detailPath.value)
  }

  // Ban / unban: applies at once.
  async function setActive(active: boolean) {
    if (!user.value) return
    toggling.value = true
    const res = await patchUser(user.value.id, { isActive: active })
    if (res.success && res.data?.data) user.value = { ...user.value, isActive: res.data.data.isActive }
    toggling.value = false
  }

  // Role: applies at once. The dialog stays open on failure (e.g. the last admin) so the toast
  // stays tied to the action.
  async function saveRole(role: UserRole) {
    if (!user.value) return
    roleSaving.value = true
    const res = await patchUser(user.value.id, { role })
    roleSaving.value = false
    if (!res.success) return
    if (res.data?.data) user.value = { ...user.value, role: res.data.data.role }
    roleOpen.value = false
  }

  onMounted(load)
  onBeforeUnmount(clearAvatar)

  return {
    user, loading, saving, form, schema: adminUserFormSchema, avatar, isStudent, detailPath,
    toggling, roleOpen, roleSaving,
    pickAvatar, save, setActive, saveRole,
  }
}
