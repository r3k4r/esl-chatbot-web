<template>
  <section class="relative overflow-hidden bg-linear-to-b from-[#0F172A] via-[#1B365D] to-[#0B132B]">
    <div
      class="absolute inset-0 pointer-events-none opacity-80 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-size-[56px_56px] mask-[radial-gradient(ellipse_70%_60%_at_50%_40%,black_40%,transparent_80%)]"
    />
    <div class="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 size-350 rounded-full bg-[radial-gradient(closest-side,rgba(185,28,28,0.25),rgba(27,54,93,0.15)_55%,transparent_70%)] blur-[25px] pointer-events-none" />
    <div class="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2 size-275 rounded-full pointer-events-none [box-shadow:inset_0_0_0_1px_rgba(255,255,255,0.04),0_0_120px_0_rgba(185,28,28,0.15)] [background:conic-gradient(from(210deg,transparent_0deg,rgba(185,28,28,0.08)_60deg,rgba(245,158,11,0.18)_90deg,rgba(27,54,93,0.12)_120deg,transparent_180deg))] [mask:radial-gradient(closest-side,transparent_58%,black_60%,black_62%,transparent_64%)]" />
    <div class="absolute inset-x-0 top-0 h-40 bg-linear-to-b from-black/60 to-transparent pointer-events-none" />
    <div class="absolute inset-x-0 -bottom-px h-24 bg-linear-to-b from-transparent to-[#0B132B] pointer-events-none" />

    <div class="relative container-lg layout-padding-lg pt-32 sm:pt-40 pb-24 sm:pb-32">
      <div class="grid lg:grid-cols-12 gap-12 lg:gap-14 items-center">
        <!-- Text Column -->
        <div class="lg:col-span-7 text-center lg:text-start">
          <!-- Institutional Location Badge -->
          <div class="inline-flex items-center gap-2 rounded-full bg-white/5 border border-white/10 ps-2 pe-4 py-1.5 mb-6 backdrop-blur-md shadow-sm">
            <div class="inline-flex items-center gap-1 bg-[#B91C1C] text-white px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-xs">
              <Icon icon="lucide:award" width="12" />
              {{ t('hero.badgeNew') }}
            </div>
            <AppText size="12" color="white" class-list="text-slate-200 font-medium">
              {{ t('hero.badgeText') }}
            </AppText>
          </div>

          <!-- Main Pitch Headline -->
          <AppText size="hero-h1" weight="semibold" color="white" class-list="tracking-[-0.035em] leading-[1.05]">
            {{ t('hero.titleLead') }}
            <br class="hidden sm:block" />
            <span class="bg-linear-to-r from-white via-red-100 to-[#F87171] bg-clip-text text-transparent font-extrabold">
              {{ t('hero.titleAccent') }}
            </span>
            <span class="text-white/90">{{ t('hero.titleTrail') }}</span>
          </AppText>

          <!-- Verified Institutional Value Proposition -->
          <AppText size="18" color="white-60" class-list="mt-6 max-w-xl mx-auto lg:mx-0 leading-relaxed text-slate-300">
            {{ t('hero.subtitle') }}
          </AppText>

          <!-- CTAs -->
          <div class="mt-8 flex flex-col sm:flex-row items-center gap-3.5 justify-center lg:justify-start">
            <AppButton to="/dashboard/chat" variant="brand" size="52" radius="12" class-list="text-[14px] gap-2.5 px-6 shadow-xl shadow-red-950/40">
              <Icon icon="lucide:sparkles" width="16" class="text-amber-300" />
              <span>{{ t('hero.ctaPrimary') }}</span>
              <Icon icon="lucide:arrow-right" width="14" class="rtl:rotate-180" />
            </AppButton>

            <a
              href="https://t.me/+9647707362000"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center justify-center h-[52px] px-5 rounded-xl bg-white/5 border border-white/15 text-[14px] font-medium text-white hover:bg-white/10 active:bg-white/15 transition gap-2"
            >
              <Icon icon="lucide:send" width="16" class="text-[#229ED9]" />
              <span>{{ t('hero.ctaSecondary') }}</span>
            </a>
          </div>

          <!-- Quality Checks -->
          <div class="mt-8 flex flex-wrap items-center gap-5 justify-center lg:justify-start">
            <div
              v-for="item in checks"
              :key="item"
              class="flex items-center gap-2 text-[12px] text-slate-300/80"
            >
              <Icon icon="lucide:check-circle-2" width="14" class="text-[#F59E0B]" />
              <span>{{ item }}</span>
            </div>
          </div>
        </div>

        <!-- Chat Mockup Column -->
        <div class="lg:col-span-5 flex justify-center lg:justify-end relative">
          <PagesHomeChatMockup />
        </div>
      </div>

      <!-- Trust Bar -->
      <div class="mt-20 sm:mt-24 pt-8 border-t border-white/10">
        <AppText size="11" color="white" class-list="text-center uppercase tracking-[0.2em] text-slate-400 font-semibold mb-6">
          {{ t('hero.trustedBy') }}
        </AppText>
        <div class="relative overflow-hidden mask-[linear-gradient(90deg,transparent,black_10%,black_90%,transparent)]">
          <NuxtMarquee :auto-fill="true" :pause-on-hover="false" :speed="36" class="py-1">
            <div
              v-for="item in instituteHighlights"
              :key="item.name"
              class="flex items-center gap-2 shrink-0 text-[14px] font-semibold tracking-wide text-slate-300/80 me-12"
            >
              <Icon :icon="item.icon" width="16" class="text-[#F59E0B]" />
              <span>{{ item.name }}</span>
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

const checks = computed<string[]>(() => ta('hero.checks'))

const instituteHighlights = [
  { name: 'Sulaymaniyah Campus (بەرامبەر پارکی ئازادی)', icon: 'lucide:map-pin' },
  { name: 'Guaranteed Learning Methodology (بە گەرەنتی فێربوون)', icon: 'lucide:shield-check' },
  { name: '24/7 LEO AI Speaking Coach', icon: 'lucide:bot' },
  { name: 'Leo Kids & Mental Math (خولی بەهێزکردن)', icon: 'lucide:smile' },
  { name: 'On-Site Student Cafeteria & Lounge', icon: 'lucide:coffee' },
  { name: 'IELTS Academic Mastery Track', icon: 'lucide:graduation-cap' },
]
</script>
