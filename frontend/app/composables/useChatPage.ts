import { toast } from 'vue-sonner'
import { useAuthStore } from '~~/stores/auth'
import type { ChatSession, ChatMessage } from '~/common/types/dashboard-types'
import type {
  SessionListItem,
  SessionDetail,
  ChatMessage as ApiChatMessage,
} from '~/common/types/chat-types'
import { getLimits } from '~/common/data/plan-limits'
import { useVoiceChat } from '~/composables/useVoiceChat'

export function useChatPage() {
  const authStore = useAuthStore()
  const { listSessions, createSession, getSession, sendMessage, endSession } = useSessions()
  const {
    voiceState,
    partialTranscript,
    audioStream,
    recordingSeconds,
    acquireStream,
    startRecording,
    stopRecording,
    cancelRecording,
  } = useVoiceChat()
  const route = useRoute()
  const router = useRouter()

  const userInitial = computed(() => {
    const name = authStore.getUser?.username ?? authStore.getUser?.email ?? 'U'
    return name.charAt(0).toUpperCase()
  })

  const plan = computed(() => authStore.getUser?.subscription?.plan ?? 'FREE')
  const limits = computed(() => getLimits(plan.value))
  const subActive = computed(() => authStore.getUser?.subscription?.status === 'ACTIVE')

  // ─── State ───────────────────────────────────────────────────────────────
  const rawSessions = ref<SessionListItem[]>([])
  const sessions = ref<ChatSession[]>([])
  const activeSessionId = ref<string | null>(null)
  const activeSession = ref<SessionDetail | null>(null)

  const messages = ref<ChatMessage[]>([])
  const messageEntities = ref<ApiChatMessage[]>([])

  const input = ref('')
  const search = ref('')
  const thinking = ref(false)
  const sending = ref(false)
  const ending = ref(false)
  const creating = ref(false)
  const refreshing = ref(false)

  const threadRef = ref<{ scrollEl: HTMLElement | null } | null>(null)
  const composerRef = ref<{ focus: () => void } | null>(null)

  function focusComposer() {
    nextTick(() => composerRef.value?.focus())
  }

  // ─── Derived ─────────────────────────────────────────────────────────────
  const userMessageCount = computed(() => messageEntities.value.filter((m) => m.role === 'USER').length)

  const lastEval = computed(() => {
    for (let i = messageEntities.value.length - 1; i >= 0; i--) {
      const e = messageEntities.value[i]
      if (e?.role === 'USER' && e.evaluation) return e.evaluation
    }
    return null
  })

  const cefrLabel = computed(() => lastEval.value?.detectedCefrLevel ?? '—')
  const accuracyLabel = computed(() => {
    const evals = messageEntities.value
      .filter((m) => m.role === 'USER' && m.evaluation)
      .map((m) => m.evaluation!)
    if (!evals.length) return '—'
    const avg = evals.reduce((a, b) => a + (b.overallScore ?? 0), 0) / evals.length
    return `${Math.round(avg)}%`
  })

  const isSessionEnded = computed(() => !!activeSession.value?.endedAt)
  const hardCapReached = computed(() => userMessageCount.value >= limits.value.messagesPerSessionHard)
  const composerDisabled = computed(
    () => sending.value || thinking.value || isSessionEnded.value || hardCapReached.value || !subActive.value,
  )
  const isRecording = computed(() => voiceState.value === 'recording')
  const isTranscribing = computed(() => voiceState.value === 'processing')
  /** The mic is unusable for the same reasons the text box is — plus mid-turn. */
  const micDisabled = computed(() => composerDisabled.value || isTranscribing.value)
  /** Send is live for a typed message OR for a recording that's ready to go. */
  const canSend = computed(() => {
    if (isRecording.value) return true
    return !composerDisabled.value && !!input.value.trim()
  })
  const recordingClock = computed(() => {
    const m = Math.floor(recordingSeconds.value / 60)
    const s = recordingSeconds.value % 60
    return `${m}:${String(s).padStart(2, '0')}`
  })
  /** Populated once a session ends — drives the end-of-session summary panel. */
  const sessionEvaluation = computed(() => activeSession.value?.evaluation ?? null)

  const todaysCount = computed(() => {
    const today = new Date().toDateString()
    return rawSessions.value.filter((s) => new Date(s.createdAt).toDateString() === today).length
  })
  const dailyLimitReached = computed(() => todaysCount.value >= limits.value.sessionsPerDay)

  const filteredSessions = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return sessions.value
    return sessions.value.filter(
      (s) => s.title.toLowerCase().includes(q) || s.preview.toLowerCase().includes(q),
    )
  })

  const todayList = computed(() => {
    const today = new Date().toDateString()
    return filteredSessions.value.filter((s) => {
      const raw = rawSessions.value.find((r) => r.id === s.id)
      return raw ? new Date(raw.createdAt).toDateString() === today : false
    })
  })
  const earlierList = computed(() => {
    const today = new Date().toDateString()
    return filteredSessions.value.filter((s) => {
      const raw = rawSessions.value.find((r) => r.id === s.id)
      return raw ? new Date(raw.createdAt).toDateString() !== today : false
    })
  })

  // ─── Timer ───────────────────────────────────────────────────────────────
  const sessionTimer = ref('00:00')
  let timerHandle: ReturnType<typeof setInterval> | null = null

  function fmtTimer() {
    if (!activeSession.value) { sessionTimer.value = '00:00'; return }
    const start = new Date(activeSession.value.startedAt).getTime()
    // An ended session freezes at its final duration instead of ticking forever.
    const until = activeSession.value.endedAt
      ? new Date(activeSession.value.endedAt).getTime()
      : Date.now()
    const diff = Math.max(0, Math.floor((until - start) / 1000))
    const m = String(Math.floor(diff / 60)).padStart(2, '0')
    const s = String(diff % 60).padStart(2, '0')
    sessionTimer.value = `${m}:${s}`
  }

  watch(activeSessionId, () => {
    if (timerHandle) clearInterval(timerHandle)
    fmtTimer()
    timerHandle = setInterval(fmtTimer, 1000)
  })
  onBeforeUnmount(() => { if (timerHandle) clearInterval(timerHandle) })

  // ─── Scroll ──────────────────────────────────────────────────────────────
  function scrollBottom() {
    nextTick(() => {
      const el = threadRef.value?.scrollEl
      if (el) el.scrollTop = el.scrollHeight
    })
  }
  watch([() => messages.value.length, thinking], scrollBottom)

  // ─── Formatters ──────────────────────────────────────────────────────────
  function fmtTime(iso: string) {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function fmtWhen(iso: string) {
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const min = Math.floor((Date.now() - d.getTime()) / 60000)
    if (min < 1) return 'Now'
    if (min < 60) return `${min}m`
    const h = Math.floor(min / 60)
    if (h < 24) return `${h}h`
    const days = Math.floor(h / 24)
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days}d`
    if (days < 30) return `${Math.floor(days / 7)}w`
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  function toChatSession(s: SessionListItem): ChatSession {
    return {
      id: s.id,
      title: s.topic || 'Open conversation',
      when: fmtWhen(s.startedAt || s.createdAt),
      active: s.id === activeSessionId.value,
      preview: s.summary || (s.endedAt ? 'Session ended' : `${s.messageCount} messages`),
    }
  }

  function toChatMessage(m: ApiChatMessage): ChatMessage {
    const c = m.evaluation?.corrections?.[0]
    return {
      who: m.role === 'USER' ? 'user' : 'ai',
      text: m.content,
      time: fmtTime(m.createdAt),
      type: m.type,
      audioUrl: m.audioUrl ?? null,
      correction: c
        ? { original: c.original ?? '', suggested: c.corrected ?? '', why: c.explanation ?? '' }
        : undefined,
    }
  }

  function rebuildSessions() {
    sessions.value = rawSessions.value.map(toChatSession)
  }

  async function streamReveal(targetIndex: number, fullText: string) {
    const total = fullText.length
    const stepDelay = total > 400 ? 8 : total > 150 ? 14 : 22
    for (let i = 1; i <= total; i++) {
      if (!messages.value[targetIndex]) return
      messages.value[targetIndex].text = fullText.slice(0, i)
      if (i % 3 === 0) await new Promise((r) => setTimeout(r, stepDelay))
    }
  }

  // ─── Session helpers ──────────────────────────────────────────────────────
  async function ensureSession(): Promise<string | null> {
    if (activeSessionId.value) return activeSessionId.value
    if (dailyLimitReached.value) {
      toast.error(`Daily session limit reached (${limits.value.sessionsPerDay}/day on ${plan.value}).`)
      return null
    }
    creating.value = true
    const res = await createSession({ mode: 'TEXT', topic: null })
    creating.value = false
    if (!res.success) {
      if (res.status === 403) toast.error('You need an active subscription to start a session.')
      else if (res.status === 429) toast.error('Daily session limit reached.')
      else toast.error(res.message || 'Could not start session')
      return null
    }
    const session = res.data?.data
    if (!session) return null
    rawSessions.value = [session, ...rawSessions.value]
    activeSessionId.value = session.id
    activeSession.value = { ...session, messages: [], evaluation: null }
    messageEntities.value = []
    messages.value = []
    rebuildSessions()
    return session.id
  }

  // ─── API actions ──────────────────────────────────────────────────────────
  async function loadSessions(autoPick = false) {
    const res = await listSessions({ limit: 30 })
    if (!res.success) return
    rawSessions.value = res.data?.data ?? []
    rebuildSessions()
    if (!activeSessionId.value) {
      const fromQuery = route.query.session as string | undefined
      if (fromQuery) {
        await openSession(fromQuery)
      } else if (autoPick) {
        const firstActive = rawSessions.value.find((s) => !s.endedAt) ?? rawSessions.value[0]
        if (firstActive) await openSession(firstActive.id)
      }
    }
  }

  async function openSession(id: string | number, skipIfSame = true) {
    const sid = String(id)
    if (skipIfSame && activeSessionId.value === sid && activeSession.value) return
    activeSessionId.value = sid
    router.replace({ query: { session: sid } })
    const res = await getSession(sid)
    if (!res.success) { toast.error(res.message || 'Could not load session'); return }
    const detail = res.data?.data
    if (!detail) return
    activeSession.value = detail
    messageEntities.value = detail.messages ?? []
    messages.value = messageEntities.value.map(toChatMessage)
    rebuildSessions()
    scrollBottom()
  }

  async function newSession() {
    if (creating.value) return
    activeSessionId.value = null
    activeSession.value = null
    messageEntities.value = []
    messages.value = []
    router.replace({ query: {} })
    await ensureSession()
    focusComposer()
  }

  async function send() {
    // Send is one button for both modes: while the mic is live it ends the
    // recording and ships it. Stopping and sending used to be welded onto the
    // mic button (a "stop" square), which read as pause and left Send dead.
    if (voiceState.value === 'recording') {
      stopRecording()
      return
    }
    if (!input.value.trim() || composerDisabled.value) return
    const text = input.value.trim()
    input.value = ''

    const sid = await ensureSession()
    if (!sid) { input.value = text; return }

    const nowIso = new Date().toISOString()
    messages.value.push({ who: 'user', text, time: fmtTime(nowIso) })
    messageEntities.value.push({ id: `tmp-${Date.now()}`, role: 'USER', type: 'TEXT', content: text, createdAt: nowIso })

    sending.value = true
    thinking.value = true

    const res = await sendMessage(sid, text, 'TEXT')
    sending.value = false

    if (!res.success) {
      messages.value.pop()
      messageEntities.value.pop()
      thinking.value = false
      input.value = text
      if (res.status === 429) toast.error(res.message || `Message limit reached (${limits.value.messagesPerSessionHard}).`)
      else if (res.status === 409) toast.error('This session has ended. Start a new one.')
      else if (res.status === 403) toast.error('Subscription required.')
      else toast.error(res.message || 'Could not send message')
      return
    }

    const payload = res.data?.data
    if (!payload) { thinking.value = false; return }

    const userApi: ApiChatMessage = {
      id: payload.userMessage?.id ?? `u-${Date.now()}`,
      role: 'USER',
      type: 'TEXT',
      content: payload.userMessage?.content ?? text,
      wordCount: payload.userMessage?.wordCount,
      createdAt: payload.userMessage?.createdAt ?? nowIso,
      evaluation: payload.evaluation ?? null,
    }
    messageEntities.value[messageEntities.value.length - 1] = userApi
    messages.value[messages.value.length - 1] = toChatMessage(userApi)

    const aiText = payload.assistantMessage?.content ?? ''
    const aiApi: ApiChatMessage = {
      id: payload.assistantMessage?.id ?? `ai-${Date.now()}`,
      role: 'ASSISTANT',
      type: 'TEXT',
      content: aiText,
      createdAt: payload.assistantMessage?.createdAt ?? new Date().toISOString(),
    }
    messageEntities.value.push(aiApi)
    messages.value.push({ who: 'ai', text: '', time: fmtTime(aiApi.createdAt) })
    thinking.value = false
    await streamReveal(messages.value.length - 1, aiText)

    if (userMessageCount.value === limits.value.messagesPerSessionSoft) {
      const left = limits.value.messagesPerSessionHard - userMessageCount.value
      toast.message(`Heads up — ${left} message${left === 1 ? '' : 's'} left before the session cap.`)
    }
    if (limits.value.messagesPerDayHard && userMessageCount.value >= limits.value.messagesPerDayHard - 2) {
      const left = limits.value.messagesPerDayHard - userMessageCount.value
      if (left > 0) toast.message(`${left} daily message${left === 1 ? '' : 's'} left on ${plan.value}.`)
    }

    loadSessions()
  }

  async function endCurrent() {
    if (!activeSessionId.value || ending.value || isSessionEnded.value) return
    ending.value = true
    const res = await endSession(activeSessionId.value)
    ending.value = false
    if (!res.success) {
      if (res.status === 409) toast.message('Session was already ended.')
      else toast.error(res.message || 'Could not end session')
      return
    }
    const data = res.data?.data
    if (!data) return
    const e = data.evaluation
    if (activeSession.value) {
      activeSession.value.endedAt = data.endedAt ?? new Date().toISOString()
      // Keep the evaluation on the session so the end-of-session panel can show
      // the real scores instead of a toast that vanishes after 6 seconds.
      if (e) activeSession.value.evaluation = e
    }
    if (e) {
      toast.success(`Session ended · ${Math.round(e.avgOverallScore ?? 0)}/100 · CEFR ${e.detectedCefrLevel}`, { duration: 6000 })
    } else {
      toast.success('Session ended')
    }
    loadSessions()
  }

  async function refreshCurrent() {
    if (!activeSessionId.value || refreshing.value) return
    refreshing.value = true
    await openSession(activeSessionId.value, false)
    refreshing.value = false
    toast.success('Refreshed')
  }

  // ── Voice ─────────────────────────────────────────────────────────────────
  // Three explicit actions instead of one overloaded toggle:
  //   mic     → startVoice()   begin recording
  //   discard → cancelVoice()  throw the audio away
  //   Send    → send()         stop + ship it (see send() above)
  async function startVoice() {
    if (voiceState.value === 'recording' || voiceState.value === 'processing') return
    if (composerDisabled.value) {
      if (isSessionEnded.value) toast.message('This session has ended — start a new one to keep talking.')
      else if (hardCapReached.value) toast.message('This session hit its message limit. Start a new one.')
      else if (!subActive.value) toast.error('You need an active plan to talk to Tutelage AI.')
      return
    }

    const granted = await acquireStream()
    if (!granted) {
      toast.error('Microphone blocked. Allow mic access in your browser, then try again.')
      return
    }

    const sid = await ensureSession()
    if (!sid) return

    await startRecording(sid, {
      onTranscript(_text) {},
      onResult(result) {
        const nowIso = new Date().toISOString()

        const userApi: ApiChatMessage = {
          id: result.userMessage?.id ?? `u-voice-${Date.now()}`,
          role: 'USER',
          type: 'VOICE',
          content: result.userMessage?.content ?? '',
          wordCount: result.userMessage?.wordCount,
          createdAt: result.userMessage?.createdAt ?? nowIso,
          evaluation: (result.evaluation as ApiChatMessage['evaluation']) ?? null,
        }
        messageEntities.value.push(userApi)
        messages.value.push({ who: 'user', text: userApi.content, time: fmtTime(userApi.createdAt), type: 'VOICE' })

        const aiText = result.assistantMessage?.content ?? ''
        const aiApi: ApiChatMessage = {
          id: result.assistantMessage?.id ?? `ai-voice-${Date.now()}`,
          role: 'ASSISTANT',
          type: 'VOICE',
          content: aiText,
          createdAt: result.assistantMessage?.createdAt ?? new Date().toISOString(),
        }
        messageEntities.value.push(aiApi)
        // audioBase64 arrives separately via onTts — push placeholder, fill it in onTts
        messages.value.push({ who: 'ai', text: '', time: fmtTime(aiApi.createdAt), type: 'VOICE' })

        nextTick(async () => {
          await streamReveal(messages.value.length - 1, aiText)
        })

        loadSessions()
      },
      onTts(audioBase64) {
        // Find the last AI voice message and attach audio — bubble auto-plays it
        for (let i = messages.value.length - 1; i >= 0; i--) {
          const msg = messages.value[i]
          if (msg && msg.who === 'ai' && msg.type === 'VOICE') {
            messages.value[i] = { who: msg.who, text: msg.text, time: msg.time, type: 'VOICE', audioBase64 }
            break
          }
        }
      },
      onError(code, message) {
        if (code === 'NO_SPEECH') toast.message("I didn't catch that — try again a bit closer to the mic.")
        else toast.error(message || 'Voice message failed.')
      },
    })
  }

  function cancelVoice() {
    if (voiceState.value !== 'recording') return
    cancelRecording()
    toast.message('Recording discarded')
  }

  async function fillSuggestion(text: string) {
    input.value = text
    await send()
  }

  onMounted(async () => {
    await loadSessions(subActive.value)
    if (!subActive.value) {
      toast.message('Activate a plan to start chatting with Tutelage AI.')
    }
  })

  return {
    // refs
    threadRef,
    composerRef,
    input,
    search,
    // state flags
    thinking,
    sending,
    ending,
    creating,
    refreshing,
    // session data
    sessions,
    activeSessionId,
    activeSession,
    messages,
    // derived
    userInitial,
    plan,
    limits,
    subActive,
    userMessageCount,
    cefrLabel,
    accuracyLabel,
    isSessionEnded,
    hardCapReached,
    composerDisabled,
    dailyLimitReached,
    sessionEvaluation,
    todayList,
    earlierList,
    sessionTimer,
    // actions
    newSession,
    openSession,
    send,
    startVoice,
    cancelVoice,
    endCurrent,
    refreshCurrent,
    fillSuggestion,
    focusComposer,
    // voice state
    voiceState,
    isRecording,
    isTranscribing,
    micDisabled,
    canSend,
    recordingClock,
    partialTranscript,
    audioStream,
  }
}
