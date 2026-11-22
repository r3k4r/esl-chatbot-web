<!--
  TODO(ISS-006): the Free card says "20 msgs/session" (i18n pricing.plans…features) but the
  AI Conversation FAQ says "20 messages a day" (featurePages…faq). The real FREE rule is
  20 messages per session AND a 20-message daily cap (see PLAN_LIMITS in common/data/plan-limits.ts).
  Pick one wording for both places in en.json + ku.json.
-->
<template>
  <section id="pricing" class="bg-brand-muted/60 py-28 sm:py-36 border-y border-neutral-200/70">
    <div class="container-lg layout-padding-lg">
      <LayoutsSectionHeader :eyebrow="t('pricing.eyebrow')" :title="t('pricing.title')" align="center"
        wrapper-class="mb-16 md-lg:mb-20" title-class="text-balance" />

      <div class="grid md-lg:grid-cols-3 gap-5 items-stretch max-w-md md-lg:max-w-7xl mx-auto">
        <PagesHomePricingCard v-for="plan in plans" :key="plan.id" :plan="plan" :href="ctaHref(plan)" />
      </div>

      <AppText size="14" color="brand-sub" class-list="text-center mt-16">
        {{ t('pricing.footnote') }}
      </AppText>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'
import type { PricingPlan } from '~/common/types/subscription-types'

const authStore = useAuthStore()
const { t, ta } = useLocale()

function ctaHref(plan: PricingPlan) {
  if (!plan.planKey) return '/signup'
  return authStore.getIsAuthenticated
    ? `/dashboard/billing?plan=${plan.planKey}`
    : `/signup?redirect=/dashboard/billing?plan=${plan.planKey}`
}

// Structural plan data (id / billing key / featured flag) lives here; all
// copy (name, price, description, cta, features) comes from the active locale.
const planMeta: Pick<PricingPlan, 'id' | 'planKey' | 'featured'>[] = [
  { id: 'starter' },
  { id: 'gold', planKey: 'GOLD', featured: true },
  { id: 'premium', planKey: 'PREMIUM' },
]

const plans = computed<PricingPlan[]>(() =>
  planMeta.map((meta) => ({
    ...meta,
    name: t(`pricing.plans.${meta.id}.name`),
    price: t(`pricing.plans.${meta.id}.price`),
    description: t(`pricing.plans.${meta.id}.description`),
    cta: t(`pricing.plans.${meta.id}.cta`),
    features: ta(`pricing.plans.${meta.id}.features`),
  })),
)
</script>
