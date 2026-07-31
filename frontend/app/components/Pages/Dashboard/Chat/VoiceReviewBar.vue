<script setup lang="ts">
// Shown between stopping the mic and sending: play the take back, then decide.
// Nothing has been sent to the AI at this point — the server is holding the
// buffered audio and only acts when Send emits `voice:end`.
const props = defineProps<{
  url: string | null
  seconds: number
}>()

const emit = defineEmits<{ discard: []; 're-record': [] }>()

const isPlaying = ref(false)
const elapsed = ref(0)
const duration = ref(0)

let audio: HTMLAudioElement | null = null
let rafId: number | null = null

function fmt(s: number) {
  if (!Number.isFinite(s) || s < 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

const progress = computed(() =>
  duration.value ? Math.min(100, (elapsed.value / duration.value) * 100) : 0,
)

function tick() {
  if (!audio) return
  elapsed.value = audio.currentTime
  // A MediaRecorder blob often reports Infinity for duration until it has played
  // through once, so fall back to the recorded length we already know.
  if (Number.isFinite(audio.duration) && audio.duration > 0) duration.value = audio.duration
  rafId = requestAnimationFrame(tick)
}

function stop() {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
  audio?.pause()
  audio = null
  isPlaying.value = false
  elapsed.value = 0
}

function toggle() {
  if (isPlaying.value) { stop(); return }
  if (!props.url) return
  stop()
  audio = new Audio(props.url)
  audio.onended = stop
  audio.onerror = stop
  audio.play().catch(() => stop())
  isPlaying.value = true
  rafId = requestAnimationFrame(tick)
}

function seek(e: MouseEvent) {
  if (!audio || !duration.value) return
  const bar = e.currentTarget as HTMLElement
  audio.currentTime = (e.offsetX / bar.offsetWidth) * duration.value
}

watch(() => props.url, () => {
  stop()
  duration.value = props.seconds
}, { immediate: true })

onBeforeUnmount(stop)
</script>

<template>
  <div
    class="mb-2 flex items-center gap-2 sm:gap-3 px-3 py-2 rounded-xl border"
    style="background:var(--surface-raised);border-color:var(--border-inner)"
  >
    <AppButton
      variant="ghost"
      size="32"
      radius="full"
      aspect="square"
      class-list="shrink-0 bg-brand-primary hover:bg-brand-primary/90"
      :aria-label="isPlaying ? 'Pause playback' : 'Play your recording'"
      @click="toggle"
    >
      <AppIconsax :name="isPlaying ? 'Pause' : 'Play'" color="white" :size="16" />
    </AppButton>

    <div class="flex-1 min-w-0">
      <div
        class="relative h-1.5 rounded-full cursor-pointer overflow-hidden"
        style="background:var(--border-inner)"
        @click="seek"
      >
        <div
          class="absolute inset-y-0 left-0 rounded-full bg-brand-primary"
          :style="{ width: `${progress}%` }"
        />
      </div>
      <div class="flex justify-between mt-1">
        <AppText size="11" color="neutral-400" font-family="mono">{{ fmt(elapsed) }}</AppText>
        <AppText size="11" color="neutral-400" font-family="mono">{{ fmt(duration) }}</AppText>
      </div>
    </div>

    <AppButton
      variant="ghost"
      size="32"
      radius="8"
      icon="Microphone"
      :icon-config="{ color: 'var(--color-text-body)', size: 16 }"
      class-list="shrink-0 gap-2 px-2.5"
      aria-label="Record again"
      @click="emit('re-record')"
    >
      <span class="hidden md:inline text-[13px]">Redo</span>
    </AppButton>

    <AppButton
      variant="ghost"
      size="32"
      radius="8"
      icon="Trash"
      :icon-config="{ color: '#ef4444', size: 16 }"
      class-list="shrink-0 gap-2 px-2.5 text-red-500 hover:bg-red-500/10"
      aria-label="Discard recording"
      @click="emit('discard')"
    >
      <span class="hidden md:inline text-[13px]">Discard</span>
    </AppButton>
  </div>
</template>
