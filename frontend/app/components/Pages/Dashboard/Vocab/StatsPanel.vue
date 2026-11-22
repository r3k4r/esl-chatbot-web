<script setup lang="ts">
import type { VocabularyStats } from '~/common/types/vocabulary-types'

const props = defineProps<{ stats: VocabularyStats | null }>()

const forecast = computed(() => [
  { label: 'New',     value: props.stats?.byMasteryLevel.new ?? 0, cls: 'text-emerald-500' },
  { label: 'Due',     value: props.stats?.dueToday ?? 0,           cls: 'text-brand-primary' },
  { label: 'Saved',   value: props.stats?.total ?? 0,              cls: 'text-text-heading' },
])

const masteryRows = computed(() => {
  const b = props.stats?.byMasteryLevel
  const total = props.stats?.total || 1
  const rows = [
    { label: 'Seen',       value: b?.seen ?? 0,       color: 'bg-sky-500',     desc: '1-day interval' },
    { label: 'Learning',   value: b?.learning ?? 0,   color: 'bg-amber-500',   desc: '≤ 3-day interval' },
    { label: 'Familiar',   value: b?.familiar ?? 0,   color: 'bg-violet-500',  desc: '≤ 7-day interval' },
    { label: 'Proficient', value: b?.proficient ?? 0, color: 'bg-emerald-500', desc: '≤ 21-day interval' },
    { label: 'Mastered',   value: b?.mastered ?? 0,   color: 'bg-brand-primary', desc: '> 21-day interval' },
  ]
  return rows.map((r) => ({ ...r, pct: Math.round((r.value / total) * 100) }))
})
</script>

<template>
  <div class="space-y-4">
    <!-- Today's forecast -->
    <div class="dash-card p-5 animate-card-enter" style="--delay:80ms">
      <p class="text-[14px] font-semibold font-poppins mb-3" style="color:var(--text-heading)">Today's forecast</p>
      <div class="grid grid-cols-3 gap-2 text-center">
        <div v-for="f in forecast" :key="f.label" class="p-3 rounded-xl" style="background:var(--surface-raised)">
          <p :class="['text-[24px] font-semibold tracking-tight font-poppins', f.cls]">{{ f.value }}</p>
          <p class="text-[14px] font-medium font-poppins mt-0.5" style="color:var(--text-muted)">{{ f.label }}</p>
        </div>
      </div>
    </div>

    <!-- Mastery breakdown -->
    <div class="dash-card p-5 animate-card-enter" style="--delay:160ms">
      <div class="flex items-center justify-between mb-4">
        <p class="text-[14px] font-semibold font-poppins" style="color:var(--text-heading)">Mastery breakdown</p>
        <p class="text-[14px] font-mono" style="color:var(--text-muted)">+{{ stats?.learnedThisWeek ?? 0 }} this week</p>
      </div>
      <div class="space-y-3.5">
        <div v-for="m in masteryRows" :key="m.label">
          <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-2">
              <div :class="['size-2 rounded-full shrink-0', m.color]" />
              <span class="text-[14px] font-medium font-poppins" style="color:var(--text-body)">{{ m.label }}</span>
            </div>
            <span class="text-[14px] font-mono font-semibold" style="color:var(--text-heading)">{{ m.value }}</span>
          </div>
          <div class="h-2 rounded-full overflow-hidden" style="background:var(--surface-raised)">
            <div
              :class="['h-full rounded-full transition-all duration-500', m.color]"
              :style="`width:${m.pct}%`"
            />
          </div>
        </div>
      </div>

      <!-- How mastery works — follows the backend SM-2 intervals exactly -->
      <div class="mt-4 p-3 rounded-xl" style="background:var(--surface-raised);border:1px solid var(--border-inner)">
        <p class="text-[14px] font-medium font-poppins mb-1" style="color:var(--text-muted)">How mastery grows</p>
        <p class="text-[14px] font-poppins leading-relaxed" style="color:var(--text-subtle)">
          Each correct review extends the interval. Rate cards daily to reach Mastered (21+ day interval) over weeks.
        </p>
      </div>
    </div>
  </div>
</template>
