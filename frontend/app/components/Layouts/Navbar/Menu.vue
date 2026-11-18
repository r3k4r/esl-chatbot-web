<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { nextTick, onMounted, onUnmounted, watch } from 'vue'
import type { NavItemTypes } from '~/common/types/nav-links-type'
import SiteSwitcher from './SiteSwitcher.vue'

const props = defineProps<{
  navItems: NavItemTypes[]
  activeLink?: string
}>()
const emit = defineEmits<{
  select: [link: string]
}>()

const route = useRoute()

const isOpen = ref(false)
const topOffset = ref(64)

const lockBody = () => {
  document.body.style.overflow = 'hidden'
}

const unlockBody = () => {
  document.body.style.overflow = ''
}

const updateTopOffset = () => {
  const el = document.getElementById('site-navbar')
  if (!el) {
    topOffset.value = 64
    return
  }

  const rect = el.getBoundingClientRect()
  topOffset.value = Math.ceil(rect.bottom)
}

const toggleMenu = async () => {
  isOpen.value = !isOpen.value
  await nextTick()

  if (isOpen.value) {
    updateTopOffset()
  }
}

const closeMenu = () => {
  isOpen.value = false
}

const handleItemClick = (link: string) => {
  emit('select', link)
  closeMenu()
}

watch(isOpen, (open) => {
  if (open) {
    lockBody()
    return
  }

  unlockBody()
})

watch(() => route.fullPath, closeMenu)

onMounted(() => {
  updateTopOffset()
  window.addEventListener('resize', updateTopOffset)
  window.addEventListener('scroll', updateTopOffset)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateTopOffset)
  window.removeEventListener('scroll', updateTopOffset)
  unlockBody()
})
</script>

<template>
  <div class="md-lg:hidden">
    <button
      type="button"
      aria-label="Toggle menu"
      class="inline-flex h-9.5 w-9.5 items-center justify-center rounded-lg border border-neutral-50/15 bg-neutral-50/3 text-neutral-50/90 transition-colors hover:bg-neutral-50/8"
      @click="toggleMenu"
    >
      <Icon :icon="isOpen ? 'lucide:x' : 'lucide:menu'" width="18" />
    </button>

    <teleport to="body">
      <transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-2"
      >
        <div
          v-if="isOpen"
          class="fixed top-0 inset-x-0 bottom-0 z-30"
        >
          <button
            type="button"
            aria-label="Close menu"
            class="absolute inset-0 bg-brand-ink/70 backdrop-blur-sm"
            @click="closeMenu"
          />

          <div class="relative h-full overflow-y-auto border-t border-neutral-50/10 bg-linear-to-b from-brand-ink via-brand-dark to-brand-dark2">
            <div class="pointer-events-none absolute inset-0 opacity-80 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-size-[44px_44px]" />

            <div :style="{ marginTop: `${topOffset}px` }" class="relative layout-padding-lg py-7">
              <nav>
                <ul class="flex flex-col gap-2">
                  <li v-for="item in props.navItems" :key="item.link">
                    <AppLink
                      :to="item.link"
                      class="group flex items-center justify-between rounded-xl border border-neutral-50/10 bg-neutral-50/3 px-4 py-3 text-neutral-50/80 transition-all hover:border-brand-primary/40 hover:bg-brand-primary/10 hover:text-neutral-50"
                      :class="{ 'border-brand-primary/40! bg-brand-primary/10! text-neutral-50!': props.activeLink === item.link }"
                      @click="handleItemClick(item.link)"
                    >
                      <AppText size="15" color="white" class-list="text-inherit font-medium tracking-tight">
                        {{ item.name ?? 'Menu item' }}
                      </AppText>
                      <Icon icon="lucide:arrow-right" width="14" class="text-inherit rtl:rotate-180" />
                    </AppLink>
                  </li>
                </ul>
              </nav>

              <div class="mt-6 flex items-center justify-between gap-4 border-t border-neutral-50/10 pt-6">
                <LayoutsNavbarLanguageSwitcher />
                <SiteSwitcher />
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>