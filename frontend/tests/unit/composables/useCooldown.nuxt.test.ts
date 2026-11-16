import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { effectScope } from 'vue'

describe('useCooldown', () => {
  // Only the interval is faked: faking setTimeout too can stall the Nuxt test runtime.
  beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] }))
  afterEach(() => vi.useRealTimers())

  const inScope = () => {
    const scope = effectScope()
    const cooldown = scope.run(() => useCooldown())!
    return { scope, cooldown }
  }

  it('counts down to zero and then deactivates', () => {
    const { cooldown } = inScope()
    cooldown.start(3)
    expect(cooldown.active.value).toBe(true)
    expect(cooldown.label.value).toBe('0:03')

    vi.advanceTimersByTime(2000)
    expect(cooldown.label.value).toBe('0:01')

    vi.advanceTimersByTime(1000)
    expect(cooldown.active.value).toBe(false)
    expect(cooldown.remaining.value).toBe(0)
  })

  it('formats minutes as m:ss and rounds partial seconds up', () => {
    const { cooldown } = inScope()
    cooldown.start(244.2)
    expect(cooldown.label.value).toBe('4:05')
  })

  it('restarts cleanly when started again', () => {
    const { cooldown } = inScope()
    cooldown.start(10)
    vi.advanceTimersByTime(4000)
    cooldown.start(2)
    vi.advanceTimersByTime(2000)
    expect(cooldown.active.value).toBe(false)
  })

  it('stops ticking when its component goes away', () => {
    const { scope, cooldown } = inScope()
    cooldown.start(5)
    scope.stop()
    vi.advanceTimersByTime(5000)
    expect(cooldown.remaining.value).toBe(5)
  })
})
