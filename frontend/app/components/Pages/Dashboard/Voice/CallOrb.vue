<script setup lang="ts">
import type { CallSpeaker } from '~/common/types/voice-types'

// The call's one visual. It follows whoever is talking: your voice moves the ring,
// the tutor's voice moves the core and sends out soft waves.
const props = defineProps<{ inCall?: boolean; connecting?: boolean; speaker?: CallSpeaker; level?: number }>()

const tutor = computed(() => props.speaker === 'tutor')
const ring = computed(() => 1 + (props.speaker === 'learner' ? (props.level ?? 0) * 0.45 : 0))
const core = computed(() => 1 + (tutor.value ? (props.level ?? 0) * 0.12 : 0))
const icon = computed(() => (!props.inCall ? 'Call' : tutor.value ? 'Sound' : 'Microphone2'))
</script>

<template>
  <div class="relative grid size-48 place-items-center" aria-hidden="true">
    <span
      class="absolute size-40 rounded-full bg-brand-primary/10 transition-transform duration-100 ease-out"
      :style="{ transform: `scale(${ring})` }"
    />
    <template v-if="tutor">
      <span class="orb-wave absolute size-32 rounded-full bg-brand-primary/25" />
      <span class="orb-wave absolute size-32 rounded-full bg-brand-primary/25 [animation-delay:900ms]" />
    </template>
    <span
      class="relative grid size-32 place-items-center rounded-full bg-brand-primary transition-transform duration-100 ease-out"
      :class="{ 'opacity-60': connecting }"
      :style="{ transform: `scale(${core})` }"
    >
      <AppIconsax :name="icon" :size="40" color="white" />
      <span
        v-if="connecting"
        class="absolute -inset-1.5 animate-spin rounded-full border-2 border-transparent border-t-brand-primary motion-reduce:animate-none"
      />
    </span>
  </div>
</template>

<style scoped>
.orb-wave {
  animation: orb-wave 1.8s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}
@keyframes orb-wave {
  from { transform: scale(1); opacity: 0.9; }
  to { transform: scale(1.6); opacity: 0; }
}
@media (prefers-reduced-motion: reduce) {
  .orb-wave { animation: none; opacity: 0.4; }
}
</style>
