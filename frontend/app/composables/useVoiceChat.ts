import { io, type Socket } from 'socket.io-client'
import { useAuthStore } from '~~/stores/auth'

// idle       — no stream, no recording
// ready      — stream acquired (permission granted), waiting for user to start
// recording  — actively capturing audio
// processing — audio sent, waiting for backend response
export type VoiceState = 'idle' | 'ready' | 'recording' | 'processing'

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

  let socket: Socket | null = null
  let recorder: MediaRecorder | null = null
  let activeSessionId: string | null = null
  let callbacks: VoiceChatCallbacks = {}

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
      voiceState.value = 'idle'
      callbacks.onError?.(code, message)
    })

    sock.on('disconnect', () => {
      if (voiceState.value === 'recording' || voiceState.value === 'processing') {
        abortRecorder()
        voiceState.value = 'idle'
        callbacks.onError?.('DISCONNECT', 'Connection lost')
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
    if (voiceState.value === 'recording' || voiceState.value === 'processing') return
    callbacks = cb
    activeSessionId = sessionId
    partialTranscript.value = ''

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

    console.log('[voice] starting — sessionId:', sessionId, 'mimeType:', finalMime)
    sock.emit('voice:start', { sessionId, mimeType: finalMime })

    let chunkCount = 0
    recorder.ondataavailable = (e) => {
      if (!e.data.size || !sock.connected) return
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
      console.log('[voice] stopped — sending voice:end, chunks sent:', chunkCount)
      if (sock.connected) sock.emit('voice:end', { sessionId })
      voiceState.value = 'processing'
    }

    recorder.onerror = () => {
      abortRecorder()
      voiceState.value = 'ready'
      callbacks.onError?.('RECORDER_ERROR', 'Recording failed. Please try again.')
    }

    recorder.start(250)
    voiceState.value = 'recording'
  }

  function stopRecording() {
    if (voiceState.value !== 'recording' || !recorder) return
    if (recorder.state !== 'inactive') recorder.stop()
    recorder = null
  }

  // ── Full teardown ─────────────────────────────────────────────────────────

  function release() {
    abortRecorder()
    if (audioStream.value) {
      audioStream.value.getTracks().forEach((t) => t.stop())
      audioStream.value = null
    }
    socket?.disconnect()
    socket = null
    voiceState.value = 'idle'
    partialTranscript.value = ''
  }

  onBeforeUnmount(release)

  return {
    voiceState,
    partialTranscript,
    audioStream,
    acquireStream,
    startRecording,
    stopRecording,
    release,
  }
}
