// One voice at a time on the page, like a messaging app: starting a player stops
// whatever was playing before (two voices at once sound garbled).
let stopCurrent: (() => void) | null = null

/** Call when a player starts; `stop` is that player's own stop function. */
export function takePlayback(stop: () => void) {
  if (stopCurrent && stopCurrent !== stop) stopCurrent()
  stopCurrent = stop
}

/** Call from the player's stop function. */
export function releasePlayback(stop: () => void) {
  if (stopCurrent === stop) stopCurrent = null
}

/**
 * The real length of a recording. Browser (MediaRecorder) WebM files report
 * `Infinity` until read to the end, which showed as "Infinity:NaN": seek far past
 * the end once so the browser works it out, then rewind. 0 when it can't tell.
 */
export function realDuration(audio: HTMLAudioElement, timeoutMs = 3000): Promise<number> {
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      audio.removeEventListener('durationchange', onChange)
      const d = audio.duration
      if (audio.currentTime > 0) audio.currentTime = 0
      resolve(Number.isFinite(d) && d > 0 ? d : 0)
    }
    const onChange = () => { if (Number.isFinite(audio.duration)) finish() }
    const onMeta = () => {
      if (Number.isFinite(audio.duration)) return finish()
      audio.addEventListener('durationchange', onChange)
      audio.currentTime = 1e101
    }
    audio.addEventListener('error', finish, { once: true })
    setTimeout(finish, timeoutMs)
    if (audio.readyState >= 1) onMeta()
    else audio.addEventListener('loadedmetadata', onMeta, { once: true })
  })
}
