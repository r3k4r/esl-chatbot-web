<template>
  <div class="relative">
    <div class="absolute -inset-8 rounded-4xl bg-[radial-gradient(closest-side,rgba(245,158,11,0.12),transparent_70%)] pointer-events-none" />
    <div class="rounded-2xl bg-neutral-50 border border-neutral-200/70 shadow-card overflow-hidden transform-[perspective(1800px)_rotateX(6deg)_rotateY(-2deg)] transform-3d">

      <!-- Window chrome -->
      <div class="flex items-center gap-2 px-4 py-2.5 bg-neutral-50 border-b border-neutral-200/70">
        <div class="flex gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-neutral-300" />
          <span class="w-2.5 h-2.5 rounded-full bg-neutral-300" />
          <span class="w-2.5 h-2.5 rounded-full bg-neutral-300" />
        </div>
        <div class="mx-auto text-[11px] text-neutral-500 font-mono flex items-center gap-1.5">
          <Icon icon="lucide:shield" width="10" /> app.tutelage.ai / dashboard
        </div>
      </div>

      <div class="grid grid-cols-12 gap-4 p-5 bg-neutral-50">

        <!-- Sidebar -->
        <aside class="col-span-3 hidden md:flex flex-col gap-1 pe-3 border-e border-neutral-100">
          <div class="flex items-center gap-2 px-2 pb-3">
            <div class="w-7 h-7 rounded-lg bg-brand-ink flex items-center justify-center">
              <Icon icon="lucide:sparkles" width="12" class="text-brand-primary" />
            </div>
            <div class="text-[13px] font-semibold tracking-tight">Tutelage</div>
          </div>
          <div
            v-for="item in sidebarItems"
            :key="item.label"
            class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer"
            :class="item.active ? 'bg-brand-primary/10 text-brand-ink font-medium' : 'text-neutral-500'"
          >
            <Icon :icon="item.icon" width="14" />
            <span>{{ item.label }}</span>
            <span v-if="item.active" class="ms-auto w-1.5 h-1.5 rounded-full bg-brand-primary" />
          </div>
          <div class="mt-auto pt-4 text-[11px] text-neutral-400 px-2">
            <div class="rounded-lg bg-neutral-50 border border-neutral-100 p-2.5">
              <div class="font-medium text-neutral-600 mb-0.5">{{ m.dailyGoal }}</div>
              <div class="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                <div class="h-full w-[68%] bg-brand-primary rounded-full" />
              </div>
              <div class="flex justify-between mt-1 text-[10px]">
                <span>17 min</span><span>25 min</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main -->
        <section class="col-span-12 md:col-span-9 space-y-4">
          <!-- Top bar -->
          <div class="flex items-center justify-between">
            <div>
              <div class="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">{{ m.greeting }}</div>
              <div class="text-lg font-semibold tracking-tight">{{ m.welcome }}</div>
            </div>
            <button class="cursor-pointer hidden sm:flex items-center gap-2 text-[12px] bg-brand-ink text-neutral-50 px-3 py-1.5 rounded-lg">
              <Icon icon="lucide:message-circle" width="13" /> {{ m.newSession }}
            </button>
          </div>

          <!-- Stat cards -->
          <div class="grid grid-cols-4 gap-3">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="rounded-xl border border-neutral-100 bg-neutral-50 p-3"
            >
              <div class="flex items-center justify-between">
                <div class="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">{{ stat.label }}</div>
                <Icon :icon="stat.icon" width="13" class="text-neutral-300" />
              </div>
              <div class="text-[22px] font-semibold tracking-tight mt-1" :class="stat.color">{{ stat.value }}</div>
              <div class="text-[10px] text-neutral-400">{{ stat.sub }}</div>
            </div>
          </div>

          <!-- Chart + chat preview -->
          <div class="grid grid-cols-5 gap-3">
            <!-- Sparkline chart -->
            <div class="col-span-3 rounded-xl border border-neutral-100 p-4">
              <div class="flex items-center justify-between mb-2">
                <div>
                  <div class="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">{{ m.wordsLearned }}</div>
                  <div class="text-base font-semibold tracking-tight">
                    1,248 <span class="text-brand-primary text-[12px] font-medium">+12.4%</span>
                  </div>
                </div>
                <div class="text-[10px] text-neutral-400 font-mono">14d</div>
              </div>
              <svg :viewBox="`0 0 ${chartW} ${chartH}`" class="w-full h-35">
                <defs>
                  <linearGradient id="ag" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%"   stop-color="var(--color-brand-primary)" stop-opacity="0.25" />
                    <stop offset="100%" stop-color="var(--color-brand-primary)" stop-opacity="0" />
                  </linearGradient>
                </defs>
                <path :d="areaPath" fill="url(#ag)" stroke="none" />
                <path :d="linePath" fill="none" stroke="var(--color-brand-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="[stroke-dasharray:400] [stroke-dashoffset:400] animate-[dash_2.2s_ease-out_forwards]" />
                <g>
                  <circle :cx="lastX" :cy="lastY" r="4" fill="var(--color-brand-primary)" />
                  <circle :cx="lastX" :cy="lastY" r="8" fill="var(--color-brand-primary)" opacity="0.15" />
                </g>
              </svg>
              <!-- Heatmap -->
              <div class="mt-3">
                <div class="text-[10px] text-neutral-400 uppercase tracking-wider font-medium mb-1.5">{{ m.consistency }}</div>
                <div class="flex gap-1">
                  <div v-for="(week, i) in heatWeeks" :key="i" class="flex flex-col gap-1">
                    <span
                      v-for="(n, j) in week"
                      :key="j"
                      class="w-3 h-3 rounded-[3px]"
                      :class="heatColor(n)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent session -->
            <div class="col-span-2 rounded-xl border border-neutral-100 p-3 flex flex-col">
              <div class="flex items-center justify-between mb-2">
                <div class="text-[11px] text-neutral-400 uppercase tracking-wider font-medium">{{ m.recentSession }}</div>
                <span class="text-[10px] font-mono text-neutral-400">{{ m.minutesAgo }}</span>
              </div>
              <div class="space-y-2 text-[11px] flex-1">
                <div class="flex gap-1.5">
                  <div class="w-5 h-5 rounded-full bg-linear-to-br from-brand-primary to-brand-accent flex items-center justify-center shrink-0">
                    <Icon icon="lucide:sparkles" width="9" class="text-brand-ink" />
                  </div>
                  <div class="bg-neutral-50 rounded-lg rounded-ss-sm px-2 py-1.5 text-neutral-700">What's a goal you have this month?</div>
                </div>
                <div class="flex justify-end">
                  <div class="bg-brand-ink text-neutral-50 rounded-lg rounded-ee-sm px-2 py-1.5 max-w-[85%]">I want to read two novels in English.</div>
                </div>
                <div class="flex gap-1.5">
                  <div class="w-5 h-5 rounded-full bg-linear-to-br from-brand-primary to-brand-accent flex items-center justify-center shrink-0">
                    <Icon icon="lucide:sparkles" width="9" class="text-brand-ink" />
                  </div>
                  <div class="bg-neutral-50 rounded-lg rounded-ss-sm px-2 py-1.5 text-neutral-700">Ambitious — which novels?</div>
                </div>
              </div>
              <div class="mt-2 pt-2 border-t border-neutral-100 flex items-center justify-between">
                <div class="text-[10px] text-neutral-400">{{ m.turnsAccuracy }}</div>
                <button class="cursor-pointer text-[10px] font-medium text-brand-primary flex items-center gap-0.5">
                  {{ m.continue }} <Icon icon="lucide:arrow-right" width="10" class="rtl:rotate-180" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { t } = useLocale()

const m = computed(() => ({
  greeting:       t('dashboardPreview.mockup.greeting'),
  welcome:        t('dashboardPreview.mockup.welcome'),
  newSession:     t('dashboardPreview.mockup.newSession'),
  dailyGoal:      t('dashboardPreview.mockup.dailyGoal'),
  statLessons:    t('dashboardPreview.mockup.statLessons'),
  statLessonsSub: t('dashboardPreview.mockup.statLessonsSub'),
  statStudyTime:  t('dashboardPreview.mockup.statStudyTime'),
  statStudyTimeSub: t('dashboardPreview.mockup.statStudyTimeSub'),
  statStreak:     t('dashboardPreview.mockup.statStreak'),
  statStreakSub:  t('dashboardPreview.mockup.statStreakSub'),
  statLevel:      t('dashboardPreview.mockup.statLevel'),
  statLevelSub:   t('dashboardPreview.mockup.statLevelSub'),
  wordsLearned:   t('dashboardPreview.mockup.wordsLearned'),
  consistency:    t('dashboardPreview.mockup.consistency'),
  recentSession:  t('dashboardPreview.mockup.recentSession'),
  minutesAgo:     t('dashboardPreview.mockup.minutesAgo'),
  turnsAccuracy:  t('dashboardPreview.mockup.turnsAccuracy'),
  continue:       t('dashboardPreview.mockup.continue'),
}))

// Sparkline
const pts = [12, 18, 14, 22, 19, 28, 24, 32, 30, 38, 35, 44, 42, 52]
const chartW = 520, chartH = 140, pad = 8
const maxV = Math.max(...pts), minV = Math.min(...pts)
const xs = pts.map((_, i) => pad + (i * (chartW - pad * 2)) / (pts.length - 1))
const ys = pts.map(v => chartH - pad - ((v - minV) / (maxV - minV)) * (chartH - pad * 2))
const linePath = xs.map((x, i) => `${i ? 'L' : 'M'}${x},${ys[i]}`).join(' ')
const areaPath = `${linePath} L${chartW - pad},${chartH - pad} L${pad},${chartH - pad} Z`
const lastX = xs[xs.length - 1]
const lastY = ys[ys.length - 1]

const heatWeeks = [
  [1, 2, 3, 4, 2, 0, 0],
  [3, 4, 5, 3, 4, 2, 1],
  [4, 5, 6, 5, 6, 4, 3],
  [5, 6, 7, 6, 5, 7, 6],
]

function heatColor(n: number) {
  if (n === 0) return 'bg-neutral-100'
  if (n <= 2)  return 'bg-brand-primary/20'
  if (n <= 4)  return 'bg-brand-primary/45'
  if (n <= 5)  return 'bg-brand-primary/70'
  return 'bg-brand-primary'
}

const sidebarItems = [
  { label: 'Dashboard', icon: 'lucide:bar-chart-2',    active: true },
  { label: 'Chat',      icon: 'lucide:message-circle', active: false },
  { label: 'Voice Lab', icon: 'lucide:mic',            active: false },
  { label: 'Vocabulary',icon: 'lucide:book-open',      active: false },
  { label: 'Goals',     icon: 'lucide:target',         active: false },
]

// Numbers/icons are structural; labels + subs come from the active locale.
const stats = computed(() => [
  { label: m.value.statLessons,   value: '124', sub: m.value.statLessonsSub,   icon: 'lucide:book-open', color: 'text-neutral-900' },
  { label: m.value.statStudyTime, value: '42h', sub: m.value.statStudyTimeSub, icon: 'lucide:clock',     color: 'text-neutral-900' },
  { label: m.value.statStreak,    value: '23',  sub: m.value.statStreakSub,    icon: 'lucide:flame',     color: 'text-brand-primary' },
  { label: m.value.statLevel,     value: 'B2',  sub: m.value.statLevelSub,     icon: 'lucide:star',      color: 'text-neutral-900' },
])
</script>

<style scoped>
@keyframes dash {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
