import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useAuthStore } from '~~/stores/auth'
import { GUIDE_READY, GUIDE_STEPS } from '~/common/data/guide-steps'
import type { GuideStep } from '~/common/types/guide-types'

// The dashboard guide (product tour), one per role (common/data/guide-steps.ts). It starts by
// itself on the dashboard while the account's guideSeenAt is null, and again from "Take the tour"
// in the account menu (/dashboard?tour=1). Finishing or skipping saves guideSeenAt on the account,
// so it shows once per person on any device.
let running = false

const onScreen = (el: Element | null): el is HTMLElement => {
  if (!el) return false
  const r = el.getBoundingClientRect()
  return r.width > 0 && r.height > 0 && r.right > 0 && r.left < window.innerWidth
}
const find = (target: string) => document.querySelector(`[data-guide="${target}"]`)

/** The role's steps that are on screen. On phones the sidebar items become one step on the menu button. */
export function guideSteps(steps: GuideStep[]): DriveStep[] {
  const out: DriveStep[] = []
  const folded: GuideStep[] = []
  let menuAt = -1
  for (const s of steps) {
    const el = s.target ? find(s.target) : null
    if (s.target && !onScreen(el)) {
      if (s.nav) { folded.push(s); if (menuAt < 0) menuAt = out.length }
      continue
    }
    out.push({ element: el ?? undefined, popover: { title: s.title, description: s.text, side: s.side, align: 'start' } })
  }
  const menu = find('menu')
  if (folded.length && onScreen(menu)) {
    const names = folded.map((s) => s.title)
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0]
    out.splice(menuAt, 0, { element: menu, popover: { title: 'Menu', description: `Open the menu for ${list}.`, side: 'bottom', align: 'start' } })
  }
  return out
}

/** Resolves when the element is on the page (the dashboard has loaded), or after `timeout`. */
function whenOnPage(target: string, timeout = 8000): Promise<void> {
  return new Promise((resolve) => {
    const started = Date.now()
    const tick = () => (find(target) || Date.now() - started > timeout ? resolve() : setTimeout(tick, 150))
    tick()
  })
}

export function useDashboardGuide() {
  const auth = useAuthStore()

  async function markSeen() {
    const user = auth.user
    if (!user || user.guideSeenAt) return
    user.guideSeenAt = new Date().toISOString() // no second auto-start while the request runs
    await useHttp({ method: 'POST', url: '/users/me/guide-seen', requireAuth: true, showToast: false })
  }

  /** Starts the tour for the signed-in role once its dashboard is on the page. */
  async function start() {
    const role = auth.getUser?.role
    if (running || !role) return
    running = true
    await whenOnPage(GUIDE_READY[role])
    await new Promise((r) => setTimeout(r, 300)) // let the cards finish their entrance
    const steps = guideSteps(GUIDE_STEPS[role])
    const tour = driver({
      steps,
      showProgress: true,
      progressText: '{{current}} of {{total}}',
      nextBtnText: 'Next',
      prevBtnText: 'Back',
      doneBtnText: 'Done',
      popoverClass: 'tutelage-guide',
      overlayOpacity: 0.55,
      stagePadding: 6,
      stageRadius: 12,
      smoothScroll: true,
      onDestroyed: () => {
        running = false
        markSeen()
      },
    })
    tour.drive()
  }

  /** On the dashboard: starts for a new account, or when asked with ?tour=1. */
  function startIfDue(path: string, query: Record<string, unknown>) {
    if (path !== '/dashboard') return
    const asked = query.tour === '1'
    if (!asked && auth.getUser?.guideSeenAt !== null) return // undefined = not loaded yet: don't guess
    if (asked) navigateTo({ path: '/dashboard', query: {} }, { replace: true })
    start()
  }

  return { start, startIfDue }
}
