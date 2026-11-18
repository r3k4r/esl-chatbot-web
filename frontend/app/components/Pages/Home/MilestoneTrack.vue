<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useWindowSize } from '@vueuse/core'

// Desktop milestones (phones get MilestoneList). The screen-high section pins; scrolling
// draws an orange line across the middle. Once its head reaches the anchor the whole track
// slides, so each milestone arrives at the same place: its node lights, its stem draws and
// its note settles in, alternating above and below. A navigator of every step sits below,
// the current one magnified. Attributes (id, class) land on the <section>.
const props = defineProps<{
  steps: { title: string; text: string; icon?: string }[]
  counter: (current: number, total: number) => string
}>()

const { isRtl } = useLocale()
const n = computed(() => props.steps.length)
const { width: vw } = useWindowSize()

// Track geometry, in px along the reading direction
const gap = computed(() => Math.min(560, Math.max(420, vw.value * 0.34)))
const anchor = computed(() => vw.value * 0.3) // where the current milestone settles on screen
const x = (i: number) => anchor.value + i * gap.value
const trackW = computed(() => x(n.value - 1) + vw.value * 0.75)

const root = useTemplateRef<HTMLElement>('root')
const LEAD = 0.45 // the line is drawn this far (in steps) before the first milestone
const pos = ref(-LEAD) // where the line's head is, in steps; eased
let target = -LEAD
let raf = 0

function readTarget() {
  if (!root.value) return
  const span = root.value.offsetHeight - window.innerHeight
  const p = span > 0 ? Math.min(1, Math.max(0, -root.value.getBoundingClientRect().top / span)) : 0
  target = -LEAD + p * (n.value - 1 + LEAD)
}
function tick() {
  const diff = target - pos.value
  pos.value = Math.abs(diff) < 0.002 ? target : pos.value + diff * 0.09
  raf = pos.value === target ? 0 : requestAnimationFrame(tick)
}
function update() {
  readTarget()
  if (!raf) raf = requestAnimationFrame(tick)
}
onMounted(() => {
  update()
  window.addEventListener('scroll', update, { passive: true })
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('scroll', update)
})

const head = computed(() => x(pos.value))
// The line draws toward the anchor first, then the track slides under it
const shift = computed(() => Math.min(0, anchor.value - head.value))
const trackStyle = computed(() => ({ width: `${trackW.value}px`, transform: `translate3d(${isRtl.value ? -shift.value : shift.value}px, 0, 0)` }))
const active = computed(() => Math.min(n.value - 1, Math.max(0, Math.round(pos.value))))

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
/** 0 → 1 as the line's head approaches milestone i */
const reveal = (i: number) => clamp01((pos.value - (i - 0.6)) / 0.5)
const reached = (i: number) => pos.value >= i - 0.02
/** Navigator magnification: the nearer the step, the larger its dot */
const mag = (i: number) => 1 + 0.9 * Math.max(0, 1 - Math.abs(i - pos.value))

function go(i: number) {
  if (!root.value) return
  const span = root.value.offsetHeight - window.innerHeight
  const top = root.value.getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top: top + (span * (i + LEAD)) / (n.value - 1 + LEAD), behavior: 'smooth' })
}
</script>

<template>
  <section ref="root" class="relative bg-brand-ink text-neutral-50" :style="{ height: `${100 + (n - 1) * 70}vh` }">
    <div class="sticky top-0 flex h-screen flex-col overflow-hidden pt-24">
      <div class="container-lg layout-padding-lg">
        <slot name="header" />
        <p class="sr-only" aria-live="polite">{{ counter(active + 1, n) }}</p>
      </div>

      <!-- The timeline -->
      <div class="relative min-h-[420px] flex-1">
        <div class="absolute inset-y-0 start-0 will-change-transform" :style="trackStyle">
          <span class="absolute inset-x-0 top-1/2 h-px bg-neutral-50/15" aria-hidden="true" />
          <span class="absolute inset-x-0 top-1/2 h-0.5 -translate-y-px origin-left bg-brand-primary rtl:origin-right" aria-hidden="true"
            :style="{ transform: `scaleX(${Math.max(0, head) / trackW})` }" />
          <span class="absolute top-1/2 size-3 -translate-y-1/2 rounded-full bg-brand-primary shadow-[0_0_0_6px_rgba(245,158,11,0.18)]" aria-hidden="true"
            :style="{ insetInlineStart: `${Math.max(0, head) - 6}px` }" />

          <div v-for="(s, i) in steps" :key="i" class="absolute top-1/2" :style="{ insetInlineStart: `${x(i)}px` }">
            <!-- Node -->
            <span class="absolute -start-7 -top-7 grid size-14 place-items-center rounded-full border-2 bg-brand-ink transition-colors duration-500"
              :class="reached(i) ? 'border-brand-primary' : 'border-neutral-50/20'" aria-hidden="true">
              <span class="size-4 rounded-full transition-[transform,background-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                :class="reached(i) ? 'scale-100 bg-brand-primary' : 'scale-50 bg-neutral-50/30'" />
            </span>
            <!-- Step number, on the other side of the line from the note -->
            <span class="absolute -start-7 w-14 text-center font-poppins text-[15px] font-semibold tabular-nums transition-colors duration-500"
              :class="[i % 2 ? 'bottom-10' : 'top-10', reached(i) ? 'text-brand-primary' : 'text-neutral-50/40']">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
            <!-- Stem, drawn out of the node toward the note -->
            <span class="absolute start-0 h-10 w-0.5 -translate-x-px bg-brand-primary rtl:translate-x-px"
              :class="i % 2 ? 'top-7 origin-top' : 'bottom-7 origin-bottom'" :style="{ transform: `scaleY(${reveal(i)})` }" aria-hidden="true" />
            <!-- Note -->
            <div class="absolute -start-7 w-[min(440px,30vw)] rounded-2xl border bg-neutral-50/[0.04] p-6 transition-colors duration-500"
              :class="[i % 2 ? 'top-[5.25rem]' : 'bottom-[5.25rem]', i === active ? 'border-brand-primary/50' : 'border-neutral-50/10']"
              :style="{ opacity: reveal(i), transform: `scale(${0.96 + 0.04 * reveal(i)})` }">
              <div class="flex items-center gap-3">
                <span v-if="s.icon" class="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-primary/15 text-brand-primary">
                  <Icon :icon="s.icon" width="20" />
                </span>
                <p class="font-poppins text-[clamp(20px,1.7vw,26px)] font-semibold leading-tight tracking-[-0.01em]">{{ s.title }}</p>
              </div>
              <p class="mt-3 font-poppins text-[16px] leading-[1.6] text-neutral-50/65">{{ s.text }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Navigator: every step, the current one magnified -->
      <nav class="container-lg layout-padding-lg pb-10" :aria-label="counter(active + 1, n)">
        <ol class="relative flex justify-between">
          <span class="absolute inset-x-[7%] top-[11px] h-px bg-neutral-50/15" aria-hidden="true" />
          <span class="absolute inset-x-[7%] top-[11px] h-px origin-left bg-brand-primary rtl:origin-right" aria-hidden="true"
            :style="{ transform: `scaleX(${clamp01(pos / (n - 1))})` }" />
          <li v-for="(s, i) in steps" :key="i" class="relative flex w-[14%] justify-center">
            <AppButton variant="ghost" size="auto" radius="8" :aria-current="i === active ? 'step' : undefined"
              class-list="h-auto flex-col items-center gap-3 p-1 hover:bg-transparent active:bg-transparent" @click="go(i)">
              <span class="grid size-[22px] place-items-center">
                <span class="size-2.5 rounded-full transition-colors duration-300" :style="{ transform: `scale(${mag(i)})` }"
                  :class="reached(i) ? 'bg-brand-primary' : 'bg-neutral-50/35'" />
              </span>
              <span class="text-center font-poppins text-[14px] leading-snug transition-colors duration-300"
                :class="i === active ? 'font-semibold text-neutral-50' : 'text-neutral-50/50 hover:text-neutral-50/80'">{{ s.title }}</span>
            </AppButton>
          </li>
        </ol>
      </nav>
    </div>
  </section>
</template>
