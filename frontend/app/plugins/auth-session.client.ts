import { useAuthStore } from '~~/stores/auth'

// Every timing below is derived from the tokens themselves (their `iat`/`exp`), so
// changing JWT_ACCESS_EXPIRES / JWT_REFRESH_EXPIRES on the backend (20m / 1h today,
// 8h tomorrow) needs no frontend change.

// Refresh the access token this share of its lifetime before it expires, at most 1 minute.
const ACCESS_LEAD_SHARE = 0.1
const ACCESS_LEAD_MAX_MS = 60 * 1000
// The backend rotates the refresh token once half its lifetime is used; refresh just
// after that midpoint (plus this margin for clock skew) to get the new one.
const ROTATION_MARGIN_MS = 5 * 1000
// Never refresh more often than this — guards against loops if the clocks disagree.
const MIN_GAP_MS = 30 * 1000
// After a failed attempt (offline, 429, 5xx) try again this soon — the session is still fine.
const RETRY_MS = 30 * 1000
const MAX_TIMEOUT_MS = 2 ** 31 - 1

/** `iat`/`exp` of a JWT in ms, or null when the token isn't a readable JWT. */
function claims(token: string | null): { iat: number; exp: number } | null {
  try {
    const payload = JSON.parse(atob(token!.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.iat === 'number' && typeof payload.exp === 'number'
      ? { iat: payload.iat * 1000, exp: payload.exp * 1000 }
      : null
  } catch {
    return null
  }
}

/**
 * Keeps the session alive while the app is open: the access token is refreshed just
 * before it expires, and the refresh token is rotated before it expires. Someone who
 * is away longer than the refresh token's lifetime is signed out — nothing else is.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const auth = useAuthStore()
  const router = useRouter()
  let timer: ReturnType<typeof setTimeout> | undefined
  let lastRefreshAt = 0

  /** When the next refresh is due (epoch ms), or NaN when nothing can be planned. */
  function nextDue(): number {
    const due: number[] = []

    // Access token: shortly before it expires.
    const access = claims(auth.accessToken)
    const accessExp = access?.exp ?? Date.parse(auth.accessTokenExpiresAt ?? '')
    if (!Number.isNaN(accessExp)) {
      const lead = access ? Math.min(ACCESS_LEAD_MAX_MS, (access.exp - access.iat) * ACCESS_LEAD_SHARE) : ACCESS_LEAD_MAX_MS
      due.push(accessExp - lead)
    }

    // Refresh token: just past its midpoint, when the backend will rotate it.
    const refresh = claims(auth.refreshToken)
    if (refresh) due.push(refresh.iat + (refresh.exp - refresh.iat) / 2 + ROTATION_MARGIN_MS)

    return due.length ? Math.min(...due) : NaN
  }

  function schedule(delayMs?: number) {
    clearTimeout(timer)
    timer = undefined
    if (!auth.isAuthenticated || !auth.refreshToken) return

    if (delayMs === undefined) {
      const due = nextDue()
      if (Number.isNaN(due)) return
      delayMs = Math.max(due, lastRefreshAt + MIN_GAP_MS) - Date.now()
    }
    timer = setTimeout(run, Math.min(Math.max(delayMs, 1000), MAX_TIMEOUT_MS))
  }

  async function run() {
    timer = undefined
    lastRefreshAt = Date.now()
    const outcome = await auth.refreshTokens()
    if (outcome === 'unavailable') return schedule(RETRY_MS)
    if (outcome === 'ended' && router.currentRoute.value.meta.requiresAuth) {
      await navigateTo('/signin')
    }
    // 'refreshed': the token watcher below schedules the next round.
  }

  watch(
    () => [auth.isAuthenticated, auth.accessToken, auth.refreshToken, auth.accessTokenExpiresAt],
    () => schedule(),
  )

  nuxtApp.hook('app:mounted', () => {
    // SSR may have refreshed the tokens; make the browser's copy match, then plan ahead.
    auth.syncClientStorage()
    schedule()
    // Background tabs throttle timers and laptops sleep — re-check when the tab returns.
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') schedule()
    })
  })
})
