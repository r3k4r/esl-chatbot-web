<script setup lang="ts">
import { Icon } from '@iconify/vue'
import type { FeaturePage } from '~/common/types/feature-page-types'
import { shotSrcset } from '~/common/data/feature-pages'

// The first screen: the way back, the two-line headline across the page, one sentence beside
// the actions, then the real screen of the feature rising from the bottom like an open window.
const props = defineProps<{ feature: FeaturePage }>()
const { t } = useLocale()
const signedIn = useSignedIn() // signed-in visitors go to their dashboard
const k = computed(() => `featurePages.items.${props.feature.key}`)

// The one moving picture: the screen drifts up a little as the page scrolls.
const drift = ref(0)
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  let frame = 0
  const onScroll = () => {
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => { drift.value = Math.min(48, window.scrollY * 0.06) })
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
})
</script>

<template>
  <!-- No overflow clip: the screen hangs over the top of the next section (Flow makes room) -->
  <section class="relative z-10 flow-root bg-brand-ink pt-28 text-neutral-50 sm:pt-32">
    <div class="container-lg layout-padding-lg">
      <AppLink to="/#features" class="group inline-flex items-center gap-2 text-[15px] text-neutral-50/70 transition-colors hover:text-brand-primary">
        <Icon icon="lucide:arrow-left" width="16" class="transition-transform duration-200 group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
        {{ t('featurePages.allFeatures') }}
      </AppLink>

      <h1 class="mt-8 font-poppins text-[clamp(44px,7.4vw,112px)] font-semibold leading-[0.98] tracking-[-0.04em] md-lg:mt-10">
        <span class="block overflow-hidden pb-[0.08em]"><span class="mask-line block">{{ t(`${k}.line1`) }}</span></span>
        <span class="block overflow-hidden pb-[0.08em]"><span class="mask-line block [animation-delay:110ms]">{{ t(`${k}.line2`) }}</span></span>
      </h1>

      <div class="masthead-after mt-8 flex flex-col gap-8 md-lg:mt-10 md-lg:flex-row md-lg:items-end md-lg:justify-between">
        <p class="max-w-[46ch] font-poppins text-[20px] leading-[1.5] text-neutral-50/75">{{ t(`${k}.standfirst`) }}</p>
        <div class="flex shrink-0 flex-wrap items-center gap-3">
          <AppButton :to="signedIn ? '/dashboard' : '/signup'" variant="brand" size="48" radius="12" class-list="gap-2 px-5 text-[15px] max-sm:w-full">
            <span>{{ signedIn ? t('nav.goToDashboard') : t('featurePages.startFree') }}</span>
            <Icon icon="lucide:arrow-right" width="16" class="rtl:rotate-180" />
          </AppButton>
          <AppButton to="/#pricing" variant="dark-ghost" size="48" radius="12" class-list="px-5 text-[15px] max-sm:w-full" :text="t('featurePages.seePricing')" />
        </div>
      </div>

      <!-- The real screen, hanging over the edge into the section below -->
      <figure class="masthead-shot relative mt-14 -mb-24 md-lg:mt-20 md-lg:-mb-40">
        <div class="aspect-4/3 overflow-hidden rounded-2xl bg-neutral-50 ring-1 ring-neutral-50/10 shadow-[0_40px_90px_-40px_rgba(17,17,17,0.55)] sm:aspect-[1552/640]" dir="ltr">
          <!-- On phones the shot is shown at the frame's height, about 1.4× the screen width -->
          <img :src="feature.hero" :srcset="shotSrcset(feature.hero)" sizes="(max-width: 445px) 140vw, (min-width: 1440px) 1240px, 92vw"
            :alt="t(`${k}.heroAlt`)" width="1552" height="777"
            class="h-auto w-full object-cover object-left-top will-change-transform max-sm:h-full max-sm:w-auto max-sm:max-w-none"
            :style="{ transform: `translateY(${-drift}px)` }" fetchpriority="high">
        </div>
      </figure>
    </div>
  </section>
</template>

<style scoped>
/* Signature move: each headline line rises from behind its own baseline, then the sentence,
   the actions and the screen follow. */
.mask-line {
  animation: mask-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
}
.masthead-after {
  animation: after-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
}
.masthead-shot {
  animation: after-rise 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
}
@keyframes mask-rise {
  from { transform: translateY(105%); }
  to { transform: none; }
}
@keyframes after-rise {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .mask-line, .masthead-after, .masthead-shot { animation: none; }
}
</style>
