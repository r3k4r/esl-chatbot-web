<script setup lang="ts">
import type { VoiceTurn } from '~/common/types/voice-types'

// In the live call the composable owns playback, so the log player is manual
// (autoPlay off) to avoid double audio. autoPlay is opt-in for standalone use.
const props = withDefaults(defineProps<{ turn: VoiceTurn; autoPlay?: boolean }>(), {
  autoPlay: false,
})

function scoreColor(score: number | null | undefined) {
  if (score == null) return 'var(--color-text-subtle)'
  if (score >= 85) return 'var(--status-active-text)'
  if (score >= 70) return 'var(--color-brand-primary)'
  return 'var(--status-expired-text)'
}

// ── Inline TTS player (mirrors MessageBubble pattern) ──────────────────────
const isPlaying = ref(false)
const progress = ref(0)
const elapsed = ref(0)
const duration = ref(0)
let audio: HTMLAudioElement | null = null
let rafId: number | null = null

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}
function tick() {
  if (!audio) return
  elapsed.value = audio.currentTime
  duration.value = audio.duration || 0
  progress.value = duration.value ? (audio.currentTime / duration.value) * 100 : 0
  rafId = requestAnimationFrame(tick)
}
function stopAudio() {
  if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null }
  audio?.pause()
  audio = null
  isPlaying.value = false
  progress.value = 0
  elapsed.value = 0
}
function toggleAudio() {
  if (isPlaying.value) { stopAudio(); return }
  if (!props.turn.replyAudioBase64) return
  stopAudio()
  audio = new Audio(`data:audio/mpeg;base64,${props.turn.replyAudioBase64}`)
  audio.onloadedmetadata = () => { duration.value = audio?.duration || 0 }
  audio.onended = () => stopAudio()
  audio.play().catch(() => {})
  isPlaying.value = true
  rafId = requestAnimationFrame(tick)
}
function seek(e: MouseEvent) {
  if (!audio || !duration.value) return
  const bar = e.currentTarget as HTMLElement
  audio.currentTime = (e.offsetX / bar.offsetWidth) * duration.value
}
// Auto-play only when explicitly opted in (the live call handles its own audio).
watch(() => props.turn.replyAudioBase64, (b64) => { if (b64 && props.autoPlay) nextTick(toggleAudio) })
onBeforeUnmount(stopAudio)
</script>

<template>
  <div class="animate-card-enter space-y-2.5" style="--delay:0ms">
    <!-- Learner turn (your transcript) -->
    <div class="flex justify-end">
      <div class="max-w-[80%] rounded-[14px] rounded-br-sm bg-brand-ink px-3.5 py-2.5 text-left dark:bg-white">
        <p class="text-[14px] leading-relaxed text-white dark:text-brand-ink font-poppins">{{ turn.transcript }}</p>
        <div v-if="turn.evaluation" class="mt-1.5 flex items-center justify-end gap-1.5">
          <AppIconsax name="Microphone2" color="var(--color-brand-primary)" :size="11" />
          <span
            class="font-mono text-[11px] font-semibold"
            :style="{ color: scoreColor(turn.evaluation.overallScore) }"
          >{{ Math.round(turn.evaluation.overallScore) }}</span>
        </div>
      </div>
    </div>

    <!-- AI reply -->
    <div class="flex items-start gap-2.5">
      <div class="flex size-7 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#1B365D] to-[#B91C1C] shadow-xs">
        <AppIconsax name="Teacher" color="#ffffff" :size="13" />
      </div>
      <div class="max-w-[80%]">
        <div class="inline-block rounded-[14px] rounded-bl-sm bg-surface-raised px-3.5 py-2.5 text-left">
          <p class="text-[14px] leading-relaxed text-text-heading font-poppins">{{ turn.reply }}</p>
        </div>

        <!-- TTS player -->
        <div
          v-if="turn.replyAudioBase64"
          class="mt-2 flex w-56 items-center gap-2.5 rounded-2xl border border-border-inner bg-surface-raised px-3 py-2"
        >
          <button
            class="flex size-8 shrink-0 items-center justify-center rounded-full transition"
            :class="isPlaying ? 'bg-brand-primary' : 'bg-surface-well hover:bg-brand-primary/15'"
            @click="toggleAudio"
          >
            <AppIconsax
              :name="isPlaying ? 'Pause' : 'Play'"
              :color="isPlaying ? 'white' : 'var(--color-text-body)'"
              :size="15"
            />
          </button>
          <div class="min-w-0 flex-1">
            <div class="relative h-1.5 cursor-pointer overflow-hidden rounded-full bg-border-inner" @click="seek">
              <div class="absolute inset-y-0 left-0 rounded-full bg-brand-primary" :style="{ width: `${progress}%` }" />
            </div>
            <div class="mt-1 flex justify-between">
              <span class="font-mono text-[10px] text-text-subtle">{{ fmt(elapsed) }}</span>
              <span class="font-mono text-[10px] text-text-subtle">{{ fmt(duration) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
