<script setup lang="ts">
import { useLiveCall } from '~/composables/useLiveCall'
import CallAllowance from '~/components/Pages/Dashboard/Voice/CallAllowance.vue'
import CallLocked from '~/components/Pages/Dashboard/Voice/CallLocked.vue'
import CallTranscript from '~/components/Pages/Dashboard/Voice/CallTranscript.vue'

definePageMeta({ layout: 'dashboard', requiresAuth: true, learnerOnly: true })

const {
  usage, lock, pronunciationAvailable,
  phase, inCall, speaker, level, muted, callClock, learnerCaption, tutorCaption,
  turns, lastEval, lastPron, scoring,
  startCall, toggleMute, hangUp,
} = useLiveCall()
</script>

<template>
  <div class="h-full overflow-y-auto page-padding">
    <header class="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div>
        <AppText size="24" weight="semibold" class-list="tracking-tight">Voice Lab</AppText>
        <AppText size="14" color="neutral-400" class-list="mt-1">
          Practise speaking English on a live call with Tutelage AI.
        </AppText>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <CallAllowance :usage="usage" />
        <!-- The voice is set when a call starts, so it can't change mid-call -->
        <BlockTutorVoicePicker :disabled="inCall" disabled-hint="Change the voice after this call" />
      </div>
    </header>

    <!-- Built in the browser (mic + live audio only work there), so the row layout never
         depends on server-rendered markup matching. -->
    <ClientOnly>
    <div class="voice-grid mt-5">
      <div class="relative md-lg:h-[calc(100dvh-11rem)] md-lg:min-h-[540px]">
        <PagesDashboardVoiceCallStage
          v-if="inCall"
          :phase="phase"
          :speaker="speaker"
          :level="level"
          :muted="muted"
          :call-clock="callClock"
          :learner-caption="learnerCaption"
          :tutor-caption="tutorCaption"
          @mute="toggleMute"
          @hangup="hangUp"
        />
        <PagesDashboardVoiceCallIntro v-else :disabled="!!lock" :inert="!!lock" @start="startCall" />
        <CallLocked v-if="lock && !inCall" :lock="lock" :usage="usage" />
      </div>

      <aside class="flex min-w-0 flex-col gap-4">
        <PagesDashboardVoiceScorePanel :evaluation="lastEval" :scoring="scoring" />
        <PagesDashboardVoicePronunciationCard :available="pronunciationAvailable" :pronunciation="lastPron" />
        <CallTranscript :turns="turns" />
      </aside>
    </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* Call beside the scores whenever there is room (1024px+). Plain CSS, so the layout
   never depends on a utility class being generated or on hydration patching classes. */
.voice-grid {
  display: grid;
  gap: 1rem;
}
@media (min-width: 1024px) {
  .voice-grid { grid-template-columns: minmax(0, 1fr) 22rem; }
}
</style>
