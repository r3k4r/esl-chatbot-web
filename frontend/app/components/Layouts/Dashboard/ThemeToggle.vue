<script setup lang="ts">
// Round light/dark switch in the dashboard header. The choice stays on this device;
// until it is used, the system's light/dark setting applies.
const { theme, toggleTheme } = useTheme()

const label = computed(() => (theme.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'))
</script>

<template>
  <button type="button" class="header-circle-btn overflow-hidden" :aria-label="label" :title="label"
    @click="toggleTheme">
    <!-- The saved theme lives in this browser only, so the server can't know which icon to
         draw; rendering it on the server half-patched the SVG into a bare circle on reload. -->
    <ClientOnly>
      <Transition name="theme-icon" mode="out-in">
        <AppIconsax v-if="theme === 'dark'" key="moon" name="Moon" color="currentColor" :size="18" />
        <AppIconsax v-else key="sun" name="Sun1" color="currentColor" :size="18" />
      </Transition>
      <template #fallback><span class="size-4.5" /></template>
    </ClientOnly>
  </button>
</template>

<style scoped>
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-90deg) scale(0.8);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(90deg) scale(0.8);
}

@media (prefers-reduced-motion: reduce) {
  .theme-icon-enter-active,
  .theme-icon-leave-active {
    transition: none;
  }
}
</style>
