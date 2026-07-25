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
        <div
          v-for="(feature, i) in features"
          :key="i"
          class="group relative rounded-[14px] bg-brand-muted border border-neutral-200/60 p-6 overflow-hidden transform-gpu will-change-transform transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_20px_48px_-20px_rgba(17,17,17,0.18)]"
        >
          <div class="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-brand-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition" />
          <div class="w-11 h-11 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-center shadow-soft mb-5 text-brand-ink group-hover:text-brand-primary group-hover:border-brand-primary/30 transition">
            <Icon :icon="feature.icon" width="20" />
          </div>
          <AppText size="17" weight="semibold" color="brand-ink" class-list="tracking-tight">{{ t(`features.items.${feature.key}.title`) }}</AppText>
          <AppText size="14" color="brand-sub" class-list="mt-2 leading-relaxed">{{ t(`features.items.${feature.key}.description`) }}</AppText>
          <div class="mt-5 flex items-center gap-1.5 text-[12px] font-medium text-brand-primary opacity-0 group-hover:opacity-100 transition">
            <AppText class-list="cursor-pointer" size="12" color="brand-primary">{{ t('features.learnMore') }}</AppText>
            <Icon icon="lucide:arrow-right" width="12" class="rtl:rotate-180" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { t } = useLocale()

// Icons are structural; the `key` maps to the localized title/description.
const features = [
  { icon: 'lucide:message-circle', key: 'conversation' },
  { icon: 'lucide:mic',            key: 'voice' },
  { icon: 'lucide:brain',          key: 'vocab' },
  { icon: 'lucide:activity',       key: 'pronunciation' },
  { icon: 'lucide:target',         key: 'goals' },
  { icon: 'lucide:bar-chart-2',    key: 'analytics' },
] as const
</script>
