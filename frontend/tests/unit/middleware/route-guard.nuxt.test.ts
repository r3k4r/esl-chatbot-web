import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { setActivePinia, type Pinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { useAuthStore } from '~~/stores/auth'
import guard from '~/middleware/middleware.global'
import { sampleUser } from '../helpers/fetch-mock'

const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn((to: string) => `redirect:${to}`) }))
mockNuxtImport('navigateTo', () => navigateToMock)

const route = (meta: Record<string, boolean> = {}) => ({ path: '/x', meta }) as unknown as RouteLocationNormalized

/** Runs the global middleware with the user already resolved (no /auth/me call). */
async function run(meta: Record<string, boolean>, role?: 'STUDENT' | 'TUTOR' | 'ADMIN') {
  const store = useAuthStore()
  store.isCheckedUser = true
  if (role) store.setUserFromResponse(sampleUser({ role }) as never)
  // Nuxt middleware is (to, from); the returned value is the redirect, undefined = allow.
  return (guard as unknown as (to: RouteLocationNormalized, from: RouteLocationNormalized) => unknown)(route(meta), route())
}

describe('global route guard', () => {
  beforeEach(() => {
    // The guard reads roles inside nuxtApp.runWithContext, which resolves the Nuxt
    // app's own Pinia — so seed that one (as the real app does), reset per test.
    setActivePinia(useNuxtApp().$pinia as Pinia)
    useAuthStore().$reset()
    navigateToMock.mockClear()
  })

  it('lets anyone through public pages', async () => {
    expect(await run({})).toBeUndefined()
    expect(await run({}, 'STUDENT')).toBeUndefined()
  })

  it('sends guests on protected pages to /signin', async () => {
    expect(await run({ requiresAuth: true })).toBe('redirect:/signin')
  })

  it('sends signed-in users away from guest-only pages', async () => {
    expect(await run({ guestOnly: true }, 'STUDENT')).toBe('redirect:/dashboard')
  })

  it('lets guests open guest-only pages', async () => {
    expect(await run({ guestOnly: true })).toBeUndefined()
  })

  it.each(['STUDENT', 'TUTOR'] as const)('bounces a %s off admin-only pages', async (role) => {
    expect(await run({ requiresAuth: true, requiresAdmin: true }, role)).toBe('redirect:/dashboard')
  })

  it('lets an ADMIN into admin-only pages', async () => {
    expect(await run({ requiresAuth: true, requiresAdmin: true }, 'ADMIN')).toBeUndefined()
  })

  it('resolves the user once before deciding', async () => {
    const store = useAuthStore()
    const fetchUser = vi.spyOn(store, 'fetchUser').mockImplementation(async () => {
      store.setUserFromResponse(sampleUser() as never)
    })
    const result = await (guard as unknown as (to: RouteLocationNormalized, from: RouteLocationNormalized) => unknown)(
      route({ requiresAuth: true }),
      route(),
    )
    expect(fetchUser).toHaveBeenCalledOnce()
    expect(result).toBeUndefined()
  })
})
