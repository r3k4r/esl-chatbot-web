import { describe, expect, it } from 'vitest'
import { base64ToFloat32, bytesToBase64, joinPcm, trimQuiet } from '~/lib/pcm'

describe('pcm helpers', () => {
  it('round-trips Int16 PCM through base64 to float samples', () => {
    const pcm = new Int16Array([0, 16384, -16384, 32767, -32768])
    const out = base64ToFloat32(bytesToBase64(new Uint8Array(pcm.buffer)))
    expect(Array.from(out)).toEqual([0, 0.5, -0.5, 32767 / 32768, -1])
  })

  it('base64-encodes large buffers without overflowing the call stack', () => {
    const big = new Uint8Array(200_000).fill(7)
    expect(atob(bytesToBase64(big)).length).toBe(200_000)
  })

  it('trims the quiet around the learner\'s words, keeping a little padding', () => {
    const c = (rms: number, v: number) => ({ pcm: new Int16Array([v]), rms })
    const chunks = [c(0, 1), c(0, 2), c(0, 3), c(0.1, 4), c(0.2, 5), c(0, 6), c(0, 7), c(0, 8)]
    expect(trimQuiet(chunks, 0.05, 1).map((x) => x[0])).toEqual([3, 4, 5, 6])
    expect(trimQuiet([c(0, 1), c(0.01, 2)], 0.05)).toEqual([])
  })

  it('joins chunks and keeps only the newest samples', () => {
    const chunks = [new Int16Array([1, 2, 3]), new Int16Array([4, 5]), new Int16Array([6, 7, 8])]
    expect(Array.from(joinPcm(chunks, 100))).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    expect(Array.from(joinPcm(chunks, 4))).toEqual([5, 6, 7, 8])
  })
})
