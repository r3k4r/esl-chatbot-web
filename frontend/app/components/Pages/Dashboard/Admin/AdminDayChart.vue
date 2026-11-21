<script setup lang="ts">
// One measure over the last 30 days, in a card: the headline number, what it's compared with,
// and the chart. Three marks for three kinds of data:
//   bars  - a count per day (active learners)
//   area  - a volume per day (AI messages)
//   line  - a running total that only grows (accounts)
// One series each, so no legend: the title names it. Hover (or tap) a day for its value.
const props = defineProps<{
  title: string
  value: string
  context: string
  kind: 'bars' | 'area' | 'line'
  dates: string[]
  values: number[]
  /** Tooltip text for one day's value */
  tip: (v: number, i: number) => string
}>()

const max = computed(() => Math.max(1, ...props.values))
const min = computed(() => (props.kind === 'line' ? Math.min(...props.values) : 0))
const span = computed(() => Math.max(1, max.value - min.value))
const n = computed(() => props.values.length)

// SVG in a 0..100 box; strokes keep their width with non-scaling-stroke.
const x = (i: number) => (n.value === 1 ? 50 : (i / (n.value - 1)) * 100)
const y = (v: number) => 96 - ((v - min.value) / span.value) * 88
const path = computed(() => props.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' '))
const fill = computed(() => `${path.value} L100,100 L0,100 Z`)

const hover = ref<number | null>(null)
const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
const short = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })
const tipLeft = computed(() => (hover.value === null ? 0 : Math.min(85, Math.max(15, ((hover.value + 0.5) / n.value) * 100))))
</script>

<template>
  <section class="dash-card flex flex-col p-5">
    <AppText size="14" color="neutral-400">{{ title }}</AppText>
    <div class="mt-0.5 flex flex-wrap items-baseline gap-x-2">
      <AppText size="24" weight="semibold" class-list="tabular-nums leading-tight">{{ value }}</AppText>
      <AppText size="13" color="neutral-400" class-list="tabular-nums">{{ context }}</AppText>
    </div>

    <div class="relative mt-3 min-h-28 flex-1" @mouseleave="hover = null">
      <!-- Baseline only: the grid stays out of the way -->
      <div class="absolute inset-x-0 bottom-0 border-t border-border-inner" aria-hidden="true" />

      <div v-if="kind === 'bars'" class="absolute inset-0 grid grid-cols-30 items-end gap-0.5" aria-hidden="true">
        <div v-for="(v, i) in values" :key="i"
          class="rounded-t-[3px] transition-[background-color]"
          :class="hover === i ? 'bg-brand-primary' : i >= n - 7 ? 'bg-brand-primary/85' : 'bg-brand-primary/40'"
          :style="{ height: v ? `${Math.max(4, (v / max) * 100)}%` : '0' }" />
      </div>

      <svg v-else class="absolute inset-0 size-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <path v-if="kind === 'area'" :d="fill" class="fill-brand-primary/15" />
        <path :d="path" fill="none" class="stroke-brand-primary" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
        <line v-if="hover !== null" :x1="x(hover)" :x2="x(hover)" y1="0" y2="100" class="stroke-border-card" stroke-width="1" vector-effect="non-scaling-stroke" />
      </svg>
      <!-- The hovered point (HTML, so it stays round in a stretched box) -->
      <span v-if="kind !== 'bars' && hover !== null"
        class="pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-card bg-brand-primary"
        :style="{ left: `${x(hover)}%`, top: `${y(values[hover]!)}%` }" />

      <!-- Hit targets: one column per day, wider than the marks -->
      <div class="absolute inset-0 grid grid-cols-30" role="list" :aria-label="`${title}, last 30 days`">
        <button v-for="(d, i) in dates" :key="d" type="button" role="listitem" class="h-full cursor-default outline-none focus-visible:bg-surface-raised/60"
          :aria-label="`${day(d)}: ${tip(values[i]!, i)}`" @mouseenter="hover = i" @focus="hover = i" @blur="hover = null" @click="hover = i" />
      </div>

      <div v-if="hover !== null" class="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-border-card bg-surface-card px-2.5 py-1.5 shadow-md"
        :style="{ left: `${tipLeft}%` }">
        <AppText size="13" color="neutral-400">{{ day(dates[hover]!) }}</AppText>
        <AppText size="14" weight="semibold" class-list="tabular-nums">{{ tip(values[hover]!, hover) }}</AppText>
      </div>
    </div>
    <div class="mt-1.5 flex justify-between">
      <AppText size="13" color="neutral-400">{{ short(dates[0]!) }}</AppText>
      <AppText size="13" color="neutral-400">Today</AppText>
    </div>
  </section>
</template>
