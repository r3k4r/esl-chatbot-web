<script setup lang="ts">
import type { VoicePhase, VoiceSpeaker } from '~/composables/useVoiceLab'

const props = defineProps<{
  phase: VoicePhase
  speaker: VoiceSpeaker
  level: number // 0-1 audio level for pulsing
}>()

const inCall = computed(() => props.phase === 'active')
const connecting = computed(() => props.phase === 'connecting')
const aiSpeaking = computed(() => props.speaker === 'ai')
const userTalking = computed(() => props.speaker === 'user')
const thinking = computed(() => props.speaker === 'thinking')

// Dynamic scale driven by audio level (subtle 1.0 -> 1.18 pulse)
const scale = computed(() => {
  if (aiSpeaking.value) return 1 + props.level * 0.18
  if (userTalking.value) return 1 + props.level * 0.12
  return 1
})
</script>

<template>
  <div class="relative flex h-72 items-center justify-center">
    <!-- ambient background aura -->
    <div
      class="pointer-events-none absolute h-64 w-64 rounded-full blur-3xl transition-all duration-300"
      :class="[
        aiSpeaking ? 'bg-[#B91C1C]/25 scale-125' : '',
        userTalking ? 'bg-[#1B365D]/30 scale-110' : '',
        thinking ? 'bg-amber-500/20 animate-pulse' : '',
        !inCall ? 'bg-white/5' : '',
      ]"
    />

    <!-- pulsing outer rings while speaking -->
    <span v-if="aiSpeaking" class="pulse-ring absolute rounded-full bg-[#B91C1C]/40" style="width:200px;height:200px;animation-delay:0.3s" />
    <span v-if="aiSpeaking" class="pulse-ring absolute rounded-full bg-[#1B365D]/40" style="width:170px;height:170px" />

    <!-- core orb -->
    <div
      class="relative grid place-content-center rounded-full shadow-[0_20px_60px_-15px_rgba(185,28,28,0.45)] transition-transform duration-150 ease-out"
      :class="aiSpeaking
        ? 'bg-linear-to-br from-[#1B365D] to-[#B91C1C]'
        : 'bg-linear-to-br from-[#1a1a1e] to-[#2a2a30] dark:from-[#1a1a1e] dark:to-[#2a2a30]'"
      style="width:150px;height:150px"
      :style="{ transform: `scale(${scale})` }"
    >
      <!-- inner sheen -->
      <div class="absolute inset-2 rounded-full bg-white/5" />

      <AppIconsax
        :name="userTalking ? 'Microphone2' : 'VolumeHigh'"
        :color="aiSpeaking ? '#ffffff' : '#B91C1C'"
        :size="44"
        class="relative"
      />

      <!-- connecting / thinking spinner ring -->
      <span
        v-if="connecting || thinking"
        class="absolute inset-0 rounded-full border-2 border-red-500/20 border-t-[#B91C1C] animate-spin"
      />
    </div>
  </div>
</template>

<style scoped>
@keyframes pulse-ring {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.15); opacity: 0.15; }
  100% { transform: scale(1.25); opacity: 0; }
}
.pulse-ring {
  animation: pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
}
</style>
