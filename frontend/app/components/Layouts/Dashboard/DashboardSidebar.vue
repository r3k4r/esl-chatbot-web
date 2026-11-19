<script setup lang="ts">
import type { DashboardNavItem } from '~/common/types/dashboard-types'
import { useAuthStore } from '~~/stores/auth'

const props = defineProps<{
  collapsed: boolean
  mobileOpen: boolean
}>()
const emit = defineEmits<{ toggle: []; 'close-mobile': [] }>()

const authStore = useAuthStore()
const currentPlan = computed(() => authStore.getUser?.subscription?.plan ?? 'FREE')
const { isAdmin, isStaff } = useRole()

const { getStats } = useVocabulary()
const vocabDueCount = ref<number | undefined>(undefined)

onMounted(async () => {
  // Staff (admins + tutors) don't see the vocab nav item — skip the stats fetch.
  if (isStaff.value) return
  const res = await getStats()
  if (res.success && res.data?.data) {
    vocabDueCount.value = res.data.data.dueToday || undefined
  }
})

const route = useRoute()
watch(() => route.path, () => {
  if (props.mobileOpen) emit('close-mobile')
})

const primaryNav = computed<DashboardNavItem[]>(() => {
  const adminOnly: DashboardNavItem[] = isAdmin.value
    ? [{ id: 'users', label: 'Users', icon: 'People', path: '/dashboard/users' }]
    : []
  // Billing is a personal-subscription page — irrelevant for staff.
  const billing: DashboardNavItem[] = isStaff.value
    ? []
    : [{ id: 'billing', label: 'Billing', icon: 'Wallet2', path: '/dashboard/billing' }]
  // Learner features — hidden for staff.
  const learnerNav: DashboardNavItem[] = isStaff.value
    ? []
    : [
      { id: 'chat', label: 'AI Chat', icon: 'Messages', path: '/dashboard/chat' },
      { id: 'voice', label: 'Voice Lab', icon: 'Microphone', path: '/dashboard/voice' },
      { id: 'vocab', label: 'Vocabulary', icon: 'Book1', path: '/dashboard/vocab', badge: vocabDueCount.value },
      { id: 'goals', label: 'Goals', icon: 'Flag', path: '/dashboard/goals' },
    ]
  return [
    { id: 'dashboard', label: 'Dashboard', icon: 'Home2', path: '/dashboard' },
    ...adminOnly,
    { id: 'classes', label: 'Classes', icon: 'BookSaved', path: '/dashboard/classes' },
    ...learnerNav,
    ...billing,
  ]
})

function isActive(path: string) {
  if (path === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(path)
}

// Clicking the empty part of the collapsed rail opens it (desktop only).
function onRailClick() {
  if (props.collapsed && window.innerWidth >= 768) emit('toggle')
}
</script>

<template>
  <Transition name="backdrop-fade">
    <!-- No backdrop blur: blurring the whole page while the drawer slides makes phones drop frames -->
    <div v-if="mobileOpen" class="fixed inset-0 z-40 bg-black/45 md:hidden"
      @click="emit('close-mobile')" />
  </Transition>

  <!-- Tailwind 4's translate-x-* sets the CSS `translate` property (not `transform`), so the
       transition lists `translate`; transitioning `transform` left the phone drawer jumping open. -->
  <aside
    :class="[
      'fixed inset-y-0 left-0 z-50 flex w-64 flex-col shrink-0 border-r border-border-card bg-surface-card',
      'sidebar-slide transition-[width,translate] md:relative md:z-auto md:translate-x-0',
      collapsed ? 'md:w-17 md:cursor-e-resize' : 'md:w-60',
      mobileOpen ? 'translate-x-0' : '-translate-x-full',
    ]"
    aria-label="Main navigation"
    @click="onRailClick"
  >
    <!-- Brand + collapse control -->
    <div class="flex h-14 shrink-0 items-center gap-2.5 border-b border-border-inner px-3">
      <!-- Mobile always shows the full brand; the collapsed desktop rail shows only the expand button -->
      <AppLink to="/dashboard" :class="['flex min-w-0 items-center gap-2.5 ps-1', collapsed && 'md:hidden']"
        aria-label="Tutelage home" @click.stop>
        <AppImage src="/only-logo-black-border-yellow-bg.svg" alt="" class="size-8 shrink-0" />
        <span class="truncate font-poppins text-[15px] font-semibold tracking-tight text-text-heading">
          Tutelage <span class="text-brand-primary">AI</span>
        </span>
      </AppLink>

      <!-- Desktop collapse / expand -->
      <AppButton variant="ghost" size="36" radius="8" aspect="square" icon="SidebarLeft"
        :icon-config="{ color: 'var(--color-text-muted)', size: 20 }"
        :class-list="['hidden md:flex shrink-0 hover:bg-surface-raised dark:hover:bg-surface-raised', collapsed ? 'mx-auto' : 'ms-auto'].join(' ')"
        :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
        @click.stop="emit('toggle')" />

      <!-- Mobile close -->
      <AppButton variant="ghost" size="36" radius="8" aspect="square" icon="CloseSquare"
        :icon-config="{ color: 'var(--color-text-muted)', size: 20 }"
        class-list="ms-auto md:hidden hover:bg-surface-raised dark:hover:bg-surface-raised"
        aria-label="Close menu" @click="emit('close-mobile')" />
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-3">
      <LayoutsDashboardSidebarItem v-for="item in primaryNav" :key="item.id" :to="item.path" :label="item.label"
        :icon="item.icon" :badge="item.badge" :active="isActive(item.path)" :collapsed="collapsed" />
    </nav>

    <!-- Upgrade card — FREE plan students only, hidden on the collapsed rail -->
    <div v-if="currentPlan === 'FREE' && !isStaff" :class="['shrink-0 px-3 py-3', collapsed && 'md:hidden']">
      <AppLink to="/dashboard/billing" @click.stop
        class="block rounded-xl border border-brand-primary/25 bg-brand-primary/8 p-3.5 transition-colors hover:bg-brand-primary/12">
        <div class="flex items-center gap-1.5">
          <AppIconsax name="Crown1" color="var(--color-brand-primary)" type="bold" :size="16" />
          <AppText size="14" weight="semibold">Free plan</AppText>
        </div>
        <AppText size="14" color="neutral-600" class-list="mt-1 leading-snug dark:text-text-muted">
          More sessions and a smarter tutor.
        </AppText>
        <AppText size="14" weight="semibold" color="brand-primary" class-list="mt-2 inline-flex items-center gap-1">
          Upgrade
          <AppIconsax name="ArrowRight" color="var(--color-brand-primary)" :size="16" />
        </AppText>
      </AppLink>

    </div>
  </aside>
</template>

<style scoped>
/* Phone drawer: a quick, soft-landing slide (iOS sheet curve). Desktop collapse stays brisk. */
.sidebar-slide {
  transition-duration: 300ms;
  transition-timing-function: cubic-bezier(0.32, 0.72, 0, 1);
}
@media (min-width: 768px) {
  .sidebar-slide { transition-duration: 200ms; }
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 300ms cubic-bezier(0.32, 0.72, 0, 1);
}

@media (prefers-reduced-motion: reduce) {
  .sidebar-slide,
  .backdrop-fade-enter-active,
  .backdrop-fade-leave-active { transition-duration: 0ms; }
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}
</style>
