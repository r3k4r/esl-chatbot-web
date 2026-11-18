<script setup lang="ts">
import type { VoicePronunciation } from '~/common/types/voice-types'

// Word-level pronunciation (Azure assessment): GOLD and PREMIUM only.
const props = defineProps<{ available: boolean; pronunciation: VoicePronunciation | null }>()

const metrics = computed(() => {
  const p = props.pronunciation
  if (!p) return []
  const out = [
    { label: 'Accuracy', value: p.accuracyScore },
    { label: 'Fluency', value: p.fluencyScore },
    { label: 'Complete', value: p.completenessScore },
  ]
  if (p.prosodyScore != null) out.push({ label: 'Rhythm', value: p.prosodyScore })
  return out
})
</script>

<template>
  <section class="dash-card p-5">
    <div class="flex items-center justify-between">
      <AppText size="15" weight="semibold">Pronunciation</AppText>
      <span v-if="!available" class="flex items-center gap-1 rounded-md bg-surface-raised px-2 py-0.5 text-[13px] font-medium text-text-muted">
        <AppIconsax name="Lock1" :size="14" color="var(--color-text-muted)" /> Gold
      </span>
    </div>

    <template v-if="!available">
      <AppText size="14" color="neutral-400" class-list="mt-2">
        See which words you say well and which need practice, after every answer.
      </AppText>
      <AppButton to="/dashboard/billing" variant="outline" size="36" radius="8" icon="Crown1" text="Upgrade to Gold" class-list="mt-3 text-[14px]" />
    </template>

    <AppText v-else-if="!pronunciation" size="14" color="neutral-400" class-list="mt-2">
      Your pronunciation scores appear after you speak.
    </AppText>

    <template v-else>
      <dl class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4 md-lg:grid-cols-2">
        <div v-for="m in metrics" :key="m.label" class="rounded-lg bg-surface-raised px-3 py-2">
          <dt class="text-[13px] text-text-muted">{{ m.label }}</dt>
          <dd class="text-[18px] font-semibold tabular-nums text-text-heading">{{ Math.round(m.value) }}</dd>
        </div>
      </dl>
      <div v-if="pronunciation.issues.length" class="mt-4 border-t border-border-inner pt-3">
        <AppText size="14" weight="medium">Words to practise</AppText>
        <ul class="mt-2 space-y-2" dir="ltr">
          <li v-for="(issue, i) in pronunciation.issues.slice(0, 4)" :key="i" class="text-[14px]">
            <span class="font-semibold text-text-heading">{{ issue.word }}</span>
            <span class="text-text-muted"> · {{ issue.suggestion }}</span>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>
