<script setup lang="ts">
import type { FeaturePage } from '~/common/types/feature-page-types'

// TODO(ISS-006): the AI Conversation FAQ says Free is "20 messages a day" while the pricing card
// says "20 msgs/session" — align both texts in i18n/locales/{en,ku}.json (see Home/Pricing.vue).

// Questions set as reading text: each question runs straight into its answer, in two columns,
// so everything is answered at a glance. No toggles.
const props = defineProps<{ feature: FeaturePage }>()
const { t } = useLocale()
const k = computed(() => `featurePages.items.${props.feature.key}`)
const ids = computed(() => Array.from({ length: props.feature.faqCount }, (_, i) => `q${i + 1}`))
</script>

<template>
  <section aria-labelledby="feature-faq" class="bg-neutral-50 py-24 md-lg:py-36">
    <div class="container-lg layout-padding-lg md-lg:grid md-lg:grid-cols-12 md-lg:gap-x-8">
      <h2 id="feature-faq" v-reveal class="font-poppins text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.03em] text-brand-ink md-lg:col-span-4">
        {{ t('featurePages.faqTitle') }}
      </h2>
      <div class="mt-8 gap-14 md-lg:col-span-8 md-lg:mt-0 lg:columns-2">
        <p v-for="(q, i) in ids" :key="q" v-reveal="i * 50" class="mb-6 break-inside-avoid font-poppins text-[16px] leading-[1.6] text-brand-sub">
          <span class="font-medium text-brand-ink">{{ t(`${k}.faq.${q}.q`) }}</span>
          {{ t(`${k}.faq.${q}.a`) }}
        </p>
      </div>
    </div>
  </section>
</template>
