import { test as base, expect, type Page } from '@playwright/test'
import { USERS, tokenFor, refreshFor, type Persona } from '../../fixtures/api'

export { expect }
export type { Persona }
export { USERS }

export interface ApiOverride {
  status?: number
  body?: unknown
  /** Holds the response this long — for asserting loading states. */
  delayMs?: number
  /** Extra response headers, e.g. { 'Retry-After': '30' }. */
  headers?: Record<string, string>
}

interface Fixtures {
  /** Signs in as a fixture account by planting the tokens SSR and the client both read. */
  loginAs: (persona: Persona) => Promise<void>
  /** Overrides one mock-API route for this test only (browser requests; SSR still hits the mock). */
  mockApi: (method: string, path: string, reply: ApiOverride) => Promise<void>
  /** Uncaught page errors collected during the test; asserted empty automatically. */
  pageErrors: Error[]
}

export const test = base.extend<Fixtures>({
  loginAs: async ({ page, context, baseURL }, use) => {
    await use(async (persona) => {
      const url = baseURL!
      await context.addCookies([
        { name: 'accessToken', value: tokenFor(persona), url },
        { name: 'refreshToken', value: refreshFor(persona), url },
      ])
      await page.addInitScript(([a, r]) => {
        localStorage.setItem('accessToken', a)
        localStorage.setItem('refreshToken', r)
      }, [tokenFor(persona), refreshFor(persona)] as const)
    })
  },

  mockApi: async ({ page }, use) => {
    await use(async (method, path, reply) => {
      const pattern = new RegExp(`/api/v1${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\?.*)?$`)
      await page.route(pattern, async (route) => {
        if (route.request().method() !== method.toUpperCase()) return route.fallback()
        if (reply.delayMs) await new Promise((r) => setTimeout(r, reply.delayMs))
        await route.fulfill({
          status: reply.status ?? 200,
          contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': 'Retry-After', ...reply.headers },
          body: JSON.stringify(reply.body ?? { success: true, message: 'OK', data: null }),
        })
      })
    })
  },

  pageErrors: [async ({ page }, use) => {
    const errors: Error[] = []
    page.on('pageerror', (err) => errors.push(err))
    await use(errors)
    expect(errors.map((e) => e.message), 'uncaught errors in the page').toEqual([])
  }, { auto: true }],
})

/** Waits for Nuxt to finish hydrating so clicks reach Vue handlers, not dead SSR markup. */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    type VueApp = { config: { globalProperties: { $nuxt?: { isHydrating?: boolean } } } }
    const app = (document.querySelector('#__nuxt') as (Element & { __vue_app__?: VueApp }) | null)?.__vue_app__
    return app?.config.globalProperties.$nuxt?.isHydrating === false
  })
}

/** Navigates and waits for hydration. */
export async function visit(page: Page, path: string) {
  await page.goto(path)
  await waitForHydration(page)
}
