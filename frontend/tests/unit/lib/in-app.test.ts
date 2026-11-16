import { describe, it, expect } from 'vitest'
import { inApp } from '~/lib/utils'

// Mimics Nuxt's server-side runWithContext: runs fn synchronously but returns a Promise.
const serverApp = { runWithContext: async (fn: () => unknown) => fn() }

describe('inApp', () => {
  it('returns the value synchronously, not a Promise, on the server', () => {
    expect(inApp(serverApp, () => 'token')).toBe('token')
  })

  it('runs fn directly when there is no app', () => {
    expect(inApp(null, () => 42)).toBe(42)
  })

  it('rethrows synchronous errors', () => {
    expect(() => inApp(serverApp, () => { throw new Error('boom') })).toThrow('boom')
  })

  it('passes an async result through to be awaited', async () => {
    await expect(inApp(serverApp, async () => 'done')).resolves.toBe('done')
  })
})
