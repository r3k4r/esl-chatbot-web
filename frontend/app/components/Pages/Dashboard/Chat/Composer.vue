<script setup lang="ts">
import type { SvgBasedIconName } from '~/common/types/iconsax-types'
import type { VoiceState } from '~/composables/useVoiceChat'

const props = defineProps<{
  modelValue: string
  sending: boolean
  thinking: boolean
  composerDisabled: boolean
  isSessionEnded: boolean
  hardCapReached: boolean
  subActive: boolean
  activeSessionId: string | null
  cefrLabel: string
  plan: string
  userMessageCount: number
  messagesPerSessionHard: number
  sessionTimer: string
  accuracyLabel: string
  hasMessages: boolean
  voiceState: VoiceState
  partialTranscript: string
  audioStream: MediaStream | null
}>()

// ── Live waveform ─────────────────────────────────────────────────────────
const BAR_COUNT = 20
const bars = ref<number[]>(Array(BAR_COUNT).fill(2))

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let source: MediaStreamAudioSourceNode | null = null
let rafId: number | null = null

function startVisualizer(stream: MediaStream) {
  audioCtx = new AudioContext()
  analyser = audioCtx.createAnalyser()
  analyser.fftSize = 64
  source = audioCtx.createMediaStreamSource(stream)
  source.connect(analyser)

  const data = new Uint8Array(analyser.frequencyBinCount)

  function tick() {
    analyser!.getByteFrequencyData(data)
    // Map frequency bins to bar heights (2–28px range)
    bars.value = Array.from({ length: BAR_COUNT }, (_, i) => {
      const bin = Math.floor((i / BAR_COUNT) * data.length)
      return Math.min(28, Math.max(2, Math.round((data[bin]! / 255) * 28)))
    })
    rafId = requestAnimationFrame(tick)
  }
  tick()
}

function stopVisualizer() {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
  source?.disconnect()
  audioCtx?.close()
  audioCtx = null; analyser = null; source = null
  bars.value = Array(BAR_COUNT).fill(2)
}

watch(() => props.voiceState, (state) => {
  if (state === 'recording' && props.audioStream) {
    startVisualizer(props.audioStream)
  } else {
    stopVisualizer()
  }
})

onBeforeUnmount(stopVisualizer)

const emit = defineEmits<{
  'update:modelValue': [val: string]
  'send': []
  'fill-suggestion': [text: string]
  'attach': []
  'mic': []
}>()

const suggestions: { icon: SvgBasedIconName; text: string }[] = [
  { icon: 'Messages2', text: "Let's practice small-talk at work." },
  { icon: 'Cup', text: 'Help me order coffee in English.' },
  { icon: 'Briefcase', text: 'Coach me for a job interview.' },
  { icon: 'Airplane', text: "Let's talk about planning a trip." },
  { icon: 'Book1', text: 'Correct my grammar as we chat.' },
  { icon: 'People', text: "Tell me about today's English idiom." },
]

const placeholder = computed(() => {
  if (!props.subActive) return 'Subscribe to chat with Tutelage AI...'
  if (props.isSessionEnded) return 'Session ended — start a new one.'
  if (props.hardCapReached) return 'Session message limit reached.'
  if (!props.activeSessionId) return "Type a message to start chatting with Tutelage AI…"
  return 'Ask Tutelage AI anything in English, or say hi to start a conversation!'
})

const textareaEl = ref<HTMLTextAreaElement | null>(null)
defineExpose({ textareaEl })

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    emit('send')
  }
}
</script>

<template>
  <div class="border-t border-black/6 dark:border-white/6 p-4 shrink-0">
    <div class="max-w-3xl mx-auto">

      <!-- Suggestion chips (only when no messages yet) -->
      <div v-if="!hasMessages && subActive && !isSessionEnded" class="hidden xl:flex flex-wrap gap-1.5 mb-3">
        <button v-for="s in suggestions" :key="s.text" type="button"
          class="flex items-center gap-1 px-2.5 py-1 rounded-full border border-black/8 dark:border-white/8 bg-white dark:bg-white/4 hover:border-brand-primary/40 hover:bg-brand-primary/5 text-[11.5px] text-zinc-600 dark:text-zinc-300 font-poppins transition"
          @click="emit('fill-suggestion', s.text)">
          <AppIconsax :name="s.icon" color="#a1a1aa" :size="11" />
          {{ s.text }}
        </button>
      </div>

      <!-- Recording banner with live waveform -->
      <div v-if="voiceState === 'recording'"
        class="mb-2 flex items-center gap-3 px-3 py-2 rounded-xl border bg-red-500/8 border-red-500/20">
        <!-- Waveform bars — fixed 28px tall box, bars grow upward from baseline -->
        <div class="flex items-end gap-0.5 h-7 shrink-0">
          <span
            v-for="(h, i) in bars"
            :key="i"
            class="w-0.75 rounded-full bg-red-500"
            :style="{ height: `${h}px`, maxHeight: '28px' }"
          />
        </div>
        <span class="truncate text-[12px] text-red-500 font-poppins">
          {{ partialTranscript || 'Listening…' }}
        </span>
      </div>

      <!-- Processing banner -->
      <div v-else-if="voiceState === 'processing'"
        class="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl border bg-surface-raised border-border-inner text-text-muted">
        <AppIconsax name="Microphone2" color="var(--color-text-muted)" :size="13" />
        <span class="text-[12px] font-poppins">Processing…</span>
      </div>

      <div class="dash-card p-2.5 flex items-end gap-2">
        <button
          class="w-9 h-9 rounded-lg flex items-center justify-center text-text-subtle hover:text-text-body hover:bg-surface-raised transition"
          title="Attachments — coming soon" @click="emit('attach')">
          <AppIconsax name="Paperclip" color="currentColor" :size="14" />
        </button>
        <textarea ref="textareaEl" :value="modelValue" rows="1" :placeholder="placeholder"
          :disabled="composerDisabled || voiceState === 'recording' || voiceState === 'processing'"
          class="flex-1 resize-none outline-none bg-transparent py-2 overflow-hidden px-1 text-[14px] text-brand-ink dark:text-white placeholder:text-zinc-400 font-poppins disabled:cursor-not-allowed"
          @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)" @keydown="onKeydown" />
        <!-- Mic button: tap to record · tap again to stop -->
        <button
          :disabled="voiceState === 'processing'"
          :class="[
            'w-9 h-9 rounded-lg flex items-center justify-center transition',
            voiceState === 'recording'
              ? 'bg-red-500 text-white hover:bg-red-600'
              : voiceState === 'processing'
                ? 'bg-surface-raised text-text-subtle cursor-not-allowed opacity-40'
                : 'bg-surface-raised text-text-body hover:bg-surface-card hover:text-brand-primary',
          ]"
          @click="emit('mic')"
        >
          <AppIconsax
            :name="voiceState === 'recording' ? 'Stop' : 'Microphone'"
            :color="voiceState === 'recording' ? 'white' : 'currentColor'"
            :size="14"
          />
        </button>
        <AppButton variant="primary" size="36" radius="8" icon="Send" :icon-config="{ color: 'white' }"
          :text="sending ? 'Sending…' : 'Send'" class="text-[12.5px]!" :loading="sending"
          :disabled="composerDisabled || !modelValue.trim() || voiceState === 'recording' || voiceState === 'processing'"
          @click="emit('send')" />
      </div>

      <div class="flex items-center justify-between mt-2 px-1 text-[10.5px] text-zinc-400">
        <div class="flex items-center gap-3 font-poppins">
          <!-- <span class="flex items-center gap-1">
            <AppIconsax name="Candle" color="#a1a1aa" :size="10" />
            Corrections: on
          </span>
          <span>·</span> -->
          <span>Level: {{ cefrLabel }}</span>
          <span>·</span>
          <span>{{ plan }}</span>
        </div>
        <span class="font-mono">
          {{ userMessageCount }}/{{ messagesPerSessionHard }} msgs · {{ accuracyLabel }} token usage
        </span>
      </div>
    </div>
  </div>
</template>
