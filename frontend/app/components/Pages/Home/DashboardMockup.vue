<template>
  <div class="relative" aria-hidden="true">
    <div class="pointer-events-none absolute -inset-10 rounded-4xl bg-[radial-gradient(closest-side,rgba(245,158,11,0.16),transparent_70%)]" />
    <!-- Today's dashboard in a browser window, set at a fixed angle (turned slightly to the side) -->
    <div class="dm-frame relative overflow-hidden rounded-2xl border border-border-card bg-surface-page text-start shadow-[0_50px_100px_-40px_rgba(17,17,17,0.45)]" dir="ltr">
      <!-- Window bar -->
      <div class="flex items-center gap-2 border-b border-border-card bg-surface-card px-4 py-2.5">
        <span class="flex gap-1.5"><span v-for="d in 3" :key="d" class="size-2.5 rounded-full bg-surface-well" /></span>
        <span class="mx-auto flex items-center gap-1.5 text-[11px] text-text-subtle">
          <Icon icon="lucide:lock" width="10" /> ai.tutelage.krd/dashboard
        </span>
      </div>

      <div class="flex">
        <!-- Sidebar (from 768px) -->
        <aside class="hidden w-48 shrink-0 flex-col gap-0.5 border-e border-border-card bg-surface-card p-3 md:flex">
          <div class="mb-3 flex items-center gap-2 px-1.5">
            <AppImage src="/only-logo-black-border-yellow-bg.svg" alt="" width="24" height="24" class="size-6" />
            <span class="text-[14px] font-semibold text-text-heading">Tutelage <span class="text-brand-primary">AI</span></span>
          </div>
          <div
            v-for="item in NAV" :key="item.label"
            class="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px]"
            :class="item.active ? 'bg-brand-primary/10 font-medium text-text-heading' : 'text-text-body'"
          >
            <Icon :icon="item.icon" width="15" :class="item.active ? 'text-brand-primary' : ''" />
            <span class="flex-1">{{ item.label }}</span>
            <span v-if="item.badge" class="rounded-md bg-brand-primary px-1.5 text-[11px] font-semibold text-neutral-50">{{ item.badge }}</span>
          </div>
        </aside>

        <div class="min-w-0 flex-1">
          <!-- Header -->
          <div class="flex items-center gap-3 border-b border-border-card bg-surface-card px-4 py-2.5">
            <span class="text-[13px] font-medium text-text-heading">Dashboard</span>
            <span class="mx-auto hidden w-64 items-center gap-2 rounded-lg bg-surface-raised px-3 py-1.5 text-[12px] text-text-subtle sm:flex">
              <Icon icon="lucide:search" width="13" /> Search users, classes, words…
            </span>
            <span class="ms-auto flex items-center gap-2 sm:ms-0">
              <span class="grid size-7 place-items-center rounded-full border border-border-card text-text-body"><Icon icon="lucide:sun" width="13" /></span>
              <span class="grid size-7 place-items-center rounded-full border border-border-card text-text-body"><Icon icon="lucide:bell" width="13" /></span>
              <span class="grid size-7 place-items-center rounded-full bg-linear-to-br from-brand-primary to-[#b45309] text-[12px] font-semibold text-neutral-50">A</span>
            </span>
          </div>
          <PagesHomeDashboardMockupBody />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const NAV = [
  { label: 'Dashboard', icon: 'lucide:house', active: true },
  { label: 'Classes', icon: 'lucide:book-open' },
  { label: 'AI Chat', icon: 'lucide:messages-square' },
  { label: 'Voice Lab', icon: 'lucide:mic' },
  { label: 'Vocabulary', icon: 'lucide:book-a', badge: 12 },
  { label: 'Goals', icon: 'lucide:flag' },
]
</script>

<style scoped>
/* A still product shot: tipped back a little, square to the screen (no sideways turn). */
.dm-frame {
  transform: perspective(1800px) rotateX(6deg);
  transform-style: preserve-3d;
}
@media (max-width: 767px) {
  .dm-frame { transform: perspective(1200px) rotateX(4deg); }
}
</style>
