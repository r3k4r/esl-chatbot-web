import type { ChatMockupMessage } from '~/common/types/chat-types'

// The landing hero's chat, played on a loop: the learner types, the tutor thinks and answers,
// a voice message is recorded and corrected, the tutor answers out loud, then it starts again.
// The lines stay English in every language (it is an English lesson); the labels are translated.
const SCRIPT: ChatMockupMessage[] = [
  { who: 'user', text: 'I went to Erbil last weekend with my family.' },
  { who: 'ai', text: 'Erbil is lovely this time of year! Did you visit the citadel, or spend time in the bazaar?' },
  { who: 'user', text: 'Yes, we go to the citadel and eat kebab.', voice: true, fix: ['We ', 'went', ' to the citadel.'] },
  { who: 'ai', text: 'Kebab after the citadel sounds perfect! What did you like most there?', voice: true },
]

export function useChatMockupScript() {
  const shown = ref<ChatMockupMessage[]>([])
  const thinking = ref(false)
  const recording = ref(false)
  const draft = ref('')
  const typingText = ref(false)
  const seconds = ref(3 * 60 + 4)
  const clock = computed(() => `${String(Math.floor(seconds.value / 60)).padStart(2, '0')}:${String(seconds.value % 60).padStart(2, '0')}`)

  let alive = true
  let ticker: ReturnType<typeof setInterval> | undefined
  const timers = new Set<ReturnType<typeof setTimeout>>()
  const wait = (ms: number) => new Promise<void>((resolve) => {
    const id = setTimeout(() => { timers.delete(id); resolve() }, ms)
    timers.add(id)
  })

  async function typeOut(text: string) {
    typingText.value = true
    for (let i = 1; i <= text.length && alive; i++) {
      draft.value = text.slice(0, i)
      await wait(34)
    }
    typingText.value = false
    await wait(400)
    draft.value = ''
  }

  async function reply(message: ChatMockupMessage, pause: number) {
    thinking.value = true
    await wait(1300)
    thinking.value = false
    shown.value.push(message)
    await wait(pause)
  }

  async function play() {
    while (alive) {
      shown.value = []
      await wait(800)
      await typeOut(SCRIPT[0]!.text)
      shown.value.push(SCRIPT[0]!)
      await reply(SCRIPT[1]!, 1800)
      recording.value = true
      await wait(2200)
      recording.value = false
      shown.value.push(SCRIPT[2]!)
      await wait(1000)
      await reply(SCRIPT[3]!, 5500)
    }
  }

  onMounted(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown.value = [...SCRIPT] // the whole conversation, still
      return
    }
    ticker = setInterval(() => seconds.value++, 1000)
    play()
  })

  onBeforeUnmount(() => {
    alive = false
    clearInterval(ticker)
    timers.forEach(clearTimeout)
  })

  return { shown, thinking, recording, draft, typingText, clock }
}
