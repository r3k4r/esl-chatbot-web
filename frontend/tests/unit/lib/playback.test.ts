import { describe, expect, it, vi } from 'vitest'
import { releasePlayback, takePlayback } from '~/lib/playback'

describe('one voice at a time', () => {
  it('stops the voice that was playing when another one starts', () => {
    const first = vi.fn()
    const second = vi.fn()
    takePlayback(first)
    takePlayback(second)
    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
    releasePlayback(second)
  })

  it('does not stop a player that already finished', () => {
    const done = vi.fn()
    takePlayback(done)
    releasePlayback(done)
    takePlayback(vi.fn())
    expect(done).not.toHaveBeenCalled()
  })

  it('does not stop the same player when it starts again', () => {
    const self = vi.fn()
    takePlayback(self)
    takePlayback(self)
    expect(self).not.toHaveBeenCalled()
    releasePlayback(self)
  })
})
