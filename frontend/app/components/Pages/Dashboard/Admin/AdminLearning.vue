<script setup lang="ts">
import type { AdminDashboardData } from '~/common/types/admin-types'
import type { SkillRow } from '~/common/types/dashboard-types'

// How students are doing across the whole platform: the four skills (students who practise)
// and how many sit at each level the AI hears.
const props = defineProps<{ learning: AdminDashboardData['learning'] }>()

const skills = computed<SkillRow[]>(() => [
  { key: 'Grammar', value: props.learning.skills.grammar || null },
  { key: 'Vocabulary', value: props.learning.skills.vocabulary || null },
  { key: 'Fluency', value: props.learning.skills.fluency || null },
  { key: 'Speaking', value: props.learning.skills.speaking || null },
])

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const
const levelRows = computed(() => {
  const max = Math.max(1, ...LEVELS.map(l => props.learning.levels[l] ?? 0))
  return LEVELS.map(l => ({ level: l, n: props.learning.levels[l] ?? 0, pct: Math.round(((props.learning.levels[l] ?? 0) / max) * 100) }))
})
const notMeasured = computed(() => props.learning.levels.NONE ?? 0)
const n = computed(() => props.learning.skills.practisingStudents)
</script>

<template>
  <section aria-labelledby="admin-learning" class="dash-card p-5 md:p-6">
    <AppText id="admin-learning" size="16" weight="semibold">How students are doing</AppText>
    <AppText size="14" color="neutral-400" class-list="mt-1">
      {{ n ? `Average of the ${n} student${n === 1 ? '' : 's'} who practise with the AI tutor.` : 'Appears once students chat with the AI tutor.' }}
    </AppText>
    <PagesDashboardSharedSkillBars :rows="skills" class="mt-5" />

    <div class="mt-6 border-t border-border-inner pt-5">
      <div class="flex items-baseline justify-between gap-3">
        <AppText size="14" weight="medium">Level the AI hears</AppText>
        <AppText v-if="notMeasured" size="13" color="neutral-400">{{ notMeasured }} not measured yet</AppText>
      </div>
      <ul class="mt-3 space-y-2">
        <li v-for="r in levelRows" :key="r.level" class="grid grid-cols-[2rem_minmax(0,1fr)_2rem] items-center gap-3">
          <AppText size="14" weight="medium">{{ r.level }}</AppText>
          <div class="h-2 overflow-hidden rounded-full bg-surface-well" role="img" :aria-label="`${r.level}: ${r.n} students`">
            <div class="h-full rounded-full bg-brand-primary transition-[width] duration-500 ease-out" :style="{ width: `${r.pct}%` }" />
          </div>
          <AppText size="14" class-list="text-end tabular-nums" :color="r.n ? 'black' : 'neutral-400'">{{ r.n }}</AppText>
        </li>
      </ul>
    </div>
  </section>
</template>
