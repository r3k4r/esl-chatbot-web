<script setup lang="ts">
import type { LearnerGoal } from '~/common/types/dashboard-overview-types'

// Active learning goals with their progress (0–100).
defineProps<{ goals: LearnerGoal[] }>()

const dateLabel = (iso: string | null) => (iso ? `by ${new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : '')
</script>

<template>
  <section aria-labelledby="learner-goals" class="dash-card p-5">
    <div class="flex items-baseline justify-between gap-3">
      <AppText id="learner-goals" size="16" weight="semibold">Goals</AppText>
      <AppLink to="/dashboard/goals" class="text-[14px] text-text-muted hover:text-text-heading">All goals</AppLink>
    </div>

    <ul v-if="goals.length" class="mt-3 space-y-4">
      <li v-for="g in goals" :key="g.id">
        <div class="flex items-baseline justify-between gap-3">
          <AppText size="14" weight="medium" class-list="line-clamp-2">{{ g.description }}</AppText>
          <AppText size="14" color="neutral-600" class-list="shrink-0 tabular-nums">{{ Math.round(g.progress) }}%</AppText>
        </div>
        <div class="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-well">
          <div class="h-full rounded-full bg-brand-primary" :style="{ width: `${Math.min(100, g.progress)}%` }" />
        </div>
        <AppText v-if="g.targetDate" size="13" color="neutral-400" class-list="mt-1">{{ dateLabel(g.targetDate) }}</AppText>
      </li>
    </ul>
    <template v-else>
      <AppText size="14" color="neutral-400" class-list="mt-3">A goal gives your practice a direction.</AppText>
      <AppButton variant="secondary" size="36" radius="8" to="/dashboard/goals" text="Set a goal" icon="Add" :icon-config="{ size: 16 }" class-list="mt-3 w-full" />
    </template>
  </section>
</template>
