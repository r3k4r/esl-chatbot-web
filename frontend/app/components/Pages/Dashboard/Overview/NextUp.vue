<script setup lang="ts">
import type { UpcomingLesson } from '~/common/types/dashboard-types'

defineProps<{
  recommended: UpcomingLesson
  upcoming: UpcomingLesson[]
}>()

const emit = defineEmits<{ startLesson: [] }>()
</script>

<template>
  <div class="dash-card p-5 flex flex-col">
    <div class="flex items-center justify-between">
      <AppText size="10" color="neutral-400" weight="semibold" uppercase class="tracking-[0.18em] font-poppins">
        Next up
      </AppText>
      <AppText size="10" color="brand-primary" class="font-mono">AI suggested</AppText>
    </div>

    <!-- Recommended card -->
    <div class="mt-3 p-4 rounded-xl bg-linear-to-br from-brand-primary/8 to-transparent border border-brand-primary/20 relative overflow-hidden">
      <div class="absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-brand-primary/20 blur-2xl pointer-events-none" />
      <div class="relative">
        <div class="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-brand-primary font-semibold font-poppins">
          <AppIconsax name="Flash" color="#B91C1C" :size="11" />
          Recommended
        </div>
        <AppText size="15" weight="semibold" color="brand-ink" class="mt-1 leading-snug font-poppins">
          {{ recommended.title }}
        </AppText>
        <AppText size="12" color="neutral-400" class="mt-1 font-poppins">
          Your practice shows growth — let's level it up.
        </AppText>
        <div class="mt-3 flex items-center gap-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-poppins">
          <span class="flex items-center gap-1">
            <AppIconsax name="Clock" color="currentColor" :size="11" />
            {{ recommended.minutes }} min
          </span>
          <span>·</span>
          <span>{{ recommended.level }}</span>
          <span>·</span>
          <span>{{ recommended.tag }}</span>
        </div>
        <AppButton
          variant="primary"
          size="36"
          radius="8"
          icon="ArrowRight"
          :icon-config="{
            color:'white'
          }"
          icon-position="end"
          text="Start lesson"
          class="mt-3 w-full"
          @click="emit('startLesson')"
        />
      </div>
    </div>

    <!-- Upcoming list -->
    <div class="mt-4 space-y-1 flex-1">
      <button
        v-for="lesson in upcoming"
        :key="lesson.title"
        class="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-white/3 transition text-left"
      >
        <div class="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-zinc-500 dark:text-zinc-400 shrink-0">
          <AppIconsax :name="lesson.icon as any" color="currentColor" :size="14" />
        </div>
        <div class="flex-1 min-w-0">
          <AppText size="12" weight="medium" color="brand-ink" class="truncate font-poppins">{{ lesson.title }}</AppText>
          <AppText size="10" color="neutral-400" class="font-mono">{{ lesson.tag }} · {{ lesson.minutes }} min · {{ lesson.level }}</AppText>
        </div>
        <AppIconsax name="ArrowRight" color="#d4d4d8" :size="12" />
      </button>
    </div>
  </div>
</template>
