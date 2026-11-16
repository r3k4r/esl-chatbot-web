<template>
  <article :class="[
    'relative flex flex-col rounded-3xl p-7 sm:p-8 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5',
    featured
      ? 'bg-brand-ink md-lg:-my-6 md-lg:py-12 shadow-[0_48px_90px_-40px_rgba(17,17,17,0.7)]'
      : 'bg-neutral-50 border border-neutral-200/80',
  ]">
    <div v-if="featured" class="absolute inset-0 overflow-hidden rounded-[inherit] pointer-events-none" aria-hidden="true">
      <div class="absolute -top-40 -inset-e-24 size-120 rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.32),rgba(245,158,11,0.08)_55%,transparent)]" />
      <Icon v-for="star in stars" :key="star.id" icon="mdi:star-four-points" class="pricing-star absolute text-brand-accent"
        :width="star.size" :style="{
          insetInlineStart: `${star.x}%`,
          top: `${star.y}%`,
          '--o': star.opacity,
          '--d': `${star.delay}s`,
        }" />
    </div>

    <div class="relative flex items-center justify-between gap-3">
      <AppText size="18" weight="semibold" :color="featured ? 'white' : 'brand-ink'" class-list="tracking-tight">
        {{ plan.name }}
      </AppText>
      <span v-if="featured"
        class="inline-flex items-center gap-1.5 rounded-lg bg-brand-primary/15 px-2.5 py-1 text-[14px] font-medium text-brand-primary">
        <Icon icon="lucide:sparkles" width="16" /> {{ t('pricing.mostPopular') }}
      </span>
    </div>

    <div class="relative mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <AppText size="price" weight="semibold" :color="featured ? 'white' : 'brand-ink'"
        class-list="tracking-[-0.045em] leading-none tabular-nums">
        {{ amount }}
      </AppText>
      <AppText v-if="currency" size="15" :color="featured ? 'white-60' : 'brand-sub'">
        {{ currency }}{{ t('pricing.perMonth') }}
      </AppText>
    </div>

    <AppText size="15" :color="featured ? 'white-70' : 'brand-sub'" class-list="relative mt-4 leading-relaxed max-w-[34ch]">
      {{ plan.description }}
    </AppText>

    <ul class="relative mt-8 space-y-3.5">
      <li v-for="item in plan.features" :key="item" class="flex items-start gap-3">
        <Icon icon="lucide:check" width="18" stroke-width="2.5" class="mt-0.5 shrink-0"
          :class="featured ? 'text-brand-primary' : 'text-brand-ink'" />
        <AppText size="15" :color="featured ? 'white-90' : 'brand-ink'">{{ item }}</AppText>
      </li>
    </ul>

    <div class="relative mt-auto pt-10">
      <!-- Featured sits on ink, so its button inverts to light instead of amber. -->
      <AppButton :to="href" variant="ink" size="52" radius="12" :class-list="[
        'w-full gap-2 text-[15px] font-semibold',
        featured ? 'bg-neutral-50! text-brand-ink! border-neutral-50! hover:bg-neutral-100!' : '',
      ].join(' ')">
        <span>{{ plan.cta }}</span>
        <Icon icon="lucide:arrow-right" width="16" class="rtl:rotate-180"
          :class="featured ? 'text-brand-ink' : 'text-neutral-50'" />
      </AppButton>
    </div>
  </article>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { PricingPlan } from '~/common/types/subscription-types'

const props = defineProps<{
  plan: PricingPlan
  href: string
}>()

const { t } = useLocale()
const featured = computed(() => Boolean(props.plan.featured))

// "25,000 IQD" → big amount + small currency; a single word ("Free") stays whole.
const amount = computed(() => props.plan.price.split(' ')[0])
const currency = computed(() => props.plan.price.split(' ').slice(1).join(' '))

const stars = [
  { id: 1, x: 60, y: 15, size: 10, opacity: 0.7, delay: 0 },
  { id: 2, x: 76, y: 21, size: 16, opacity: 0.95, delay: 0.8 },
  { id: 3, x: 92, y: 13, size: 9, opacity: 0.6, delay: 1.6 },
  { id: 4, x: 68, y: 33, size: 8, opacity: 0.5, delay: 2.2 },
  { id: 5, x: 88, y: 37, size: 13, opacity: 0.8, delay: 0.4 },
  { id: 6, x: 53, y: 26, size: 7, opacity: 0.45, delay: 1.2 },
  { id: 7, x: 96, y: 27, size: 7, opacity: 0.5, delay: 2.6 },
  { id: 8, x: 81, y: 50, size: 9, opacity: 0.35, delay: 1.9 },
]
</script>

<style scoped>
.pricing-star {
  translate: -50% -50%;
  opacity: var(--o);
  filter: drop-shadow(0 0 6px rgba(254, 192, 22, 0.55));
  animation: twinkle 3.6s ease-in-out var(--d) infinite;
}

@keyframes twinkle {
  50% {
    opacity: calc(var(--o) * 0.3);
    scale: 0.65;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pricing-star {
    animation: none;
  }
}
</style>
