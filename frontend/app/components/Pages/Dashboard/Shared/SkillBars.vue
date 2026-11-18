<script setup lang="ts">
import type { SkillRow } from '~/common/types/dashboard-types'
import { skillBand, toneStyle } from '~/lib/progress'

// Skill scores as bars with a plain-language band, so a number is never read alone.
// Used by the learner dashboard, the tutor dashboard, a student's page and class Analytics.

const props = defineProps<{ rows: SkillRow[] }>()

const shown = computed(() => props.rows.map(r => ({ ...r, band: skillBand(r.value), pct: Math.round(Math.min(100, r.value ?? 0)) })))
const withHelp = computed(() => props.rows.some(r => r.help))
</script>

<template>
  <div class="@container space-y-4">
    <div v-for="r in shown" :key="r.key"
      :class="['grid items-center gap-3 grid-cols-[6rem_minmax(0,1fr)_2.5rem] @sm:grid-cols-[6rem_minmax(0,1fr)_2.5rem_7.5rem]',
               withHelp && '@2xl:grid-cols-[13rem_minmax(0,1fr)_2.5rem_7.5rem]']">
      <div class="min-w-0">
        <AppText size="14" weight="medium">{{ r.key }}</AppText>
        <AppText v-if="r.help" size="13" color="neutral-400" class-list="truncate @max-2xl:hidden">{{ r.help }}</AppText>
      </div>
      <div class="h-2 overflow-hidden rounded-full bg-surface-well" role="img" :aria-label="`${r.key}: ${r.value ? Math.round(r.value) : 'no data'}`">
        <div class="h-full rounded-full bg-brand-primary transition-[width] duration-500 ease-out" :style="{ width: `${r.pct}%` }" />
      </div>
      <AppText size="14" weight="semibold" class-list="text-end tabular-nums">{{ r.value ? Math.round(r.value) : '–' }}</AppText>
      <UiBadge class="justify-self-start rounded-md border-0 text-[12px] font-semibold @max-sm:hidden" :style="toneStyle(r.band.tone)">
        {{ r.band.label }}
      </UiBadge>
    </div>
  </div>
</template>
