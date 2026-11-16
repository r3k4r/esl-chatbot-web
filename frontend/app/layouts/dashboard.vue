<script setup lang="ts">
useHead({
  bodyAttrs: { class: 'overflow-x-hidden' },
})

const route = useRoute()

// The user's own choice, remembered across visits (a cookie, so SSR renders it right).
const pinnedCollapsed = useCookie<boolean>('sidebar-collapsed', { default: () => false })
const collapsed = ref(pinnedCollapsed.value)
const mobileOpen = ref(false)

// A page that needs the width (chat) folds the sidebar to icons on entry;
// leaving it puts back the user's own choice.
watch(
  () => !!route.meta.collapseSidebar,
  (fold) => { collapsed.value = fold || pinnedCollapsed.value },
  { immediate: true },
)

function toggle() {
  collapsed.value = !collapsed.value
  if (!route.meta.collapseSidebar) pinnedCollapsed.value = collapsed.value
}
</script>

<template>
  <div class="flex h-dvh overflow-hidden bg-surface-page">
    <LayoutsDashboardSidebar
      :collapsed="collapsed"
      :mobile-open="mobileOpen"
      @toggle="toggle"
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
