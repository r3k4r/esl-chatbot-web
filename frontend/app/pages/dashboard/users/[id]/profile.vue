<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import { useAdmin } from '~/composables/useAdmin'
import type { AdminUserItem, UserRole } from '~/common/types/admin-types'

definePageMeta({ layout: 'dashboard', requiresAuth: true, requiresAdmin: true })

const route = useRoute()
const router = useRouter()
const { getUser, patchUser, adminUpdateProfile, adminUploadAvatar, adminUpdateLearnerProfile } = useAdmin()

const userId = computed(() => route.params.id as string)
const user = ref<AdminUserItem | null>(null)
const loading = ref(false)

// Status toggle
const toggling = ref(false)

// Role change
const roleOpen = ref(false)
const roleSaving = ref(false)

// Profile form
const displayName = ref('')
const phoneNumber = ref('')
const savingProfile = ref(false)
const avatarFile = ref<File | null>(null)
const avatarPreview = ref<string | null>(null)
const avatarError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)

// Learner profile form
const currentLevel = ref('NONE')
const targetLevel = ref('NONE')
const aiPersonality = ref('NONE')
const weeklyGoalMinutes = ref(210)
const voiceSpeed = ref(1.0)
const autoSpeak = ref(false)
const timezone = ref('Asia/Baghdad')
const theme = ref<'light' | 'dark'>('light')
const learningPurpose = ref('')
const topicInput = ref('')
const topics = ref<string[]>([])
const savingLearner = ref(false)

// Timezone combobox
const ALL_TIMEZONES: string[] = (() => {
  try { return Intl.supportedValuesOf('timeZone') } catch { return [] }
})()
const tzSearch = ref('')
const tzOpen = ref(false)
const tzSearchInput = ref<HTMLInputElement | null>(null)
const tzContainer = ref<HTMLElement | null>(null)
onClickOutside(tzContainer, () => { tzOpen.value = false })
watch(tzOpen, (v) => {
  if (v) nextTick(() => tzSearchInput.value?.focus())
  else tzSearch.value = ''
})
const filteredTimezones = computed(() => {
  const q = tzSearch.value.toLowerCase()
  if (!q) return ALL_TIMEZONES.slice(0, 80)
  return ALL_TIMEZONES.filter(tz => tz.toLowerCase().includes(q)).slice(0, 80)
})
function selectTimezone(tz: string) {
  timezone.value = tz
  tzOpen.value = false
}

const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const PERSONALITIES = ['FRIENDLY', 'FORMAL', 'CASUAL', 'ENCOURAGING', 'STRICT', 'PATIENT'] as const
const PERSONALITY_LABEL: Record<string, string> = {
  FRIENDLY: 'Friendly', FORMAL: 'Formal', CASUAL: 'Casual',
  ENCOURAGING: 'Encouraging', STRICT: 'Strict', PATIENT: 'Patient',
}

const ROLE_DESCRIPTION: Record<string, string> = {
  STUDENT: 'Student — learner access only.',
  TUTOR: 'Tutor — creates classes and manages students.',
  ADMIN: 'Admin — full platform control.',
}

const PLAN_COLOR: Record<string, string> = {
  FREE: 'bg-surface-raised text-text-muted',
  GOLD: 'bg-amber-500/15 text-amber-500',
  PREMIUM: 'bg-violet-500/15 text-violet-500',
}

async function load() {
  loading.value = true
  const res = await getUser(userId.value)
  if (res.success && res.data?.data) {
    user.value = res.data.data
    syncForms(res.data.data)
  }
  loading.value = false
}

function syncForms(u: AdminUserItem) {
  displayName.value = u.displayName ?? ''
  phoneNumber.value = u.phoneNumber ?? ''
  const lp = u.learnerProfile
  currentLevel.value = lp?.currentLevel ?? 'NONE'
  targetLevel.value = lp?.targetLevel ?? 'NONE'
  aiPersonality.value = lp?.aiPersonality ?? 'NONE'
  weeklyGoalMinutes.value = lp?.weeklyGoalMinutes ?? 210
  voiceSpeed.value = lp?.voiceSpeed ?? 1.0
  autoSpeak.value = lp?.autoSpeak ?? false
  timezone.value = lp?.timezone ?? 'Asia/Baghdad'
  theme.value = (lp?.theme as 'light' | 'dark') ?? 'light'
  learningPurpose.value = lp?.learningPurpose ?? ''
  topics.value = Array.isArray(lp?.topicsOfInterest) ? [...lp!.topicsOfInterest] : []
}

onMounted(load)

// Status toggle — instant PATCH
async function onToggleActive(checked: boolean) {
  if (!user.value) return
  toggling.value = true
  const res = await patchUser(user.value.id, { isActive: checked })
  if (res.success && res.data?.data) user.value = { ...user.value, isActive: res.data.data.isActive }
  toggling.value = false
}

// Role change — instant PATCH
async function onSaveRole(role: UserRole) {
  if (!user.value) return
  roleSaving.value = true
  const res = await patchUser(user.value.id, { role })
  roleSaving.value = false
  // Leave the dialog open on failure (e.g. last-admin 409) so the error toast
  // stays tied to the action the admin just attempted.
  if (!res.success) return
  if (res.data?.data) user.value = { ...user.value, role: res.data.data.role }
  roleOpen.value = false
}

// Avatar
function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    avatarError.value = `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Max 5 MB.`
    if (fileInputRef.value) fileInputRef.value.value = ''
    return
  }
  avatarError.value = null
  avatarFile.value = file
  avatarPreview.value = URL.createObjectURL(file)
}

async function saveAvatar() {
  if (!user.value || !avatarFile.value) return
  uploadingAvatar.value = true
  const res = await adminUploadAvatar(user.value.id, avatarFile.value)
  if (res.success && res.data?.data) {
    user.value = { ...user.value, avatarUrl: res.data.data.avatarUrl }
    avatarPreview.value = null
    avatarFile.value = null
  }
  uploadingAvatar.value = false
}

// Profile
async function saveProfile() {
  if (!user.value) return
  savingProfile.value = true
  await adminUpdateProfile(user.value.id, {
    displayName: displayName.value.trim() || undefined,
    phoneNumber: phoneNumber.value.trim() || null,
  })
  await load()
  savingProfile.value = false
}

// Learner profile
function addTopic() {
  const t = topicInput.value.trim()
  if (t && !topics.value.includes(t)) topics.value.push(t)
  topicInput.value = ''
}
function removeTopic(t: string) { topics.value = topics.value.filter(x => x !== t) }
function onTopicKeydown(e: KeyboardEvent) { if (e.key === 'Enter') { e.preventDefault(); addTopic() } }

async function saveLearner() {
  if (!user.value) return
  savingLearner.value = true
  await adminUpdateLearnerProfile(user.value.id, {
    currentLevel: currentLevel.value === 'NONE' ? null : currentLevel.value,
    targetLevel: targetLevel.value === 'NONE' ? null : targetLevel.value,
    aiPersonality: aiPersonality.value === 'NONE' ? null : aiPersonality.value,
    weeklyGoalMinutes: weeklyGoalMinutes.value,
    voiceSpeed: voiceSpeed.value,
    autoSpeak: autoSpeak.value,
    timezone: timezone.value,
    theme: theme.value,
    learningPurpose: learningPurpose.value.trim() || null,
    topicsOfInterest: topics.value,
  })
  await load()
  savingLearner.value = false
}

const avatarSrc = computed(() => avatarPreview.value || user.value?.avatarUrl || null)
const initials = computed(() => (user.value?.displayName || user.value?.username || 'U').charAt(0).toUpperCase())
const dailyGoal = computed(() => Math.round(weeklyGoalMinutes.value / 7))
</script>

<template>
  <div class="h-full overflow-y-auto">

    <!-- Top bar -->
    <div class="sticky top-0 z-10 flex items-center gap-3 px-6 py-4"
      style="background:var(--surface-page);border-bottom:1px solid var(--border-inner)">
      <AppButton variant="secondary" size="36" radius="8" icon="ArrowLeft" text="Overview"
        @click="router.push(`/dashboard/users/${userId}`)" />
      <div v-if="user" class="flex items-center gap-2 ml-2">
        <p class="text-[16px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
          {{ user.displayName || user.username }}
        </p>
        <span class="text-[14px] font-poppins" :style="`color:var(--text-subtle)`">/ Edit Profile</span>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-6 grid lg:grid-cols-3 gap-6">
      <UiSkeleton class="h-80 rounded-2xl" />
      <div class="lg:col-span-2 space-y-5">
        <UiSkeleton class="h-48 rounded-2xl" />
        <UiSkeleton class="h-64 rounded-2xl" />
      </div>
    </div>

    <template v-else-if="user">
      <div class="p-6 grid lg:grid-cols-3 gap-6 items-start">

        <!-- ── LEFT COLUMN: Identity card ─────────────────────────────── -->
        <div class="space-y-4">

          <!-- Avatar card -->
          <div class="dash-card p-6 flex flex-col items-center text-center">
            <!-- Avatar -->
            <div class="relative mb-4">
              <UiAvatar class="w-24 h-24 rounded-2xl">
                <UiAvatarImage v-if="avatarSrc" :src="avatarSrc" alt="Avatar" class="object-cover" />
                <UiAvatarFallback class="w-full h-full rounded-2xl text-[32px] font-semibold font-poppins text-white"
                  style="background:linear-gradient(135deg,var(--color-brand-primary),#b45309)">
                  {{ initials }}
                </UiAvatarFallback>
              </UiAvatar>
              <button type="button"
                class="absolute -bottom-2 -right-2 size-8 rounded-xl flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
                style="background:var(--color-brand-primary)" aria-label="Upload photo" @click="fileInputRef?.click()">
                <AppIconsax name="Camera" color="white" :size="14" />
              </button>
              <input ref="fileInputRef" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden"
                @change="onFileChange" />
            </div>

            <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
              {{ user.displayName || user.username }}
            </p>
            <p class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">{{ user.email }}</p>

            <div class="mt-3 flex items-center gap-2 flex-wrap justify-center">
              <span
                :class="['text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins', PLAN_COLOR[user.subscription?.plan ?? 'FREE']]">
                {{ user.subscription?.plan ?? 'FREE' }}
              </span>
              <span class="text-[14px] font-poppins" :style="`color:var(--text-subtle)`">
                {{ user.role.charAt(0) + user.role.slice(1).toLowerCase() }}
              </span>
            </div>

            <!-- Avatar error -->
            <p v-if="avatarError" class="mt-2 text-[14px] text-red-500 font-poppins">{{ avatarError }}</p>

            <!-- Save avatar button — only when a new file is picked -->
            <AppButton v-if="avatarFile" variant="primary" size="36" radius="8" icon="Camera"
              :icon-config="{ color: 'white', size: 14 }" text="Save photo" class="mt-3 w-full"
              :loading="uploadingAvatar" @click="saveAvatar" />

            <p class="mt-4 text-[14px] font-mono" :style="`color:var(--text-subtle)`">
              Joined {{ new Date(user.createdAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year:
                  'numeric'
              }) }}
            </p>
          </div>

          <!-- Account role -->
          <div class="dash-card p-5">
            <div class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="text-[15px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Account role</p>
                <p class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">
                  {{ ROLE_DESCRIPTION[user.role] }}
                </p>
              </div>
              <AppButton variant="secondary" size="36" radius="8" icon="Profile"
                :icon-config="{ color: 'currentColor', size: 16 }" text="Change" class="shrink-0"
                @click="roleOpen = true" />
            </div>
          </div>

          <!-- Account status -->
          <div class="dash-card p-5">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-[15px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Account status
                </p>
                <p class="text-[14px] font-poppins mt-0.5"
                  :style="user.isActive ? 'color:var(--status-active-text)' : 'color:var(--status-expired-text)'">
                  {{ user.isActive ? 'Active — can log in' : 'Banned — blocked' }}
                </p>
              </div>
              <UiSwitch :model-value="user.isActive" :disabled="toggling" @update:model-value="onToggleActive" />
            </div>
          </div>

          <!-- Subscription info -->
          <div class="dash-card p-5 space-y-3">
            <p class="text-[15px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Subscription</p>
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Plan</span>
                <span
                  :class="['text-[14px] font-semibold px-2 py-0.5 rounded-md font-poppins', PLAN_COLOR[user.subscription?.plan ?? 'FREE']]">
                  {{ user.subscription?.plan ?? 'FREE' }}
                </span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Status</span>
                <span class="text-[14px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
                  {{ user.subscription?.status ?? '—' }}
                </span>
              </div>
              <div v-if="user.subscription?.currentPeriodEnd" class="flex items-center justify-between">
                <span class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Expires</span>
                <span class="text-[14px] font-mono" :style="`color:var(--text-subtle)`">
                  {{ new Date(user.subscription.currentPeriodEnd).toLocaleDateString('en-US', {
                    month: 'short', day:
                      'numeric', year: 'numeric'
                  }) }}
                </span>
              </div>
            </div>
          </div>

        </div>

        <!-- ── RIGHT COLUMN: Edit forms ───────────────────────────────── -->
        <div class="lg:col-span-2 space-y-5">

          <!-- Basic profile -->
          <div class="dash-card p-6 space-y-4">
            <div>
              <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Basic profile</p>
              <p class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">Display name and phone
                number.</p>
            </div>

            <!-- Read-only fields -->
            <div class="grid sm:grid-cols-2 gap-3">
              <div class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
                <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Username</p>
                <p class="text-[15px] font-semibold font-poppins mt-0.5" :style="`color:var(--text-heading)`">{{
                  user.username }}</p>
              </div>
              <div class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
                <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Email</p>
                <p class="text-[15px] font-semibold font-poppins mt-0.5 truncate" :style="`color:var(--text-heading)`">
                  {{ user.email }}</p>
              </div>
            </div>

            <!-- Editable fields -->
            <div class="grid sm:grid-cols-2 gap-3">
              <FormInput id="admin-displayName" v-model="displayName" label="Display name" placeholder="Full name"
                icon="User" />
              <FormInput id="admin-phone" v-model="phoneNumber" label="Phone" placeholder="+964 750 000 0000"
                icon="Call" />
            </div>

            <div class="flex justify-end pt-1">
              <AppButton variant="primary" size="38" radius="8" icon="TickCircle"
                :icon-config="{ color: 'white', size: 15 }" text="Save profile" :loading="savingProfile"
                @click="saveProfile" />
            </div>
          </div>

          <!-- Learner profile -->
          <div class="dash-card p-6 space-y-4">
            <div>
              <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Learning settings
              </p>
              <p class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">CEFR level, AI personality
                and weekly goal.</p>
            </div>

            <!-- CEFR + Personality row -->
            <div class="grid sm:grid-cols-3 gap-3">
              <div>
                <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Current
                  level</p>
                <UiSelect v-model="currentLevel">
                  <UiSelectTrigger class="text-[14px] w-full">
                    <UiSelectValue placeholder="Not set" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem value="NONE">Not set</UiSelectItem>
                    <UiSelectItem v-for="l in CEFR" :key="l" :value="l">{{ l }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
              <div>
                <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Target level
                </p>
                <UiSelect v-model="targetLevel">
                  <UiSelectTrigger class="text-[14px] w-full">
                    <UiSelectValue placeholder="Not set" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem value="NONE">Not set</UiSelectItem>
                    <UiSelectItem v-for="l in CEFR" :key="l" :value="l">{{ l }}</UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
              <div>
                <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">AI
                  personality</p>
                <UiSelect v-model="aiPersonality">
                  <UiSelectTrigger class="text-[14px] w-full">
                    <UiSelectValue placeholder="Default" />
                  </UiSelectTrigger>
                  <UiSelectContent>
                    <UiSelectItem value="NONE">Default</UiSelectItem>
                    <UiSelectItem v-for="p in PERSONALITIES" :key="p" :value="p">{{ PERSONALITY_LABEL[p] }}
                    </UiSelectItem>
                  </UiSelectContent>
                </UiSelect>
              </div>
            </div>

            <!-- Weekly goal slider -->
            <div>
              <div class="flex items-center justify-between mb-1.5">
                <p class="text-[14px] font-medium font-poppins" :style="`color:var(--text-heading)`">Weekly goal</p>
                <span class="text-[14px] font-semibold font-poppins" style="color:var(--color-brand-primary)">
                  {{ weeklyGoalMinutes }} min/wk · {{ dailyGoal }} min/day
                </span>
              </div>
              <input v-model.number="weeklyGoalMinutes" type="range" min="35" max="840" step="35"
                class="w-full accent-brand-primary" />
              <div class="flex justify-between text-[14px] font-poppins mt-1" :style="`color:var(--text-subtle)`">
                <span>5 min/day</span><span>2h/day</span>
              </div>
            </div>

            <!-- Voice speed + autoSpeak -->
            <div class="grid sm:grid-cols-2 gap-3 items-end">
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <p class="text-[14px] font-medium font-poppins" :style="`color:var(--text-heading)`">Voice speed</p>
                  <span class="text-[14px] font-semibold font-poppins" style="color:var(--color-brand-primary)">{{
                    voiceSpeed.toFixed(1) }}×</span>
                </div>
                <input v-model.number="voiceSpeed" type="range" min="0.5" max="2" step="0.1"
                  class="w-full accent-brand-primary" />
                <div class="flex justify-between text-[14px] font-poppins mt-1" :style="`color:var(--text-subtle)`">
                  <span>0.5×</span><span>2×</span>
                </div>
              </div>
              <div class="flex items-center justify-between p-3.5 rounded-xl" style="background:var(--surface-raised)">
                <div>
                  <p class="text-[14px] font-medium font-poppins" :style="`color:var(--text-heading)`">Auto-speak</p>
                  <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Play AI replies</p>
                </div>
                <UiSwitch :model-value="autoSpeak" @update:model-value="autoSpeak = $event" />
              </div>
            </div>

            <!-- Timezone combobox -->
            <div ref="tzContainer" class="relative">
              <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Timezone</p>
              <button
                type="button"
                class="w-full flex items-center justify-between gap-2 px-3 h-10 rounded-lg border text-[14px] font-poppins cursor-pointer transition-colors"
                :style="`background:var(--surface-raised);border-color:var(--border-inner);color:var(--text-heading)`"
                @click="tzOpen = !tzOpen"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <AppIconsax name="Clock" color="var(--color-text-muted)" :size="16" />
                  <span class="truncate">{{ timezone }}</span>
                </div>
                <AppIconsax name="ArrowDown2" color="var(--color-text-subtle)" :size="14" />
              </button>
              <div
                v-show="tzOpen"
                class="absolute z-50 left-0 right-0 mt-1 rounded-lg border shadow-lg overflow-hidden"
                :style="`background:var(--surface-card);border-color:var(--border-card)`"
              >
                <div class="p-2 border-b" :style="`border-color:var(--border-inner)`">
                  <input
                    ref="tzSearchInput"
                    v-model="tzSearch"
                    type="text"
                    placeholder="Search timezones…"
                    class="w-full px-3 h-8 rounded-lg text-[14px] font-poppins outline-none"
                    :style="`background:var(--surface-raised);color:var(--text-heading)`"
                  />
                </div>
                <div class="max-h-52 overflow-y-auto py-1">
                  <button
                    v-for="tz in filteredTimezones"
                    :key="tz"
                    type="button"
                    class="w-full text-left px-3 py-2 text-[14px] font-poppins cursor-pointer"
                    :class="tz === timezone ? 'font-semibold' : ''"
                    :style="tz === timezone ? 'background:var(--surface-raised);color:var(--color-brand-primary)' : 'color:var(--text-body)'"
                    @click="selectTimezone(tz)"
                  >{{ tz }}</button>
                  <p v-if="filteredTimezones.length === 0" class="px-3 py-4 text-[14px] text-center font-poppins" :style="`color:var(--text-muted)`">
                    No timezones found
                  </p>
                </div>
              </div>
            </div>

            <!-- Theme -->
            <div>
              <p class="text-[14px] font-medium font-poppins mb-2" :style="`color:var(--text-heading)`">Theme</p>
              <div class="grid grid-cols-2 gap-3">
                <button type="button"
                  class="relative flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all"
                  :style="theme === 'light' ? 'border-color:var(--color-brand-primary);background:var(--surface-raised)' : 'border-color:var(--border-inner);background:var(--surface-raised)'"
                  @click="theme = 'light'">
                  <div class="size-8 rounded-lg flex items-center justify-center shrink-0"
                    style="background:#F8F9FA;border:1px solid #E9ECEF">
                    <AppIconsax name="Sun1"
                      :color="theme === 'light' ? 'var(--color-brand-primary)' : 'var(--color-text-muted)'"
                      :size="16" />
                  </div>
                  <div class="text-left">
                    <p class="text-[14px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Light</p>
                    <p class="text-[13px] font-poppins" :style="`color:var(--text-muted)`">Bright UI</p>
                  </div>
                  <div v-if="theme === 'light'"
                    class="absolute top-2.5 right-2.5 size-4 rounded-full flex items-center justify-center"
                    style="background:var(--color-brand-primary)">
                    <AppIconsax name="TickCircle" color="white" :size="12" />
                  </div>
                </button>
                <button type="button"
                  class="relative flex items-center gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all"
                  :style="theme === 'dark' ? 'border-color:var(--color-brand-primary);background:var(--surface-raised)' : 'border-color:var(--border-inner);background:var(--surface-raised)'"
                  @click="theme = 'dark'">
                  <div class="size-8 rounded-lg flex items-center justify-center shrink-0"
                    style="background:#1E2329;border:1px solid #2D333B">
                    <AppIconsax name="Moon"
                      :color="theme === 'dark' ? 'var(--color-brand-primary)' : 'var(--color-text-muted)'" :size="16" />
                  </div>
                  <div class="text-left">
                    <p class="text-[14px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Dark</p>
                    <p class="text-[13px] font-poppins" :style="`color:var(--text-muted)`">Easy on eyes</p>
                  </div>
                  <div v-if="theme === 'dark'"
                    class="absolute top-2.5 right-2.5 size-4 rounded-full flex items-center justify-center"
                    style="background:var(--color-brand-primary)">
                    <AppIconsax name="TickCircle" color="white" :size="12" />
                  </div>
                </button>
              </div>
            </div>

            <!-- Learning purpose -->
            <div>
              <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Learning
                purpose</p>
              <UiTextarea v-model="learningPurpose" placeholder="e.g. Prepare for IELTS…"
                class="text-[14px] resize-none" :rows="2" />
            </div>

            <!-- Topics -->
            <div>
              <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Topics of
                interest</p>
              <div class="flex gap-2">
                <FormInput id="admin-topic" v-model="topicInput" placeholder="e.g. Technology…" class-list="flex-1"
                  @keydown="onTopicKeydown" />
                <AppButton variant="secondary" size="40" radius="8" icon="Add" text="Add" @click="addTopic" />
              </div>
              <div v-if="topics.length" class="flex flex-wrap gap-2 mt-3">
                <span v-for="t in topics" :key="t"
                  class="flex items-center gap-1.5 text-[14px] font-medium font-poppins px-3 py-1 rounded-lg"
                  style="background:var(--surface-raised);color:var(--text-heading)">
                  {{ t }}
                  <button type="button" class="cursor-pointer opacity-60 hover:opacity-100" @click="removeTopic(t)">
                    <AppIconsax name="CloseCircle" color="currentColor" :size="14" />
                  </button>
                </span>
              </div>
            </div>

            <div class="flex justify-end pt-1">
              <AppButton variant="primary" size="38" radius="8" icon="TickCircle"
                :icon-config="{ color: 'white', size: 15 }" text="Save learning settings" :loading="savingLearner"
                @click="saveLearner" />
            </div>
          </div>

        </div>
      </div>

      <!-- Change role modal -->
      <PagesDashboardUsersChangeRoleDialog
        :open="roleOpen"
        :user="user"
        :saving="roleSaving"
        @update:open="roleOpen = $event"
        @save="onSaveRole"
      />
    </template>

  </div>
</template>
