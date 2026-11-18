<script setup lang="ts">
import type { FeaturePage } from '~/common/types/feature-page-types'

// Why it helps: a whole page of the accent colour. The label and the statement stack in one
// column, the three reasons sit side by side under them.
const props = defineProps<{ feature: FeaturePage }>()
const { t } = useLocale()
const k = computed(() => `featurePages.items.${props.feature.key}`)
const reasons = ['s1', 's2', 's3'] as const
</script>

<template>
  <section aria-labelledby="feature-why" class="bg-brand-primary py-24 text-brand-ink md-lg:py-36">
    <div class="container-lg layout-padding-lg">
      <div class="flex flex-col gap-4">
        <h2 id="feature-why" v-reveal class="font-poppins text-[20px] font-semibold">{{ t('featurePages.whyTitle') }}</h2>
        <p v-reveal="80" class="max-w-[24ch] font-poppins text-[clamp(24px,2.5vw,36px)] font-semibold leading-[1.2] tracking-[-0.02em]">
          {{ t(`${k}.whyStatement`) }}
        </p>
      </div>
      <ul class="mt-14 grid gap-x-12 gap-y-8 sm:grid-cols-3">
        <li v-for="(r, i) in reasons" :key="r" v-reveal="140 + i * 80">
          <p class="font-poppins text-[20px] font-semibold">{{ t(`${k}.reasons.${r}.name`) }}</p>
          <p class="mt-2 max-w-[36ch] font-poppins text-[16px] leading-[1.55]">{{ t(`${k}.reasons.${r}.text`) }}</p>
        </li>
      </ul>
    </div>
  </section>
</template>
