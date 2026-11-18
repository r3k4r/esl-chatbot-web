<script setup lang="ts">
import type { LearnerActivity } from '~/common/types/dashboard-overview-types'

// The last 12 weeks as a calendar: one column per week (Mon at the top), shaded by how
// much of the daily goal that day reached. Future days stay empty.
const props = defineProps<{ activity: LearnerActivity; dailyGoalMinutes: number }>()

const DAY_NAMES = ['Mon', '', 'Wed', '', 'Fri', '', '']
const LEGEND = [0, 0.25, 0.5, 1]

// Mixed in sRGB: oklch drifts the hue toward pink when blending orange into grey.
function shade(min: number | null) {
  if (min === null) return 'transparent'
  if (!min) return 'var(--surface-well)'
  const r = min / Math.max(1, props.dailyGoalMinutes)
  return `color-mix(in srgb, var(--color-brand-primary) ${r >= 1 ? 100 : r >= 0.5 ? 65 : 35}%, var(--surface-well))`
}
function dayLabel(week: number, day: number) {
  const d = new Date(props.activity.firstDay)
  d.setUTCDate(d.getUTCDate() + week * 7 + day)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
}
</script>

<template>
  <section aria-labelledby="learner-activity" class="dash-card flex flex-col p-5 md:p-6">
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <AppText id="learner-activity" size="16" weight="semibold">Last 12 weeks</AppText>
      <AppText size="14" color="neutral-600">{{ activity.activeDays }} day{{ activity.activeDays === 1 ? '' : 's' }} practised</AppText>
    </div>

    <div class="mt-5 flex flex-1 items-center gap-2 overflow-x-auto">
      <div class="grid shrink-0 grid-rows-7 gap-1" aria-hidden="true">
        <span v-for="(n, i) in DAY_NAMES" :key="i" class="h-4 text-[12px] leading-4 text-text-muted">{{ n }}</span>
      </div>
      <div class="flex gap-1" role="img" :aria-label="`${activity.activeDays} days practised in the last 12 weeks`">
        <div v-for="(w, wi) in activity.weeks" :key="wi" class="grid shrink-0 grid-rows-7 gap-1">
          <span v-for="(m, di) in w" :key="di" class="size-4 rounded-[4px]"
            :style="{ background: shade(m) }" :title="m === null ? '' : `${dayLabel(wi, di)}: ${m} min`" />
        </div>
      </div>
    </div>

    <div class="mt-4 flex items-center gap-1.5">
      <AppText size="13" color="neutral-400" class-list="me-1">Less</AppText>
      <span v-for="r in LEGEND" :key="r" class="size-3 rounded-[3px]" :style="{ background: shade(r * dailyGoalMinutes) }" />
      <AppText size="13" color="neutral-400" class-list="ms-1">Goal reached</AppText>
    </div>
  </section>
</template>
