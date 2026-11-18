<script setup lang="ts">
import type { ClassStudentDetail } from '~/common/types/class-types'
import { daysAgo, formatMinutes, isInactive } from '~/lib/progress'

// Side column: how much and how recently they practise, their vocabulary deck, and the
// learning goals they set for themselves.
const props = defineProps<{ student: ClassStudentDetail }>()

const p = computed(() => props.student.practice)
const practice = computed(() => [
  { label: 'Last practised', value: p.value.lastPracticeAt ? daysAgo(p.value.lastPracticeAt) : 'Never', warn: isInactive(p.value.lastPracticeAt) },
  { label: 'AI chats', value: String(p.value.chats) },
  { label: 'Study time', value: formatMinutes(p.value.totalStudyTimeMinutes) },
  // A streak only means something if they practised in the last few days.
  { label: 'Streak', value: p.value.currentStreak && !isInactive(p.value.lastPracticeAt) ? `${p.value.currentStreak} days (best ${p.value.longestStreak})` : `None now (best ${p.value.longestStreak})` },
])
const vocab = computed(() => [
  { label: 'Words saved', value: String(props.student.vocabTotal) },
  { label: 'Due for review', value: String(props.student.vocabDueToday) },
])

const profile = computed(() => props.student.learnerProfile)
const topics = computed(() => (Array.isArray(profile.value?.topicsOfInterest) ? profile.value!.topicsOfInterest : []) as string[])
</script>

<template>
  <div class="space-y-5">
    <section aria-labelledby="student-practice" class="dash-card p-5">
      <AppText id="student-practice" size="16" weight="semibold">Practice</AppText>
      <dl class="mt-3 divide-y divide-border-inner">
        <div v-for="f in practice" :key="f.label" class="flex items-baseline justify-between gap-3 py-2.5">
          <dt><AppText size="14" color="neutral-400">{{ f.label }}</AppText></dt>
          <dd><AppText size="14" weight="medium" class-list="text-end" :color="f.warn ? 'neutral-400' : 'black'">{{ f.value }}</AppText></dd>
        </div>
      </dl>
      <AppText v-if="isInactive(p.lastPracticeAt)" size="13" color="neutral-400" class-list="mt-2">
        No AI practice this week. A short nudge in class can help.
      </AppText>
    </section>

    <section aria-labelledby="student-vocab" class="dash-card p-5">
      <AppText id="student-vocab" size="16" weight="semibold">Vocabulary</AppText>
      <dl class="mt-3 divide-y divide-border-inner">
        <div v-for="f in vocab" :key="f.label" class="flex items-baseline justify-between gap-3 py-2.5">
          <dt><AppText size="14" color="neutral-400">{{ f.label }}</AppText></dt>
          <dd><AppText size="14" weight="medium">{{ f.value }}</AppText></dd>
        </div>
      </dl>
    </section>

    <section v-if="profile" aria-labelledby="student-profile" class="dash-card p-5">
      <AppText id="student-profile" size="16" weight="semibold">Learning goals</AppText>
      <AppText v-if="profile.learningPurpose" size="14" color="neutral-600" class-list="mt-2 leading-6">{{ profile.learningPurpose }}</AppText>
      <AppText v-if="profile.weeklyGoalMinutes" size="14" color="neutral-400" class-list="mt-2">
        Wants to practise {{ formatMinutes(profile.weeklyGoalMinutes) }} a week
      </AppText>
      <div v-if="topics.length" class="mt-3 flex flex-wrap gap-1.5">
        <UiBadge v-for="t in topics" :key="t" class="rounded-md border-0 bg-surface-raised text-[13px] font-medium text-text-body">{{ t }}</UiBadge>
      </div>
      <AppText v-if="!profile.learningPurpose && !topics.length" size="14" color="neutral-400" class-list="mt-2">
        They haven't set any goals yet.
      </AppText>
    </section>
  </div>
</template>
