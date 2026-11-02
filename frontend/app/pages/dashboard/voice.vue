<script setup lang="ts">
import { useVoiceLab } from '~/composables/useVoiceLab'

definePageMeta({ layout: 'dashboard', requiresAuth: true })

const {
  phase,
  speaker,
  muted,
  inCall,
  level,
  caption,
  turns,
  callClock,
  subActive,
  pronunciationAvailable,
  lastEval,
  lastPron,
  startCall,
  toggleMute,
  hangUp,
} = useVoiceLab()

const logOpen = ref(false)
const connecting = computed(() => phase.value === 'connecting')
// Show the coaching rail once there's something to show, or while in a call.
const showCoaching = computed(() => inCall.value || turns.value.length > 0)
</script>

<template>
  <div class="h-full overflow-y-auto p-5 sm:p-7">
    <!-- Header -->
    <div class="animate-card-enter" style="--delay:0ms">
      <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#B91C1C]/10 border border-[#B91C1C]/20 mb-2">
        <img src="/leo-logo.jpg" alt="Leo" class="size-3.5 rounded-full object-cover" />
        <span class="text-[10px] font-semibold text-[#B91C1C] dark:text-red-400 uppercase tracking-widest font-poppins">
          LEO Live Speaking Lab · پەیمانگای لیۆ
        </span>
      </div>
      <h1 class="font-poppins text-[28px] font-semibold tracking-[-0.02em] text-text-heading">Voice Lab &amp; Live Pronunciation Coach</h1>
      <p class="mt-1 font-poppins text-[14px] text-text-muted">
        A live speaking call with LEO AI Speaking Coach. Talk hands-free, get scored on how you sound.
      </p>
    </div>

    <!-- Subscription gate -->
    <div
      v-if="!subActive"
      class="animate-card-enter mt-5 flex items-center gap-3 rounded-xl border border-brand-primary/20 bg-brand-primary/5 p-4"
      style="--delay:60ms"
    >
      <AppIconsax name="InfoCircle" color="var(--color-brand-primary)" :size="20" />
      <div class="flex-1">
        <AppText size="14" weight="semibold" color="brand-ink" class-list="block font-poppins">
          Activate your plan to start calling
        </AppText>
        <AppText size="13" color="neutral-400" class-list="font-poppins">
          Verify your email or link Google to unlock spoken practice with LEO AI Speaking Coach.
        </AppText>
      </div>
      <AppButton to="/dashboard/billing" variant="primary" size="36" radius="8" text="View plans" :icon-config="{ color: 'white' }" />
    </div>

    <!-- Call surface -->
    <div class="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <div class="animate-card-enter" style="--delay:80ms">
          <PagesDashboardVoiceCallStage
            v-if="inCall"
            :phase="phase"
            :speaker="speaker"
            :level="level"
            :caption="caption"
            :call-clock="callClock"
            :muted="muted"
            @mute="toggleMute"
            @hangup="hangUp"
            @log="logOpen = true"
          />
          <PagesDashboardVoiceCallIntro
            v-else
            :disabled="!subActive"
            :connecting="connecting"
            @start="startCall"
          />
        </div>
      </div>

      <!-- Coaching rail -->
      <div class="flex flex-col gap-4">
        <template v-if="showCoaching">
          <div class="animate-card-enter" style="--delay:120ms">
            <PagesDashboardVoiceScorePanel :evaluation="lastEval" />
          </div>
          <div class="animate-card-enter" style="--delay:200ms">
            <PagesDashboardVoicePronunciationCard :available="pronunciationAvailable" :pronunciation="lastPron" />
          </div>
        </template>

        <!-- pre-call helper -->
        <div v-else class="dash-card animate-card-enter p-5" style="--delay:120ms">
          <div class="flex items-center gap-2">
            <AppIconsax name="Chart" color="var(--color-brand-primary)" :size="16" />
            <AppText size="14" weight="semibold" color="brand-ink" class-list="font-poppins">Live scoring</AppText>
          </div>
          <AppText size="13" color="neutral-400" class-list="mt-1.5 block font-poppins">
            Start a call and your grammar, vocabulary, and fluency scores update here after every turn you speak.
          </AppText>
          <div v-if="!pronunciationAvailable" class="mt-4 flex items-center gap-2 rounded-lg bg-surface-raised px-3 py-2.5">
            <AppIconsax name="Lock1" color="var(--color-text-subtle)" :size="14" />
            <AppText size="13" color="neutral-400" class-list="font-poppins">
              Word-level pronunciation scoring is a GOLD feature.
            </AppText>
          </div>
        </div>
      </div>
    </div>

    <!-- Transcript log -->
    <PagesDashboardVoiceTranscriptLog v-model:open="logOpen" :turns="turns" />
  </div>
</template>
