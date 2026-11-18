<script setup lang="ts">
import type { VoiceEvaluation } from '~/common/types/voice-types'

// Scores of the learner's last answer, with the tutor's one tip.
const props = defineProps<{ evaluation: VoiceEvaluation | null; scoring?: boolean }>()

const metrics = computed(() => [
  { label: 'Grammar', value: props.evaluation?.grammarScore ?? null },
  { label: 'Vocabulary', value: props.evaluation?.vocabularyScore ?? null },
  { label: 'Fluency', value: props.evaluation?.fluencyScore ?? null },
])

function tone(v: number) {
  if (v >= 85) return 'var(--status-active-text)'
  if (v >= 60) return 'var(--color-brand-primary)'
  return 'var(--status-expired-text)'
}
</script>

<template>
  <section class="dash-card p-5">
    <div class="flex items-center justify-between">
      <AppText size="15" weight="semibold">Your last answer</AppText>
      <span v-if="evaluation" class="rounded-md bg-surface-raised px-2 py-0.5 text-[13px] font-medium text-text-body">
        Level {{ evaluation.detectedCefrLevel }}
      </span>
    </div>

    <AppText v-if="!evaluation" size="14" color="neutral-400" class-list="mt-2">
      {{ scoring ? 'Scoring your answer…' : 'Speak on the call and your scores appear here after each answer.' }}
    </AppText>

    <template v-else>
      <div class="mt-3 flex items-baseline gap-1.5">
        <AppText size="36" weight="semibold" class-list="leading-none tabular-nums">{{ Math.round(evaluation.overallScore) }}</AppText>
        <AppText size="14" color="neutral-400">/ 100</AppText>
      </div>
      <dl class="mt-4 space-y-2.5">
        <div v-for="m in metrics" :key="m.label">
          <div class="flex justify-between text-[14px]">
            <dt class="text-text-muted">{{ m.label }}</dt>
            <dd class="font-medium tabular-nums text-text-heading">{{ m.value == null ? '–' : Math.round(m.value) }}</dd>
          </div>
          <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-raised">
            <div
              class="h-full origin-left rounded-full transition-transform duration-500 ease-out"
              :style="{ transform: `scaleX(${(m.value ?? 0) / 100})`, background: m.value == null ? 'transparent' : tone(m.value) }"
            />
          </div>
        </div>
      </dl>
      <AppText v-if="evaluation.feedback" size="14" color="neutral-400" class-list="mt-4 border-t border-border-inner pt-3 leading-relaxed">
        {{ evaluation.feedback }}
      </AppText>
    </template>
  </section>
</template>
