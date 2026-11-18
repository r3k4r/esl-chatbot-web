<script setup lang="ts">
import { useProfile } from '~/composables/useProfile'
import type { UpdateProfileInput, UpdateLearnerProfileInput } from '~/common/types/profile-types'

definePageMeta({ layout: 'dashboard', requiresAuth: true })

const {
  profile, loading,
  fetchProfile, updateProfile, updateLearnerProfile, uploadAvatar,
  memberSince, planLabel, planColor, initials, dailyGoalMins,
} = useProfile()

onMounted(fetchProfile)

const editOpen = ref(false)
const settingsOpen = ref(false)
const savingProfile = ref(false)
const savingSettings = ref(false)

async function onSaveProfile(input: UpdateProfileInput, avatarFile: File | null) {
  savingProfile.value = true
  if (avatarFile) {
    const res = await uploadAvatar(avatarFile)
    if (!res.success) {
      savingProfile.value = false
      return
    }
  }
  await updateProfile(input)
  savingProfile.value = false
  editOpen.value = false
}

async function onSaveSettings(input: UpdateLearnerProfileInput) {
  savingSettings.value = true
  const res = await updateLearnerProfile(input)
  if (res.success && profile.value?.learnerProfile) {
    Object.assign(profile.value.learnerProfile, input)
    // Show toast for email digest toggle
    if (input.emailDigestEnabled !== undefined) {
      const { toast } = await import('vue-sonner')
      toast.success(
        input.emailDigestEnabled
          ? '📧 Email digests enabled — you\'ll receive weekly summaries'
          : '💤 Email digests disabled — you won\'t receive weekly emails'
      )
    }
  }
  savingSettings.value = false
  settingsOpen.value = false
}

const CEFR_FULL: Record<string, string> = {
  A1: 'A1 · Beginner', A2: 'A2 · Elementary',
  B1: 'B1 · Intermediate', B2: 'B2 · Upper-Int',
  C1: 'C1 · Advanced', C2: 'C2 · Mastery',
}

const PERSONALITY_LABEL: Record<string, string> = {
  FRIENDLY: 'Friendly', FORMAL: 'Formal', CASUAL: 'Casual',
  ENCOURAGING: 'Encouraging', STRICT: 'Strict', PATIENT: 'Patient',
}

const avatarSrc = computed(() => profile.value?.avatarUrl || null)

const currentLevelDisplay = computed(() => {
  const l = profile.value?.learnerProfile?.currentLevel
  return l ? (CEFR_FULL[l] ?? l) : null
})
const targetLevelDisplay = computed(() => {
  const l = profile.value?.learnerProfile?.targetLevel
  return l ? (CEFR_FULL[l] ?? l) : null
})
const aiPersonalityDisplay = computed(() => {
  const p = profile.value?.learnerProfile?.aiPersonality
  return p ? (PERSONALITY_LABEL[p] ?? p) : null
})
const topics = computed(() => {
  const t = profile.value?.learnerProfile?.topicsOfInterest
  return Array.isArray(t) && t.length ? t : []
})
const learningPurpose = computed(() => profile.value?.learnerProfile?.learningPurpose || null)
const isGoogleLinked = computed(() => profile.value?.authProvider === 'GOOGLE')
</script>

<template>
  <div class="h-full overflow-y-auto page-padding space-y-5">

    <!-- Page header -->
    <div class="animate-card-enter" style="--delay:0ms">
      <h1 class="text-[28px] font-semibold tracking-[-0.02em] font-poppins" :style="`color:var(--text-heading)`">Profile</h1>
      <p class="text-[14px] mt-1 font-poppins" :style="`color:var(--text-muted)`">Manage your account and learning preferences.</p>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading && !profile">
      <div class="dash-card p-6 flex items-center gap-5 animate-card-enter" style="--delay:80ms">
        <UiSkeleton class="w-20 h-20 rounded-2xl shrink-0" />
        <div class="flex-1 space-y-2">
          <UiSkeleton class="h-5 w-48" />
          <UiSkeleton class="h-4 w-64" />
          <UiSkeleton class="h-4 w-36" />
        </div>
      </div>
      <div class="grid md:grid-cols-3 gap-4">
        <UiSkeleton v-for="n in 3" :key="n" class="h-28 rounded-2xl" />
      </div>
    </template>

    <template v-else-if="profile">

      <!-- ── User card ───────────────────────────────────────────────── -->
      <div class="dash-card p-6 flex items-start sm:items-center gap-5 flex-wrap animate-card-enter" style="--delay:80ms">
        <!-- Avatar -->
        <div class="relative shrink-0">
          <UiAvatar class="w-20 h-20 rounded-2xl">
            <UiAvatarImage v-if="avatarSrc" :src="avatarSrc" alt="Avatar" class="object-cover" />
            <UiAvatarFallback
              class="w-full h-full rounded-2xl text-[28px] font-semibold font-poppins text-white"
              style="background: linear-gradient(135deg, var(--color-brand-primary), #b45309)"
            >
              {{ initials }}
            </UiAvatarFallback>
          </UiAvatar>
          <div
            v-if="isGoogleLinked"
            class="absolute -bottom-1.5 -right-1.5 size-6 rounded-full flex items-center justify-center"
            style="background:var(--surface-card); border:2px solid var(--border-card)"
            title="Linked with Google"
          >
            <svg viewBox="0 0 24 24" class="size-3.5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          </div>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-[22px] font-semibold tracking-tight font-poppins" :style="`color:var(--text-heading)`">
            {{ profile.displayName || profile.username }}
          </p>
          <p class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">
            {{ profile.email }}<span v-if="profile.phoneNumber"> · {{ profile.phoneNumber }}</span>
          </p>
          <div class="mt-2.5 flex items-center gap-2 flex-wrap">
            <span :class="['text-[14px] font-semibold px-2.5 py-0.5 rounded-full font-poppins', planColor]">
              {{ planLabel }}
            </span>
            <span
              v-if="profile.learnerProfile?.currentLevel"
              class="text-[14px] font-semibold px-2.5 py-0.5 rounded-full font-poppins"
              style="background:var(--surface-raised);color:var(--text-heading)"
            >
              {{ profile.learnerProfile.currentLevel }}
            </span>
            <span
              v-if="profile.role !== 'STUDENT'"
              class="text-[14px] font-semibold px-2.5 py-0.5 rounded-full font-poppins"
              style="background:var(--status-active-bg);color:var(--status-active-text)"
            >
              {{ profile.role === 'ADMIN' ? 'Admin' : 'Tutor' }}
            </span>
          </div>
        </div>

        <AppButton
          variant="primary"
          size="38"
          radius="8"
          icon="Edit"
          :icon-config="{ color: 'white' }"
          text="Edit profile"
          class="shrink-0"
          @click="editOpen = true"
        />
      </div>

      <!-- ── Quick stats (clickable to open settings) ───────────────── -->
      <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-4">

        <!-- Current level — click to set -->
        <button
          class="dash-card p-5 text-left cursor-pointer transition-colors hover:border-brand-primary/40 animate-card-enter group"
          style="--delay:160ms"
          @click="settingsOpen = true"
        >
          <div class="flex items-start justify-between">
            <p class="text-[14px] uppercase tracking-[0.16em] font-semibold font-poppins" :style="`color:var(--text-subtle)`">Current level</p>
            <AppIconsax name="Edit2" color="var(--color-brand-primary)" :size="15" class="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p v-if="currentLevelDisplay" class="mt-2 text-[22px] font-semibold tracking-tight font-poppins" :style="`color:var(--text-heading)`">
            {{ profile.learnerProfile?.currentLevel }}
          </p>
          <p v-if="currentLevelDisplay" class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">
            {{ currentLevelDisplay.split(' · ')[1] }}
          </p>
          <p v-else class="mt-2 text-[15px] font-medium font-poppins" style="color:var(--color-brand-primary)">
            Tap to set your level →
          </p>
        </button>

        <!-- Target level — click to set -->
        <button
          class="dash-card p-5 text-left cursor-pointer transition-colors hover:border-brand-primary/40 animate-card-enter group"
          style="--delay:200ms"
          @click="settingsOpen = true"
        >
          <div class="flex items-start justify-between">
            <p class="text-[14px] uppercase tracking-[0.16em] font-semibold font-poppins" :style="`color:var(--text-subtle)`">Target level</p>
            <AppIconsax name="Edit2" color="var(--color-brand-primary)" :size="15" class="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p v-if="targetLevelDisplay" class="mt-2 text-[22px] font-semibold tracking-tight font-poppins" :style="`color:var(--text-heading)`">
            {{ profile.learnerProfile?.targetLevel }}
          </p>
          <p v-if="targetLevelDisplay" class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">
            {{ targetLevelDisplay.split(' · ')[1] }}
          </p>
          <p v-else class="mt-2 text-[15px] font-medium font-poppins" style="color:var(--color-brand-primary)">
            Tap to set target →
          </p>
        </button>

        <!-- Daily goal -->
        <button
          class="dash-card p-5 text-left cursor-pointer transition-colors hover:border-brand-primary/40 animate-card-enter group"
          style="--delay:240ms"
          @click="settingsOpen = true"
        >
          <div class="flex items-start justify-between">
            <p class="text-[14px] uppercase tracking-[0.16em] font-semibold font-poppins" :style="`color:var(--text-subtle)`">Daily goal</p>
            <AppIconsax name="Edit2" color="var(--color-brand-primary)" :size="15" class="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p class="mt-2 text-[22px] font-semibold tracking-tight font-poppins" :style="`color:var(--text-heading)`">
            {{ dailyGoalMins }} min
          </p>
          <p class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">
            {{ profile.learnerProfile?.weeklyGoalMinutes ?? 210 }} min/week
          </p>
        </button>

        <!-- AI personality -->
        <button
          class="dash-card p-5 text-left cursor-pointer transition-colors hover:border-brand-primary/40 animate-card-enter group"
          style="--delay:280ms"
          @click="settingsOpen = true"
        >
          <div class="flex items-start justify-between">
            <p class="text-[14px] uppercase tracking-[0.16em] font-semibold font-poppins" :style="`color:var(--text-subtle)`">AI tutor</p>
            <AppIconsax name="Edit2" color="var(--color-brand-primary)" :size="15" class="opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p v-if="aiPersonalityDisplay" class="mt-2 text-[22px] font-semibold tracking-tight font-poppins" :style="`color:var(--text-heading)`">
            {{ aiPersonalityDisplay }}
          </p>
          <p v-if="aiPersonalityDisplay" class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">Personality</p>
          <p v-else class="mt-2 text-[15px] font-medium font-poppins" style="color:var(--color-brand-primary)">
            Tap to choose →
          </p>
        </button>

      </div>

      <!-- ── Member since ────────────────────────────────────────────── -->
      <div class="dash-card p-5 animate-card-enter" style="--delay:320ms">
        <div class="flex items-center gap-4">
          <div class="size-10 rounded-xl flex items-center justify-center shrink-0" style="background:var(--surface-raised)">
            <AppIconsax name="Calendar" color="var(--color-text-muted)" :size="18" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Member since</p>
            <p class="text-[16px] font-semibold font-poppins" :style="`color:var(--text-heading)`">{{ memberSince }}</p>
          </div>
          <p class="text-[14px] font-poppins shrink-0" :style="`color:var(--text-muted)`">@{{ profile.username }}</p>
        </div>
      </div>

      <!-- ── Learning purpose & topics ──────────────────────────────── -->
      <div
        v-if="learningPurpose || topics.length"
        class="dash-card p-6 space-y-4 animate-card-enter"
        style="--delay:360ms"
      >
        <div class="flex items-center justify-between">
          <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Learning profile</p>
          <AppButton variant="secondary" size="32" radius="8" icon="Edit2" text="Edit" @click="settingsOpen = true" />
        </div>

        <div v-if="learningPurpose" class="flex items-start gap-3">
          <div class="size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style="background:var(--surface-raised)">
            <AppIconsax name="Note" color="var(--color-brand-primary)" :size="15" />
          </div>
          <div>
            <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Learning purpose</p>
            <p class="text-[15px] font-medium font-poppins mt-0.5 leading-relaxed" :style="`color:var(--text-heading)`">{{ learningPurpose }}</p>
          </div>
        </div>

        <div v-if="topics.length" class="flex items-start gap-3">
          <div class="size-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style="background:var(--surface-raised)">
            <AppIconsax name="Book1" color="var(--color-brand-primary)" :size="15" />
          </div>
          <div>
            <p class="text-[14px] font-poppins mb-2" :style="`color:var(--text-muted)`">Topics of interest</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="t in topics"
                :key="t"
                class="text-[14px] font-medium font-poppins px-3 py-1 rounded-full"
                style="background:var(--surface-raised);color:var(--text-heading)"
              >{{ t }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Email digests card -->
      <div class="dash-card p-6 animate-card-enter" style="--delay:400ms">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <AppIconsax name="Send2" color="var(--color-brand-primary)" :size="18" />
              <p class="text-[16px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Email digests</p>
            </div>
            <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">
              Receive a weekly summary of your progress every Sunday morning.
            </p>
          </div>
          <UiSwitch
            :model-value="profile?.learnerProfile?.emailDigestEnabled ?? true"
            @update:model-value="onSaveSettings({ emailDigestEnabled: $event })"
          />
        </div>
        <p v-if="!(profile?.learnerProfile?.emailDigestEnabled ?? true)" class="text-[13px] font-poppins mt-3" :style="`color:var(--text-muted)`">
          💤 You won't receive email digests.
        </p>
      </div>

      <!-- Empty state CTA when no learner profile at all -->
      <div
        class="dash-card p-8 flex flex-col items-center text-center animate-card-enter"
        style="--delay:440ms"
      >
        <div class="size-14 rounded-2xl flex items-center justify-center mb-4" style="background:var(--surface-raised)">
          <AppIconsax name="Setting2" color="var(--color-brand-primary)" :size="24" />
        </div>
        <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Set up your learning profile</p>
        <p class="text-[14px] font-poppins mt-1 max-w-sm" :style="`color:var(--text-muted)`">
          Tell us your English level, learning goals and preferred topics so the AI can personalise your sessions.
        </p>
        <AppButton
          variant="primary"
          size="40"
          radius="8"
          icon="Setting2"
          :icon-config="{ color: 'white' }"
          text="Set up now"
          class="mt-5"
          @click="settingsOpen = true"
        />
      </div>

    </template>

    <!-- ── Modals ─────────────────────────────────────────────────────── -->
    <PagesDashboardProfileEditProfileModal
      :open="editOpen"
      :profile="profile"
      :saving="savingProfile"
      @update:open="editOpen = $event"
      @save="onSaveProfile"
    />

    <PagesDashboardProfileLearnerSettingsModal
      :open="settingsOpen"
      :learner-profile="profile?.learnerProfile ?? null"
      :saving="savingSettings"
      @update:open="settingsOpen = $event"
      @save="onSaveSettings"
    />

  </div>
</template>
