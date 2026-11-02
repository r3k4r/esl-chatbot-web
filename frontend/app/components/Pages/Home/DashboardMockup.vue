<template>
  <div class="relative">
    <div class="absolute -inset-8 rounded-4xl bg-[radial-gradient(closest-side,rgba(185,28,28,0.12),transparent_70%)] pointer-events-none" />
    <div class="rounded-2xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden transform-[perspective(1800px)_rotateX(6deg)_rotateY(-2deg)] transform-3d">

      <!-- Window chrome -->
      <div class="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <div class="flex gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span class="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400" />
        </div>
        <div class="mx-auto text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
          <Icon icon="lucide:shield-check" width="12" class="text-emerald-500" /> portal.leoinstitute.krd / student-lab
        </div>
      </div>

      <div class="grid grid-cols-12 gap-4 p-5 bg-white">

        <!-- Sidebar -->
        <aside class="col-span-3 hidden md:flex flex-col gap-1 pe-3 border-e border-slate-100">
          <div class="flex items-center gap-2 px-1 pb-3">
            <AppBrandLogo size="sm" :show-subtitle="false" />
          </div>
          <div
            v-for="item in sidebarItems"
            :key="item.label"
            class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer"
            :class="item.active ? 'bg-red-50 text-[#B91C1C] font-semibold' : 'text-slate-500 hover:text-slate-900'"
          >
            <Icon :icon="item.icon" width="14" />
            <span>{{ item.label }}</span>
            <span v-if="item.active" class="ms-auto w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
          </div>
          <div class="mt-auto pt-4 text-[11px] text-slate-400 px-1">
            <div class="rounded-xl bg-slate-50 border border-slate-200/70 p-3">
              <div class="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                <span>{{ m.dailyGoal }}</span>
                <span class="text-xs text-[#B91C1C] font-bold">85%</span>
              </div>
              <div class="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div class="h-full w-[85%] bg-linear-to-r from-[#B91C1C] to-[#F59E0B] rounded-full" />
              </div>
              <div class="flex justify-between mt-1 text-[10px] text-slate-500 font-medium">
                <span>21 min spoke</span><span>25 min target</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main -->
        <section class="col-span-12 md:col-span-9 space-y-4">
          <!-- Top bar -->
          <div class="flex items-center justify-between">
            <div>
              <div class="text-[11px] text-[#B91C1C] uppercase tracking-wider font-bold">{{ m.greeting }}</div>
              <div class="text-lg font-bold tracking-tight text-slate-900">{{ m.welcome }}</div>
            </div>
            <NuxtLink to="/dashboard/chat" class="cursor-pointer hidden sm:flex items-center gap-2 text-[12px] font-semibold bg-[#B91C1C] text-white px-3.5 py-2 rounded-xl shadow-sm hover:bg-[#991B1B] transition">
              <Icon icon="lucide:sparkles" width="14" /> {{ m.newSession }}
            </NuxtLink>
          </div>

          <!-- Stat tiles -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div
              v-for="stat in statCards"
              :key="stat.label"
              class="rounded-xl bg-slate-50 border border-slate-100 p-3"
            >
              <div class="text-[11px] text-slate-500 font-medium">{{ stat.label }}</div>
              <div class="text-xl font-bold tracking-tight text-slate-900 mt-0.5">{{ stat.val }}</div>
              <div class="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <Icon icon="lucide:trending-up" width="10" /> {{ stat.sub }}
              </div>
            </div>
          </div>

          <!-- Two-column split -->
          <div class="grid sm:grid-cols-2 gap-3">
            <div class="rounded-xl bg-slate-50 border border-slate-100 p-3.5 space-y-2">
              <div class="flex items-center justify-between">
                <div class="text-[12px] font-semibold text-slate-800">{{ m.wordsLearned }}</div>
                <span class="text-[10px] text-slate-500 font-mono">148 words</span>
              </div>
              <div class="h-16 flex items-end gap-1.5 pt-2">
                <span
                  v-for="(h, i) in [45, 60, 35, 80, 65, 90, 75]"
                  :key="i"
                  class="flex-1 bg-linear-to-t from-[#1B365D] to-[#B91C1C] rounded-t opacity-90 hover:opacity-100 transition"
                  :style="{ height: `${h}%` }"
                />
              </div>
              <div class="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Sat</span><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span>
              </div>
            </div>

            <div class="rounded-xl bg-slate-50 border border-slate-100 p-3.5 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between">
                  <div class="text-[12px] font-semibold text-slate-800">{{ m.recentSession }}</div>
                  <span class="text-[10px] text-emerald-700 bg-emerald-100/70 font-semibold px-2 py-0.5 rounded-full">
                    {{ m.minutesAgo }}
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 mt-1">Level 1: Ordering Coffee & Croissant at Leo Cafeteria</div>
                <div class="text-[10px] text-slate-400 mt-2 flex items-center gap-2">
                  <Icon icon="lucide:check-circle" width="12" class="text-emerald-500" />
                  <span>{{ m.turnsAccuracy }}</span>
                </div>
              </div>
              <NuxtLink to="/dashboard/chat" class="mt-3 w-full py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-800">
                <span>{{ m.continue }}</span>
                <Icon icon="lucide:arrow-right" width="11" />
              </NuxtLink>
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
  dailyGoal:      t('dashboardPreview.mockup.dailyGoal'),
  greeting:       t('dashboardPreview.mockup.greeting'),
  welcome:        t('dashboardPreview.mockup.welcome'),
  newSession:     t('dashboardPreview.mockup.newSession'),
  wordsLearned:   t('dashboardPreview.mockup.wordsLearned'),
  recentSession:  t('dashboardPreview.mockup.recentSession'),
  minutesAgo:     t('dashboardPreview.mockup.minutesAgo'),
  turnsAccuracy:  t('dashboardPreview.mockup.turnsAccuracy'),
  continue:       t('dashboardPreview.mockup.continue'),
}))

const sidebarItems = [
  { icon: 'lucide:layout-dashboard', label: 'Speaking Lab', active: true },
  { icon: 'lucide:coffee',           label: 'Cafeteria Roleplay' },
  { icon: 'lucide:graduation-cap',   label: 'IELTS Examiner' },
  { icon: 'lucide:smile',            label: 'Leo Kids & Math' },
  { icon: 'lucide:award',            label: 'Certificate' },
]

const statCards = computed(() => [
  { label: t('dashboardPreview.mockup.statLessons'),   val: 'B2 Upper', sub: t('dashboardPreview.mockup.statLessonsSub') },
  { label: t('dashboardPreview.mockup.statStudyTime'), val: '14.2 hrs', sub: t('dashboardPreview.mockup.statStudyTimeSub') },
  { label: t('dashboardPreview.mockup.statStreak'),    val: '18 Days',  sub: t('dashboardPreview.mockup.statStreakSub') },
  { label: t('dashboardPreview.mockup.statLevel'),     val: '94.2%',    sub: t('dashboardPreview.mockup.statLevelSub') },
])
</script>
