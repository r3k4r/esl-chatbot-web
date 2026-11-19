<script setup lang="ts">
// The live-recording strip above the composer: waveform, elapsed time, the
// interim transcript, and an explicit Discard. Sending is deliberately NOT here
// — that is the composer's Send button, so one button means one thing.
const props = defineProps<{
  stream: MediaStream | null
  clock: string
  partialTranscript: string
}>()

const emit = defineEmits<{ discard: [] }>()

const BAR_COUNT = 24
const bars = ref<number[]>(Array(BAR_COUNT).fill(2))

let audioCtx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let source: MediaStreamAudioSourceNode | null = null
let rafId: number | null = null

function start(stream: MediaStream) {
  stop()
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new Ctx()
    analyser = audioCtx.createAnalyser()
    analyser.fftSize = 64
    source = audioCtx.createMediaStreamSource(stream)
    source.connect(analyser)

    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      if (!analyser) return
      analyser.getByteFrequencyData(data)
      bars.value = Array.from({ length: BAR_COUNT }, (_, i) => {
        const bin = Math.floor((i / BAR_COUNT) * data.length)
        return Math.min(28, Math.max(2, Math.round(((data[bin] ?? 0) / 255) * 28)))
      })
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
  } catch {
    // Web Audio unavailable — the bar still shows the timer and transcript.
  }
}

function stop() {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
  source?.disconnect()
  audioCtx?.close().catch(() => {})
  audioCtx = null
  analyser = null
  source = null
  bars.value = Array(BAR_COUNT).fill(2)
}

watch(() => props.stream, (s) => { if (s) start(s); else stop() }, { immediate: true })
onBeforeUnmount(stop)
</script>

<template>
  <!-- Brand orange, not alarm red: recording is a normal, friendly action here -->
  <div class="mb-2 flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-xl border bg-brand-primary/8 border-brand-primary/25">
    <span class="w-2 h-2 rounded-full bg-brand-primary animate-pulse shrink-0" aria-hidden="true" />

    <!-- Waveform — fixed 28px box, bars grow from the baseline -->
    <div class="hidden xs:flex items-end gap-0.5 h-7 shrink-0" aria-hidden="true">
      <span
        v-for="(h, i) in bars"
        :key="i"
        class="w-0.75 rounded-full bg-brand-primary"
        :style="{ height: `${h}px`, maxHeight: '28px' }"
      />
    </div>

    <AppText size="14" font-family="mono" weight="medium" class-list="text-brand-primary shrink-0">
      {{ clock }}
    </AppText>

    <AppText size="14" class-list="truncate text-text-body flex-1 min-w-0">
      {{ partialTranscript || 'Listening… press Send when you\'re done' }}
    </AppText>

    <AppButton
      variant="ghost"
      size="32"
      radius="8"
      icon="Trash"
      :icon-config="{ color: 'var(--color-text-muted)', size: 16 }"
      class-list="shrink-0 gap-2 px-2.5 text-text-muted"
      aria-label="Discard recording"
      @click="emit('discard')"
    >
      <span class="hidden sm:inline text-[14px]">Discard</span>
    </AppButton>
  </div>
</template>
