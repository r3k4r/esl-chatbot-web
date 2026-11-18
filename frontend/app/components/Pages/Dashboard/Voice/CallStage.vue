<script setup lang="ts">
import type { CallPhase, CallSpeaker } from '~/common/types/voice-types'

// A live call, like a phone call: talk whenever you like, the tutor answers at once and
// stops when you talk over it. Captions show both sides as they are spoken.
const props = defineProps<{
  phase: CallPhase
  speaker: CallSpeaker
  level: number
  muted: boolean
  callClock: string
  learnerCaption: string
  tutorCaption: string
}>()
const emit = defineEmits<{ mute: []; hangup: [] }>()

const status = computed(() => {
  if (props.phase === 'connecting') return 'Calling Tutelage AI…'
  if (props.muted) return 'You are muted'
  if (props.speaker === 'tutor') return 'Tutelage AI is talking'
  if (props.speaker === 'learner') return 'Listening…'
  return 'Your turn, go ahead'
})
</script>

<template>
  <div class="dash-card flex h-full min-h-[540px] flex-col p-5 sm:p-6">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span
          class="size-2 rounded-full"
          :class="phase === 'live' ? 'bg-[var(--status-active-text)] motion-safe:animate-pulse' : 'bg-[var(--text-subtle)]'"
        />
        <AppText size="14" color="neutral-400">{{ phase === 'live' ? 'Live' : 'Connecting' }}</AppText>
      </div>
      <AppText size="14" weight="medium" class-list="tabular-nums">{{ callClock }}</AppText>
    </div>

    <div class="flex flex-1 flex-col items-center justify-center py-6 text-center">
      <PagesDashboardVoiceCallOrb in-call :connecting="phase === 'connecting'" :speaker="speaker" :level="level" />
      <AppText size="15" weight="medium" :color="speaker === 'tutor' ? 'brand-primary' : 'neutral-400'" class-list="mt-5" role="status" aria-live="polite">
        {{ status }}
      </AppText>

      <div class="mt-6 w-full max-w-xl space-y-4" dir="ltr">
        <AppText v-if="tutorCaption" size="20" weight="medium" :class-list="speaker === 'tutor' ? 'leading-snug' : 'leading-snug opacity-70'">
          {{ tutorCaption }}
        </AppText>
        <AppText v-if="learnerCaption" size="17" color="neutral-400" class-list="leading-snug">
          {{ learnerCaption }}
        </AppText>
      </div>
    </div>

    <div class="flex flex-col items-center gap-3">
      <div class="flex items-center gap-3">
        <AppButton
          variant="secondary"
          size="52"
          radius="12"
          aspect="square"
          :icon="muted ? 'MicrophoneSlash1' : 'Microphone2'"
          :active="muted"
          :aria-label="muted ? 'Unmute' : 'Mute'"
          :aria-pressed="muted"
          @click="emit('mute')"
        />
        <AppButton
          variant="danger"
          size="52"
          radius="12"
          icon="CallSlash"
          :icon-config="{ color: 'white' }"
          text="End call"
          class-list="px-6 text-[15px]"
          @click="emit('hangup')"
        />
      </div>
      <AppText size="13" color="neutral-400">Talk any time. You can interrupt the tutor, like on a real call.</AppText>
    </div>
  </div>
</template>
