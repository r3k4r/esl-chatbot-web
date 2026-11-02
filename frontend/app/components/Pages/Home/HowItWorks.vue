<template>
  <section id="how" class="bg-slate-50/50 py-24 sm:py-32 border-y border-slate-200/80">
    <div class="container-lg layout-padding-lg">
      <LayoutsSectionHeader
        :eyebrow="t('howItWorks.eyebrow')"
        :title="t('howItWorks.title')"
        align="start"
        wrapper-class="mb-14"
      >
        <template #action>
          <NuxtLink to="/dashboard/chat" class="text-[13px] font-semibold text-[#B91C1C] inline-flex items-center gap-1.5 hover:underline">
            {{ t('howItWorks.seeInAction') }} <Icon icon="lucide:arrow-right" width="13" class="rtl:rotate-180" />
          </NuxtLink>
        </template>
      </LayoutsSectionHeader>

      <div class="relative grid md:grid-cols-3 gap-6">
        <div class="hidden md:block absolute top-11.5 inset-x-[12%] h-px bg-[repeating-linear-gradient(90deg,#94a3b8_0_6px,transparent_6px_12px)] opacity-60" />

        <div
          v-for="(step, i) in steps"
          :key="i"
          class="relative bg-white border border-slate-200/90 rounded-2xl p-7 shadow-sm hover:shadow-md transition-shadow"
        >
          <div class="flex items-center gap-3 mb-6">
            <div class="w-11 h-11 rounded-xl bg-linear-to-br from-[#1B365D] to-[#0F172A] text-white font-bold flex items-center justify-center text-[14px] shadow-md">
              {{ step.n }}
            </div>
            <div class="flex-1 h-px bg-slate-200" />
            <Icon :icon="step.icon" width="20" class="text-[#B91C1C]" />
          </div>
          <AppText size="20" weight="semibold" color="brand-ink" class-list="tracking-tight text-slate-900 font-bold">{{ t(`howItWorks.steps.${step.key}.title`) }}</AppText>
          <AppText size="14" color="brand-sub" class-list="mt-2.5 leading-relaxed text-slate-600">{{ t(`howItWorks.steps.${step.key}.description`) }}</AppText>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { t } = useLocale()

const steps = [
  { n: '01', icon: 'lucide:graduation-cap', key: 'one' },
  { n: '02', icon: 'lucide:bot',            key: 'two' },
  { n: '03', icon: 'lucide:shield-check',   key: 'three' },
] as const
</script>
