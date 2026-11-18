<script setup lang="ts">
import type { Lesson, LessonCategory } from '~/common/types/dashboard-types'

definePageMeta({ layout: 'dashboard', requiresAuth: true })

const allLessons: Lesson[] = [
  { title: 'Job interview: strengths & weaknesses',  category: 'Business',     minutes: 20, level: 'B2', popular: true },
  { title: 'Small-talk at work',                     category: 'Business',     minutes: 15, level: 'B2' },
  { title: 'Present perfect vs past simple',         category: 'Grammar',      minutes: 18, level: 'B1' },
  { title: 'Ordering food at a restaurant',          category: 'Real-life',    minutes: 10, level: 'A2' },
  { title: 'The "TH" sound, once and for all',       category: 'Pronunciation',minutes: 12, level: 'A2' },
  { title: 'Discussing the news politely',           category: 'Real-life',    minutes: 15, level: 'B2' },
  { title: 'IELTS speaking part 2 practice',         category: 'Exams',        minutes: 25, level: 'B2', popular: true },
  { title: 'Travel: asking for directions',          category: 'Travel',       minutes: 10, level: 'A2' },
  { title: 'Conditionals in everyday speech',        category: 'Grammar',      minutes: 18, level: 'B1' },
]

const activeCategory = ref<LessonCategory>('All')
const search = ref('')

const filtered = computed(() => {
  let list = activeCategory.value === 'All'
    ? allLessons
    : allLessons.filter(l => l.category === activeCategory.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(l => l.title.toLowerCase().includes(q))
  }
  return list
})
</script>

<template>
  <div class="h-full overflow-y-auto page-padding space-y-5">
    <!-- Header + search -->
    <div class="flex items-end justify-between flex-wrap gap-3 animate-card-enter" style="--delay:0ms">
      <div>
        <h1 class="text-[28px] font-semibold tracking-[-0.02em] text-brand-ink dark:text-white font-poppins">Lesson library</h1>
        <p class="text-[14px] text-zinc-500 dark:text-zinc-400 mt-1 font-poppins">
          Curated lessons — pick a topic, we'll drive the session.
        </p>
      </div>
      <div class="relative w-full sm:w-64">
        <AppIconsax name="SearchNormal" color="#a1a1aa" :size="13" class="absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="search"
          placeholder="Search lessons"
          class="w-full pl-8 pr-3 py-2 text-[12.5px] rounded-lg bg-white dark:bg-[#151517] border border-black/6 dark:border-white/6 outline-none focus:border-brand-primary/40 text-brand-ink dark:text-white font-poppins"
        />
      </div>
    </div>

    <!-- Category pills -->
    <div class="animate-card-enter" style="--delay:80ms">
      <PagesDashboardLessonsCategoryFilter v-model="activeCategory" />
    </div>

    <!-- Lesson cards -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <PagesDashboardLessonsLessonCard
        v-for="(lesson, i) in filtered"
        :key="lesson.title"
        :lesson="lesson"
        :delay="160 + i * 40"
        @start="() => {}"
      />
    </div>

    <!-- Empty state -->
    <div
      v-if="filtered.length === 0"
      class="text-center py-16 animate-card-enter"
      style="--delay:160ms"
    >
      <AppIconsax name="SearchNormal" color="#d4d4d8" :size="40" class="mx-auto" />
      <p class="mt-3 text-[14px] text-zinc-400 font-poppins">No lessons match "{{ search }}"</p>
    </div>
  </div>
</template>
