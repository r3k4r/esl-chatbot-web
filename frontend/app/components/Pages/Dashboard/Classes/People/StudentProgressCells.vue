<script setup lang="ts">
import type { ClassStudentSummary } from '~/common/types/class-types'
import { daysAgo, isInactive, skillBand, toneStyle } from '~/lib/progress'

// A student's progress at a glance, inside their People row (teachers only):
// level, task record, last practice, overall skill band.
const props = defineProps<{ s: ClassStudentSummary }>()

const level = computed(() => props.s.estimatedLevel ?? props.s.currentLevel)
const practised = computed(() => !!props.s.lastPracticeAt)
const overall = computed(() => {
  if (!practised.value) return null
  const xs = [props.s.grammarSkill, props.s.vocabularySkill, props.s.fluencySkill, props.s.speakingSkill].filter(x => x > 0)
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
})
const band = computed(() => skillBand(overall.value))
const t = computed(() => props.s.tasks)
</script>

<template>
  <!-- Phone + tablet: one quiet line (the 4-column grid only fits from 1024px) -->
  <AppText size="13" color="neutral-400" class-list="ms-auto shrink-0 text-end md-lg:hidden">
    {{ t.handedIn }}/{{ t.total }} tasks<template v-if="t.missing"> · <span :style="{ color: 'var(--destructive)' }">{{ t.missing }} missing</span></template>
  </AppText>

  <div class="hidden min-w-0 flex-1 grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1fr)_8rem] items-center gap-4 md-lg:grid">
    <AppText size="14" weight="semibold" :color="level ? 'black' : 'neutral-400'" :title="s.estimatedLevel ? 'Level estimated by the AI tutor' : 'Level the student chose'">
      {{ level ?? '–' }}
    </AppText>

    <div class="min-w-0">
      <AppText size="14" class-list="truncate">
        <template v-if="t.total">{{ t.handedIn }} of {{ t.total }} handed in</template>
        <template v-else>No tasks yet</template>
      </AppText>
      <AppText v-if="t.missing" size="13" color="error">{{ t.missing }} missing</AppText>
      <AppText v-else-if="t.total && t.handedIn - t.reviewed > 0" size="13" color="neutral-400">{{ t.handedIn - t.reviewed }} to review</AppText>
    </div>

    <div class="min-w-0">
      <AppText size="14" class-list="truncate" :color="isInactive(s.lastPracticeAt) ? 'neutral-400' : 'black'">
        {{ practised ? `Practised ${daysAgo(s.lastPracticeAt)}` : 'No AI practice yet' }}
      </AppText>
      <AppText v-if="practised && s.currentStreak > 1 && !isInactive(s.lastPracticeAt)" size="13" color="neutral-400">{{ s.currentStreak }}-day streak</AppText>
    </div>

    <UiBadge class="justify-self-start rounded-md border-0 text-[12px] font-semibold" :style="toneStyle(band.tone)">
      {{ band.label }}
    </UiBadge>
  </div>
</template>
