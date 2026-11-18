<script setup lang="ts">
import type { AdminDashboardData } from '~/common/types/admin-types'

// Where students drop off: each step with its count and the share of the step before.
const props = defineProps<{ funnel: AdminDashboardData['funnel'] }>()

const steps = computed(() => {
  const f = props.funnel
  const list = [
    { label: 'Signed up', value: f.signedUp, help: 'Student accounts' },
    { label: 'Verified', value: f.verified, help: 'Email or Google confirmed, AI unlocked' },
    { label: 'Practised', value: f.practised, help: 'Sent the AI tutor at least one message' },
    { label: 'Paying now', value: f.paying, help: 'Gold or Premium, not yet expired' },
  ]
  return list.map((s, i) => ({
    ...s,
    width: f.signedUp ? Math.max(2, Math.round((s.value / f.signedUp) * 100)) : 0,
    step: i && list[i - 1]!.value ? Math.round((s.value / list[i - 1]!.value) * 100) : null,
  }))
})
</script>

<template>
  <section aria-labelledby="admin-funnel" class="dash-card p-5 md:p-6">
    <AppText id="admin-funnel" size="16" weight="semibold">Student funnel</AppText>
    <AppText size="14" color="neutral-400" class-list="mt-1">All time. The percentage is the share of the step above.</AppText>

    <ol class="mt-5 space-y-4">
      <li v-for="s in steps" :key="s.label">
        <div class="flex items-baseline justify-between gap-3">
          <div class="min-w-0">
            <AppText size="14" weight="medium">{{ s.label }}</AppText>
            <AppText size="13" color="neutral-400" class-list="truncate">{{ s.help }}</AppText>
          </div>
          <div class="shrink-0 text-end">
            <AppText size="16" weight="semibold" class-list="tabular-nums">{{ s.value.toLocaleString() }}</AppText>
            <AppText v-if="s.step !== null" size="13" color="neutral-400" class-list="tabular-nums">{{ s.step }}%</AppText>
          </div>
        </div>
        <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-well">
          <div class="h-full rounded-full bg-brand-primary transition-[width] duration-500 ease-out" :style="{ width: `${s.width}%` }" />
        </div>
      </li>
    </ol>
  </section>
</template>
