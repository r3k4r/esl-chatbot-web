<script setup lang="ts">
import type { ChatMessage } from '~/common/types/dashboard-types'

const props = defineProps<{ message: ChatMessage; userInitial?: string }>()

// ── Voice audio player ────────────────────────────────────────────────────
// Two sources: `audioUrl` (R2 link, present on fetched voice messages — both
// the user's recording and the AI's TTS reply) and `audioBase64` (TTS that
// streamed in live during a voice turn, AI replies only).
const audioSrc = computed(() => {
  if (props.message.audioBase64) return `data:audio/mpeg;base64,${props.message.audioBase64}`
  if (props.message.audioUrl) return props.message.audioUrl
  return null
})
const hasAudio = computed(() => props.message.type === 'VOICE' && !!audioSrc.value)

const isPlaying = ref(false)
const progress = ref(0)   // 0–100
const elapsed = ref(0)    // seconds
const duration = ref(0)   // seconds

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
  if (!audioSrc.value) return
  stopAudio()
  audio = new Audio(audioSrc.value)
  audio.onloadedmetadata = () => { duration.value = audio?.duration || 0 }
  audio.onended = () => { stopAudio() }
  audio.play().catch(() => { })
  isPlaying.value = true
  rafId = requestAnimationFrame(tick)
}

// Click on the progress bar to seek
function seek(e: MouseEvent) {
  if (!audio || !duration.value) return
  const bar = e.currentTarget as HTMLElement
  const ratio = e.offsetX / bar.offsetWidth
  audio.currentTime = ratio * duration.value
}

// Auto-play when audioBase64 first arrives on this bubble
watch(() => props.message.audioBase64, (b64) => {
  if (b64) nextTick(toggleAudio)
})

onBeforeUnmount(stopAudio)
</script>

<template>
  <div :class="['flex flex-col animate-card-enter', message.who === 'user' ? 'items-end' : 'items-start']"
    style="--delay:0ms">
    <!-- The learner's turn: a compact bubble on the right -->
    <div v-if="message.who === 'user'"
      class="max-w-[85%] sm:max-w-[75%] rounded-2xl rounded-br-md bg-surface-well px-3.5 py-2.5 text-[15px] leading-relaxed text-text-heading font-poppins break-words whitespace-pre-wrap">
      {{ message.text }}
    </div>

    <!-- The tutor's turn: plain reading text, no bubble (like a document, easy on the eyes).
         v-html is safe: the backend allowlist-sanitizes replies (p strong em ul ol li br). -->
    <div v-else class="flex w-full gap-3">
      <div class="mt-0.5 grid size-7 shrink-0 place-content-center rounded-lg bg-brand-primary/12" aria-hidden="true">
        <AppIconsax name="Candle" color="var(--color-brand-primary)" type="bold" :size="16" />
      </div>
      <div class="ai-prose min-w-0 flex-1 text-[15px] leading-7 text-text-body font-poppins break-words"
        v-html="message.text" />
    </div>

    <!-- Voice player — on any voice message that has audio (user recording or AI reply) -->
    <div v-if="hasAudio"
      :class="['mt-2 flex w-full max-w-56 items-center gap-2.5 rounded-xl border border-border-card bg-surface-card px-2.5 py-2', message.who === 'ai' && 'ms-10']">
      <AppButton
        variant="ghost"
        size="32"
        radius="8"
        aspect="square"
        :class-list="isPlaying ? 'bg-brand-primary hover:bg-brand-primary shrink-0' : 'bg-surface-raised shrink-0'"
        :aria-label="isPlaying ? 'Pause audio' : 'Play audio'"
        @click="toggleAudio"
      >
        <AppIconsax :name="isPlaying ? 'Pause' : 'Play'" :color="isPlaying ? 'white' : 'var(--color-text-body)'"
          :size="16" />
      </AppButton>

      <div class="flex-1 min-w-0">
        <div class="relative h-1.5 rounded-full bg-surface-well cursor-pointer overflow-hidden" @click="seek">
          <div class="absolute inset-y-0 left-0 rounded-full bg-brand-primary transition-none"
            :style="{ width: `${progress}%` }" />
        </div>
        <div class="flex justify-between mt-1">
          <span class="text-[12px] tabular-nums text-text-subtle">{{ fmt(elapsed) }}</span>
          <span class="text-[12px] tabular-nums text-text-subtle">{{ fmt(duration) }}</span>
        </div>
      </div>
    </div>

    <!-- A better way to say it, under the learner's own message -->
    <div v-if="message.correction"
      class="mt-2 max-w-[85%] sm:max-w-[75%] rounded-xl border border-border-card bg-surface-card px-3.5 py-3 text-left">
      <div class="mb-1.5 flex items-center gap-1.5">
        <AppIconsax name="Magicpen" color="var(--color-brand-primary)" :size="16" />
        <AppText size="13" weight="semibold" color="brand-primary">Better phrasing</AppText>
      </div>
      <AppText size="14" color="neutral-400" class-list="line-through decoration-text-subtle">
        {{ message.correction.original }}
      </AppText>
      <AppText size="15" weight="medium">{{ message.correction.suggested }}</AppText>
      <AppText v-if="message.correction.why" size="14" color="neutral-400" class-list="mt-1">
        {{ message.correction.why }}
      </AppText>
    </div>

    <AppText v-if="message.time" size="12" color="neutral-400" :class-list="['mt-1.5', message.who === 'ai' && 'ms-10'].filter(Boolean).join(' ')">
      {{ message.time }}
    </AppText>
  </div>
</template>

<style scoped>
/* The tutor's reply: short paragraphs, real bullets, and key words marked
   like a highlighter pen so a learner's eye lands on them first. */
.ai-prose :deep(p) { margin-bottom: 0.6em; }
.ai-prose :deep(> :last-child) { margin-bottom: 0; }
.ai-prose :deep(strong) {
  font-weight: 600;
  color: var(--text-heading);
  background: linear-gradient(transparent 58%, color-mix(in oklch, var(--color-brand-primary) 28%, transparent) 58%);
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  padding-inline: 0.1em;
}
.ai-prose :deep(em) { font-style: italic; color: var(--text-heading); }
.ai-prose :deep(ul),
.ai-prose :deep(ol) { padding-inline-start: 1.3em; margin-bottom: 0.6em; }
.ai-prose :deep(ul) { list-style-type: disc; }
.ai-prose :deep(ol) { list-style-type: decimal; }
.ai-prose :deep(li) { margin-bottom: 0.3em; padding-inline-start: 0.2em; }
.ai-prose :deep(li::marker) { color: var(--color-brand-primary); font-weight: 600; }
</style>
