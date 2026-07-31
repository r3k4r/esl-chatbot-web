import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '~~/stores/auth'

// idle       — no stream, no recording
// ready      — stream acquired (permission granted), waiting for user to start
// recording  — actively capturing audio
// review     — recording stopped, held locally for playback; nothing sent yet
// processing — audio sent, waiting for backend response
export type VoiceState = 'idle' | 'ready' | 'recording' | 'review' | 'processing'

export interface VoiceResult {
  sessionId: string
  clientMsgId: string
  transcript: string
  pronunciationScore?: number | null
  userMessage: { id: string; content: string; createdAt: string; wordCount?: number | null }
  assistantMessage: { id: string; content: string; createdAt: string }
  evaluation: Record<string, unknown> | null
  audioBase64?: string | null
}

export interface VoiceChatCallbacks {
  onTranscript?: (text: string, isFinal: boolean) => void
  onResult?: (result: VoiceResult) => void
  onTts?: (audioBase64: string) => void
  onError?: (code: string, message: string) => void
}

export function useVoiceChat() {
  const authStore = useAuthStore()

  // Read runtime config at composable init — useRuntimeConfig() only works in setup context
  const configUrl = (useRuntimeConfig().public.baseUrl as string) || 'http://localhost:8000/api/v1'
  const socketOrigin = new URL(configUrl).origin

  const voiceState = ref<VoiceState>('idle')
  const partialTranscript = ref('')
  const audioStream = ref<MediaStream | null>(null)
  /** Seconds elapsed in the current recording — drives the composer's timer. */
  const recordingSeconds = ref(0)
  /** Object URL of the just-stopped recording, for playback before sending. */
  const reviewUrl = ref<string | null>(null)
  /** Length of the recording being reviewed, in seconds. */
  const reviewSeconds = ref(0)

  let socket: Socket | null = null
  let recorder: MediaRecorder | null = null
  let activeSessionId: string | null = null
  let callbacks: VoiceChatCallbacks = {}
  // What recorder.onstop should do. The server buffers chunks as they stream in and
  // only acts on `voice:end`, so "stop" and "send" are genuinely separate steps.
  let stopMode: 'send' | 'review' | 'discard' = 'send'
  // Chunks kept client-side purely so the user can play the recording back. The copy
  // the server uses is the one it buffered during streaming — this is never uploaded.
  let localChunks: Blob[] = []
  let localMime = ''
  // The exact socket the chunks were streamed over. The server keys its buffer by
  // socket (a WeakMap in voice.socket.ts), so sending over a *different* socket after
  // a reconnect would find no audio.
  let activeSock: Socket | null = null
  let tickHandle: ReturnType<typeof setInterval> | null = null

  function startTimer() {
    recordingSeconds.value = 0
    if (tickHandle) clearInterval(tickHandle)
    tickHandle = setInterval(() => { recordingSeconds.value++ }, 1000)
  }

  function stopTimer() {
    if (tickHandle) { clearInterval(tickHandle); tickHandle = null }
  }

  // ── Socket ────────────────────────────────────────────────────────────────

  function getSocket(): Promise<Socket> {
    return new Promise((resolve, reject) => {
      if (socket?.connected) { resolve(socket); return }

      if (socket) {
        socket.removeAllListeners()
        socket.disconnect()
        socket = null
      }

      const token = authStore.getAccessToken

      socket = io(`${socketOrigin}/chat`, {
        auth: { token },
        transports: ['websocket'],
        timeout: 8000,
      })

      socket.once('connect', () => {
        console.log('[voice] socket connected to', socketOrigin)
        attachSocketHandlers(socket!)
        resolve(socket!)
      })
      socket.once('connect_error', (err) => {
        console.error('[voice] socket connect_error:', err.message)
        reject(err)
      })
    })
  }

  function attachSocketHandlers(sock: Socket) {
    sock.off('voice:partial_transcript')
    sock.off('voice:transcript')
    sock.off('message:response')
    sock.off('voice:tts')
    sock.off('voice:error')
    sock.off('disconnect')

    sock.on('voice:partial_transcript', ({ sessionId, text, isFinal }: { sessionId: string; text: string; isFinal: boolean }) => {
      if (sessionId !== activeSessionId) return
      partialTranscript.value = text
      callbacks.onTranscript?.(text, isFinal)
    })

    sock.on('voice:transcript', ({ sessionId, transcript }: { sessionId: string; transcript: string }) => {
      if (sessionId !== activeSessionId) return
      partialTranscript.value = transcript
    })

    sock.on('message:response', (payload: VoiceResult) => {
      if (payload.sessionId !== activeSessionId) return
      // Turn complete. The mic stream stays open across turns, so if it's still
      // live we're immediately 'ready' for the next turn; only fall back to
      // 'idle' when the stream has been released (call ended). Leaving this at
      // 'idle' while the stream was open is what stalled turn 2 (startRecording
      // used to require exactly 'ready').
      voiceState.value = audioStream.value ? 'ready' : 'idle'
      partialTranscript.value = ''
      callbacks.onResult?.(payload)
    })

    sock.on('voice:tts', ({ sessionId, audioBase64 }: { sessionId: string; audioBase64: string }) => {
      if (sessionId !== activeSessionId) return
      callbacks.onTts?.(audioBase64)
    })

    sock.on('voice:error', ({ code, message }: { code: string; message: string }) => {
      console.error('[voice:error]', code, message)
      abortRecorder()
      stopTimer()
      clearReview()
      partialTranscript.value = ''
      // The mic stream survives an error — stay 'ready' so the user can retry
      // straight away instead of re-triggering the permission prompt.
      voiceState.value = audioStream.value ? 'ready' : 'idle'
      callbacks.onError?.(code, message)
    })

    sock.on('disconnect', () => {
      // A recording held for review is also lost: the server buffers per socket, so
      // once this one is gone there is nothing left to claim with voice:end.
      if (voiceState.value === 'recording' || voiceState.value === 'review' || voiceState.value === 'processing') {
        const wasReviewing = voiceState.value === 'review'
        abortRecorder()
        stopTimer()
        clearReview()
        voiceState.value = audioStream.value ? 'ready' : 'idle'
        callbacks.onError?.(
          'DISCONNECT',
          wasReviewing
            ? 'Connection dropped — that recording was lost. Please record again.'
            : 'Connection lost',
        )
      }
    })
  }

  // ── Recorder helpers ──────────────────────────────────────────────────────

  function abortRecorder() {
    if (recorder) {
      recorder.onstop = null
      if (recorder.state !== 'inactive') recorder.stop()
      recorder = null
    }
    stopMode = 'send'
  }

  /** Drop the locally held playback copy and free its object URL. */
  function clearReview() {
    if (reviewUrl.value) URL.revokeObjectURL(reviewUrl.value)
    reviewUrl.value = null
    reviewSeconds.value = 0
    localChunks = []
  }

  // ── Phase 1: acquire mic permission + open stream ─────────────────────────

  async function acquireStream(): Promise<boolean> {
    if (audioStream.value) { voiceState.value = 'ready'; return true }
    try {
      audioStream.value = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      voiceState.value = 'ready'
      return true
    } catch {
      return false
    }
  }

  // ── Phase 2: start recording on the already-open stream ───────────────────

  async function startRecording(sessionId: string, cb: VoiceChatCallbacks = {}) {
    // Gate on the stream, not an exact state: the mic stream stays open across
    // turns, so a new turn can begin from 'ready' (first turn) OR 'idle' (after
    // a completed turn). Only refuse when there's no stream or a turn is already
    // in flight — otherwise turn 2+ would never start (the infinite-listening bug).
    if (!audioStream.value) return
    if (voiceState.value === 'recording' || voiceState.value === 'review' || voiceState.value === 'processing') return
    callbacks = cb
    activeSessionId = sessionId
    partialTranscript.value = ''
    stopMode = 'send'
    clearReview()

    let sock: Socket
    try {
      sock = await getSocket()
    } catch {
      voiceState.value = 'ready'
      return
    }

    const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']
      .find((m) => MediaRecorder.isTypeSupported(m)) ?? ''

    recorder = new MediaRecorder(audioStream.value, mimeType ? { mimeType } : undefined)
    const finalMime = recorder.mimeType || mimeType
    localMime = finalMime
    activeSock = sock

    console.log('[voice] starting — sessionId:', sessionId, 'mimeType:', finalMime)
    sock.emit('voice:start', { sessionId, mimeType: finalMime })

    let chunkCount = 0
    recorder.ondataavailable = (e) => {
      if (!e.data.size) return
      // Keep a local copy for playback regardless of socket state.
      localChunks.push(e.data)
      if (!sock.connected) return
      const reader = new FileReader()
      reader.onloadend = () => {
        const b64 = (reader.result as string).split(',')[1]
        if (b64 && sock.connected) {
          chunkCount++
          sock.emit('voice:chunk', { sessionId, data: b64 })
        }
      }
      reader.readAsDataURL(e.data)
    }

    recorder.onstop = () => {
      stopTimer()
      const mode = stopMode
      stopMode = 'send'

      // Discard: the buffered audio is simply never claimed. We deliberately do NOT
      // emit voice:end — that event is what runs the (paid) STT→LLM→TTS pipeline.
      // The server drops its own buffer on the next voice:start for this session,
      // or on disconnect.
      if (mode === 'discard') {
        console.log('[voice] discarded — no voice:end emitted, chunks buffered:', chunkCount)
        clearReview()
        partialTranscript.value = ''
        voiceState.value = audioStream.value ? 'ready' : 'idle'
        return
      }

      // Review: same as discard in that nothing is sent yet, but the local copy is
      // kept so the user can listen back and then decide.
      if (mode === 'review') {
        console.log('[voice] stopped for review — chunks buffered:', chunkCount)
        reviewSeconds.value = recordingSeconds.value
        if (localChunks.length) {
          reviewUrl.value = URL.createObjectURL(new Blob(localChunks, { type: localMime }))
        }
        voiceState.value = 'review'
        return
      }

      console.log('[voice] stopped — sending voice:end, chunks sent:', chunkCount)
      if (sock.connected) sock.emit('voice:end', { sessionId })
      clearReview()
      voiceState.value = 'processing'
    }

    recorder.onerror = () => {
      abortRecorder()
      stopTimer()
      voiceState.value = 'ready'
      callbacks.onError?.('RECORDER_ERROR', 'Recording failed. Please try again.')
    }

    recorder.start(250)
    voiceState.value = 'recording'
    startTimer()
  }

  /** Stop recording AND send it straight for processing. */
  function stopRecording() {
    if (voiceState.value !== 'recording' || !recorder) return
    stopMode = 'send'
    if (recorder.state !== 'inactive') recorder.stop()
    recorder = null
  }

  /** Stop recording but send nothing — hold it for playback (the Stop button). */
  function stopForReview() {
    if (voiceState.value !== 'recording' || !recorder) return
    stopMode = 'review'
    if (recorder.state !== 'inactive') recorder.stop()
    recorder = null
  }

  /**
   * Send a recording that's being reviewed. The audio is already on the server from
   * the chunk stream, so this only has to claim it — but it must go over the SAME
   * socket, since the server keys its buffer by socket.
   */
  function sendReviewed(): boolean {
    if (voiceState.value !== 'review') return false
    if (!activeSessionId || !activeSock?.connected) {
      clearReview()
      voiceState.value = audioStream.value ? 'ready' : 'idle'
      callbacks.onError?.('DISCONNECT', 'Connection dropped — that recording was lost. Please record again.')
      return false
    }
    activeSock.emit('voice:end', { sessionId: activeSessionId })
    clearReview()
    partialTranscript.value = ''
    voiceState.value = 'processing'
    return true
  }

  /** Throw the audio away, from either recording or review (the Discard button). */
  function cancelRecording() {
    if (voiceState.value === 'review') {
      clearReview()
      partialTranscript.value = ''
      voiceState.value = audioStream.value ? 'ready' : 'idle'
      return
    }
    if (voiceState.value !== 'recording' || !recorder) return
    stopMode = 'discard'
    if (recorder.state !== 'inactive') recorder.stop()
    recorder = null
  }

  // ── Full teardown ─────────────────────────────────────────────────────────

  function release() {
    abortRecorder()
    stopTimer()
    clearReview()
    if (audioStream.value) {
      audioStream.value.getTracks().forEach((t) => t.stop())
      audioStream.value = null
    }
    socket?.disconnect()
    socket = null
    activeSock = null
    voiceState.value = 'idle'
    partialTranscript.value = ''
    recordingSeconds.value = 0
  }

  onBeforeUnmount(release)

  return {
    voiceState,
    partialTranscript,
    audioStream,
    recordingSeconds,
    reviewUrl,
    reviewSeconds,
    acquireStream,
    startRecording,
    stopRecording,
    stopForReview,
    sendReviewed,
    cancelRecording,
    release,
  }
}
