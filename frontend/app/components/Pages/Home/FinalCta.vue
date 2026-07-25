<template>
  <section id="cta" class="relative overflow-hidden bg-linear-to-b from-brand-ink to-brand-dark2">
    <div class="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 w-225 h-130 bg-[radial-gradient(ellipse_at_center,rgba(254,192,22,0.35),rgba(245,158,11,0.15)_40%,transparent_70%)] blur-2xl pointer-events-none" />
    <div class="absolute inset-0 opacity-60 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_70%_60%_at_50%_40%,black_40%,transparent_80%)]" />
    <div class="relative max-w-4xl mx-auto px-5 sm:px-8 py-32 text-center">
      <div class="inline-flex items-center gap-2 rounded-full bg-neutral-50/4 border border-neutral-50/10 px-3.5 py-1 mb-7">
        <Icon icon="lucide:sparkles" width="11" class="text-brand-primary" />
        <AppText size="12" color="white" class-list="text-neutral-50/80">{{ t('finalCta.badge') }}</AppText>
      </div>

      <AppText size="cta-h2" weight="semibold" color="white" class-list="tracking-[-0.035em] leading-[1.02]">
        {{ t('finalCta.titleLead') }}<br class="hidden sm:block" />{{ t('finalCta.titleTrail') }}
      </AppText>

      <AppText size="17" color="white-55" class-list="mt-5 max-w-xl mx-auto">
        {{ t('finalCta.subtitle') }}
      </AppText>

      <div class="mt-9 flex items-center justify-center gap-3 flex-wrap">
        <AppButton to="/signin" variant="brand" size="56" radius="12" class-list="gap-2 px-6 text-[15px]">
          <span>{{ t('finalCta.ctaPrimary') }}</span>
          <Icon icon="lucide:arrow-right" width="14" class="rtl:rotate-180" />
        </AppButton>
        <AppButton to="#" variant="dark-ghost" size="56" radius="12" class-list="gap-2 px-6 text-[15px]">
          <Icon icon="lucide:play" width="12" class="rtl:rotate-180" />
          <span>{{ t('finalCta.ctaSecondary') }}</span>
        </AppButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { t } = useLocale()
</script>
