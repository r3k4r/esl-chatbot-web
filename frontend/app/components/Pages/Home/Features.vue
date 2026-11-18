<template>
  <section id="features" class="bg-neutral-50 py-28 sm:py-32">
    <div class="container-lg layout-padding-lg">
      <LayoutsSectionHeader
        :eyebrow="t('features.eyebrow')"
        :title="t('features.title')"
        :description="t('features.description')"
        align="start"
        description-class="max-w-xl"
      />

      <div class="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- The whole card opens the feature's page; "Learn more" is always shown, since phones have no hover. -->
        <AppLink
          v-for="feature in features"
          :key="feature.key"
          :to="featurePagePath(feature.key)"
          class="group relative flex flex-col rounded-[14px] bg-brand-muted border border-neutral-200/60 p-6 overflow-hidden transform-gpu will-change-transform transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_20px_48px_-20px_rgba(17,17,17,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          <div class="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-brand-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition" />
          <div class="w-11 h-11 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-center shadow-soft mb-5 text-brand-ink group-hover:text-brand-primary group-hover:border-brand-primary/30 transition">
            <Icon :icon="feature.icon" width="20" />
          </div>
          <AppText size="17" weight="semibold" color="brand-ink" class-list="tracking-tight">{{ t(`features.items.${feature.key}.title`) }}</AppText>
          <AppText size="14" color="brand-sub" class-list="mt-2 leading-relaxed">{{ t(`features.items.${feature.key}.description`) }}</AppText>
          <span class="mt-auto flex items-center gap-1.5 pt-5 text-brand-primary">
            <AppText size="14" weight="medium" color="brand-primary">{{ t('features.learnMore') }}</AppText>
            <Icon icon="lucide:arrow-right" width="16" class="transition-transform duration-200 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
          </span>
        </AppLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { FEATURE_PAGES, featurePagePath } from '~/common/data/feature-pages'

const { t } = useLocale()

// Icon and order come from the feature pages, so a card and its page never disagree.
const features = FEATURE_PAGES
</script>
