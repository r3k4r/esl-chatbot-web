<script setup lang="ts">
// The admin Learning and Revenue pages while they load: cards in their grid with text-shaped lines.
// `wide` puts a two-column card first in each row (Learning); without it, three equal cards (Revenue).
defineProps<{ wide?: boolean }>()
</script>

<template>
  <div class="space-y-5" aria-busy="true" aria-label="Loading">
    <div v-for="row in (wide ? 2 : 1)" :key="row" class="grid gap-5 xl:grid-cols-3">
      <div v-for="n in (wide ? 2 : 3)" :key="n" :class="['dash-card space-y-4 p-5 md:p-6', wide && n === (row === 1 ? 1 : 2) && 'xl:col-span-2']">
        <UiSkeleton class="h-5 w-36" />
        <UiSkeleton class="h-4 w-56 max-w-full" />
        <div v-for="r in 5" :key="r" class="flex items-center justify-between gap-4">
          <UiSkeleton class="h-4 w-2/5" /><UiSkeleton class="h-2 w-1/3 rounded-full" /><UiSkeleton class="h-4 w-8" />
        </div>
      </div>
    </div>
  </div>
</template>
