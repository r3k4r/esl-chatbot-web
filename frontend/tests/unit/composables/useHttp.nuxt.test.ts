import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '~~/stores/auth'
import { mockFetch, ok, fail } from '../helpers/fetch-mock'

const base = () => useRuntimeConfig().public.baseUrl as string

describe('useHttp', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })
  afterEach(() => vi.unstubAllGlobals())

  it('joins the base URL and returns the uniform success shape', async () => {
    const api = mockFetch({ 'GET /ping': ok({ pong: true }, 'Pinged') }, base())
    const res = await useHttp({ method: 'GET', url: 'ping' })

    expect(api.calls[0]!.url).toBe(`${base()}/ping`)
    expect(res).toEqual({ success: true, message: 'Pinged', data: { success: true, message: 'Pinged', data: { pong: true } }, status: 200 })
  })

  it('sends JSON with Accept-Language and no auth header by default', async () => {
    const api = mockFetch({ 'POST /things': ok({}) }, base())
    await useHttp({ method: 'POST', url: '/things', body: { a: 1 } })

    const req = api.calls[0]!
    expect(req.body).toEqual({ a: 1 })
    expect(req.headers['content-type']).toBe('application/json')
    expect(req.headers['accept-language']).toBe('en')
    expect(req.headers.authorization).toBeUndefined()
  })

  it('adds the bearer token from the store when requireAuth is set', async () => {
    useAuthStore().accessToken = 'store-token'
    const api = mockFetch({ 'GET /me': ok({}) }, base())
    await useHttp({ method: 'GET', url: '/me', requireAuth: true })
    expect(api.calls[0]!.headers.authorization).toBe('Bearer store-token')
  })

  it('falls back to localStorage for the token', async () => {
    localStorage.setItem('accessToken', 'ls-token')
    const api = mockFetch({ 'GET /me': ok({}) }, base())
    await useHttp({ method: 'GET', url: '/me', requireAuth: true })
    expect(api.calls[0]!.headers.authorization).toBe('Bearer ls-token')
  })

  it('lets the browser set Content-Type for FormData uploads', async () => {
    const api = mockFetch({ 'POST /users/me/avatar': ok({}) }, base())
    const form = new FormData()
    form.append('avatar', new Blob(['x']), 'a.png')
    await useHttp({ method: 'POST', url: '/users/me/avatar', body: form })
    expect(api.calls[0]!.headers['content-type']).toBeUndefined()
  })

  it.each([
    [{ success: false, message: 'Username taken' }, 'Username taken'],
    [{ success: false, error: { message: 'Nested reason' } }, 'Nested reason'],
    [{}, 'Request failed: 409'],
  ])('surfaces the server message on errors (%j)', async (body, message) => {
    mockFetch({ 'POST /auth/register': { status: 409, body } }, base())
    const res = await useHttp({ method: 'POST', url: '/auth/register', body: {} })
    expect(res).toMatchObject({ success: false, message, status: 409 })
  })

  describe('429 Too Many Requests', () => {
    it('shows the backend message and reads Retry-After from the header', async () => {
      const reason = 'Daily message limit reached (20). Upgrade to GOLD for more messages.'
      const api = mockFetch({ 'POST /sessions/s1/messages': { status: 429, body: { success: false, message: reason }, headers: { 'Retry-After': '3600' } } }, base())
      const res = await useHttp({ method: 'POST', url: '/sessions/s1/messages' })
      expect(res).toMatchObject({ success: false, message: reason, status: 429, retryAfter: 3600 })
      expect(api.calls).toHaveLength(1)
    })

    it('falls back to the body retryAfter when the header is missing', async () => {
      mockFetch({ 'POST /auth/login': { status: 429, body: { message: 'Too many sign-in attempts. Please try again in 2 minutes.', retryAfter: 95 } } }, base())
      const res = await useHttp({ method: 'POST', url: '/auth/login' })
      expect(res.retryAfter).toBe(95)
      expect(res.message).toBe('Too many sign-in attempts. Please try again in 2 minutes.')
    })

    it('writes its own message with the wait only when the server sent none', async () => {
      mockFetch({ 'GET /x': { status: 429, body: {}, headers: { 'Retry-After': '120' } } }, base())
      const res = await useHttp({ method: 'GET', url: '/x' })
      expect(res.message).toBe('Too many requests. Please try again in 2 minutes.')
    })

    it('handles an HTTP-date Retry-After', async () => {
      const at = new Date(Date.now() + 30_000).toUTCString()
      mockFetch({ 'GET /x': { status: 429, body: { message: 'Slow down' }, headers: { 'Retry-After': at } } }, base())
      const res = await useHttp({ method: 'GET', url: '/x' })
      expect(res.retryAfter).toBeGreaterThan(25)
      expect(res.retryAfter).toBeLessThanOrEqual(31)
    })
  })

  it('reports network failures without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))
    const res = await useHttp({ method: 'GET', url: '/x' })
    expect(res).toMatchObject({ success: false, message: 'Failed to fetch', data: null, status: 500 })
  })

  it('skips JSON parsing when ignoreResponse is set', async () => {
    mockFetch({ 'DELETE /vocabulary/1': { status: 204 } }, base())
    const res = await useHttp({ method: 'DELETE', url: '/vocabulary/1', ignoreResponse: true })
    expect(res).toEqual({ success: true, message: 'Success', data: null, status: 204 })
  })

  describe('401 handling', () => {
    it('refreshes the access token once and retries with the new one', async () => {
      localStorage.setItem('accessToken', 'stale')
      localStorage.setItem('refreshToken', 'refresh-1')
      const api = mockFetch({
        'GET /dashboard/overview': [fail(401, 'expired'), ok({ fine: true })],
        'POST /auth/refresh': ok({ accessToken: 'fresh', accessTokenExpiresAt: '2030-01-01T00:20:00.000Z' }),
        'POST /api/set-cookie': ok({}),
      }, base())

      const res = await useHttp({ method: 'GET', url: '/dashboard/overview', requireAuth: true })

      expect(res.success).toBe(true)
      expect(api.callsTo('POST /auth/refresh')[0]!.body).toEqual({ refreshToken: 'refresh-1' })
      const attempts = api.callsTo('GET /dashboard/overview')
      expect(attempts.map((c) => c.headers.authorization)).toEqual(['Bearer stale', 'Bearer fresh'])
      expect(localStorage.getItem('accessToken')).toBe('fresh')
    })

    it('does not try to refresh for unauthenticated calls (e.g. a bad Google token)', async () => {
      localStorage.setItem('refreshToken', 'refresh-1')
      const api = mockFetch({ 'POST /auth/google': fail(401, 'Invalid Google ID token') }, base())
      const res = await useHttp({ method: 'POST', url: '/auth/google', body: {} })
      expect(res).toMatchObject({ success: false, message: 'Invalid Google ID token', status: 401 })
      expect(api.callsTo('POST /auth/refresh')).toHaveLength(0)
    })

    it('keeps the session when the refresh itself cannot get through', async () => {
      localStorage.setItem('accessToken', 'stale')
      localStorage.setItem('refreshToken', 'refresh-1')
      mockFetch({
        'GET /me': fail(401, 'expired'),
        'POST /auth/refresh': fail(503, 'Service unavailable'),
      }, base())

      const res = await useHttp({ method: 'GET', url: '/me', requireAuth: true })

      expect(res).toMatchObject({ success: false, status: 503 })
      expect(localStorage.getItem('refreshToken')).toBe('refresh-1')
    })

    it('ends the session when there is no refresh token', async () => {
      const api = mockFetch({ 'GET /me': fail(401, 'expired') }, base())
      const res = await useHttp({ method: 'GET', url: '/me', requireAuth: true })

      expect(res).toEqual({ success: false, message: 'Session expired. Please log in again.', data: null, status: 401 })
      expect(api.callsTo('POST /auth/refresh')).toHaveLength(0)
    })

    it('clears stored tokens when the refresh is rejected', async () => {
      localStorage.setItem('accessToken', 'stale')
      localStorage.setItem('refreshToken', 'revoked')
      mockFetch({
        'GET /me': fail(401, 'expired'),
        'POST /auth/refresh': fail(401, 'revoked'),
        'POST /api/clear-cookie': ok({}),
      }, base())

      const res = await useHttp({ method: 'GET', url: '/me', requireAuth: true })

      expect(res.status).toBe(401)
      expect(localStorage.getItem('accessToken')).toBeNull()
      expect(localStorage.getItem('refreshToken')).toBeNull()
    })
  })
})
