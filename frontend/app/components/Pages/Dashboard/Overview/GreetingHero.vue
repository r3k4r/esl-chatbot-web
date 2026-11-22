<script setup lang="ts">
import type { LearnerNextStep, LearnerToday } from '~/common/types/dashboard-overview-types'
import type { SvgBasedIconName } from '~/common/types/iconsax-types'
import { useAuthStore } from '~~/stores/auth'

// The learner's welcome: greeting, how today's goal is going, the one next step as the main
// button (plus two quick ways to practise), and the goal ring + live streak on the right.
const props = defineProps<{ today: LearnerToday; next: LearnerNextStep; vocabDue: number }>()

const user = computed(() => useAuthStore().getUser)
const name = computed(() => user.value?.displayName?.split(' ')[0] || user.value?.username || '')
const greeting = computed(() => {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
})

const goal = computed(() => props.today.dailyGoalMinutes)
const left = computed(() => Math.max(0, goal.value - props.today.minutes))
const goalLine = computed(() => {
  if (!left.value) return "You reached today's goal. Anything more is a bonus."
  if (!props.today.minutes) return `Your goal today is ${goal.value} minutes of practice.`
  return `${left.value} more minutes to reach today's goal.`
})

// Quick actions, minus whatever the main button already does.
const quick = computed(() => ([
  { text: 'Start a chat', to: '/dashboard/chat', icon: 'Messages' },
  { text: 'Practise speaking', to: '/dashboard/voice', icon: 'Microphone2' },
  ...(props.vocabDue ? [{ text: `Review ${props.vocabDue} ${props.vocabDue === 1 ? 'word' : 'words'}`, to: '/dashboard/vocab', icon: 'Book1' }] : []),
] as { text: string; to: string; icon: SvgBasedIconName }[]).filter(a => a.to !== props.next.to).slice(0, 2))

const R = 48
const circumference = 2 * Math.PI * R
const offset = computed(() => circumference * (1 - Math.min(1, props.today.minutes / Math.max(1, goal.value))))
</script>

<template>
  <section aria-labelledby="hero-title" class="dash-card relative overflow-hidden">
    <div class="dot-bg pointer-events-none absolute inset-0" aria-hidden="true" />
    <div class="pointer-events-none absolute -end-14 -top-24 size-72 rounded-full bg-brand-primary/15 blur-3xl" aria-hidden="true" />

    <div class="relative flex flex-col gap-8 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
      <div class="min-w-0">
        <AppText size="14" color="neutral-400">{{ greeting }}</AppText>
        <AppText id="hero-title" size="32" weight="semibold" font-family="poppins" class-list="mt-1 leading-tight tracking-tight">
          Welcome back{{ name ? `, ${name}` : '' }}.
        </AppText>
        <AppText size="15" color="neutral-600" class-list="mt-2">{{ goalLine }}</AppText>

        <div class="mt-5 flex max-w-xl items-start gap-3 rounded-xl border border-border-inner bg-surface-raised/60 px-4 py-3">
          <AppIconsax :name="next.icon" :size="20" color="var(--color-brand-primary)" class="mt-0.5 shrink-0" />
          <div class="min-w-0">
            <AppText size="14" weight="semibold">{{ next.title }}</AppText>
            <AppText size="14" color="neutral-400">{{ next.detail }}</AppText>
          </div>
        </div>

        <div class="mt-5 flex flex-wrap items-center gap-2">
          <AppButton variant="primary" size="38" radius="8" :to="next.to" :text="next.action" :icon="next.icon" :icon-config="{ color: 'white', size: 18 }" class-list="px-4" />
          <AppButton v-for="a in quick" :key="a.to" variant="secondary" size="38" radius="8" :to="a.to" :text="a.text" :icon="a.icon" :icon-config="{ size: 18 }" class-list="px-4" />
        </div>
      </div>

      <div class="flex shrink-0 items-center gap-6">
        <div class="relative size-32" role="progressbar" :aria-valuenow="today.minutes" aria-valuemin="0" :aria-valuemax="goal" aria-label="Minutes practised today">
          <svg viewBox="0 0 120 120" class="size-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" :r="R" fill="none" stroke-width="10" style="stroke:var(--surface-well)" />
            <circle cx="60" cy="60" :r="R" fill="none" stroke-width="10" stroke-linecap="round"
              :stroke-dasharray="circumference" :stroke-dashoffset="offset"
              class="transition-[stroke-dashoffset] duration-700 ease-out" style="stroke:var(--color-brand-primary)" />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <AppText size="24" weight="semibold" font-family="poppins" class-list="leading-none tabular-nums">
              {{ Math.min(today.minutes, goal) }}<span class="text-[14px] font-normal text-text-muted">/{{ goal }}</span>
            </AppText>
            <AppText size="13" color="neutral-400" class-list="mt-1">min today</AppText>
          </div>
        </div>

        <div class="text-center">
          <span class="inline-grid size-16 place-items-center rounded-2xl border"
            :class="today.streak ? 'border-brand-primary/20 bg-brand-primary/12' : 'border-border-inner bg-surface-well'">
            <AppIconsax name="Flash" :size="26" :type="today.streak ? 'bold' : 'linear'"
              :color="today.streak ? 'var(--color-brand-primary)' : 'var(--color-text-subtle)'" />
          </span>
          <AppText size="22" weight="semibold" font-family="poppins" class-list="mt-2 leading-none tabular-nums">{{ today.streak }}</AppText>
          <AppText size="13" color="neutral-400" class-list="mt-1">day streak</AppText>
          <AppText v-if="today.longestStreak > today.streak" size="13" color="neutral-400">best {{ today.longestStreak }}</AppText>
        </div>
      </div>
    </div>
  </section>
</template>
