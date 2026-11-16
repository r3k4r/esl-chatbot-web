import { vi } from 'vitest'

export interface MockReply {
  status?: number
  body?: unknown
  headers?: Record<string, string>
}

export type MockRoutes = Record<string, MockReply | MockReply[] | ((req: RecordedRequest) => MockReply)>

export interface RecordedRequest {
  method: string
  /** Path relative to the API base, e.g. `/auth/login?x=1`; app-relative URLs are kept as-is. */
  path: string
  url: string
  headers: Record<string, string>
  body: unknown
}

/**
 * Replaces global `fetch` with a router keyed by `"METHOD /path"` (query string ignored
 * for matching). An array value is consumed in order, so `[401, 200]` scripts a retry.
 * Unmatched requests answer 404 so a missing route fails loudly in the assertion.
 */
export function mockFetch(routes: MockRoutes, apiBase = 'http://localhost:8000/api/v1') {
  const calls: RecordedRequest[] = []
  const queues = new Map<string, MockReply[]>()

  const fn = vi.fn(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input)
    const path = url.startsWith(apiBase) ? url.slice(apiBase.length) : url
    const method = (init.method ?? 'GET').toUpperCase()
    const headers = Object.fromEntries(new Headers(init.headers).entries())
    let body: unknown = init.body
    if (typeof init.body === 'string') {
      try { body = JSON.parse(init.body) } catch { /* keep raw */ }
    }
    const req: RecordedRequest = { method, path, url, headers, body }
    calls.push(req)

    const key = `${method} ${path.split('?')[0]}`
    const route = routes[key]
    let reply: MockReply = { status: 404, body: { success: false, message: `No mock for ${key}` } }
    if (typeof route === 'function') reply = route(req)
    else if (Array.isArray(route)) {
      if (!queues.has(key)) queues.set(key, [...route])
      const queue = queues.get(key)!
      reply = (queue.length > 1 ? queue.shift() : queue[0]) ?? reply
    } else if (route) reply = route

    return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
      status: reply.status ?? 200,
      headers: { 'Content-Type': 'application/json', ...reply.headers },
    })
  })

  vi.stubGlobal('fetch', fn)
  return {
    fn,
    calls,
    /** Requests to `METHOD /path` (query ignored). */
    callsTo: (key: string) => calls.filter((c) => `${c.method} ${c.path.split('?')[0]}` === key),
  }
}

/** Standard backend envelope. */
export const ok = (data: unknown, message = 'OK'): MockReply => ({ status: 200, body: { success: true, message, data } })
export const fail = (status: number, message: string): MockReply => ({ status, body: { success: false, message } })

export const sampleUser = (overrides: Record<string, unknown> = {}) => ({
  id: 'u-student',
  username: 'student_ali',
  email: 'ali@tutelage.com',
  displayName: 'Ali',
  role: 'STUDENT',
  avatarUrl: '',
  isActive: true,
  emailVerified: true,
  subscription: { plan: 'PREMIUM', status: 'ACTIVE' },
  ...overrides,
})
