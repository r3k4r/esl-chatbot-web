<script setup lang="ts">
import type { SvgBasedIconName } from '~/common/types/iconsax-types'
import { NuxtLink } from '#components'

// One row of the dashboard sidebar: a link when `to` is set, otherwise a button.
// Collapsed, it shows only the icon and names itself in a hover/focus tooltip.
const props = defineProps<{
  label: string
  icon: SvgBasedIconName
  to?: string
  active?: boolean
  collapsed?: boolean
  badge?: number
}>()

const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    :aria-label="collapsed ? label : undefined"
    :aria-current="active ? 'page' : undefined"
    :class="[
      'group relative flex w-full items-center gap-3 rounded-lg px-3 h-10 text-[14px] font-medium font-poppins',
      'transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50',
      collapsed && 'md:justify-center md:px-0',
      active
        ? 'bg-brand-primary/12 text-text-heading'
        : 'text-text-muted hover:bg-surface-raised hover:text-text-heading',
    ]"
    @click.stop="emit('click')"
  >
    <AppIconsax
      :name="icon"
      :color="active ? 'var(--color-brand-primary)' : 'currentColor'"
      :type="active ? 'bold' : 'linear'"
      :size="20"
      class="shrink-0"
    />
    <span :class="['flex-1 truncate text-left', collapsed && 'md:hidden']">{{ label }}</span>
    <span
      v-if="badge"
      :class="[
        'grid min-w-6 h-6 place-content-center rounded-md bg-brand-primary px-1.5 text-[12px] font-semibold text-white',
        collapsed && 'md:absolute md:-top-1 md:-right-1 md:min-w-5 md:h-5',
      ]"
    >
      {{ badge }}
    </span>

    <!-- Tooltip, collapsed rail only -->
    <span
      v-if="collapsed"
      role="tooltip"
      :class="[
        'pointer-events-none absolute left-full z-50 ms-3 hidden whitespace-nowrap rounded-md border px-2.5 py-1.5 md:block',
        'border-border-card bg-surface-card text-[13px] text-text-heading shadow-soft',
        'opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100',
      ]"
    >
      {{ label }}
    </span>
  </component>
</template>
