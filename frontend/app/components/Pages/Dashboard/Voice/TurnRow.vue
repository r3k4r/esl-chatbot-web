<script setup lang="ts">
import type { VoiceTurn } from '~/common/types/voice-types'

// One exchange in the call transcript: what you said (with its score) and the tutor's answer.
defineProps<{ turn: VoiceTurn }>()
</script>

<template>
  <li class="space-y-2" dir="ltr">
    <div v-if="turn.transcript">
      <div class="flex items-center justify-between">
        <AppText size="13" color="neutral-400">You</AppText>
        <span v-if="turn.evaluation" class="text-[13px] font-medium tabular-nums text-text-muted">
          {{ Math.round(turn.evaluation.overallScore) }} / 100
        </span>
        <span v-else-if="turn.scoring" class="text-[13px] text-text-subtle">Scoring…</span>
      </div>
      <AppText size="14" class-list="mt-0.5">{{ turn.transcript }}</AppText>
    </div>
    <div v-if="turn.reply" class="rounded-lg bg-surface-raised px-3 py-2">
      <AppText size="13" color="neutral-400">Tutelage AI</AppText>
      <AppText size="14" class-list="mt-0.5">{{ turn.reply }}</AppText>
    </div>
  </li>
</template>
