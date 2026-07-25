<template>
  <section class="relative overflow-hidden bg-linear-to-b from-brand-ink via-brand-dark to-brand-dark2">
    <div
      class="absolute inset-0 pointer-events-none opacity-80 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_70%_60%_at_50%_40%,black_40%,transparent_80%)]"
    />
    <div class="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 size-350 rounded-full bg-[radial-gradient(closest-side,rgba(245,158,11,0.22),rgba(245,158,11,0.05)_55%,transparent_70%)] blur-[20px] pointer-events-none" />
    <div class="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 size-275 rounded-full pointer-events-none [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.04),0_0_120px_0_rgba(245,158,11,0.10)] [background:conic-gradient(from_210deg,transparent_0deg,rgba(245,158,11,0.08)_60deg,rgba(254,192,22,0.18)_90deg,rgba(245,158,11,0.08)_120deg,transparent_180deg)] [mask:radial-gradient(closest-side,transparent_58%,black_60%,black_62%,transparent_64%)]" />
    <div class="absolute left-1/2 top-[78%] -translate-x-1/2 -translate-y-1/2 w-225 h-130 bg-[radial-gradient(ellipse_at_center,rgba(254,192,22,0.35),rgba(245,158,11,0.15)_40%,transparent_70%)] blur-2xl pointer-events-none" />
    <div class="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/60 to-transparent pointer-events-none" />
    <div class="absolute inset-x-0 -bottom-px h-24 bg-linear-to-b from-transparent to-brand-ink pointer-events-none" />

    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <span
        v-for="(p, i) in particles"
        :key="i"
        class="absolute size-0.5 rounded-full bg-neutral-50/60 shadow-[0_0_8px_rgba(254,192,22,0.6)] animate-[rise_var(--dur)_linear_var(--delay)_infinite]"
        :style="{
          left: `${p.left}%`,
          bottom: `${p.bottom}%`,
          opacity: p.op,
          '--dur': `${p.dur}s`,
          '--delay': `${p.delay}s`,
        }"
      />
    </div>

    <div class="relative container-lg layout-padding-lg pt-36 pb-28 sm:pb-36">
      <div class="grid lg:grid-cols-12 gap-14 items-center">
        <div class="lg:col-span-7 text-center lg:text-start">
          <div class="inline-flex items-center gap-2 rounded-full bg-neutral-50/4 border border-neutral-50/10 ps-2 pe-3.5 py-1 mb-7">
            <div class="inline-flex items-center gap-1 bg-brand-primary/15 text-brand-primary px-2 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wider uppercase">
              <Icon icon="lucide:sparkles" width="10" />
              {{ t('hero.badgeNew') }}
            </div>
            <AppText size="12" color="white" class-list="text-neutral-50/80">{{ t('hero.badgeText') }}</AppText>
          </div>

          <AppText size="hero-h1" weight="semibold" color="white" class-list="tracking-[-0.035em] leading-[1.02]">
            {{ t('hero.titleLead') }}
            <br class="hidden sm:block" />
            <span class="bg-linear-to-b from-neutral-50 via-primary-100 to-brand-primary bg-clip-text text-transparent">{{ t('hero.titleAccent') }}</span>
            <span class="text-neutral-50/90">{{ t('hero.titleTrail') }}</span>
          </AppText>

          <AppText size="18" color="white-60" class-list="mt-6 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            {{ t('hero.subtitle') }}
          </AppText>

          <div class="mt-9 flex flex-col sm:flex-row items-center gap-3 justify-center lg:justify-start">
            <AppButton to="/signin" variant="brand" size="52" radius="12" class-list="text-[14px] gap-2 px-5">
              <span>{{ t('hero.ctaPrimary') }}</span>
              <Icon icon="lucide:arrow-right" width="14" class="rtl:rotate-180" />
            </AppButton>
            <AppButton to="#pricing" variant="dark-ghost" size="52" radius="12" class-list="text-[14px] gap-2 px-5">
              <Icon icon="lucide:dollar-sign" width="14" />
              <span>{{ t('hero.ctaSecondary') }}</span>
            </AppButton>
          </div>

          <div class="mt-8 flex flex-wrap items-center gap-5 justify-center lg:justify-start">
            <div
              v-for="item in checks"
              :key="item"
              class="flex items-center gap-1.5 text-[12px] text-neutral-50/40"
            >
              <Icon icon="lucide:check" width="12" class="text-brand-primary" />
              <AppText size="12" color="white" class-list="text-neutral-50/40">{{ item }}</AppText>
            </div>
          </div>
        </div>

        <div class="lg:col-span-5 flex justify-center lg:justify-end relative">
          <PagesHomeChatMockup />
        </div>
      </div>

      <div class="mt-24 sm:mt-28">
        <AppText size="11" color="white" class-list="text-center uppercase tracking-[0.2em] text-neutral-50/35 mb-6">
          {{ t('hero.trustedBy') }}
        </AppText>
        <div class="relative overflow-hidden mask-[linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <NuxtMarquee :auto-fill="true" :pause-on-hover="false" :speed="36" class="py-1">
            <div
              v-for="brand in brands"
              :key="brand.name"
              class="flex items-center gap-2 shrink-0 text-[15px] font-medium tracking-tight text-neutral-50/35 me-14"
            >
              <Icon :icon="brand.icon" width="15" class="text-neutral-50/45" />
              <AppText size="15" color="white" class-list="text-neutral-50/35">{{ brand.name }}</AppText>
            </div>
          </NuxtMarquee>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { t, ta } = useLocale()

const checks = computed(() => ta('hero.checks'))

const particles = Array.from({ length: 200 }, () => ({
  left:   Math.random() * 100,
  bottom: Math.random() * 30,
  delay:  Math.random() * 8,
  dur:    8 + Math.random() * 10,
  op:     0.2 + Math.random() * 0.5,
}))

const brands = [
  { name: 'Lumen',     icon: 'lucide:sparkles' },
  { name: 'Northwind', icon: 'lucide:globe' },
  { name: 'Halcyon',   icon: 'lucide:star' },
  { name: 'Veritas',   icon: 'lucide:shield' },
  { name: 'Meridian',  icon: 'lucide:target' },
  { name: 'Atlas Edu', icon: 'lucide:book-open' },
  { name: 'Forum',     icon: 'lucide:message-circle' },
  { name: 'Polyglot',  icon: 'lucide:activity' },
]
</script>
