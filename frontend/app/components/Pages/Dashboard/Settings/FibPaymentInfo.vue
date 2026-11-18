<script setup lang="ts">
import { PLAN_PRICES_IQD } from '~/common/types/subscription-types'

// How paying works, in four plain lines, next to the plan you're on.
// The yearly saving is worked out from the real prices, never typed in.
const bestYearlySaving = Math.max(...Object.values(PLAN_PRICES_IQD).map(p => Math.floor((1 - p[12] / (p[1] * 12)) * 100)))

const points = [
  'Paid securely through First Iraqi Bank (FIB)',
  'In Iraqi dinar, with no exchange fees',
  'Cancel any time and keep your plan until the period ends',
  `Save up to ${bestYearlySaving}% with a 12-month plan`,
]
</script>

<template>
  <section aria-labelledby="fib-info" class="dash-card p-5">
    <div class="flex items-center gap-2">
      <AppIconsax name="SecuritySafe" color="var(--color-brand-primary)" :size="18" />
      <AppText id="fib-info" size="16" weight="semibold">Paying with FIB</AppText>
    </div>
    <ul class="mt-4 space-y-3">
      <li v-for="p in points" :key="p" class="flex items-start gap-2.5">
        <AppIconsax name="TickCircle" color="var(--color-brand-primary)" :size="16" class="mt-0.5 shrink-0" />
        <AppText size="14" color="neutral-600">{{ p }}</AppText>
      </li>
    </ul>
  </section>
</template>
