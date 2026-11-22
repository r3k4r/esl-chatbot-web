<script setup lang="ts">
const emit = defineEmits<{ 'open-sidebar': [] }>()
const { crumbs } = useBreadcrumbs()
</script>

<template>
  <header
    class="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border-card bg-surface-card px-3 sm:px-5">
    <div class="flex min-w-0 items-center gap-2">
      <AppButton variant="ghost" size="36" radius="8" aspect="square" icon="HambergerMenu"
        :icon-config="{ color: 'var(--color-text-body)', size: 20 }"
        class-list="md:hidden shrink-0 hover:bg-surface-raised dark:hover:bg-surface-raised" aria-label="Open menu" data-guide="menu"
        @click="emit('open-sidebar')" />

      <UiBreadcrumb class="min-w-0">
        <UiBreadcrumbList class="flex-nowrap gap-1.5 text-[14px] font-poppins sm:gap-2">
          <template v-for="(crumb, i) in crumbs" :key="crumb.label + i">
            <!-- Phones show only the current page -->
            <UiBreadcrumbItem :class="['min-w-0', crumb.to && 'hidden sm:inline-flex']">
              <UiBreadcrumbLink v-if="crumb.to" as-child>
                <AppLink :to="crumb.to"
                  class="inline-flex items-center gap-1.5 rounded-md text-text-muted transition-colors hover:text-text-heading">
                  <AppIconsax v-if="i === 0" name="Home2" color="currentColor" :size="16" />
                  <span class="truncate">{{ crumb.label }}</span>
                </AppLink>
              </UiBreadcrumbLink>
              <UiBreadcrumbPage v-else class="truncate font-semibold text-text-heading">
                {{ crumb.label }}
              </UiBreadcrumbPage>
            </UiBreadcrumbItem>
            <UiBreadcrumbSeparator v-if="crumb.to" class="hidden text-text-subtle sm:inline-flex" />
          </template>
        </UiBreadcrumbList>
      </UiBreadcrumb>
    </div>

    <!-- Global search / command palette (bar from 1024px, icon below) -->
    <LayoutsDashboardCommandPalette />

    <div class="flex shrink-0 items-center gap-2">
      <LayoutsDashboardThemeToggle />
      <!-- Wrapped so the dashboard guide can point at them (data-guide) -->
      <div data-guide="bell" class="flex"><LayoutsDashboardNotificationBell /></div>
      <div data-guide="account" class="flex"><BlockUserAvatar /></div>
    </div>
  </header>
</template>
