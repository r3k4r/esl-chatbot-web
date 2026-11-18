<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { FEATURE_PAGES } from '~/common/data/feature-pages'
import type { FeaturePage } from '~/common/types/feature-page-types'

// The close: a dark band with the closing line (its underlined phrase is the action) and
// every other feature.
const props = defineProps<{ feature: FeaturePage }>()
const { t } = useLocale()

const others = computed(() => {
  const i = FEATURE_PAGES.findIndex(f => f.key === props.feature.key)
  return [...FEATURE_PAGES.slice(i + 1), ...FEATURE_PAGES.slice(0, i)]
})
const title = (f: FeaturePage) => t(`features.items.${f.key}.title`)
</script>

<template>
  <section aria-labelledby="feature-more" class="bg-brand-ink text-neutral-50">
    <div class="container-lg layout-padding-lg pt-20 pb-8 md-lg:grid md-lg:grid-cols-12 md-lg:gap-x-8 md-lg:pt-28">
      <div class="md-lg:col-span-7">
        <h2 id="feature-more" v-reveal class="font-poppins text-[clamp(24px,2.5vw,36px)] font-semibold leading-[1.2] tracking-[-0.02em]">
          {{ t('featurePages.closingLead') }}
        </h2>
        <p v-reveal="80" class="mt-4 font-poppins text-[20px] font-semibold">
          <AppLink to="/signup" class="underline decoration-brand-primary decoration-4 underline-offset-[6px] transition-colors hover:text-brand-primary">
            {{ t('featurePages.closingLink') }}
          </AppLink>
        </p>
        <p v-reveal="140" class="mt-8 max-w-[52ch] font-poppins text-[16px] leading-[1.6] text-neutral-50/70">{{ t('featurePages.closingNote') }}</p>
      </div>

      <nav class="mt-14 md-lg:col-span-4 md-lg:col-start-9 md-lg:mt-0" :aria-label="t('featurePages.otherFeatures')">
        <p class="font-poppins text-[15px] text-neutral-50/60">{{ t('featurePages.otherFeatures') }}</p>
        <ul class="mt-3">
          <li v-for="f in others" :key="f.key">
            <AppLink :to="`/features/${f.slug}`" class="group flex items-center justify-between gap-3 py-2.5 font-poppins text-[16px] text-neutral-50 transition-colors hover:text-brand-primary">
              {{ title(f) }}
              <Icon icon="lucide:arrow-right" width="16" class="text-neutral-50/40 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand-primary rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </AppLink>
          </li>
        </ul>
      </nav>
    </div>
  </section>
</template>
