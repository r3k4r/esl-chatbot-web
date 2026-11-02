<script setup lang="ts">
import type { DueWord } from '~/common/types/dashboard-types'

defineProps<{
  words: DueWord[]
  totalDue: number
  levelPct: number
}>()

const emit = defineEmits<{ startReview: [] }>()

const levelLabels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
</script>

<template>
  <div class="dash-card p-5 flex flex-col">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-[11px] uppercase tracking-[0.18em] text-zinc-400 font-semibold font-poppins">Due for review</p>
        <p class="mt-1 text-[13px] text-zinc-500 dark:text-zinc-400 font-poppins">
          <span class="text-brand-primary font-medium">{{ totalDue }} cards</span> waiting
        </p>
      </div>
      <button
        class="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[#B91C1C] text-white hover:bg-red-700 transition font-poppins cursor-pointer"
        @click="emit('startReview')"
      >
        Start
      </button>
    </div>

    <div class="mt-4 space-y-2 flex-1">
      <div
        v-for="(item, i) in words"
        :key="item.word"
        class="p-3 rounded-lg bg-zinc-50 dark:bg-white/3 border border-black/4 dark:border-white/4 animate-card-enter"
        :style="`--delay:${i * 60}ms`"
      >
        <div class="flex items-center justify-between">
          <p class="text-[13px] font-semibold text-brand-ink dark:text-white font-poppins">{{ item.word }}</p>
          <p class="text-[10px] text-zinc-400 font-mono">{{ item.due }}</p>
        </div>
        <p class="text-[11.5px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug font-poppins">{{ item.meaning }}</p>
      </div>
    </div>

    <!-- Level progress -->
    <div class="mt-4 pt-4 border-t border-black/5 dark:border-white/5">
      <p class="text-[11px] uppercase tracking-[0.18em] text-zinc-400 font-semibold font-poppins">Level progress</p>
      <div class="mt-3 flex items-center justify-between text-[11px] font-mono">
        <span
          v-for="lbl in levelLabels"
          :key="lbl"
          :class="lbl === 'B2' ? 'text-brand-primary font-semibold' : 'text-zinc-400'"
        >{{ lbl }}</span>
      </div>
      <div class="mt-1.5 h-2 rounded-full bg-zinc-100 dark:bg-white/5 overflow-hidden relative">
        <div
          class="h-full bg-linear-to-r from-[#1B365D] to-[#B91C1C] rounded-full animate-fill-bar"
          :style="`width:${levelPct}%; --delay:600ms`"
        />
        <div
          class="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white border-2 border-brand-primary shadow"
          :style="`left:${levelPct}%`"
        />
      </div>
      <p class="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400 font-poppins">
        <span class="font-medium text-brand-ink dark:text-white">{{ 100 - levelPct }}% to go</span> to reach C1.
      </p>
    </div>
  </div>
</template>
