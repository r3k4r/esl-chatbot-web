<script setup lang="ts">
import type { LearnerWeek } from '~/common/types/dashboard-overview-types'
import { formatMinutes } from '~/lib/progress'

// This week as seven bars against the daily goal. Days are the learner's own calendar
// days; days still to come stay empty. The chart grows to fill the card's height.
const props = defineProps<{ week: LearnerWeek; dailyGoalMinutes: number; todayDate: string }>()

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const scale = computed(() => Math.max(props.dailyGoalMinutes, ...props.week.days.map(d => d.minutes ?? 0)))
const bars = computed(() => props.week.days.map((d, i) => ({
  ...d,
  name: DAY_NAMES[i]!,
  pct: d.minutes ? Math.max(4, Math.round((d.minutes / scale.value) * 100)) : 0,
  isToday: d.date === props.todayDate,
})))
const goalLine = computed(() => Math.round((props.dailyGoalMinutes / scale.value) * 100))
const weekPct = computed(() => Math.min(100, Math.round((props.week.minutes / Math.max(1, props.week.weeklyGoalMinutes)) * 100)))
</script>

<template>
  <section aria-labelledby="learner-week" class="dash-card flex flex-col p-5 md:p-6">
    <div class="flex flex-wrap items-baseline justify-between gap-3">
      <AppText id="learner-week" size="16" weight="semibold">This week</AppText>
      <AppText size="14" color="neutral-600" class-list="tabular-nums">
        {{ formatMinutes(week.minutes) }} of {{ formatMinutes(week.weeklyGoalMinutes) }} · {{ weekPct }}%
      </AppText>
    </div>

    <div class="relative mt-5 min-h-32 flex-1">
      <div class="absolute inset-x-0 border-t border-dashed border-border-card" :style="{ bottom: `${goalLine}%` }" aria-hidden="true" />
      <AppText v-if="!week.minutes" size="14" color="neutral-400" class-list="absolute inset-0 grid place-items-center text-center">
        No practice yet this week
      </AppText>
      <div class="relative grid h-full grid-cols-7 items-end gap-2 sm:gap-3">
        <div v-for="b in bars" :key="b.date" class="flex h-full flex-col justify-end" :title="b.minutes === null ? b.name : `${b.name}: ${b.minutes} min`">
          <div class="w-full rounded-t-md transition-[height] duration-500 ease-out"
            :class="b.minutes && b.minutes >= dailyGoalMinutes ? 'bg-brand-primary' : 'bg-brand-primary/45'"
            :style="{ height: `${b.pct}%` }" />
        </div>
      </div>
    </div>
    <div class="mt-2 grid grid-cols-7 gap-2 sm:gap-3">
      <AppText v-for="b in bars" :key="b.date" size="13" :weight="b.isToday ? 'semibold' : 'normal'" :color="b.isToday ? 'black' : 'neutral-400'" class-list="text-center">
        {{ b.name }}
      </AppText>
    </div>
    <AppText size="13" color="neutral-400" class-list="mt-3">Dashed line: your daily goal of {{ dailyGoalMinutes }} min.</AppText>
  </section>
</template>
