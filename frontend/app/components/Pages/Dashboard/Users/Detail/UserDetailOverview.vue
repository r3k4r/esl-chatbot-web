<script setup lang="ts">
import type { AdminUserItem } from '~/common/types/admin-types'
import type { KeyFigure, SkillRow } from '~/common/types/dashboard-types'
import { AI_PERSONALITIES, CEFR_LEVELS, optionLabel } from '~/common/data/profile-options'
import { dailyGoalOf } from '~/common/data/practice-goals'
import { DEFAULT_TUTOR_VOICE, tutorVoiceLabel } from '~/common/data/tutor-voice'
import { daysAgo, formatMinutes, toneStyle } from '~/lib/progress'
import ProfileSection from '~/components/Pages/Dashboard/Profile/ProfileSection.vue'
import ProfileRow from '~/components/Pages/Dashboard/Profile/ProfileRow.vue'

// A student at a glance: how much they practise, how their skills stand, what they set up
// for their AI tutor, and their classes. Staff accounts only have the classes part.
const props = defineProps<{ user: AdminUserItem }>()

const isStudent = computed(() => props.user.role === 'STUDENT')
const m = computed(() => props.user.metrics)
const lp = computed(() => props.user.learnerProfile)

const figures = computed<KeyFigure[]>(() => {
  if (!m.value) return []
  const days = (n: number) => `${n} ${n === 1 ? 'day' : 'days'}`
  return [
    { label: 'Streak', value: days(m.value.currentStreak), hint: `Best ${days(m.value.longestStreak)}` },
    { label: 'Practice time', value: formatMinutes(m.value.totalStudyTimeMinutes), hint: `${m.value.totalWordsTyped.toLocaleString()} words written` },
    { label: 'Last practised', value: daysAgo(m.value.lastStudyDate), hint: 'Chat or Voice Lab' },
    { label: 'Level the AI hears', value: m.value.estimatedLevel ?? '–', hint: 'From their conversations' },
  ]
})

const skills = computed<SkillRow[]>(() => [
  { key: 'Grammar', value: m.value?.grammarSkill ?? null },
  { key: 'Vocabulary', value: m.value?.vocabularySkill ?? null },
  { key: 'Fluency', value: m.value?.fluencySkill ?? null },
  { key: 'Speaking', value: m.value?.speakingSkill ?? null },
])

const voice = computed(() => tutorVoiceLabel({
  accent: lp.value?.tutorAccent ?? DEFAULT_TUTOR_VOICE.accent,
  gender: lp.value?.tutorVoice ?? DEFAULT_TUTOR_VOICE.gender,
}))
const cap = (s: string) => s.charAt(0) + s.slice(1).toLowerCase()
</script>

<template>
  <div class="space-y-5">
    <PagesDashboardSharedKeyFigures v-if="isStudent && figures.length" :items="figures" />

    <div class="grid gap-5 md-lg:grid-cols-2">
      <div class="flex flex-col gap-5">
        <section v-if="isStudent" class="dash-card p-5">
          <h2 class="font-poppins text-[16px] font-semibold text-text-heading">Skills</h2>
          <AppText size="14" color="neutral-400" class-list="mt-0.5 mb-4">Scored by the AI from their chats, out of 100.</AppText>
          <PagesDashboardSharedSkillBars :rows="skills" />
        </section>

        <section class="dash-card flex-1 p-5">
          <h2 class="font-poppins text-[16px] font-semibold text-text-heading">Classes</h2>
          <div v-if="user.classUsers?.length" class="mt-3 divide-y divide-border-inner">
            <AppLink v-for="cu in user.classUsers" :key="cu.id" :to="`/dashboard/classes/${cu.class.id}`"
              class="group flex items-center justify-between gap-3 py-3 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded-sm">
              <div class="min-w-0">
                <AppText size="15" weight="medium" class-list="truncate group-hover:text-brand-primary">{{ cu.class.className }}</AppText>
                <AppText size="14" color="neutral-400">{{ cap(cu.role) }} · Code {{ cu.class.classCode }}</AppText>
              </div>
              <span v-if="cu.class.classStatus !== 'ACTIVE'" class="shrink-0 rounded-md px-2 py-0.5 font-poppins text-[14px] font-medium"
                :style="toneStyle('inactive')">{{ cap(cu.class.classStatus) }}</span>
            </AppLink>
          </div>
          <AppText v-else size="14" color="neutral-400" class-list="mt-2">Not in any class yet.</AppText>
        </section>
      </div>

      <ProfileSection v-if="isStudent" title="Learning" description="What they set up for their AI tutor.">
        <ProfileRow label="Level now">{{ optionLabel(CEFR_LEVELS, lp?.currentLevel) ?? 'Not set' }}</ProfileRow>
        <ProfileRow label="Level wanted">{{ optionLabel(CEFR_LEVELS, lp?.targetLevel) ?? 'Not set' }}</ProfileRow>
        <ProfileRow label="Why they learn">
          <span :class="!lp?.learningPurpose && 'text-text-muted'">{{ lp?.learningPurpose || 'Not given' }}</span>
        </ProfileRow>
        <ProfileRow label="Topics">
          <div v-if="lp?.topicsOfInterest?.length" class="flex flex-wrap gap-1.5">
            <span v-for="t in lp.topicsOfInterest" :key="t" class="rounded-md bg-surface-raised px-2 py-0.5 text-[14px]">{{ t }}</span>
          </div>
          <span v-else class="text-text-muted">None</span>
        </ProfileRow>
        <ProfileRow label="Tutor style">{{ optionLabel(AI_PERSONALITIES, lp?.aiPersonality) ?? 'Default' }}</ProfileRow>
        <ProfileRow label="Tutor voice">{{ voice }}</ProfileRow>
        <ProfileRow label="Daily goal">{{ dailyGoalOf(lp?.weeklyGoalMinutes) }} min a day</ProfileRow>
        <ProfileRow label="Weekly email">{{ lp?.emailDigestEnabled === false ? 'Off' : 'On' }}</ProfileRow>
      </ProfileSection>
    </div>
  </div>
</template>
