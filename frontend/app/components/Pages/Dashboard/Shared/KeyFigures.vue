<script setup lang="ts">
import type { KeyFigure } from '~/common/types/dashboard-types'

// A calm row of the few numbers that matter, each with its context: what it's compared
// with (this week vs the 7 days before) or a short hint. One card, no icon tiles.

defineProps<{ items: KeyFigure[] }>()

function trend(f: KeyFigure) {
  if (f.now === undefined || f.before === undefined) return null
  const diff = f.now - f.before
  if (diff === 0) return { text: 'Same as last week', tone: 'text-text-subtle' }
  const good = f.upIsBad ? diff < 0 : diff > 0
  return {
    text: `${diff > 0 ? '+' : '−'}${Math.abs(diff)} vs last week`,
    tone: good ? 'text-[var(--status-active-text)]' : 'text-destructive',
  }
}
</script>

<template>
  <dl class="dash-card grid grid-cols-2 divide-border-inner max-md:gap-y-5 max-md:p-5 md:grid-flow-col md:auto-cols-fr md:divide-x">
    <div v-for="f in items" :key="f.label" class="min-w-0 md:px-6 md:py-5">
      <dt><AppText size="14" color="neutral-400">{{ f.label }}</AppText></dt>
      <dd class="mt-1">
        <AppText size="24" weight="semibold" class-list="tabular-nums leading-tight">{{ f.value }}</AppText>
        <span v-if="trend(f)" :class="['mt-1 block text-[13px]', trend(f)!.tone]">{{ trend(f)!.text }}</span>
        <AppText v-else-if="f.hint" size="13" color="neutral-400" class-list="mt-1">{{ f.hint }}</AppText>
      </dd>
    </div>
  </dl>
</template>
