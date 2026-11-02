<template>
  <section id="cta" class="relative overflow-hidden bg-linear-to-b from-[#0F172A] via-[#1B365D] to-[#0B132B]">
    <div class="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 w-225 h-130 bg-[radial-gradient(ellipse_at_center,rgba(185,28,28,0.25),rgba(245,158,11,0.15)_40%,transparent_70%)] blur-2xl pointer-events-none" />
    <div class="absolute inset-0 opacity-60 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_70%_60%_at_50%_40%,black_40%,transparent_80%)]" />
    <div class="relative max-w-4xl mx-auto px-5 sm:px-8 py-28 sm:py-36 text-center">
      <div class="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-4 py-1.5 mb-6 shadow-sm">
        <Icon icon="lucide:map-pin" width="13" class="text-[#B91C1C]" />
        <AppText size="12" color="white" class-list="text-slate-200 font-medium">{{ t('finalCta.badge') }}</AppText>
      </div>

      <AppText size="cta-h2" weight="semibold" color="white" class-list="tracking-[-0.035em] leading-[1.08] text-2xl sm:text-4xl font-extrabold">
        {{ t('finalCta.titleLead') }}<br class="hidden sm:block" />{{ t('finalCta.titleTrail') }}
      </AppText>

      <AppText size="17" color="white-55" class-list="mt-5 max-w-2xl mx-auto text-slate-300 leading-relaxed text-sm sm:text-base">
        {{ t('finalCta.subtitle') }}
      </AppText>

      <div class="mt-9 flex items-center justify-center gap-3.5 flex-wrap">
        <a
          href="https://t.me/+9647707362000"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center justify-center gap-2.5 px-7 h-14 rounded-xl bg-[#B91C1C] hover:bg-[#991B1B] text-white font-semibold text-[15px] shadow-xl shadow-red-950/40 transition active:scale-98"
        >
          <Icon icon="lucide:send" width="16" class="text-white" />
          <span>{{ t('finalCta.ctaPrimary') }}</span>
        </a>

        <a
          href="tel:07508862786"
          class="inline-flex items-center justify-center gap-2 px-6 h-14 rounded-xl bg-white/5 border border-white/15 hover:bg-white/10 text-white font-medium text-[15px] transition"
        >
          <Icon icon="lucide:phone" width="16" class="text-[#F59E0B]" />
          <span>{{ t('finalCta.ctaSecondary') }}</span>
        </a>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { t } = useLocale()
</script>
