import type { ThemePreference } from '~/common/types/profile-types'

const THEME_STORAGE_KEY = 'theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

// The theme belongs to the device, not the account: the learner's own choice (the header toggle)
// is kept in localStorage; without one, the system's light/dark setting is followed, live.
// Module-level so every consumer shares one state; only mutated on the client.
const theme = ref<ThemePreference>('light')
let initialized = false

/** Dark mode is dashboard-only: public pages (landing, auth) always render light. */
const isDashboardPath = (path: string) => path === '/dashboard' || path.startsWith('/dashboard/')

/** The one place that sets <html class="dark">. Same rule as the head script in nuxt.config.ts. */
function paint(path = window.location.pathname) {
  document.documentElement.classList.toggle('dark', theme.value === 'dark' && isDashboardPath(path))
}

function storedTheme(): ThemePreference | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'dark' || stored === 'light' ? stored : null
  } catch { return null } // storage unavailable (private mode)
}

function systemTheme(): ThemePreference {
  try { return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light' } catch { return 'light' }
}

function ensureInit() {
  if (initialized || !import.meta.client) return
  initialized = true
  // The inline head script already applied the class before first paint; bring the ref in line.
  theme.value = storedTheme() ?? systemTheme()
  paint()
  try {
    window.matchMedia(DARK_QUERY).addEventListener('change', () => {
      if (storedTheme()) return // the learner chose a theme; keep it
      theme.value = systemTheme()
      paint()
    })
  } catch { /* old browser: no live follow */ }
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

  const toggleTheme = () => applyTheme(theme.value === 'dark' ? 'light' : 'dark')

  return { theme: readonly(theme), applyTheme, toggleTheme, paint }
}
