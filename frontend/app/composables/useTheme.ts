import type { ThemePreference } from '~/common/types/profile-types'

const THEME_STORAGE_KEY = 'theme'

// Module-level so every consumer shares one state. Only ever mutated on the
// client, so the server-rendered default ('light') never leaks between users.
const theme = ref<ThemePreference>('light')
let initialized = false

/** Dark mode is dashboard-only: public pages (landing, auth) always render light. */
const isDashboardPath = (path: string) => path === '/dashboard' || path.startsWith('/dashboard/')

/** The one place that sets <html class="dark">. Same rule as the head script in nuxt.config.ts. */
function paint(path = window.location.pathname) {
  document.documentElement.classList.toggle('dark', theme.value === 'dark' && isDashboardPath(path))
}

function ensureInit() {
  if (initialized || !import.meta.client) return
  initialized = true
  // The inline head script in nuxt.config.ts already applied the class before
  // first paint; here we just bring the ref in line with it.
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'dark' || stored === 'light') theme.value = stored
  } catch { /* storage unavailable (private mode) — keep default */ }
  paint()
}

export function useTheme() {
  ensureInit()

  /** Apply a theme to the whole app and remember it on this device. */
  function applyTheme(next: ThemePreference) {
    theme.value = next
    if (!import.meta.client) return
    paint()
    try { localStorage.setItem(THEME_STORAGE_KEY, next) } catch { /* ignore */ }
  }

  /**
   * Sync from the learner profile's `theme` field (backend is the
   * cross-device source of truth). Ignores absent/unknown values, so calling
   * it with a staff account that has no learner profile is a no-op.
   */
  function syncFromProfile(profileTheme: string | null | undefined) {
    if (profileTheme === 'light' || profileTheme === 'dark') applyTheme(profileTheme)
  }

  return { theme: readonly(theme), applyTheme, syncFromProfile, paint }
}
