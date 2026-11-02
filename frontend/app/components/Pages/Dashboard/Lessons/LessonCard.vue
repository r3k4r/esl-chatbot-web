<script setup lang="ts">
import type { Lesson } from '~/common/types/dashboard-types'

defineProps<{ lesson: Lesson; delay?: number }>()
const emit = defineEmits<{ start: [] }>()
</script>

<template>
  <div
    class="dash-card p-5 group hover:-translate-y-0.5 transition-transform cursor-pointer animate-card-enter"
    :style="`--delay:${delay ?? 0}ms`"
    @click="emit('start')"
  >
    <div class="flex items-center justify-between mb-3">
      <span class="text-[10px] uppercase tracking-wider font-semibold text-brand-primary font-poppins">{{ lesson.category }}</span>
      <span
        v-if="lesson.popular"
        class="text-[10px] font-semibold bg-brand-primary/10 text-brand-primary px-1.5 py-0.5 rounded-full flex items-center gap-1 font-poppins"
      >
        <AppIconsax name="Flash" color="#f59e0b" :size="9" />
        Popular
      </span>
    </div>
    <p class="text-[15px] font-semibold text-brand-ink dark:text-white tracking-tight leading-snug font-poppins">
      {{ lesson.title }}
    </p>
    <div class="mt-4 flex items-center justify-between text-[11px] text-zinc-400">
      <div class="flex items-center gap-2 font-poppins">
        <span class="flex items-center gap-1">
          <AppIconsax name="Clock" color="#a1a1aa" :size="11" />
          {{ lesson.minutes }} min
        </span>
        <span>·</span>
        <span>{{ lesson.level }}</span>
      </div>
      <span class="inline-flex items-center gap-0.5 text-brand-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity font-poppins">
        Start <AppIconsax name="ArrowRight" color="#B91C1C" :size="11" />
      </span>
    </div>
  </div>
</template>
