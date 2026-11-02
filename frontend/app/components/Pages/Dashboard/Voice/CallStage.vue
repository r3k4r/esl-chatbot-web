<script setup lang="ts">
import type { CallPhase, Speaker } from '~/composables/useVoiceLab'

const props = defineProps<{
  phase: CallPhase
  speaker: Speaker
  level: number
  caption: string
  callClock: string
  muted: boolean
}>()

const emit = defineEmits<{ mute: []; hangup: []; log: [] }>()

const statusLabel = computed(() => {
  switch (props.phase) {
    case 'connecting': return 'Connecting…'
    case 'listening': return props.muted ? 'Muted' : 'Listening…'
    case 'thinking': return 'Thinking…'
    case 'speaking': return 'LEO AI is speaking'
    default: return ''
  }
})
</script>

<template>
  <div class="dash-card relative flex min-h-[560px] flex-col items-center justify-between overflow-hidden p-6 sm:p-8">
    <!-- ambient backdrop -->
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute left-1/2 top-1/3 size-80 -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl" />
      <div class="dot-bg absolute inset-0 opacity-50" />
    </div>

    <!-- top: live indicator + timer -->
    <div class="relative flex w-full items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="size-2 rounded-full bg-red-500 animate-pulse" />
        <AppText size="13" weight="medium" color="neutral-400" class-list="font-poppins">Live</AppText>
      </div>
      <span class="rounded-md bg-surface-raised px-2.5 py-1 font-mono text-[13px] text-text-body tabular-nums">
        {{ callClock }}
      </span>
    </div>

    <!-- center: orb + status + caption -->
    <div class="relative flex flex-1 flex-col items-center justify-center py-6">
      <PagesDashboardVoiceCallOrb :phase="phase" :speaker="speaker" :level="level" />

      <AppText size="15" weight="medium" :color="phase === 'speaking' ? 'brand-primary' : 'neutral-400'" class-list="mt-6 font-poppins">
        {{ statusLabel }}
      </AppText>

      <!-- live caption -->
      <div class="mt-3 min-h-16 max-w-lg px-4">
        <p
          v-if="caption"
          class="text-center text-[18px] leading-relaxed text-text-heading font-poppins transition-opacity duration-200"
        >
          {{ caption }}<span v-if="phase === 'listening' && !muted" class="caret text-brand-primary">|</span>
        </p>
        <p v-else-if="phase === 'listening'" class="text-center text-[15px] text-text-subtle font-poppins">
          Go ahead, say something…
        </p>
      </div>
    </div>

    <!-- bottom: call controls -->
    <div class="relative flex items-center gap-5">
      <!-- mute -->
      <button
        type="button"
        class="flex size-14 items-center justify-center rounded-full border transition active:scale-95"
        :class="muted
          ? 'border-transparent bg-brand-primary text-white'
          : 'border-border-inner bg-surface-raised hover:bg-surface-well'"
        :aria-label="muted ? 'Unmute' : 'Mute'"
        @click="emit('mute')"
      >
        <AppIconsax
          :name="muted ? 'MicrophoneSlash1' : 'Microphone2'"
          :color="muted ? 'white' : 'var(--color-text-body)'"
          :size="22"
        />
      </button>

      <!-- end call -->
      <button
        type="button"
        class="flex size-16 items-center justify-center rounded-full bg-red-500 text-white shadow-[0_12px_30px_-8px_rgba(239,68,68,0.6)] transition hover:bg-red-600 active:scale-95"
        aria-label="End call"
        @click="emit('hangup')"
      >
        <AppIconsax name="CallSlash" color="white" :size="26" />
      </button>

      <!-- transcript log -->
      <button
        type="button"
        class="flex size-14 items-center justify-center rounded-full border border-border-inner bg-surface-raised transition hover:bg-surface-well active:scale-95"
        aria-label="View transcript"
        @click="emit('log')"
      >
        <AppIconsax name="DocumentText1" color="var(--color-text-body)" :size="22" />
      </button>
    </div>
  </div>
</template>
