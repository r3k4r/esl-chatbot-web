import { expect, type Page } from '@playwright/test'

/** Fails when anything makes the page scroll sideways (the classic phone layout bug). */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    const width = doc.clientWidth
    const offenders: string[] = []
    if (doc.scrollWidth > width + 1) {
      for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('*'))) {
        const r = el.getBoundingClientRect()
        if (r.width > 0 && r.right > width + 1 && getComputedStyle(el).position !== 'fixed') {
          // Report the outermost offender only.
          if (!offenders.some((o) => el.closest(`[data-e2e-mark="${o}"]`))) {
            const id = `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}.${String(el.className).split(' ').slice(0, 3).join('.')}`
            el.setAttribute('data-e2e-mark', id)
            offenders.push(id)
          }
        }
        if (offenders.length >= 5) break
      }
    }
    return { scrollWidth: doc.scrollWidth, width, offenders }
  })
  expect(overflow.offenders, `page is ${overflow.scrollWidth}px wide in a ${overflow.width}px viewport`).toEqual([])
}

/** True when the element's box is inside the viewport horizontally. */
export async function expectWithinViewport(page: Page, selector: string) {
  const vw = page.viewportSize()!.width
  const box = await page.locator(selector).first().boundingBox()
  expect(box, `${selector} should be rendered`).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(-1)
  expect(box!.x + box!.width).toBeLessThanOrEqual(vw + 1)
}

/** Touch targets: interactive elements should be at least `min` px in both directions. */
export async function smallTapTargets(page: Page, scope = 'body', min = 24) {
  return page.locator(scope).evaluate((root, min) => {
    const els = Array.from(root.querySelectorAll<HTMLElement>('a[href], button, [role="button"], input, select'))
    return els
      .filter((el) => el.offsetParent !== null)
      .map((el) => ({ el, r: el.getBoundingClientRect() }))
      .filter(({ r }) => r.width > 0 && (r.width < min || r.height < min))
      .map(({ el, r }) => `${el.tagName.toLowerCase()} "${(el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 30)}" ${Math.round(r.width)}x${Math.round(r.height)}`)
  }, min)
}

export const isPhone = (page: Page) => page.viewportSize()!.width < 768
export const isDesktop = (page: Page) => page.viewportSize()!.width >= 1024
