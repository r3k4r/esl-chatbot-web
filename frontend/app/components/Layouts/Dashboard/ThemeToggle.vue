<script setup lang="ts">
// Round light/dark switch in the dashboard header.
const { isStaff } = useRole()
const { theme, toggleTheme } = useTheme()

const label = computed(() => (theme.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'))
</script>

<template>
  <!-- Students' choice is also saved on their profile; staff have none, so it stays on this device -->
  <button type="button" class="header-circle-btn overflow-hidden" :aria-label="label" :title="label"
    @click="toggleTheme(!isStaff)">
    <Transition name="theme-icon" mode="out-in">
      <AppIconsax v-if="theme === 'dark'" key="moon" name="Moon" color="currentColor" :size="18" />
      <AppIconsax v-else key="sun" name="Sun1" color="currentColor" :size="18" />
    </Transition>
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
