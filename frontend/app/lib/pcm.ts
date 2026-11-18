// Raw audio helpers for the live call. Gemini Live takes 16 kHz 16-bit mono PCM in and
// sends 24 kHz 16-bit mono PCM out, both base64 inside JSON messages.

export const LIVE_IN_RATE = 16000
export const LIVE_OUT_RATE = 24000
const CHUNK = 640 // 40 ms at 16 kHz

// Runs on the audio thread: downsamples the mic to 16 kHz Int16 and posts 40 ms chunks
// with their loudness. Nearest-sample resampling is enough for speech recognition.
export const CAPTURE_WORKLET = `
class PcmCapture extends AudioWorkletProcessor {
  constructor() { super(); this.step = sampleRate / ${LIVE_IN_RATE}; this.pos = 0; this.out = new Int16Array(${CHUNK}); this.n = 0; this.sum = 0; }
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (!ch) return true;
    while (this.pos < ch.length) {
      const v = Math.max(-1, Math.min(1, ch[this.pos | 0]));
      this.sum += v * v;
      this.out[this.n++] = v * 0x7fff;
      if (this.n === ${CHUNK}) {
        this.port.postMessage({ pcm: this.out.buffer, rms: Math.sqrt(this.sum / ${CHUNK}) }, [this.out.buffer]);
        this.out = new Int16Array(${CHUNK}); this.n = 0; this.sum = 0;
      }
      this.pos += this.step;
    }
    this.pos -= ch.length;
    return true;
  }
}
registerProcessor('pcm-capture', PcmCapture);
`

export function bytesToBase64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

/** base64 Int16 PCM → Float32 samples for an AudioBuffer. */
export function base64ToFloat32(b64: string): Float32Array<ArrayBuffer> {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  const pcm = new Int16Array(bytes.buffer, 0, bytes.length >> 1)
  const out = new Float32Array(pcm.length)
  for (let i = 0; i < pcm.length; i++) out[i] = pcm[i]! / 0x8000
  return out
}

/**
 * Cut the quiet before and after the learner's words, keeping `pad` chunks either side.
 * Azure's pronunciation scorer gives up after ~5 s of silence at the start, so an
 * untrimmed answer usually came back unscored. Returns [] when nothing was loud enough.
 */
export function trimQuiet(chunks: { pcm: Int16Array; rms: number }[], threshold: number, pad = 8): Int16Array[] {
  const first = chunks.findIndex((c) => c.rms >= threshold)
  if (first < 0) return []
  const last = chunks.findLastIndex((c) => c.rms >= threshold)
  return chunks.slice(Math.max(0, first - pad), last + pad + 1).map((c) => c.pcm)
}

/** Join PCM chunks, keeping at most the last `maxSamples`. */
export function joinPcm(chunks: Int16Array[], maxSamples: number): Int16Array {
  const total = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Int16Array(Math.min(total, maxSamples))
  let at = out.length
  for (let i = chunks.length - 1; i >= 0 && at > 0; i--) {
    const c = chunks[i]!
    const take = Math.min(c.length, at)
    out.set(c.subarray(c.length - take), at - take)
    at -= take
  }
  return out
}
