<script setup lang="ts">
import type { Lesson, LessonCategory } from '~/common/types/dashboard-types'

definePageMeta({ layout: 'dashboard', requiresAuth: true })

const router = useRouter()

const allLessons: Lesson[] = [
  { title: 'Ordering food at the Leo Campus Cafeteria', category: 'Real-life', minutes: 10, level: 'A2', popular: true },
  { title: 'Azadi Park directions & Sulaymaniyah small talk', category: 'Travel', minutes: 12, level: 'A2', popular: true },
  { title: 'IELTS Speaking Part 2: Cue card & 2-min speech', category: 'Exams', minutes: 25, level: 'B2', popular: true },
  { title: 'Job interview: strengths, weaknesses & career goals', category: 'Business', minutes: 20, level: 'B2', popular: true },
  { title: 'IELTS Speaking Part 1: Hometown, family & studies', category: 'Exams', minutes: 15, level: 'B1' },
  { title: 'IELTS Speaking Part 3: Abstract debate & opinion', category: 'Exams', minutes: 20, level: 'C1', popular: true },
  { title: 'Present perfect vs past simple in daily stories', category: 'Grammar', minutes: 18, level: 'B1' },
  { title: 'The English "TH" & "V/W" sounds for Kurdish speakers', category: 'Pronunciation', minutes: 12, level: 'A2' },
  { title: 'Professional workplace email & polite requests', category: 'Business', minutes: 15, level: 'B2' },
  { title: 'Conditionals in everyday speech (If I had...)', category: 'Grammar', minutes: 18, level: 'B1' },
  { title: 'Discussing global news & local events politely', category: 'Real-life', minutes: 15, level: 'B2' },
  { title: 'Airport check-in, customs & travel logistics', category: 'Travel', minutes: 15, level: 'B1' },
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

function startLesson(lesson: Lesson) {
  router.push({ path: '/dashboard/chat', query: { topic: lesson.title } })
}
</script>

<template>
  <div class="h-full overflow-y-auto p-5 sm:p-7 space-y-5">
    <!-- Header + search -->
    <div class="flex items-end justify-between flex-wrap gap-4 animate-card-enter" style="--delay:0ms">
      <div>
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#B91C1C]/10 border border-[#B91C1C]/20 mb-2">
          <img src="/leo-logo.jpg" alt="Leo" class="size-3.5 rounded-full object-cover" />
          <span class="text-[10px] font-semibold text-[#B91C1C] dark:text-red-400 uppercase tracking-widest font-poppins">
            Leo Institute Curriculum · مامۆستایان
          </span>
        </div>
        <h1 class="text-[28px] font-semibold tracking-[-0.02em] text-brand-ink dark:text-white font-poppins">
          Curriculum &amp; Scenario Library
        </h1>
        <p class="text-[14px] text-zinc-500 dark:text-zinc-400 mt-1 font-poppins max-w-xl">
          Curated speaking scenarios mapped to Leo Institute courses. Click any lesson to launch 24/7 AI roleplay.
        </p>
      </div>
      <div class="relative w-full sm:w-72">
        <AppIconsax name="SearchNormal" color="#a1a1aa" :size="13" class="absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          v-model="search"
          placeholder="Search Leo lessons & scenarios…"
          class="w-full pl-8 pr-3 py-2 text-[12.5px] rounded-lg bg-white dark:bg-[#151517] border border-black/6 dark:border-white/6 outline-none focus:border-[#B91C1C]/50 text-brand-ink dark:text-white font-poppins"
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
        @start="startLesson(lesson)"
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
