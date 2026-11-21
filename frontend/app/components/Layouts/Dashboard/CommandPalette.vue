<script setup lang="ts">
import { watchDebounced } from '@vueuse/core'
import type { SvgBasedIconName } from '~/common/types/iconsax-types'
import type { GlobalSearchResults } from '~/common/types/search-types'

const { isAdmin, isStaff } = useRole()
const route = useRoute()
const router = useRouter()
const { search: searchApi } = useGlobalSearch()

const open = ref(false)
const query = ref('')
const inputEl = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const data = ref<GlobalSearchResults['results'] | null>(null)

// ── Navigation quick-jump (client-side, role-filtered like the sidebar) ──
// `keywords` are search aliases so related terms surface the right page
// (e.g. "payment"/"upgrade" → Billing, "pronunciation" → Voice Lab).
interface NavAction { label: string; icon: SvgBasedIconName; to: string; keywords?: string[] }
const navActions: NavAction[] = [
  { label: 'Overview', icon: 'Category', to: '/dashboard', keywords: ['home', 'dashboard', 'stats', 'summary', 'start'] },
  { label: 'Classes', icon: 'BookSaved', to: '/dashboard/classes', keywords: ['class', 'course', 'students', 'tutor', 'enroll', 'join', 'announcements', 'tasks'] },
  { label: 'AI Chat', icon: 'MessageText', to: '/dashboard/chat', keywords: ['chat', 'conversation', 'talk', 'message', 'practice', 'session', 'ai', 'tutor'] },
  { label: 'Voice Lab', icon: 'Microphone2', to: '/dashboard/voice', keywords: ['voice', 'speak', 'speaking', 'pronunciation', 'call', 'microphone', 'mic', 'audio'] },
  { label: 'Vocabulary', icon: 'Book1', to: '/dashboard/vocab', keywords: ['vocab', 'words', 'flashcards', 'srs', 'review', 'deck', 'definitions', 'dictionary'] },
  { label: 'Goals', icon: 'Flag', to: '/dashboard/goals', keywords: ['goal', 'objectives', 'targets', 'achievements', 'milestones', 'progress'] },
  { label: 'Profile', icon: 'Profile', to: '/dashboard/profile', keywords: ['profile', 'account', 'me', 'settings', 'preferences', 'avatar', 'level'] },
  { label: 'Billing', icon: 'Wallet2', to: '/dashboard/billing', keywords: ['billing', 'subscription', 'payment', 'pay', 'plan', 'upgrade', 'pro', 'premium', 'gold', 'invoice', 'fib'] },
  { label: 'Users', icon: 'People', to: '/dashboard/users', keywords: ['users', 'members', 'accounts', 'people', 'manage', 'admin', 'roles'] },
  { label: 'Learning', icon: 'Teacher', to: '/dashboard/learning', keywords: ['learning', 'classes', 'skills', 'levels', 'mistakes', 'grammar', 'most active', 'teachers'] },
  { label: 'Revenue', icon: 'MoneyRecive', to: '/dashboard/revenue', keywords: ['revenue', 'money', 'plans', 'funnel', 'fib', 'payments', 'paying', 'ai use', 'cost'] },
]

const STAFF_HIDDEN = ['/dashboard/billing', '/dashboard/chat', '/dashboard/voice', '/dashboard/vocab', '/dashboard/goals']
const availableNav = computed(() =>
  navActions.filter((a) => {
    if (['/dashboard/users', '/dashboard/learning', '/dashboard/revenue'].includes(a.to)) return isAdmin.value
    if (isStaff.value) return !STAFF_HIDDEN.includes(a.to)
    return true
  }),
)

const navMatches = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return availableNav.value
  return availableNav.value.filter(
    (a) =>
      a.label.toLowerCase().includes(q) ||
      a.keywords?.some((k) => k.includes(q) || q.includes(k)),
  )
})

// ── Content results (from the backend, already role-scoped) ──
interface ResultItem { id: string; label: string; sub?: string; icon: SvgBasedIconName; to: string }
interface ResultGroup { key: string; label: string; items: ResultItem[] }

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' ')
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const contentGroups = computed<ResultGroup[]>(() => {
  const r = data.value
  if (!r) return []
  const groups: ResultGroup[] = []
  if (r.users?.length)
    groups.push({ key: 'users', label: 'Users', items: r.users.map((u) => ({ id: u.id, label: u.displayName, sub: `@${u.username}`, icon: 'Profile', to: `/dashboard/users/${u.id}` })) })
  if (r.classes?.length)
    groups.push({ key: 'classes', label: 'Classes', items: r.classes.map((c) => ({ id: c.id, label: c.className, sub: c.classCategory ?? 'Class', icon: 'BookSaved', to: `/dashboard/classes/${c.id}` })) })
  if (r.vocabulary?.length)
    groups.push({ key: 'vocab', label: 'Vocabulary', items: r.vocabulary.map((v) => ({ id: v.id, label: v.word, sub: v.definition, icon: 'Book1', to: '/dashboard/vocab' })) })
  if (r.goals?.length)
    groups.push({ key: 'goals', label: 'Goals', items: r.goals.map((g) => ({ id: g.id, label: g.description, sub: titleCase(g.type), icon: 'Flag', to: '/dashboard/goals' })) })
  if (r.sessions?.length)
    groups.push({ key: 'sessions', label: 'Sessions', items: r.sessions.map((s) => ({ id: s.id, label: s.title ?? s.topic ?? 'Untitled chat', sub: formatDate(s.startedAt), icon: 'MessageText', to: `/dashboard/chat?session=${s.id}` })) })
  return groups
})

// Content first (the "real" search), then Navigation matches.
const flatTargets = computed(() => [
  ...contentGroups.value.flatMap((g) => g.items.map((i) => i.to)),
  ...navMatches.value.map((n) => n.to),
])

const isQuerying = computed(() => query.value.trim().length >= 2)
const showEmpty = computed(() => isQuerying.value && !loading.value && flatTargets.value.length === 0)

// ── Debounced backend search (ignores stale responses) ──
watchDebounced(
  query,
  async (q) => {
    const term = q.trim()
    if (term.length < 2) {
      data.value = null
      loading.value = false
      return
    }
    loading.value = true
    const res = await searchApi(term)
    if (query.value.trim() !== term) return // a newer keystroke superseded this
    data.value = res.success && res.data?.data ? res.data.data.results : null
    loading.value = false
  },
  { debounce: 250 },
)

// ── Open / close / select ──
function openPalette() {
  open.value = true
  nextTick(() => inputEl.value?.focus())
}
function closePalette() {
  open.value = false
  query.value = ''
  data.value = null
  loading.value = false
}
function selectTarget(to: string) {
  closePalette()
  router.push(to)
}
function onEnter() {
  const first = flatTargets.value[0]
  if (first) selectTarget(first)
}

function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault()
    open.value ? closePalette() : openPalette()
  }
  if (e.key === 'Escape' && open.value) closePalette()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <!-- Trigger (search bar, md+) -->
  <div class="hidden md:flex items-center gap-2 flex-1 max-w-md mx-8" data-guide="search">
    <button
      class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] bg-zinc-100 dark:bg-white/4 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-white/7 transition"
      @click="openPalette">
      <AppIconsax name="SearchNormal" color="currentColor" :size="15" />
      <span>Search users, classes, words…</span>
      <kbd
        class="ml-auto font-mono text-[11px] px-1.5 py-0.5 rounded bg-white dark:bg-black/30 border border-black/5 dark:border-white/10">
        ⌘K
      </kbd>
    </button>
  </div>

  <!-- Palette -->
  <Teleport to="body">
    <Transition name="cmd-fade">
      <div v-if="open" class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4" @click.self="closePalette">
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closePalette" />

        <div
          class="relative w-full max-w-lg bg-white dark:bg-[#111113] rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.22)] border border-black/6 dark:border-white/6 overflow-hidden animate-cmd-enter">
          <!-- Input -->
          <div class="flex items-center gap-3 px-4 py-3.5 border-b border-black/6 dark:border-white/6">
            <AppIconsax v-if="!loading" name="SearchNormal" color="currentColor" :size="16" class="text-zinc-400 shrink-0" />
            <span v-else class="size-4 shrink-0 rounded-full border-2 border-zinc-300 dark:border-zinc-600 border-t-brand-primary animate-spin" />
            <input ref="inputEl" v-model="query" type="text" placeholder="Search users, classes, vocabulary…"
              class="flex-1 bg-transparent text-[14px] text-brand-ink dark:text-white placeholder:text-zinc-400 outline-none"
              @keydown.enter="onEnter" />
            <kbd
              class="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-white/6 border border-black/5 dark:border-white/10 text-zinc-400 shrink-0">
              Esc
            </kbd>
          </div>

          <!-- Results -->
          <div class="py-2 max-h-[60vh] overflow-y-auto">
            <!-- Empty -->
            <p v-if="showEmpty" class="px-4 py-8 text-center text-[14px] text-zinc-400">
              No results for "{{ query.trim() }}"
            </p>

            <!-- Content groups -->
            <div v-for="group in contentGroups" :key="group.key">
              <p class="px-4 pb-1 pt-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-zinc-400">
                {{ group.label }}
              </p>
              <button v-for="item in group.items" :key="item.id"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-white/4 transition group"
                @click="selectTarget(item.to)">
                <div
                  class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-zinc-100 dark:bg-white/4 text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-white/6">
                  <AppIconsax :name="item.icon" color="currentColor" :size="16" />
                </div>
                <div class="min-w-0 flex-1">
                  <p class="text-[14px] font-medium text-brand-ink dark:text-white truncate">{{ item.label }}</p>
                  <p v-if="item.sub" class="text-[12px] text-zinc-400 truncate">{{ item.sub }}</p>
                </div>
                <AppIconsax name="ArrowRight" color="currentColor" :size="14"
                  class="ml-auto text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition shrink-0" />
              </button>
            </div>

            <!-- Navigation -->
            <template v-if="navMatches.length">
              <p class="px-4 pb-1 pt-2 text-[11px] uppercase tracking-[0.16em] font-semibold text-zinc-400">
                Navigation
              </p>
              <button v-for="action in navMatches" :key="action.to"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-white/4 transition group"
                :class="route.path === action.to ? 'bg-brand-primary/5' : ''" @click="selectTarget(action.to)">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition" :class="route.path === action.to
                  ? 'bg-brand-primary/15 text-brand-primary'
                  : 'bg-zinc-100 dark:bg-white/4 text-zinc-500 group-hover:bg-zinc-200 dark:group-hover:bg-white/6'">
                  <AppIconsax :name="action.icon" color="currentColor" :size="16" />
                </div>
                <span class="text-[14px] font-medium"
                  :class="route.path === action.to ? 'text-brand-primary' : 'text-brand-ink dark:text-white'">
                  {{ action.label }}
                </span>
                <AppIconsax name="ArrowRight" color="currentColor" :size="14"
                  class="ml-auto text-zinc-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition" />
              </button>
            </template>
          </div>

          <!-- Footer hints -->
          <div class="px-4 py-2.5 border-t border-black/6 dark:border-white/6 flex items-center gap-3 text-[11px] text-zinc-400">
            <span><kbd class="font-mono px-1 py-0.5 rounded bg-zinc-100 dark:bg-white/6 border border-black/5 dark:border-white/10">↵</kbd> select</span>
            <span><kbd class="font-mono px-1 py-0.5 rounded bg-zinc-100 dark:bg-white/6 border border-black/5 dark:border-white/10">Esc</kbd> close</span>
            <span class="ml-auto"><kbd class="font-mono px-1 py-0.5 rounded bg-zinc-100 dark:bg-white/6 border border-black/5 dark:border-white/10">⌘K</kbd> toggle</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.cmd-fade-enter-active,
.cmd-fade-leave-active {
  transition: opacity 0.15s ease;
}

.cmd-fade-enter-from,
.cmd-fade-leave-to {
  opacity: 0;
}

@keyframes cmd-enter {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.97);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-cmd-enter {
  animation: cmd-enter 0.18s cubic-bezier(0.22, 1, 0.36, 1) both;
}
</style>
