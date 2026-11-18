import { toast } from 'vue-sonner'
import { useAuthStore } from '~~/stores/auth'
import { useSessions } from '~/composables/useSessions'
import { useLiveAudio } from '~/composables/useLiveAudio'
import { LIVE_IN_RATE, bytesToBase64, joinPcm, trimQuiet } from '~/lib/pcm'
import type { SessionUsage } from '~/common/types/chat-types'
import type { CallLock, CallPhase, CallSpeaker, VoiceTurn } from '~/common/types/voice-types'

// The Voice Lab: a real-time call with Gemini Live, like a phone call. The browser talks
// to Google directly with a one-use token from POST /live/calls (locked to our model and
// tutor instructions). Google decides when the learner has finished and stops the tutor
// when they talk over it; no buttons. After each exchange the two transcripts and the
// learner's audio go to POST /live/calls/:id/turns, which saves, scores and applies limits.

const LIVE_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained'
const MAX_TURN_AUDIO = 30 * LIVE_IN_RATE // the learner's last 30 s per answer
const TALKING_RMS = 0.02

type LiveMessage = {
  setupComplete?: object
  goAway?: object
  serverContent?: {
    modelTurn?: { parts?: { inlineData?: { data: string } }[] }
    inputTranscription?: { text?: string }
    outputTranscription?: { text?: string }
    interrupted?: boolean
    turnComplete?: boolean
  }
}

export function useLiveCall() {
  const authStore = useAuthStore()
  const { getUsage, startLiveCall, saveLiveTurn, endSession } = useSessions()
  const audio = useLiveAudio()

  // ─── Plan & usage ──────────────────────────────────────────────────────────
  const usage = ref<SessionUsage | null>(null)
  const plan = computed(() => usage.value?.plan ?? authStore.getUser?.subscription?.plan ?? 'FREE')
  const pronunciationAvailable = computed(() => plan.value === 'GOLD' || plan.value === 'PREMIUM')
  const lock = computed<CallLock>(() => {
    const u = usage.value
    if (!u) return null
    if (!u.active) return authStore.getUser?.emailVerified === false ? 'verify' : 'inactive'
    if (u.reason === 'SESSION_LIMIT') return 'sessions'
    if (u.reason === 'MESSAGE_LIMIT') return 'messages'
    return null
  })
  async function refreshUsage() {
    const res = await getUsage()
    if (res.success && res.data?.data) usage.value = res.data.data
  }

  // ─── Call state ────────────────────────────────────────────────────────────
  const phase = ref<CallPhase>('idle')
  const inCall = computed(() => phase.value !== 'idle')
  const speaker = ref<CallSpeaker>('none')
  const level = ref(0)
  const muted = ref(false)
  const learnerCaption = ref('')
  const tutorCaption = ref('')
  const turns = ref<VoiceTurn[]>([])
  const lastEval = computed(() => turns.value.findLast((t) => t.evaluation)?.evaluation ?? null)
  const lastPron = computed(() => turns.value.findLast((t) => t.pronunciation)?.pronunciation ?? null)
  const scoring = computed(() => turns.value.some((t) => t.scoring))
  const seconds = ref(0)
  const callClock = computed(() => `${String(Math.floor(seconds.value / 60)).padStart(2, '0')}:${String(seconds.value % 60).padStart(2, '0')}`)

  let ws: WebSocket | null = null
  let micStream: MediaStream | null = null
  let sessionId: string | null = null
  let clock: ReturnType<typeof setInterval> | null = null
  let raf: number | null = null
  let micLevel = 0
  let lastVoiceAt = 0
  // The learner's audio since the tutor's last reply began (never while the tutor talks,
  // so its voice coming back through the speakers isn't scored as theirs).
  let heard: { pcm: Int16Array; rms: number }[] = []
  let answerAudio: Int16Array | null = null
  let tutorReplying = false
  let endWhenQuiet = false
  const saving = new Set<Promise<unknown>>()

  // ─── Live connection ───────────────────────────────────────────────────────
  function onMessage(m: LiveMessage) {
    if (m.setupComplete) {
      phase.value = 'live'
      clock = setInterval(() => { seconds.value += 1 }, 1000)
      ws?.send(JSON.stringify({ realtimeInput: { text: '(The student has joined the call.)' } }))
      return
    }
    if (m.goAway) toast.message('The call will end in a moment.')
    const c = m.serverContent
    if (!c) return
    if (c.inputTranscription?.text) learnerCaption.value += c.inputTranscription.text
    if (c.modelTurn?.parts?.length) {
      if (!tutorReplying) { // a new reply: what the learner said before it is their answer
        tutorReplying = true
        tutorCaption.value = ''
        answerAudio = joinPcm(trimQuiet(heard, TALKING_RMS), MAX_TURN_AUDIO)
        heard = []
      }
      for (const p of c.modelTurn.parts) if (p.inlineData?.data) audio.play(p.inlineData.data)
    }
    if (c.outputTranscription?.text) tutorCaption.value += c.outputTranscription.text
    if (c.interrupted) audio.flush()
    if (c.turnComplete) finishExchange()
  }

  function finishExchange() {
    tutorReplying = false
    const user = learnerCaption.value.trim()
    const tutor = tutorCaption.value.trim()
    learnerCaption.value = ''
    if (!user) {
      if (tutor && !turns.value.length) turns.value.push({ id: 'greeting', transcript: '', reply: tutor, evaluation: null, pronunciation: null, scoring: false })
      return
    }
    const turn = reactive<VoiceTurn>({ id: crypto.randomUUID(), transcript: user, reply: tutor, evaluation: null, pronunciation: null, scoring: true })
    turns.value.push(turn)
    const pcm = answerAudio
    answerAudio = null
    save(turn, pcm)
  }

  function save(turn: VoiceTurn, pcm: Int16Array | null) {
    if (!sessionId) return
    const body = { user: turn.transcript, tutor: turn.reply, audio: pcm?.length ? bytesToBase64(new Uint8Array(pcm.buffer)) : undefined }
    const p = saveLiveTurn(sessionId, body).then((res) => {
      turn.scoring = false
      if (res.success && res.data?.data) {
        turn.evaluation = res.data.data.evaluation
        turn.pronunciation = pronunciationAvailable.value ? res.data.data.pronunciation : null
        if (usage.value) usage.value.messagesToday += 1
        if (res.data.data.remainingMessages === 0) {
          toast.message("That was today's last free message. See you tomorrow, or upgrade for more.")
          endWhenQuiet = true
        }
      } else if (res.status === 429) {
        toast.error(res.message || "You've reached today's limit.")
        endWhenQuiet = true
      }
    })
    saving.add(p)
    p.finally(() => saving.delete(p))
  }

  // Orb + who is talking, every frame.
  function tick() {
    const tutorTalking = audio.playing()
    if (micLevel > TALKING_RMS && !muted.value) lastVoiceAt = performance.now()
    const learnerTalking = performance.now() - lastVoiceAt < 400
    speaker.value = tutorTalking ? 'tutor' : learnerTalking ? 'learner' : 'none'
    level.value = tutorTalking ? audio.tutorLevel() : learnerTalking ? Math.min(1, micLevel * 6) : 0
    if (endWhenQuiet && !tutorTalking) hangUp()
    raf = requestAnimationFrame(tick)
  }

  // ─── Controls ──────────────────────────────────────────────────────────────
  async function startCall() {
    if (inCall.value || lock.value) return
    audio.open() // inside the tap, before any await
    phase.value = 'connecting'
    turns.value = []
    seconds.value = 0

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 },
      })
    } catch {
      phase.value = 'idle'
      audio.close()
      toast.error('Allow microphone access to call Tutelage AI.')
      return
    }

    const res = await startLiveCall()
    if (!res.success || !res.data?.data) {
      stream.getTracks().forEach((t) => t.stop())
      phase.value = 'idle'
      audio.close()
      toast.error(res.message || 'Could not start the call. Please try again.')
      refreshUsage()
      return
    }
    const { sessionId: id, token, model } = res.data.data
    sessionId = id
    if (usage.value) usage.value.sessionsToday += 1

    micStream = stream
    await audio.startMic(stream, (pcm, rms) => {
      micLevel = rms
      if (muted.value || phase.value !== 'live' || ws?.readyState !== WebSocket.OPEN) return
      if (!audio.playing()) {
        heard.push({ pcm, rms })
        if (heard.length > MAX_TURN_AUDIO / pcm.length) heard.shift()
      }
      ws.send(JSON.stringify({ realtimeInput: { audio: { data: bytesToBase64(new Uint8Array(pcm.buffer)), mimeType: `audio/pcm;rate=${LIVE_IN_RATE}` } } }))
    })

    ws = new WebSocket(`${LIVE_URL}?access_token=${encodeURIComponent(token)}`)
    ws.binaryType = 'arraybuffer'
    ws.onopen = () => ws?.send(JSON.stringify({ setup: { model: `models/${model}` } }))
    ws.onmessage = (e) => onMessage(JSON.parse(typeof e.data === 'string' ? e.data : new TextDecoder().decode(e.data)))
    ws.onclose = (e) => {
      if (!inCall.value) return
      if (e.code !== 1000) toast.error(e.reason ? `The call ended: ${e.reason}` : 'The call was disconnected.')
      hangUp()
    }
    raf = requestAnimationFrame(tick)
  }

  function toggleMute() {
    muted.value = !muted.value
    // Tell Google the mic went quiet, so it doesn't wait for the rest of a sentence.
    if (muted.value && ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }))
  }

  function hangUp() {
    if (!inCall.value) return
    // Words said after the tutor's last answer still count as a turn.
    if (learnerCaption.value.trim()) { answerAudio = joinPcm(trimQuiet(heard, TALKING_RMS), MAX_TURN_AUDIO); tutorCaption.value = ''; finishExchange() }
    phase.value = 'idle'
    speaker.value = 'none'
    level.value = 0
    muted.value = false
    endWhenQuiet = false
    tutorReplying = false
    heard = []
    if (clock) { clearInterval(clock); clock = null }
    if (raf !== null) { cancelAnimationFrame(raf); raf = null }
    const socket = ws
    ws = null
    socket?.close(1000)
    micStream?.getTracks().forEach((t) => t.stop())
    micStream = null
    audio.close()
    const id = sessionId
    sessionId = null
    // Close the session once its last turns are saved, so its summary includes them.
    if (id) Promise.allSettled([...saving]).then(() => endSession(id)).finally(refreshUsage)
  }

  onMounted(refreshUsage)
  onBeforeUnmount(hangUp)

  return {
    usage, lock, pronunciationAvailable,
    phase, inCall, speaker, level, muted, callClock, learnerCaption, tutorCaption,
    turns, lastEval, lastPron, scoring,
    startCall, toggleMute, hangUp,
  }
}
