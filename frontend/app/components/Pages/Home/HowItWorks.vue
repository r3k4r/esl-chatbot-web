<template>
  <section id="how" class="bg-brand-muted/60 py-28 sm:py-32 border-y border-neutral-200/70">
    <div class="container-lg layout-padding-lg">
      <LayoutsSectionHeader
        :eyebrow="t('howItWorks.eyebrow')"
        :title="t('howItWorks.title')"
        align="start"
        wrapper-class="mb-14"
      >
        <template #action>
          <AppLink to="#cta" class="text-[13px] font-medium text-brand-ink inline-flex items-center gap-1 hover:text-brand-primary transition-colors">
            {{ t('howItWorks.seeInAction') }} <Icon icon="lucide:arrow-right" width="13" class="rtl:rotate-180" />
          </AppLink>
        </template>
      </LayoutsSectionHeader>

      <div class="relative grid md:grid-cols-3 gap-6">
        <div class="hidden md:block absolute top-11.5 inset-x-[12%] h-px bg-[repeating-linear-gradient(90deg,var(--color-neutral-300)_0_6px,transparent_6px_12px)] opacity-70" />

        <div
          v-for="(step, i) in steps"
          :key="i"
          class="relative bg-neutral-50 border border-neutral-200/70 rounded-[14px] p-6 shadow-soft"
        >
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-brand-primary text-brand-ink font-semibold flex items-center justify-center text-[13px] shadow-[0_8px_18px_-8px_rgba(245,158,11,0.7)]">
              {{ step.n }}
            </div>
            <div class="flex-1 h-px bg-neutral-200" />
            <Icon :icon="step.icon" width="18" class="text-brand-sub" />
          </div>
          <AppText size="20" weight="semibold" color="brand-ink" class-list="tracking-tight">{{ t(`howItWorks.steps.${step.key}.title`) }}</AppText>
          <AppText size="14" color="brand-sub" class-list="mt-2 leading-relaxed">{{ t(`howItWorks.steps.${step.key}.description`) }}</AppText>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { t } = useLocale()

// Step number + icon are structural; `key` maps to the localized text.
const steps = [
  { n: '01', icon: 'lucide:message-circle', key: 'one' },
  { n: '02', icon: 'lucide:mic',            key: 'two' },
  { n: '03', icon: 'lucide:bar-chart-2',    key: 'three' },
] as const
</script>
