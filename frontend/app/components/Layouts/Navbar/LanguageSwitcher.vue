<script setup lang="ts">
import { Icon } from '@iconify/vue'

const { locale, locales, setLocale } = useLocale()

const open = ref(false)
const containerRef = ref<HTMLElement | null>(null)

const META: Record<string, { label: string; iconify?: string; kurdish?: true }> = {
  en: { label: 'EN', iconify: 'circle-flags:uk' },
  ku: { label: 'KR', kurdish: true },
}

const activeMeta = computed(() => META[locale.value] ?? { label: locale.value.toUpperCase(), iconify: 'lucide:globe' })

function pick(code: string) {
  setLocale(code)
  open.value = false
}

function toggle() { open.value = !open.value }

onMounted(() => document.addEventListener('pointerdown', onOutside))
onUnmounted(() => document.removeEventListener('pointerdown', onOutside))
function onOutside(e: PointerEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    open.value = false
  }
}
</script>

<template>
  <div ref="containerRef" class="relative">

    <!-- Trigger -->
    <button type="button" :aria-expanded="open" aria-haspopup="listbox" aria-label="Select language"
      class="group flex items-center gap-2 rounded-lg border border-neutral-50/12 bg-neutral-50/6 px-2.5 py-1.5 transition-all duration-200 hover:border-neutral-50/25 hover:bg-neutral-50/10"
      @click="toggle">
      <!-- Kurdish flag inline SVG -->
      <span v-if="activeMeta.kurdish"
        class="size-4.5 shrink-0 rounded-full overflow-hidden ring-1 ring-neutral-50/15 block">
        <AppImage
          src="https://rlv.zcache.com/flag_of_kurdistan_kurd_kurdish_classic_round_sticker-r4fec51d88ab34e2b8ed2dfb693d04d7a_zg2qos_644.webp?rlvnet=1"
          alt="Kurdish flag" />
      </span>
      <Icon v-else :icon="activeMeta.iconify!" width="18" height="18"
        class="rounded-full shrink-0 ring-1 ring-neutral-50/15" />

      <span
        class="text-[12px] font-semibold tracking-wide text-neutral-50/80 group-hover:text-neutral-50 transition-colors">
        {{ activeMeta.label }}
      </span>
      <Icon icon="lucide:chevron-down" width="12"
        class="text-neutral-50/40 group-hover:text-neutral-50/70 transition-all duration-300"
        :class="open ? 'rotate-180' : 'rotate-0'" />
    </button>

    <!-- Dropdown -->
    <Transition name="lang-drop">
      <div v-if="open" role="listbox" aria-label="Language selection"
        class="absolute inset-e-0 top-[calc(100%+8px)] z-200 min-w-37 overflow-hidden rounded-xl border border-neutral-50/10 bg-brand-ink/90 shadow-[0_16px_48px_-8px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.04)_inset] backdrop-blur-xl">
        <div class="p-1.5 flex flex-col gap-0.5">
          <button v-for="item in locales" :key="item.code" type="button" role="option"
            :aria-selected="locale === item.code" :lang="(item as { language?: string }).language ?? item.code"
            class="group/opt flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-start transition-all duration-150"
            :class="locale === item.code
              ? 'bg-brand-primary/15 text-neutral-50'
              : 'text-neutral-50/60 hover:bg-neutral-50/6 hover:text-neutral-50'" @click="pick(item.code)">
            <!-- Kurdish flag in dropdown -->
            <span v-if="META[item.code]?.kurdish"
              class="size-5 shrink-0 rounded-full overflow-hidden ring-1 block transition-all duration-150"
              :class="locale === item.code ? 'ring-brand-primary/40' : 'ring-neutral-50/10 group-hover/opt:ring-neutral-50/20'">
              <AppImage
                src="https://rlv.zcache.com/flag_of_kurdistan_kurd_kurdish_classic_round_sticker-r4fec51d88ab34e2b8ed2dfb693d04d7a_zg2qos_644.webp?rlvnet=1"
                alt="Kurdish flag" />

            </span>
            <Icon v-else :icon="META[item.code]?.iconify ?? 'lucide:globe'" width="20" height="20"
              class="shrink-0 rounded-full ring-1 transition-all duration-150"
              :class="locale === item.code ? 'ring-brand-primary/40' : 'ring-neutral-50/10 group-hover/opt:ring-neutral-50/20'" />

            <div class="flex flex-col leading-tight min-w-0">
              <span class="text-[13px] font-medium truncate">
                {{ (item as { name?: string }).name ?? item.code }}
              </span>
              <span class="text-[10px] font-mono tracking-wider opacity-40">
                {{ META[item.code]?.label ?? item.code.toUpperCase() }}
              </span>
            </div>

            <Icon v-if="locale === item.code" icon="lucide:check" width="13"
              class="ms-auto shrink-0 text-brand-primary" />
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.lang-drop-enter-active {
  transition: opacity 180ms ease, transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.lang-drop-leave-active {
  transition: opacity 130ms ease, transform 130ms ease-in;
}

.lang-drop-enter-from {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}

.lang-drop-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {

  .lang-drop-enter-active,
  .lang-drop-leave-active {
    transition: opacity 100ms ease;
  }

  .lang-drop-enter-from,
  .lang-drop-leave-to {
    transform: none;
  }
}
</style>
