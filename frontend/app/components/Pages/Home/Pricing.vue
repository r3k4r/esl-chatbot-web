<template>
  <section id="pricing" class="bg-slate-50/70 py-24 sm:py-32 border-y border-slate-200/80">
    <div class="container-lg layout-padding-lg">
      <LayoutsSectionHeader :eyebrow="t('pricing.eyebrow')" :title="t('pricing.title')" align="center"
        wrapper-class="mb-14" />

      <div class="grid md:grid-cols-3 gap-6 items-stretch max-w-7xl mx-auto">
        <div v-for="plan in plans" :key="plan.id" :class="[
          'relative rounded-[22px] overflow-hidden p-7 flex flex-col transition-all duration-300 h-140 hover:-translate-y-1',
          plan.featured
            ? 'bg-linear-to-b from-[#1B365D] via-[#162B4D] to-[#0F172A] text-white border border-white/15 shadow-2xl shadow-slate-900/25'
            : 'bg-white border border-slate-200/90 shadow-sm',
        ]">
          <div v-if="plan.featured" class="premium-stars" aria-hidden="true">
            <Icon v-for="star in premiumStars" :key="star.id" icon="mdi:star" class="premium-star text-amber-400" :width="star.size"
              :style="{
                left: `${star.x}%`,
                top: `${star.y}%`,
                opacity: star.opacity,
                transform: `translate(-50%, -50%) rotate(${star.rotate}deg)`,
              }" />
          </div>

          <div class="relative flex items-center justify-between">
            <AppText size="15" weight="semibold" class-list="tracking-tight font-bold"
              :class="plan.featured ? 'text-amber-300' : 'text-[#B91C1C]'">
              {{ plan.name }}
            </AppText>
            <span v-if="plan.featured"
              class="text-[11px] font-semibold text-white flex items-center gap-1.5 bg-[#B91C1C] px-3 py-1 rounded-full shadow-xs">
              <Icon icon="lucide:sparkles" width="11" class="text-amber-300" /> {{ t('pricing.mostPopular') }}
            </span>
          </div>

          <div class="relative mt-4 flex items-baseline gap-1.5">
            <AppText size="price" weight="semibold" class-list="tracking-[-0.04em] font-extrabold text-2xl sm:text-3xl"
              :class="plan.featured ? 'text-white' : 'text-slate-900'">
              {{ plan.price }}
            </AppText>
            <AppText size="14" :class="plan.featured ? 'text-slate-300' : 'text-slate-500'">
              {{ t('pricing.perMonth') }}
            </AppText>
          </div>

          <AppText size="13" class-list="mt-3 leading-relaxed relative flex-1 text-xs sm:text-sm"
            :class="plan.featured ? 'text-slate-200' : 'text-slate-600'">
            {{ plan.description }}
          </AppText>

          <div class="relative mt-7">
            <ul class="space-y-3">
              <li v-for="item in plan.features" :key="item" class="flex items-center gap-3">
                <span
                  class="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  :class="plan.featured ? 'bg-[#B91C1C] text-white' : 'bg-red-50 text-[#B91C1C] border border-red-200'"
                >
                  <Icon icon="lucide:check" width="12" stroke-width="3" />
                </span>
                <AppText size="13" :class="plan.featured ? 'text-slate-200' : 'text-slate-700'" class-list="text-xs sm:text-sm font-medium">
                  {{ item }}
                </AppText>
              </li>
            </ul>
            <div class="mt-8">
              <AppButton :to="ctaHref(plan)" :variant="plan.featured ? 'brand' : 'ghost'" size="44" radius="full"
                :class-list="plan.featured
                    ? 'gap-2 text-[13px] px-5 w-full shadow-lg shadow-red-950/40'
                    : 'gap-2 text-[13px] px-5 w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800'
                  ">
                <span>{{ plan.cta }}</span>
                <Icon icon="lucide:arrow-right" width="14" class="rtl:rotate-180" />
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <AppText size="12" color="brand-sub" class-list="text-center mt-12 text-slate-500">
        {{ t('pricing.footnote') }}
      </AppText>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useAuthStore } from '~~/stores/auth'

const authStore = useAuthStore()
const { t, ta } = useLocale()

type Plan = {
  id: 'starter' | 'gold' | 'premium'
  name: string
  price: string
  description: string
  features: string[]
  cta: string
  planKey?: 'GOLD' | 'PREMIUM'
  featured?: boolean
}

function ctaHref(plan: Plan) {
  if (plan.id === 'starter') return '/#cta'
  if (plan.id === 'gold') return '/#cta'
  return '/dashboard/chat'
}

type PremiumStar = {
  id: string
  x: number
  y: number
  size: number
  opacity: number
  rotate: number
}

const premiumStars: PremiumStar[] = [
  { id: 's1', x: 10, y: 10, size: 12, opacity: 0.95, rotate: -10 },
  { id: 's2', x: 24, y: 16, size: 18, opacity: 0.92, rotate: 8 },
  { id: 's3', x: 38, y: 8, size: 10, opacity: 0.8, rotate: -6 },
  { id: 's4', x: 75, y: 14, size: 14, opacity: 0.9, rotate: 12 },
  { id: 's5', x: 88, y: 9, size: 10, opacity: 0.75, rotate: -15 },
]

const plans = computed<Plan[]>(() => [
  {
    id: 'starter',
    name: t('pricing.plans.starter.name'),
    price: t('pricing.plans.starter.price'),
    description: t('pricing.plans.starter.description'),
    features: ta('pricing.plans.starter.features'),
    cta: t('pricing.plans.starter.cta'),
  },
  {
    id: 'gold',
    name: t('pricing.plans.gold.name'),
    price: t('pricing.plans.gold.price'),
    description: t('pricing.plans.gold.description'),
    features: ta('pricing.plans.gold.features'),
    cta: t('pricing.plans.gold.cta'),
    planKey: 'GOLD',
    featured: true,
  },
  {
    id: 'premium',
    name: t('pricing.plans.premium.name'),
    price: t('pricing.plans.premium.price'),
    description: t('pricing.plans.premium.description'),
    features: ta('pricing.plans.premium.features'),
    cta: t('pricing.plans.premium.cta'),
    planKey: 'PREMIUM',
  },
])
</script>

<style scoped>
.premium-stars {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.premium-star {
  position: absolute;
  filter: drop-shadow(0 0 6px rgba(245, 158, 11, 0.45));
}
</style>
