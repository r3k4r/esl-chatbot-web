import { afterEach, describe, expect, it, vi } from 'vitest'
import { guideSteps } from '~/composables/useDashboardGuide'
import type { GuideStep } from '~/common/types/guide-types'

// Elements on the page with a fake layout: visible ones get a box, hidden ones (the folded
// phone sidebar) sit off screen to the left.
function page(targets: Record<string, boolean>) {
  document.body.innerHTML = Object.keys(targets).map((t) => `<div data-guide="${t}"></div>`).join('')
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const on = targets[this.getAttribute('data-guide') ?? '']
    return { width: 100, height: 40, left: on ? 10 : -300, right: on ? 110 : -200, top: 0, bottom: 40, x: 0, y: 0, toJSON: () => ({}) } as DOMRect
  })
}
afterEach(() => { vi.restoreAllMocks(); document.body.innerHTML = '' })

const STEPS: GuideStep[] = [
  { title: 'Welcome', text: 'hi' },
  { target: 'hero', title: 'Today', text: '…' },
  { target: 'nav-chat', nav: true, title: 'AI Chat', text: '…' },
  { target: 'nav-voice', nav: true, title: 'Voice Lab', text: '…' },
  { target: 'nav-goals', nav: true, title: 'Goals', text: '…' },
  { target: 'search', title: 'Search', text: '…' },
  { target: 'bell', title: 'Notifications', text: '…' },
]

describe('dashboard guide steps', () => {
  it('keeps every step whose element is on screen (desktop)', () => {
    page({ hero: true, 'nav-chat': true, 'nav-voice': true, 'nav-goals': true, search: true, bell: true, menu: false })
    expect(guideSteps(STEPS).map((s) => s.popover?.title)).toEqual(['Welcome', 'Today', 'AI Chat', 'Voice Lab', 'Goals', 'Search', 'Notifications'])
  })

  it('folds the sidebar steps into one menu step on phones, where they were, and drops hidden ones', () => {
    page({ hero: true, 'nav-chat': false, 'nav-voice': false, 'nav-goals': false, search: false, bell: true, menu: true })
    const steps = guideSteps(STEPS)
    expect(steps.map((s) => s.popover?.title)).toEqual(['Welcome', 'Today', 'Menu', 'Notifications'])
    expect(steps[2]!.popover?.description).toBe('Open the menu for AI Chat, Voice Lab and Goals.')
  })

  it('skips a step whose element is missing', () => {
    page({ bell: true })
    expect(guideSteps(STEPS).map((s) => s.popover?.title)).toEqual(['Welcome', 'Notifications'])
  })
})
