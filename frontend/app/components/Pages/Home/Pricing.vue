<template>
  <section id="pricing" class="bg-brand-muted/60 py-28 sm:py-32 border-y border-neutral-200/70">
    <div class="container-lg layout-padding-lg">
      <LayoutsSectionHeader :eyebrow="t('pricing.eyebrow')" :title="t('pricing.title')" align="center"
        wrapper-class="mb-14" />

      <div class="grid md:grid-cols-3 gap-5 items-stretch max-w-7xl mx-auto">
        <div v-for="plan in plans" :key="plan.id" :class="[
          'relative rounded-[22px] overflow-hidden p-7 flex flex-col transition-transform duration-250 h-140 hover:-translate-y-0.5',
          plan.featured
            ? 'bg-linear-to-t from-white via-primary-200/60 to-primary-300 shadow-card shadow-brand-primary/20'
            : 'bg-neutral-50 border border-neutral-200/70 shadow-soft',
        ]">
          <div v-if="plan.featured" class="premium-stars" aria-hidden="true">
            <Icon v-for="star in premiumStars" :key="star.id" icon="mdi:star" class="premium-star" :width="star.size"
              :style="{
                left: `${star.x}%`,
                top: `${star.y}%`,
                opacity: star.opacity,
                transform: `translate(-50%, -50%) rotate(${star.rotate}deg)`,
              }" />
          </div>

          <div class="relative flex items-center justify-between">
            <AppText size="15" weight="semibold" class-list="tracking-tight"
              :class="plan.featured ? 'text-white' : 'text-brand-primary'">
              {{ plan.name }}
            </AppText>
            <span v-if="plan.featured"
              class="text-[11px] font-medium text-white flex items-center gap-1.5 bg-white/20 backdrop-blur px-2.5 py-1 rounded-full">
              <Icon icon="lucide:sparkles" width="11" /> {{ t('pricing.mostPopular') }}
            </span>
          </div>

          <div class="relative mt-4 flex items-baseline gap-1">
            <AppText size="price" weight="semibold" class-list="tracking-[-0.04em]"
              :class="plan.featured ? 'text-white' : 'text-brand-ink'">
              {{ plan.price }}
            </AppText>
            <AppText size="14" :class="plan.featured ? 'text-white/85' : 'text-brand-sub'">
              {{ t('pricing.perMonth') }}
            </AppText>
          </div>

          <AppText size="13" class-list="mt-3 leading-relaxed relative flex-1"
            :class="plan.featured ? 'text-white/90' : 'text-brand-sub'">
            {{ plan.description }}
          </AppText>

          <div class="relative mt-7">
            <ul class="space-y-3">
              <li v-for="item in plan.features" :key="item" class="flex items-center gap-3">
                <span
                  class="w-4.5 h-4.5 rounded-full flex items-center justify-center shrink-0 bg-brand-primary text-white">
                  <Icon icon="lucide:check" width="11" stroke-width="3" />
                </span>
                <AppText size="13" class="text-brand-ink">
                  {{ item }}
                </AppText>
              </li>
            </ul>
            <div class="mt-8">
              <AppButton :to="ctaHref(plan)" :variant="plan.featured ? 'primary' : 'ghost'" size="44" radius="full"
                :class-list="plan.featured
                    ? 'gap-2 text-[13px] px-5 bg-brand-ink! hover:bg-neutral-900!'
                    : 'gap-2 text-[13px] px-5 bg-neutral-100! border-neutral-200/70! text-brand-ink!'
                  ">
                <span>{{ plan.cta }}</span>
                <Icon icon="lucide:arrow-right" width="14" class="rtl:rotate-180" />
              </AppButton>
            </div>
          </div>
        </div>
      </div>

      <AppText size="12" color="brand-sub" class-list="text-center mt-12">
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
  if (!plan.planKey) return '/signup'
  return authStore.getIsAuthenticated
    ? `/dashboard/billing?plan=${plan.planKey}`
    : `/signup?redirect=/dashboard/billing?plan=${plan.planKey}`
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
  { id: 's4', x: 54, y: 13, size: 20, opacity: 0.95, rotate: 12 },
  { id: 's5', x: 68, y: 9, size: 12, opacity: 0.82, rotate: -14 },
  { id: 's6', x: 83, y: 18, size: 16, opacity: 0.9, rotate: 5 },
  { id: 's7', x: 92, y: 10, size: 11, opacity: 0.78, rotate: -8 },
  { id: 's8', x: 16, y: 29, size: 13, opacity: 0.8, rotate: 10 },
  { id: 's9', x: 47, y: 27, size: 17, opacity: 0.86, rotate: -5 },
  { id: 's10', x: 74, y: 33, size: 12, opacity: 0.8, rotate: 7 },
]

// Structural plan data (id / billing key / featured flag) lives here; all
// copy (name, price, description, cta, features) comes from the active locale.
const planMeta: Pick<Plan, 'id' | 'planKey' | 'featured'>[] = [
  { id: 'starter' },
  { id: 'gold', planKey: 'GOLD', featured: true },
  { id: 'premium', planKey: 'PREMIUM' },
]

const plans = computed<Plan[]>(() =>
  planMeta.map((meta) => ({
    ...meta,
    name:        t(`pricing.plans.${meta.id}.name`),
    price:       t(`pricing.plans.${meta.id}.price`),
    description: t(`pricing.plans.${meta.id}.description`),
    cta:         t(`pricing.plans.${meta.id}.cta`),
    features:    ta(`pricing.plans.${meta.id}.features`),
  })),
)
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
  color: rgba(255, 255, 255, 0.95);
  filter: drop-shadow(0 2px 4px rgba(8, 20, 46, 0.18));
}
</style>
