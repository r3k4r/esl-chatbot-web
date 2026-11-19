<template>
  <!-- The student dashboard as it looks today, with demo data (a still picture: no motion). -->
  <div class="space-y-3 p-3 sm:p-4">
    <!-- Greeting -->
    <div class="flex items-center gap-6 rounded-xl border border-border-card bg-surface-card p-4 sm:p-5">
      <div class="min-w-0 flex-1">
        <div class="text-[12px] text-text-muted">Good morning</div>
        <div class="mt-0.5 text-[19px] font-semibold tracking-tight text-text-heading sm:text-[21px]">Welcome back, Aram.</div>
        <div class="mt-1 text-[13px] text-text-muted">8 more minutes to reach today's goal.</div>
        <div class="mt-3 flex max-w-md items-center gap-2.5 rounded-lg border border-border-card bg-surface-raised px-3 py-2">
          <Icon icon="lucide:book-a" width="15" class="shrink-0 text-brand-primary" />
          <div class="min-w-0">
            <div class="text-[13px] font-medium text-text-heading">12 words are ready to review</div>
            <div class="truncate text-[12px] text-text-muted">A short review keeps them in your memory.</div>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <span class="rounded-lg bg-linear-to-br from-primary-500 to-primary-300 px-3 py-1.5 text-[12px] font-medium text-neutral-50">Review words</span>
          <span class="rounded-lg border border-border-card bg-surface-raised px-3 py-1.5 text-[12px] text-text-body">Start a chat</span>
          <span class="hidden rounded-lg border border-border-card bg-surface-raised px-3 py-1.5 text-[12px] text-text-body sm:inline">Practise speaking</span>
        </div>
      </div>
      <div class="hidden items-center gap-5 sm:flex">
        <div class="relative size-24">
          <svg viewBox="0 0 100 100" class="size-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-well)" stroke-width="9" />
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-brand-primary)" stroke-width="9" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="32" />
          </svg>
          <div class="absolute inset-0 grid place-content-center text-center">
            <span class="text-[19px] font-semibold tabular-nums text-text-heading">17<span class="text-[12px] text-text-muted">/25</span></span>
            <span class="text-[11px] text-text-muted">min today</span>
          </div>
        </div>
        <div class="text-center">
          <div class="mx-auto grid size-11 place-items-center rounded-xl bg-brand-primary/12 text-brand-primary"><Icon icon="lucide:zap" width="18" /></div>
          <div class="mt-1.5 text-[18px] font-semibold text-text-heading">6</div>
          <div class="text-[11px] text-text-muted">day streak</div>
        </div>
      </div>
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
      <div v-for="s in STATS" :key="s.label" class="rounded-xl border border-border-card bg-surface-card p-3.5">
        <div class="flex items-center justify-between text-[12px] text-text-muted">{{ s.label }}<Icon :icon="s.icon" width="13" /></div>
        <div class="mt-1.5 text-[19px] font-semibold tabular-nums text-text-heading">{{ s.value }}</div>
        <div class="text-[11.5px] text-text-muted">{{ s.sub }}</div>
      </div>
    </div>

    <!-- Skills · This week · Class work -->
    <div class="grid gap-3 md:grid-cols-3">
      <div class="rounded-xl border border-border-card bg-surface-card p-4">
        <div class="text-[14px] font-semibold text-text-heading">Skills</div>
        <div class="text-[11.5px] text-text-muted">From your last 40 messages, 23 spoken.</div>
        <div class="mt-3 space-y-2.5">
          <div v-for="k in SKILLS" :key="k.name" class="flex items-center gap-3 text-[12.5px]">
            <span class="w-20 text-text-heading">{{ k.name }}</span>
            <span class="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-well"><span class="block h-full rounded-full bg-brand-primary" :style="{ width: `${k.score}%` }" /></span>
            <span class="w-6 text-end tabular-nums text-text-heading">{{ k.score }}</span>
          </div>
        </div>
      </div>
      <div class="hidden rounded-xl border border-border-card bg-surface-card p-4 sm:block">
        <div class="flex items-baseline justify-between"><span class="text-[14px] font-semibold text-text-heading">This week</span><span class="text-[11.5px] text-text-muted">2 h 10 min</span></div>
        <div class="relative mt-3 flex h-24 items-end justify-between gap-1.5 border-t border-dashed border-border-card pt-0">
          <div v-for="d in WEEK" :key="d.day" class="flex flex-1 flex-col items-center gap-1">
            <span class="w-full max-w-7 rounded-md" :class="d.today ? 'bg-brand-primary' : 'bg-brand-primary/35'" :style="{ height: `${d.min * 2.4}px` }" />
            <span class="text-[11px]" :class="d.today ? 'font-semibold text-text-heading' : 'text-text-muted'">{{ d.day }}</span>
          </div>
        </div>
      </div>
      <div class="hidden rounded-xl border border-border-card bg-surface-card p-4 md:block">
        <div class="text-[14px] font-semibold text-text-heading">Class work</div>
        <div class="mt-2 divide-y divide-border-inner">
          <div v-for="w in TASKS" :key="w.title" class="flex items-center gap-2 py-2">
            <div class="min-w-0 flex-1">
              <div class="truncate text-[12.5px] text-text-heading">{{ w.title }}</div>
              <div class="truncate text-[11px] text-text-muted">{{ w.when }}</div>
            </div>
            <span v-if="w.missing" class="rounded-md bg-status-expired-bg px-1.5 py-0.5 text-[11px] text-status-expired-text">Missing</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

// Demo data for the landing page (a believable B1 learner), in the real dashboard's shapes.
const STATS = [
  { label: 'Words mastered', value: '48', sub: '126 saved · 9 new', icon: 'lucide:book-open' },
  { label: 'Practice this week', value: '2 h 10 min', sub: 'Goal 2 h 55 min', icon: 'lucide:clock' },
  { label: 'Speaking', value: '84', sub: 'Good · 23 spoken', icon: 'lucide:mic' },
  { label: 'Level', value: 'B1', sub: 'Aiming for B2', icon: 'lucide:graduation-cap' },
]
const SKILLS = [
  { name: 'Grammar', score: 78 },
  { name: 'Vocabulary', score: 71 },
  { name: 'Fluency', score: 82 },
  { name: 'Speaking', score: 84 },
]
const WEEK = [
  { day: 'Mon', min: 22 }, { day: 'Tue', min: 31 }, { day: 'Wed', min: 18 }, { day: 'Thu', min: 25 },
  { day: 'Fri', min: 17, today: true }, { day: 'Sat', min: 0 }, { day: 'Sun', min: 0 },
]
const TASKS = [
  { title: 'Describe your neighbourhood', when: 'Sarah’s class · Due Tue' },
  { title: 'Café roleplay recording', when: 'Sarah’s class · Was due Mon', missing: true },
  { title: 'Weekend reading: The Market', when: 'Sarah’s class · Due Sun' },
]
</script>
