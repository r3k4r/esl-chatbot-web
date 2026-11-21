<script setup lang="ts">
// The admin home while it loads: the same cards in the same grid (Admin/AdminDashboard.vue),
// each shaped like what it will hold, so nothing jumps when the numbers arrive.
const BARS = [30, 45, 20, 60, 35, 50, 25, 70, 40, 55, 30, 65, 45, 80, 35, 50, 60, 40, 75, 55, 45, 85, 50, 65, 70, 55, 90, 60, 75, 95]
</script>

<template>
  <div class="space-y-5" aria-busy="true" aria-label="Loading the admin dashboard">
    <!-- Key figures -->
    <div class="dash-card grid grid-cols-2 gap-5 p-5 md:grid-cols-4 md:p-6">
      <div v-for="n in 4" :key="n" class="space-y-2">
        <UiSkeleton class="h-4 w-24" /><UiSkeleton class="h-7 w-14" /><UiSkeleton class="h-3.5 w-28" />
      </div>
    </div>

    <!-- Three charts -->
    <div class="grid gap-5 md-lg:grid-cols-3">
      <div v-for="n in 3" :key="n" class="dash-card p-5">
        <UiSkeleton class="h-4 w-36" />
        <UiSkeleton class="mt-2 h-7 w-20" />
        <div class="mt-3 grid h-28 grid-cols-30 items-end gap-0.5">
          <UiSkeleton v-for="(h, i) in BARS" :key="i" class="w-full rounded-b-none rounded-t-[3px]" :style="{ height: `${h}%` }" />
        </div>
        <div class="mt-1.5 flex justify-between"><UiSkeleton class="h-3.5 w-12" /><UiSkeleton class="h-3.5 w-10" /></div>
      </div>
    </div>

    <!-- Follow up · Newest accounts · Gone quiet -->
    <div class="grid gap-5 md-lg:grid-cols-3">
      <div v-for="n in 3" :key="n" class="dash-card p-5">
        <UiSkeleton class="h-5 w-32" />
        <div v-for="r in 4" :key="r" class="mt-3 flex items-center gap-3">
          <UiSkeleton class="size-8 shrink-0 rounded-full" />
          <div class="flex-1 space-y-1.5"><UiSkeleton class="h-4 w-28" /><UiSkeleton class="h-3.5 w-40 max-w-full" /></div>
        </div>
      </div>
    </div>
  </div>
</template>
