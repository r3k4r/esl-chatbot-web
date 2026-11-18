import { CAPTURE_WORKLET, LIVE_OUT_RATE, base64ToFloat32 } from '~/lib/pcm'

// Mic in and tutor voice out for the live call, on one Web Audio context. The context is
// created inside the Start tap so phones allow it to play. The tutor's audio arrives in
// small pieces that are queued back to back; `flush()` silences it at once when the
// learner talks over the tutor.
export function useLiveAudio() {
  let ctx: AudioContext | null = null
  let out: GainNode | null = null
  let analyser: AnalyserNode | null = null
  let mic: MediaStreamAudioSourceNode | null = null
  let capture: AudioWorkletNode | null = null
  let nextAt = 0
  const voices = new Set<AudioBufferSourceNode>()
  const level = new Float32Array(512)

  /** Call synchronously inside the user's tap, before any await. */
  function open() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctx()
    ctx.resume().catch(() => {})
    out = ctx.createGain()
    analyser = ctx.createAnalyser()
    analyser.fftSize = 512
    out.connect(analyser)
    analyser.connect(ctx.destination)
  }

  /** Stream the mic as 16 kHz PCM chunks (40 ms each) with their loudness. */
  async function startMic(stream: MediaStream, onChunk: (pcm: Int16Array, rms: number) => void) {
    if (!ctx) return
    const url = URL.createObjectURL(new Blob([CAPTURE_WORKLET], { type: 'application/javascript' }))
    await ctx.audioWorklet.addModule(url)
    URL.revokeObjectURL(url)
    mic = ctx.createMediaStreamSource(stream)
    capture = new AudioWorkletNode(ctx, 'pcm-capture')
    capture.port.onmessage = (e: MessageEvent<{ pcm: ArrayBuffer; rms: number }>) => onChunk(new Int16Array(e.data.pcm), e.data.rms)
    // Silent route to the speakers keeps the worklet running in every browser.
    const mute = ctx.createGain()
    mute.gain.value = 0
    mic.connect(capture).connect(mute).connect(ctx.destination)
  }

  /** Queue one piece of the tutor's voice (base64 24 kHz PCM). */
  function play(b64: string) {
    if (!ctx || !out) return
    const samples = base64ToFloat32(b64)
    if (!samples.length) return
    const buf = ctx.createBuffer(1, samples.length, LIVE_OUT_RATE)
    buf.copyToChannel(samples, 0)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(out)
    nextAt = Math.max(nextAt, ctx.currentTime + 0.03)
    src.start(nextAt)
    nextAt += buf.duration
    voices.add(src)
    src.onended = () => voices.delete(src)
  }

  /** Stop the tutor now (the learner interrupted). */
  function flush() {
    for (const v of voices) { v.onended = null; try { v.stop() } catch { /* not started */ } }
    voices.clear()
    nextAt = 0
  }

  const playing = () => voices.size > 0

  /** 0–1 loudness of the tutor's voice right now, for the orb. */
  function tutorLevel() {
    if (!analyser) return 0
    analyser.getFloatTimeDomainData(level)
    let sum = 0
    for (let i = 0; i < level.length; i++) sum += level[i]! * level[i]!
    return Math.min(1, Math.sqrt(sum / level.length) * 4)
  }

  function close() {
    flush()
    capture?.port.close()
    mic?.disconnect()
    capture?.disconnect()
    mic = null
    capture = null
    ctx?.close().catch(() => {})
    ctx = null
  }

  onBeforeUnmount(close)

  return { open, startMic, play, flush, playing, tutorLevel, close }
}
