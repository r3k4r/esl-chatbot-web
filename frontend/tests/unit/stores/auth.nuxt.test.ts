import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~~/stores/auth'
import { mockFetch, ok, fail, sampleUser } from '../helpers/fetch-mock'

const base = () => useRuntimeConfig().public.baseUrl as string
const cookieRoutes = { 'POST /api/set-cookie': ok({}), 'POST /api/clear-cookie': ok({}) }
const tokens = {
  accessToken: 'acc-1',
  refreshToken: 'ref-1',
  accessTokenExpiresAt: '2030-01-01T00:20:00.000Z',
  refreshTokenExpiresAt: '2030-01-01T01:00:00.000Z',
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  afterEach(() => vi.unstubAllGlobals())

  describe('signIn', () => {
    it('persists both tokens and the user on success', async () => {
      const api = mockFetch({ ...cookieRoutes, 'POST /auth/login': ok({ ...tokens, user: sampleUser() }) }, base())
      const store = useAuthStore()

      const res = await store.signIn({ username: 'student_ali', password: 'password123' })

      expect(res.success).toBe(true)
      expect(api.callsTo('POST /auth/login')[0]!.body).toEqual({ username: 'student_ali', password: 'password123' })
      expect(store.getIsAuthenticated).toBe(true)
      expect(store.getUser).toMatchObject({ username: 'student_ali', role: 'STUDENT', subscription: { plan: 'PREMIUM' } })
      expect(localStorage.getItem('accessToken')).toBe('acc-1')
      expect(localStorage.getItem('refreshToken')).toBe('ref-1')
      // Expiries from the backend are kept for the proactive refresh.
      expect(store.accessTokenExpiresAt).toBe(tokens.accessTokenExpiresAt)
      expect(localStorage.getItem('refreshTokenExpiresAt')).toBe(tokens.refreshTokenExpiresAt)
      // The httpOnly cookies live exactly as long as the refresh token.
      expect(api.callsTo('POST /api/set-cookie')[0]!.body).toEqual({
        accessToken: 'acc-1', refreshToken: 'ref-1', expiresAt: tokens.refreshTokenExpiresAt,
      })
      expect(store.getIsLoading).toBe(false)
    })

    it('leaves the session empty on bad credentials', async () => {
      const api = mockFetch({ ...cookieRoutes, 'POST /auth/login': fail(400, 'Invalid username or password') }, base())
      const store = useAuthStore()

      const res = await store.signIn({ username: 'x', password: 'y' })

      expect(res).toMatchObject({ success: false, message: 'Invalid username or password' })
      expect(store.getIsAuthenticated).toBe(false)
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(api.callsTo('POST /auth/refresh')).toHaveLength(0)
      expect(store.getIsLoading).toBe(false)
    })
  })

  it('signUp never logs the user in (email must be verified first)', async () => {
    const api = mockFetch({ ...cookieRoutes, 'POST /auth/register': ok({ id: 'new' }) }, base())
    const store = useAuthStore()

    await store.signUp({
      username: 'new_user', email: 'n@t.com', password: 'password123',
      confirmPassword: 'password123', displayName: 'New', acceptAgreement: true,
    })

    expect(api.callsTo('POST /auth/register')[0]!.body).toEqual({
      username: 'new_user', email: 'n@t.com', password: 'password123', displayName: 'New', acceptAgreement: true,
    })
    expect(store.getIsAuthenticated).toBe(false)
    expect(api.callsTo('POST /api/set-cookie')).toHaveLength(0)
  })

  it('verifyEmail logs the user in with the returned token pair', async () => {
    mockFetch({ ...cookieRoutes, 'POST /auth/verify-email': ok({ ...tokens, user: sampleUser({ subscription: { plan: 'FREE', status: 'ACTIVE' } }) }) }, base())
    const store = useAuthStore()

    await store.verifyEmail({ email: 'ali@tutelage.com', otp: '123456' })

    expect(store.getIsAuthenticated).toBe(true)
    expect(store.getUser.subscription.plan).toBe('FREE')
    expect(localStorage.getItem('accessToken')).toBe('acc-1')
  })

  it('googleAuth only sends username + agreement when registering', async () => {
    const api = mockFetch({ ...cookieRoutes, 'POST /auth/google': ok({ needsRegistration: true }) }, base())
    const store = useAuthStore()

    await store.googleAuth('id-token')
    await store.googleAuth('id-token', 'picked_name', true)

    const bodies = api.callsTo('POST /auth/google').map((c) => c.body)
    expect(bodies).toEqual([{ idToken: 'id-token' }, { idToken: 'id-token', username: 'picked_name', acceptAgreement: true }])
    expect(store.getIsAuthenticated).toBe(false)
  })

  it('signOut clears local state and revokes the refresh token', async () => {
    const api = mockFetch({ ...cookieRoutes, 'POST /auth/login': ok({ ...tokens, user: sampleUser() }), 'POST /auth/logout': ok({}) }, base())
    const store = useAuthStore()
    await store.signIn({ username: 'a', password: 'b' })

    await store.signOut()
    await vi.waitFor(() => expect(api.callsTo('POST /auth/logout')).toHaveLength(1))

    expect(api.callsTo('POST /auth/logout')[0]!.body).toEqual({ refreshToken: 'ref-1' })
    expect(store.getIsAuthenticated).toBe(false)
    expect(store.getUser).toBeNull()
    expect(localStorage.getItem('accessToken')).toBeNull()
  })

  describe('refreshTokens', () => {
    const accessOnly = { accessToken: 'acc-2', accessTokenExpiresAt: '2030-01-01T00:40:00.000Z' }

    it('swaps the access token and keeps the refresh token when not rotated', async () => {
      localStorage.setItem('refreshToken', 'ref-1')
      localStorage.setItem('refreshTokenExpiresAt', tokens.refreshTokenExpiresAt)
      const api = mockFetch({ ...cookieRoutes, 'POST /auth/refresh': ok(accessOnly) }, base())
      const store = useAuthStore()

      expect(await store.refreshTokens()).toBe('refreshed')
      expect(api.callsTo('POST /auth/refresh')[0]!.body).toEqual({ refreshToken: 'ref-1' })
      expect(store.getAccessToken).toBe('acc-2')
      expect(store.accessTokenExpiresAt).toBe(accessOnly.accessTokenExpiresAt)
      expect(store.getRefreshToken).toBe('ref-1')
      expect(store.refreshTokenExpiresAt).toBe(tokens.refreshTokenExpiresAt)
    })

    it('stores a rotated refresh token and its new expiry', async () => {
      localStorage.setItem('refreshToken', 'ref-1')
      const rotated = { ...accessOnly, refreshToken: 'ref-2', refreshTokenExpiresAt: '2030-01-01T02:00:00.000Z' }
      mockFetch({ ...cookieRoutes, 'POST /auth/refresh': ok(rotated) }, base())
      const store = useAuthStore()

      await store.refreshTokens()

      expect(store.getRefreshToken).toBe('ref-2')
      expect(localStorage.getItem('refreshToken')).toBe('ref-2')
      expect(localStorage.getItem('refreshTokenExpiresAt')).toBe(rotated.refreshTokenExpiresAt)
    })

    it('shares one request between concurrent callers', async () => {
      localStorage.setItem('refreshToken', 'ref-1')
      const api = mockFetch({ ...cookieRoutes, 'POST /auth/refresh': ok(accessOnly) }, base())
      const store = useAuthStore()

      const results = await Promise.all([store.refreshTokens(), store.refreshTokens(), store.refreshTokens()])

      expect(results).toEqual(['refreshed', 'refreshed', 'refreshed'])
      expect(api.callsTo('POST /auth/refresh')).toHaveLength(1)
    })

    it('ends the session when the refresh token is rejected', async () => {
      localStorage.setItem('refreshToken', 'ref-1')
      mockFetch({ ...cookieRoutes, 'POST /auth/refresh': fail(401, 'Invalid or expired refresh token') }, base())
      const store = useAuthStore()

      expect(await store.refreshTokens()).toBe('ended')
      expect(localStorage.getItem('refreshToken')).toBeNull()
    })

    it.each([
      [fail(429, 'Too many session refreshes.')],
      [fail(500, 'Internal server error')],
    ])('keeps the session on a transient failure (%#)', async (reply) => {
      localStorage.setItem('refreshToken', 'ref-1')
      mockFetch({ ...cookieRoutes, 'POST /auth/refresh': reply }, base())
      const store = useAuthStore()

      expect(await store.refreshTokens()).toBe('unavailable')
      expect(localStorage.getItem('refreshToken')).toBe('ref-1')
    })

    it('ends without a request when the stored refresh token has expired', async () => {
      localStorage.setItem('refreshToken', 'ref-1')
      localStorage.setItem('refreshTokenExpiresAt', '2000-01-01T00:00:00.000Z')
      const api = mockFetch(cookieRoutes, base())

      expect(await useAuthStore().refreshTokens()).toBe('ended')
      expect(api.callsTo('POST /auth/refresh')).toHaveLength(0)
    })

    it('ends without a request when no refresh token exists', async () => {
      const api = mockFetch(cookieRoutes, base())
      expect(await useAuthStore().refreshTokens()).toBe('ended')
      expect(api.callsTo('POST /auth/refresh')).toHaveLength(0)
    })
  })

  describe('fetchUser', () => {
    it('skips the request entirely for a guest', async () => {
      const api = mockFetch(cookieRoutes, base())
      const store = useAuthStore()
      await store.fetchUser()
      expect(api.calls).toHaveLength(0)
      expect(store.isCheckedUser).toBe(true)
      expect(store.getIsAuthenticated).toBe(false)
    })

    it('refreshes an expired access token and loads the user', async () => {
      localStorage.setItem('accessToken', 'expired')
      localStorage.setItem('refreshToken', 'ref-1')
      mockFetch({
        ...cookieRoutes,
        'GET /auth/me': (req) => (req.headers.authorization === 'Bearer acc-2' ? ok(sampleUser()) : fail(401, 'expired')),
        'POST /auth/refresh': ok({ accessToken: 'acc-2', accessTokenExpiresAt: '2030-01-01T00:20:00.000Z' }),
      }, base())
      const store = useAuthStore()

      await store.fetchUser()

      expect(store.getIsAuthenticated).toBe(true)
      expect(store.getUser.username).toBe('student_ali')
    })

    it('does not sign out when the server is unreachable', async () => {
      localStorage.setItem('accessToken', 'acc-1')
      localStorage.setItem('refreshToken', 'ref-1')
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))
      const store = useAuthStore()

      await store.fetchUser()

      expect(store.getIsAuthenticated).toBe(false)
      expect(localStorage.getItem('refreshToken')).toBe('ref-1')
    })
  })

  it('setUserFromResponse keeps only the known user fields', () => {
    const store = useAuthStore()
    store.setUserFromResponse({ ...sampleUser({ role: 'TUTOR' }), password: 'leak', extra: 1 } as never)
    expect(store.getUser).toEqual({
      id: 'u-student', username: 'student_ali', email: 'ali@tutelage.com', displayName: 'Ali', role: 'TUTOR',
      avatarUrl: '', isActive: true, emailVerified: true, subscription: { plan: 'PREMIUM', status: 'ACTIVE' },
    })
    expect(store.userCurrentRole).toBe('TUTOR')
  })
})
