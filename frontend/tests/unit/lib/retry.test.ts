import { describe, it, expect } from 'vitest'
import { waitText, parseRetryAfter } from '~/lib/utils'

describe('waitText', () => {
  it.each([
    [0.4, '1 second'],
    [1, '1 second'],
    [45, '45 seconds'],
    [60, '1 minute'],
    [61, '2 minutes'],
    [3599, '60 minutes'],
    [3600, '1 hour'],
    [5400, '2 hours'],
  ])('%s s → %s', (seconds, text) => {
    expect(waitText(seconds)).toBe(text)
  })
})

describe('parseRetryAfter', () => {
  const now = Date.parse('2026-06-15T12:00:00Z')

  it('reads delta-seconds', () => {
    expect(parseRetryAfter('120', now)).toBe(120)
    expect(parseRetryAfter('1.2', now)).toBe(2)
  })

  it('reads an HTTP date', () => {
    expect(parseRetryAfter('Mon, 15 Jun 2026 12:01:30 GMT', now)).toBe(90)
  })

  it.each([null, undefined, '', '0', '-5', 'soon', 'Mon, 15 Jun 2026 11:00:00 GMT'])('ignores %j', (value) => {
    expect(parseRetryAfter(value as string | null | undefined, now)).toBeUndefined()
  })
})
