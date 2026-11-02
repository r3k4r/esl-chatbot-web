<script setup lang="ts">
const emit = defineEmits<{ 'open-sidebar': [] }>()
// Staff = admins + tutors. Learner/subscription features are hidden for them.
const { isStaff } = useRole()

const route = useRoute()

const pageTitles: Record<string, string> = {
  '/dashboard': 'Leo Overview',
  '/dashboard/chat': 'AI Speaking Coach',
  '/dashboard/voice': 'Voice Lab',
  '/dashboard/vocab': 'Vocabulary & SRS',
  '/dashboard/goals': 'Learning Milestones',
  '/dashboard/lessons': 'Curriculum Library',
  '/dashboard/profile': 'Student Profile',
  '/dashboard/billing': 'Subscriptions & Billing',
  '/dashboard/users': 'User Management',
  '/dashboard/classes': 'Classes & Cohorts',
}

const pageTitle = computed(() => pageTitles[route.path] ?? 'Dashboard')
const pageSlug = computed(() => pageTitle.value.toLowerCase())
</script>

<template>
  <header
    class="h-16 flex items-center justify-between px-5 sm:px-7 border-b border-black/6 dark:border-white/6 bg-white/70 dark:bg-[#0e0e10]/70 backdrop-blur sticky top-0 z-30 shrink-0">
    <!-- Left: burger (mobile) + breadcrumb -->
    <div class="flex items-center gap-3">
      <!-- Mobile burger -->
      <button
        class="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-brand-ink dark:hover:text-white transition"
        aria-label="Open sidebar" @click="emit('open-sidebar')">
        <AppIconsax name="HambergerMenu" color="currentColor" :size="18" />
      </button>

      <UiBreadcrumb>
        <UiBreadcrumbList class="text-[11px] font-mono flex-nowrap gap-1 sm:gap-1.5 items-center">
          <UiBreadcrumbItem>
            <UiBreadcrumbLink as="span" class="text-zinc-400 cursor-default flex items-center gap-1.5">
              <span class="size-2 rounded-full bg-[#B91C1C]" />
              <span>leo-institute</span>
            </UiBreadcrumbLink>
          </UiBreadcrumbItem>
          <UiBreadcrumbSeparator />
          <UiBreadcrumbItem>
            <UiBreadcrumbPage class="text-brand-ink dark:text-white font-mono text-[11px]">{{ pageSlug }}
            </UiBreadcrumbPage>
          </UiBreadcrumbItem>
        </UiBreadcrumbList>
      </UiBreadcrumb>
    </div>

    <!-- Global search / command palette (md+) -->
    <LayoutsDashboardCommandPalette />

    <!-- Right actions -->
    <div class="flex items-center gap-2">
      <!-- Campus Indicator (Live) -->
      <div class="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[11px] text-zinc-500 font-poppins">
        <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span>Mamostayan Campus</span>
      </div>

      <!-- Notifications -->
      <LayoutsDashboardNotificationBell />

      <!-- New session CTA — learner feature, hidden for staff -->
      <NuxtLink v-if="!isStaff" to="/dashboard/chat">
        <AppButton variant="primary" size="36" radius="8" icon="Messages" :icon-config="{ color: 'white', size: 14 }"
          text="Start AI Coach" class="hidden sm:flex text-[12.5px]!" />
      </NuxtLink>

      <!-- User avatar popup -->
      <BlockUserAvatar />
    </div>
  </header>
</template>
