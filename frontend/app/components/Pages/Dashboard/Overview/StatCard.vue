<script setup lang="ts">
import type { StatCard } from '~/common/types/dashboard-types'
defineProps<{ card: StatCard }>()
</script>

<template>
  <div class="dash-card p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
    <div class="flex items-center justify-between">
      <p class="text-[10px] uppercase tracking-[0.18em] text-zinc-400 font-semibold font-poppins">{{ card.label }}</p>
      <div class="size-6 rounded-md bg-[#1B365D]/10 dark:bg-red-500/10 flex items-center justify-center text-[#1B365D] dark:text-red-400">
        <AppIconsax :name="card.icon as any" color="currentColor" :size="13" />
      </div>
    </div>
    <p class="mt-2 text-[26px] font-semibold tracking-[-0.02em] text-brand-ink dark:text-white font-poppins">{{ card.value }}</p>
    <p class="text-[11px] text-zinc-400 mt-0.5 font-mono">{{ card.delta }}</p>
  </div>
</template>
