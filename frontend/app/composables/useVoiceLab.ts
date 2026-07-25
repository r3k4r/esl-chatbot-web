import { toast } from 'vue-sonner'
import { useAuthStore } from '~~/stores/auth'
import { useVoiceChat, type VoiceResult } from '~/composables/useVoiceChat'
import { useSessions } from '~/composables/useSessions'
import { stripHtml } from '~/lib/utils'
import { getLimits } from '~/common/data/plan-limits'
import type {
  VoiceTurn,
  VoiceEvaluation,
  VoicePronunciation,
} from '~/common/types/voice-types'

// The Voice Lab is a hands-free live CALL with Tutelage AI.
//
// The backend pipeline is half-duplex (it processes a turn only on `voice:end`),
// so a real call feel is built here on the client: the mic stays open, on-device
// silence detection (VAD) auto-ends your turn after a pause, the AI reply plays
// automatically, and the mic resumes listening when it finishes. No tapping,
// no reading mid-conversation. The transcript is kept as a quiet record.
//
// Pronunciation scoring is GOLD/PREMIUM-only — `pronunciation` is null on FREE/dev.

// connecting → listening → thinking → speaking → listening … (until ended)
export type CallPhase = 'idle' | 'connecting' | 'listening' | 'thinking' | 'speaking' | 'ended'
// who currently holds the floor — drives the orb animation
export type Speaker = 'none' | 'user' | 'ai'

export function useVoiceLab() {
  const authStore = useAuthStore()
  const { createSession, listSessions } = useSessions()
  const {
    voiceState,
    partialTranscript,
    audioStream,
    acquireStream,
    startRecording,
    stopRecording,
    release,
  } = useVoiceChat()

  const plan = computed(() => authStore.getUser?.subscription?.plan ?? 'FREE')
  const subActive = computed(() => authStore.getUser?.subscription?.status === 'ACTIVE')
  const limits = computed(() => getLimits(plan.value))
  const pronunciationAvailable = computed(() => plan.value === 'GOLD' || plan.value === 'PREMIUM')

  // ─── Call state ──────────────────────────────────────────────────────────────
  const phase = ref<CallPhase>('idle')
  const speaker = ref<Speaker>('none')
  const muted = ref(false)
  const sessionId = ref<string | null>(null)
  const turns = ref<VoiceTurn[]>([])
  const liveTranscript = partialTranscript
  const level = ref(0) // 0–1 live mic loudness, drives the orb size

  const inCall = computed(() => phase.value !== 'idle' && phase.value !== 'ended')

  // Caption shown under the orb — live partial while listening, AI reply while speaking.
  const caption = computed(() => {
    if (phase.value === 'speaking') return lastTurn.value?.reply ?? ''
    if (phase.value === 'listening') return liveTranscript.value
    if (phase.value === 'thinking') return liveTranscript.value
    return ''
  })

  // ─── Derived scoring (coaching, shown after call / in log) ────────────────────
  const lastTurn = computed<VoiceTurn | null>(() => turns.value[turns.value.length - 1] ?? null)
  const lastEval = computed<VoiceEvaluation | null>(() => {
    for (let i = turns.value.length - 1; i >= 0; i--) if (turns.value[i]?.evaluation) return turns.value[i]!.evaluation
    return null
  })
  const lastPron = computed<VoicePronunciation | null>(() => {
    for (let i = turns.value.length - 1; i >= 0; i--) if (turns.value[i]?.pronunciation) return turns.value[i]!.pronunciation
    return null
  })

  const todaysVoiceSessions = ref(0)
  const dailyLimitReached = computed(() => todaysVoiceSessions.value >= limits.value.sessionsPerDay)

  // ─── Call timer ────────────────────────────────────────────────────────────────
  const callSeconds = ref(0)
  let callTimer: ReturnType<typeof setInterval> | null = null
  const callClock = computed(() => {
    const m = Math.floor(callSeconds.value / 60)
    const s = callSeconds.value % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  })

  // ─── Live mic meter + voice-activity detection (VAD) ─────────────────────────
  let audioCtx: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let rafId: number | null = null
  // VAD tuning
  const SPEECH_ON = 0.16   // rms above this = speaking
  const SILENCE_MS = 1400  // pause after speech that ends the turn
  let spokeThisTurn = false
  let silenceSince = 0

  function startMeter(stream: MediaStream) {
    stopMeter()
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      audioCtx = new Ctx()
      const src = audioCtx.createMediaStreamSource(stream)
      analyser = audioCtx.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.7
      src.connect(analyser)
      const buf = new Uint8Array(analyser.fftSize)
      const loop = () => {
        if (!analyser) return
        analyser.getByteTimeDomainData(buf)
        // RMS amplitude around the 128 mid-point
        let sum = 0
        for (let i = 0; i < buf.length; i++) {
          const v = ((buf[i] ?? 128) - 128) / 128
          sum += v * v
        }
        const rms = Math.sqrt(sum / buf.length)
        level.value = Math.min(1, rms * 3.2)

        // VAD only matters while actively listening and not muted
        if (phase.value === 'listening' && !muted.value) {
          if (rms >= SPEECH_ON) {
            spokeThisTurn = true
            silenceSince = 0
          } else if (spokeThisTurn) {
            if (silenceSince === 0) silenceSince = performance.now()
            else if (performance.now() - silenceSince >= SILENCE_MS) endTurn()
          }
        }
        rafId = requestAnimationFrame(loop)
      }
      rafId = requestAnimationFrame(loop)
    } catch {
      // Web Audio unavailable — VAD won't fire; user can still End the call.
    }
  }

  function stopMeter() {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null }
    analyser = null
    level.value = 0
  }

  watch(audioStream, (s) => { if (s) startMeter(s) })

  // ─── Turn lifecycle ──────────────────────────────────────────────────────────
  function beginListening() {
    if (!sessionId.value || !inCall.value) return
    spokeThisTurn = false
    silenceSince = 0
    speaker.value = 'user'
    phase.value = 'listening'
    startRecording(sessionId.value, {
      onResult: handleResult,
      onTts: handleTts,
      onError: handleError,
    })
  }

  function endTurn() {
    if (voiceState.value !== 'recording') return
    spokeThisTurn = false
    silenceSince = 0
    phase.value = 'thinking'
    speaker.value = 'none'
    stopRecording() // → backend processes → onResult / onTts
  }

  function handleResult(result: VoiceResult) {
    const ev = (result.evaluation ?? null) as Record<string, unknown> | null
    const pron = (result as unknown as { pronunciation?: VoicePronunciation | null }).pronunciation ?? null
    turns.value.push({
      id: result.userMessage?.id ?? `turn-${Date.now()}`,
      transcript: result.transcript || result.userMessage?.content || '',
      // AI replies are sanitized HTML; the caption and transcript are plain-text
      // surfaces, so strip tags here (once) — the spoken audio is unaffected.
      reply: stripHtml(result.assistantMessage?.content ?? ''),
      replyAudioBase64: result.audioBase64 ?? null,
      evaluation: ev ? toEval(ev, result.pronunciationScore ?? null) : null,
      pronunciation: pronunciationAvailable.value ? pron : null,
      at: result.assistantMessage?.createdAt ?? new Date().toISOString(),
    })
    // If TTS audio rode along in the result, play immediately; otherwise wait for onTts.
    if (result.audioBase64) speak(result.audioBase64)
    else if (inCall.value) {
      // No audio (TTS unavailable) — let the user read the reply briefly, then resume.
      phase.value = 'speaking'
      speaker.value = 'ai'
      window.setTimeout(() => resumeAfterReply(), 1800)
    }
  }

  function handleTts(audioBase64: string) {
    const t = turns.value[turns.value.length - 1]
    if (t && !t.replyAudioBase64) t.replyAudioBase64 = audioBase64
    speak(audioBase64)
  }

  function handleError(code: string, message: string) {
    if (code === 'NO_SPEECH') {
      // Empty turn — quietly go back to listening, no scary error.
      if (inCall.value) beginListening()
      return
    }
    if (code === 'LIMIT_REACHED') {
      toast.error(message || 'Session limit reached.')
      hangUp()
      return
    }
    toast.error(message || 'Something went wrong on the call.')
    if (inCall.value) beginListening()
  }

  // ─── AI playback ───────────────────────────────────────────────────────────────
  let callAudio: HTMLAudioElement | null = null
  function speak(audioBase64: string) {
    if (!inCall.value) return
    phase.value = 'speaking'
    speaker.value = 'ai'
    stopPlayback()
    callAudio = new Audio(`data:audio/mpeg;base64,${audioBase64}`)
    callAudio.onended = () => resumeAfterReply()
    callAudio.onerror = () => resumeAfterReply()
    callAudio.play().catch(() => resumeAfterReply())
  }
  function stopPlayback() {
    if (callAudio) { callAudio.pause(); callAudio = null }
  }
  function resumeAfterReply() {
    stopPlayback()
    if (inCall.value) beginListening()
  }

  // ─── Public controls ─────────────────────────────────────────────────────────
  async function startCall() {
    if (inCall.value) return
    if (!subActive.value) { toast.error('You need an active plan to use the Voice Lab.'); return }
    if (dailyLimitReached.value) {
      toast.error(`Daily session limit reached (${limits.value.sessionsPerDay}/day on ${plan.value}).`)
      return
    }
    phase.value = 'connecting'
    speaker.value = 'none'

    const granted = await acquireStream()
    if (!granted) {
      phase.value = 'idle'
      toast.error('Microphone access is needed for the Voice Lab.')
      return
    }

    const sid = await ensureSession()
    if (!sid) { phase.value = 'idle'; return }

    callSeconds.value = 0
    callTimer = setInterval(() => { callSeconds.value += 1 }, 1000)
    beginListening()
  }

  function toggleMute() {
    muted.value = !muted.value
    // While muted, freeze VAD so a turn never auto-sends; resume cleanly on unmute.
    if (!muted.value && phase.value === 'listening') { spokeThisTurn = false; silenceSince = 0 }
  }

  function hangUp() {
    phase.value = 'ended'
    speaker.value = 'none'
    if (callTimer) { clearInterval(callTimer); callTimer = null }
    stopPlayback()
    if (voiceState.value === 'recording') stopRecording()
    stopMeter()
    release()
    // brief 'ended' beat so the UI can show a hang-up state, then idle
    window.setTimeout(() => { if (phase.value === 'ended') phase.value = 'idle' }, 400)
  }

  async function ensureSession(): Promise<string | null> {
    if (sessionId.value) return sessionId.value
    const res = await createSession({ mode: 'VOICE', topic: 'Voice Lab call' })
    if (!res.success || !res.data?.data) {
      if (res.status === 403) toast.error('You need an active subscription to practice.')
      else if (res.status === 429) toast.error('Daily session limit reached.')
      else toast.error(res.message || 'Could not start a voice session')
      return null
    }
    sessionId.value = res.data.data.id
    todaysVoiceSessions.value += 1
    return sessionId.value
  }

  function toEval(raw: Record<string, unknown>, pronScore: number | null): VoiceEvaluation {
    const n = (k: string) => (typeof raw[k] === 'number' ? (raw[k] as number) : 0)
    return {
      grammarScore: n('grammarScore'),
      vocabularyScore: n('vocabularyScore'),
      vocabularyLevel: String(raw.vocabularyLevel ?? '—'),
      fluencyScore: n('fluencyScore'),
      overallScore: n('overallScore'),
      detectedCefrLevel: String(raw.detectedCefrLevel ?? '—'),
      feedback: String(raw.feedback ?? ''),
      pronunciationScore: typeof raw.pronunciationScore === 'number' ? (raw.pronunciationScore as number) : pronScore,
    }
  }

  onMounted(async () => {
    const res = await listSessions({ limit: 50 })
    if (res.success && res.data?.data) {
      const today = new Date().toDateString()
      todaysVoiceSessions.value = res.data.data.filter(
        (s) => s.mode === 'VOICE' && new Date(s.createdAt).toDateString() === today,
      ).length
    }
  })

  onBeforeUnmount(() => {
    if (callTimer) clearInterval(callTimer)
    stopPlayback()
    stopMeter()
    release()
  })

  return {
    // call state
    phase,
    speaker,
    muted,
    inCall,
    level,
    caption,
    liveTranscript,
    turns,
    callClock,
    // gating / scoring
    plan,
    subActive,
    pronunciationAvailable,
    dailyLimitReached,
    lastEval,
    lastPron,
    // controls
    startCall,
    toggleMute,
    hangUp,
  }
}
