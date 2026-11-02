<script setup lang="ts">
useHead({
  bodyAttrs: { class: 'overflow-x-hidden' },
})

const collapsed = ref(false)
const mobileOpen = ref(false)
</script>

<template>
  <div class="flex h-dvh bg-neutral-50 dark:bg-neutral-900 relative overflow-hidden">
    <LayoutsDashboardSidebar
      :collapsed="collapsed"
      :mobile-open="mobileOpen"
      @toggle="collapsed = !collapsed"
      @close-mobile="mobileOpen = false"
    />

    <div class="flex flex-col flex-1 min-w-0 overflow-hidden">
      <LayoutsDashboardHeader @open-sidebar="mobileOpen = true" />

      <main class="flex-1 min-h-0 overflow-hidden">
        <slot />
      </main>
    </div>
  </div>
</template>
