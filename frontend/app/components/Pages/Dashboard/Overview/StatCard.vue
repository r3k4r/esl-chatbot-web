<script setup lang="ts">
import type { LearnerStat } from '~/common/types/dashboard-overview-types'

// One number under the greeting, with a line that says what it's measured against.
defineProps<{ stat: LearnerStat }>()
</script>

<template>
  <div class="dash-card p-5">
    <div class="flex items-center justify-between gap-3">
      <AppText size="14" color="neutral-400">{{ stat.label }}</AppText>
      <AppIconsax :name="stat.icon" :size="18" color="var(--color-text-subtle)" />
    </div>
    <AppText size="24" weight="semibold" font-family="poppins" class-list="mt-2 leading-tight tabular-nums">{{ stat.value }}</AppText>
    <AppText size="13" color="neutral-400" class-list="mt-1">{{ stat.sub }}</AppText>
  </div>
</template>
