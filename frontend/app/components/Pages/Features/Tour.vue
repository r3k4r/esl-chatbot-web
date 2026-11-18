<script setup lang="ts">
import { useElementSize, useMediaQuery } from '@vueuse/core'
import type { FeaturePage, ScreenBox } from '~/common/types/feature-page-types'
import { shotSrcset } from '~/common/data/feature-pages'

// How to use it: the real screen, with its notes. Choosing a note (hover, focus or tap)
// lights up the part of the screen it describes and dims the rest. On a phone the screen
// also zooms to that part, since the whole screenshot is too small to read there.
const props = defineProps<{ feature: FeaturePage }>()
const { t } = useLocale()
const k = computed(() => `featurePages.items.${props.feature.key}`)

const notes = computed(() => props.feature.boxes.map((box, i) => ({ id: `n${i + 1}`, box })))
const active = ref(0)
watch(() => props.feature.key, () => { active.value = 0 })

const IMG_RATIO = 777 / 1552
const phone = useMediaQuery('(max-width: 1023px)')
const frame = useTemplateRef<HTMLElement>('frame')
const { width } = useElementSize(frame)

// Phone zoom: scale so the box fills ~85% of the 4:3 frame (1–3.2×), centred, never past the edges.
const zoom = computed(() => {
  const b: ScreenBox | undefined = notes.value[active.value]?.box
  if (!phone.value || !b || !width.value) return 'none'
  const W = width.value
  const H = W * 0.75
  const s = Math.min(3.2, Math.max(1, Math.min((W * 0.85) / ((b.w / 100) * W), (H * 0.85) / ((b.h / 100) * W * IMG_RATIO))))
  const imgW = W * s
  const imgH = imgW * IMG_RATIO
  const cx = ((b.x + b.w / 2) / 100) * imgW
  const cy = ((b.y + b.h / 2) / 100) * imgH
  const tx = Math.min(0, Math.max(W - imgW, W / 2 - cx))
  const ty = Math.min(0, Math.max(H - imgH, H / 2 - cy))
  return `translate(${tx}px, ${ty}px) scale(${s})`
})
</script>

<template>
  <section aria-labelledby="feature-tour" class="bg-brand-muted py-24 md-lg:py-36">
    <div class="container-lg layout-padding-lg">
      <div>
        <div>
          <h2 id="feature-tour" v-reveal class="font-poppins text-[clamp(34px,4vw,56px)] font-semibold leading-[1.02] tracking-[-0.03em] text-brand-ink">
            {{ t(`${k}.tourTitle`) }}
          </h2>
          <p v-reveal="80" class="mt-4 font-poppins text-[16px] text-brand-sub">{{ t('featurePages.tourHint') }}</p>
        </div>
      </div>

      <div class="mt-12 grid gap-8 md-lg:grid-cols-12 md-lg:items-start">
        <!-- The screen: dims everything except the chosen part -->
        <div class="max-md-lg:sticky max-md-lg:top-20 max-md-lg:z-10 md-lg:sticky md-lg:top-28 md-lg:order-2 md-lg:col-span-8" data-ui>
          <div ref="frame" dir="ltr" class="relative overflow-hidden bg-neutral-50 max-md-lg:aspect-4/3">
            <div class="relative origin-top-left transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" :style="{ transform: zoom }">
              <!-- Phones zoom into parts of the screen, so they get the 2× file -->
              <img :src="feature.tour" :srcset="shotSrcset(feature.tour)" sizes="(min-width: 1024px) 62vw, 300vw"
                :alt="t(`${k}.heroAlt`)" width="1552" height="777" loading="lazy" class="block h-auto w-full">
              <span v-for="(n, i) in notes" :key="n.id" aria-hidden="true"
                class="spot pointer-events-none absolute rounded-md transition-opacity duration-300"
                :class="i === active ? 'opacity-100' : 'opacity-0'"
                :style="{ left: `${n.box.x}%`, top: `${n.box.y}%`, width: `${n.box.w}%`, height: `${n.box.h}%` }" />
            </div>
          </div>
        </div>

        <!-- The notes: each one lights up its part of the screen -->
        <ul class="grid gap-1 md-lg:order-1 md-lg:col-span-4">
          <li v-for="(n, i) in notes" :key="n.id" v-reveal="i * 60">
            <AppButton variant="ghost" size="auto" radius="8" :aria-pressed="i === active"
              :class-list="`h-auto w-full flex-col items-start justify-start gap-1 px-4 py-3.5 text-start whitespace-normal transition-colors duration-200 ${i === active ? 'bg-neutral-50' : 'hover:bg-neutral-50/60'}`"
              @mouseenter="active = i" @focus="active = i" @click="active = i">
              <span class="font-poppins text-[16px] font-semibold text-brand-ink">{{ t(`${k}.notes.${n.id}.name`) }}</span>
              <span class="font-poppins text-[15px] leading-[1.5] text-brand-sub">{{ t(`${k}.notes.${n.id}.text`) }}</span>
            </AppButton>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* A ring around the chosen part; everything outside it is dimmed by the ring's own spread. */
.spot {
  box-shadow: 0 0 0 2px var(--color-brand-primary), 0 0 0 200vmax rgb(17 17 17 / 0.42);
}
</style>
