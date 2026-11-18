<script setup lang="ts">
import type { FeaturePage } from '~/common/types/feature-page-types'

// How it works: the heading and one paragraph, then the three steps side by side, words only.
const props = defineProps<{ feature: FeaturePage }>()
const { t } = useLocale()
const k = computed(() => `featurePages.items.${props.feature.key}`)
const steps = ['s1', 's2', 's3'] as const
</script>

<template>
  <!-- Extra top room: the masthead's screen hangs 96px (160px on desktop) into this section -->
  <section aria-labelledby="feature-flow" class="bg-neutral-50 pb-24 pt-48 md-lg:pb-36 md-lg:pt-76">
    <div class="container-lg layout-padding-lg">
      <h2 id="feature-flow" v-reveal class="font-poppins text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.03em] text-brand-ink">
        {{ t('featurePages.flowTitle') }}
      </h2>
      <p v-reveal="80" class="mt-5 max-w-[56ch] font-poppins text-[20px] leading-[1.55] text-brand-ink">{{ t(`${k}.flowText`) }}</p>

      <ol class="mt-16 grid gap-x-12 gap-y-12 md-lg:mt-20 md-lg:grid-cols-3">
        <li v-for="(s, i) in steps" :key="s" v-reveal="120 + i * 90">
          <span class="block h-1 w-10 rounded-full bg-brand-primary" aria-hidden="true" />
          <p class="mt-6 font-poppins text-[clamp(24px,2.2vw,30px)] font-semibold tracking-[-0.02em] text-brand-ink">{{ t(`${k}.steps.${s}.name`) }}</p>
          <p class="mt-3 max-w-[36ch] font-poppins text-[17px] leading-[1.6] text-brand-sub">{{ t(`${k}.steps.${s}.text`) }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
