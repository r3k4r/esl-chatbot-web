<script setup lang="ts">
import { Icon } from '@iconify/vue'

// Phones and reduced motion: the same milestones running down a line on the start side.
// As you scroll, the line fills and each step lights up when it reaches the reading line
// (65% down the screen). With `still`, everything is shown lit and nothing moves.
// Attributes (id, class) land on the <section>.
const props = defineProps<{
  steps: { title: string; text: string; icon?: string }[]
  still?: boolean
}>()

const list = useTemplateRef<HTMLElement>('list')
const fill = ref(props.still ? 1 : 0)
const lit = ref(props.still ? props.steps.length : 0) // how many steps are reached
let raf = 0

function measure() {
  raf = 0
  if (!list.value || props.still) return
  const line = window.innerHeight * 0.65
  const r = list.value.getBoundingClientRect()
  fill.value = Math.min(1, Math.max(0, (line - r.top) / r.height))
  lit.value = [...list.value.children].filter(li => li.tagName === 'LI' && li.getBoundingClientRect().top < line).length
}
const onScroll = () => { if (!raf) raf = requestAnimationFrame(measure) }

onMounted(() => {
  if (props.still) return
  measure()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <section class="bg-brand-ink py-24 text-neutral-50 sm:py-28">
    <div class="container-lg layout-padding-lg">
      <slot name="header" />

      <ol ref="list" class="relative mt-14">
        <span class="absolute start-[27px] top-2 bottom-2 w-px bg-neutral-50/15" aria-hidden="true" />
        <span class="absolute start-[27px] top-2 bottom-2 w-0.5 origin-top bg-brand-primary" aria-hidden="true"
          :style="{ transform: `scaleY(${fill})` }" />
        <li v-for="(s, i) in steps" :key="i" class="relative pb-12 ps-20 last:pb-0">
          <span class="absolute start-0 top-0 grid size-14 place-items-center rounded-full border-2 bg-brand-ink transition-colors duration-500"
            :class="i < lit ? 'border-brand-primary' : 'border-neutral-50/20'" aria-hidden="true">
            <Icon v-if="s.icon" :icon="s.icon" width="22" class="transition-colors duration-500" :class="i < lit ? 'text-brand-primary' : 'text-neutral-50/40'" />
          </span>
          <div class="pt-1 transition-opacity duration-500" :class="i < lit ? 'opacity-100' : 'opacity-45'">
            <p class="font-poppins text-[14px] font-semibold tabular-nums text-brand-primary">{{ String(i + 1).padStart(2, '0') }}</p>
            <p class="mt-1 font-poppins text-[22px] font-semibold leading-tight">{{ s.title }}</p>
            <p class="mt-2 font-poppins text-[16px] leading-[1.6] text-neutral-50/65">{{ s.text }}</p>
          </div>
        </li>
      </ol>
    </div>
  </section>
</template>
