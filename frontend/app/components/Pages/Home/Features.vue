<template>
  <section id="features" class="bg-neutral-50 py-24 sm:py-32">
    <div class="container-lg layout-padding-lg">
      <LayoutsSectionHeader
        :eyebrow="t('features.eyebrow')"
        :title="t('features.title')"
        :description="t('features.description')"
        align="start"
        description-class="max-w-xl"
      />

      <div class="mt-14 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div
          v-for="(feature, i) in features"
          :key="i"
          class="group relative rounded-2xl bg-white border border-slate-200/80 p-7 overflow-hidden transform-gpu will-change-transform transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:border-[#B91C1C]/30"
        >
          <div class="absolute top-0 inset-x-0 h-1 bg-linear-to-r from-transparent via-[#B91C1C] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div class="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shadow-xs mb-5 text-[#1B365D] group-hover:text-[#B91C1C] group-hover:bg-red-50/50 group-hover:border-red-200 transition-all duration-200">
            <Icon :icon="feature.icon" width="22" />
          </div>
          <AppText size="17" weight="semibold" color="brand-ink" class-list="tracking-tight text-slate-900 group-hover:text-[#B91C1C] transition-colors">
            {{ t(`features.items.${feature.key}.title`) }}
          </AppText>
          <AppText size="14" color="brand-sub" class-list="mt-2.5 leading-relaxed text-slate-600">
            {{ t(`features.items.${feature.key}.description`) }}
          </AppText>
          <div class="mt-6 flex items-center gap-1.5 text-[12px] font-semibold text-[#B91C1C] group-hover:translate-x-1 transition-transform">
            <span>{{ t('features.learnMore') }}</span>
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

const features = [
  { icon: 'lucide:message-square', key: 'conversation' },
  { icon: 'lucide:bot',            key: 'voice' },
  { icon: 'lucide:smile',          key: 'vocab' },
  { icon: 'lucide:graduation-cap', key: 'pronunciation' },
  { icon: 'lucide:coffee',         key: 'goals' },
  { icon: 'lucide:line-chart',     key: 'analytics' },
] as const
</script>
