<script setup lang="ts">
import type { DashboardNavItem } from '~/common/types/dashboard-types'
import { useAuthStore } from '~~/stores/auth'

const props = defineProps<{
  collapsed: boolean
  mobileOpen: boolean
}>()

const emit = defineEmits<{
  'close-mobile': []
  'toggle': []
}>()

const route = useRoute()
const authStore = useAuthStore()
const { isAdmin, isStaff } = useRole()
const { getStats } = useVocabulary()

const vocabDueCount = ref<number | undefined>(undefined)

onMounted(async () => {
  if (isStaff.value) return
  const res = await getStats()
  if (res.success && res.data?.data) {
    vocabDueCount.value = res.data.data.dueToday || undefined
  }
})

watch(() => route.path, () => {
  if (props.mobileOpen) emit('close-mobile')
})

const primaryNav = computed<DashboardNavItem[]>(() => {
  const adminOnly: DashboardNavItem[] = isAdmin.value
    ? [{ id: 'users', label: 'Users & Staff', icon: 'People', path: '/dashboard/users' }]
    : []

  const billing: DashboardNavItem[] = isStaff.value
    ? []
    : [{ id: 'billing', label: 'Billing & Plans', icon: 'Wallet2', path: '/dashboard/billing' }]

  const learnerNav: DashboardNavItem[] = isStaff.value
    ? []
    : [
      { id: 'chat', label: 'LEO AI Coach', icon: 'Messages', path: '/dashboard/chat' },
      { id: 'voice', label: 'Voice Lab', icon: 'Microphone', path: '/dashboard/voice' },
      { id: 'lessons', label: 'Curriculum & Lessons', icon: 'Teacher', path: '/dashboard/lessons' },
      { id: 'vocab', label: 'Vocabulary & SRS', icon: 'Book1', path: '/dashboard/vocab', badge: vocabDueCount.value },
      { id: 'goals', label: 'Learning Goals', icon: 'Flag', path: '/dashboard/goals' },
    ]

  return [
    { id: 'dashboard', label: 'Overview', icon: 'Chart', path: '/dashboard' },
    ...adminOnly,
    { id: 'classes', label: 'Classes & Cohorts', icon: 'BookSaved', path: '/dashboard/classes' },
    ...learnerNav,
    ...billing,
  ]
})

const isActive = (itemPath: string) => {
  if (itemPath === '/dashboard') {
    return route.path === '/dashboard'
  }
  return route.path.startsWith(itemPath)
}
</script>

<template>
  <!-- Backdrop for mobile drawer -->
  <Transition name="backdrop-fade">
    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
      aria-hidden="true"
      @click="emit('close-mobile')"
    />
  </Transition>

  <aside :class="[
    'flex flex-col select-none transition-all duration-300 ease-in-out relative',
    'bg-white dark:bg-[#0c1322] border-r border-slate-200 dark:border-white/10 shadow-sm',
    // Mobile: fixed overlay
    'fixed inset-y-0 left-0 z-50 w-64',
    mobileOpen ? 'translate-x-0' : '-translate-x-full',
    // Desktop: inline in normal flex flow, takes up physical space
    'md:relative md:inset-auto md:z-30 md:translate-x-0 md:shrink-0 md:flex',
    collapsed ? 'md:w-20' : 'md:w-64',
  ]">
    <!-- Desktop collapse toggle button right on the border seam -->
    <button
      class="hidden md:flex absolute -right-3 top-5.5 z-40 w-6 h-6 rounded-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-slate-700 shadow-sm items-center justify-center text-slate-500 hover:text-[#B91C1C] dark:hover:text-red-400 transition hover:scale-110 cursor-pointer"
      :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="emit('toggle')"
    >
      <AppIconsax
        name="ArrowRight"
        color="currentColor"
        :size="12"
        :class="collapsed ? '' : 'rotate-180'"
        class="transition-transform duration-300"
      />
    </button>

    <!-- Brand -->
    <div :class="[
      'h-16 flex items-center border-b border-slate-200/80 dark:border-white/10 shrink-0 transition-all',
      collapsed ? 'justify-center px-2' : 'justify-between px-4',
    ]">
      <NuxtLink to="/" class="flex items-center gap-2 min-w-0" :title="collapsed ? 'LEO Institute' : undefined">
        <AppBrandLogo :size="collapsed ? 'sm' : 'sm'" :show-text="!collapsed" :show-subtitle="false" />
      </NuxtLink>

      <!-- Mobile close button -->
      <button
        class="md:hidden ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-brand-ink dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition"
        aria-label="Close sidebar" @click="emit('close-mobile')">
        <AppIconsax name="CloseCircle" color="currentColor" :size="16" />
      </button>
    </div>

    <!-- Primary nav -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <Transition name="fade">
        <div v-if="!collapsed"
          class="text-[10px] uppercase tracking-[0.18em] font-bold text-slate-400 px-2 mb-2 font-poppins">
          LEO AI Speaking Coach
        </div>
      </Transition>

      <NuxtLink
        v-for="item in primaryNav"
        :key="item.id"
        :to="item.path"
        :title="collapsed ? item.label : undefined"
        :class="[
          'relative flex items-center rounded-xl text-[13px] font-poppins w-full transition-all duration-200 group',
          collapsed ? 'justify-center h-11 px-0' : 'gap-3 px-3 py-2.5',
          isActive(item.path)
            ? 'bg-[#B91C1C]/10 text-[#B91C1C] dark:text-red-400 font-semibold'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white',
        ]"
      >
        <span
          v-if="isActive(item.path)"
          class="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-[#B91C1C]"
        />
        <AppIconsax
          :name="item.icon as any"
          :color="isActive(item.path) ? '#B91C1C' : 'currentColor'"
          :size="17"
          class="shrink-0 transition-transform group-hover:scale-105"
        />
        <Transition name="fade">
          <span v-if="!collapsed" class="flex-1 truncate">{{ item.label }}</span>
        </Transition>
        <Transition name="fade">
          <span
            v-if="!collapsed && item.badge"
            class="ml-auto text-[10px] grid place-content-center bg-[#B91C1C] text-white font-semibold aspect-square rounded-full px-1.5 min-w-5 h-5 leading-none"
          >
            {{ item.badge }}
          </span>
        </Transition>
      </NuxtLink>
    </nav>

    <!-- Student Progress & Pronunciation Score Widget (Enterprise pitch highlight) -->
    <Transition name="fade">
      <div v-if="!collapsed" class="mx-3 mb-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-white/10 shrink-0">
        <div class="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          <div class="flex items-center gap-1.5">
            <span class="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Teacher Portal Sync</span>
          </div>
          <span class="text-[10px] text-[#B91C1C] font-bold">LIVE</span>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span>Pronunciation Accuracy</span>
            <span class="font-bold text-emerald-600 dark:text-emerald-400">94.8%</span>
          </div>
          <div class="h-1.5 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden">
            <div class="h-full w-[94.8%] bg-linear-to-r from-[#1B365D] to-[#B91C1C] rounded-full" />
          </div>
          <div class="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
            <span>CEFR Level: <strong class="text-slate-700 dark:text-slate-300">B2 Upper</strong></span>
            <span>Mamostayan Campus</span>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Institutional Footer Badge -->
    <div v-if="!collapsed" class="px-3 pb-3 pt-2 text-[10px] text-zinc-400 flex items-center justify-between border-t border-slate-200/80 dark:border-white/10">
      <span class="font-medium text-slate-600 dark:text-slate-300">پەیمانگای لیۆ</span>
      <span class="font-mono text-[10px] text-zinc-400 font-semibold">0770 736 2000</span>
    </div>
  </aside>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.backdrop-fade-enter-active,
.backdrop-fade-leave-active {
  transition: opacity 0.2s ease;
}

.backdrop-fade-enter-from,
.backdrop-fade-leave-to {
  opacity: 0;
}
</style>
