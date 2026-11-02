<template>
  <div class="inline-flex items-center gap-3 select-none group">
    <!-- Emblem Badge -->
    <div
      class="relative shrink-0 overflow-hidden rounded-xl border border-white/10 shadow-sm transition-transform duration-200 group-hover:scale-105"
      :class="badgeSizeClass"
    >
      <img
        v-if="!imageFailed"
        src="/leo-logo.jpg"
        alt="LEO Institute Logo"
        class="w-full h-full object-cover"
        @error="imageFailed = true"
      />
      <!-- SVG Crest Fallback if image fails -->
      <div
        v-else
        class="w-full h-full bg-linear-to-b from-[#B91C1C] via-[#1B365D] to-[#0F172A] flex items-center justify-center p-1 text-white"
      >
        <svg viewBox="0 0 100 120" class="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M50 5 L92 22 V65 C92 92 50 115 50 115 C50 115 8 92 8 65 V22 Z" fill="#1B365D" stroke="#FFFFFF" stroke-width="3"/>
          <path d="M50 8 L90 24 V42 H10 V24 Z" fill="#B91C1C"/>
          <polygon points="50,15 53,24 62,24 55,29 57,38 50,33 43,38 45,29 38,24 47,24" fill="#FFFFFF"/>
          <polygon points="30,22 32,27 38,27 33,31 35,36 30,33 25,36 27,31 22,27 28,27" fill="#FFFFFF"/>
          <polygon points="70,22 72,27 78,27 73,31 75,36 70,33 65,36 67,31 62,27 68,27" fill="#FFFFFF"/>
          <text x="50" y="66" font-family="Montserrat, sans-serif" font-size="20" font-weight="900" fill="#FFFFFF" text-anchor="middle">LEO</text>
          <text x="50" y="78" font-family="Montserrat, sans-serif" font-size="8.5" font-weight="700" letter-spacing="1.5" fill="#F59E0B" text-anchor="middle">INSTITUTE</text>
          <path d="M22 88 L50 96 L78 88" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
    </div>

    <!-- Wordmark & Subtitle -->
    <div v-if="showText" class="flex flex-col leading-tight min-w-0">
      <div class="flex items-center gap-1.5">
        <span
          class="font-bold tracking-tight text-base sm:text-lg"
          :class="textPrimaryColor"
        >
          LEO
        </span>
        <span
          class="font-semibold tracking-wider text-xs sm:text-sm uppercase text-[#B91C1C] dark:text-[#F87171]"
        >
          INSTITUTE
        </span>
      </div>
      <div
        v-if="showSubtitle"
        class="text-[10px] sm:text-[11px] font-medium tracking-wide flex items-center gap-1.5"
        :class="textSecondaryColor"
      >
        <span>پەیمانگای لیۆ</span>
        <span class="opacity-40">·</span>
        <span class="hidden sm:inline opacity-75">Learn English Online</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg' | 'xl'
    showText?: boolean
    showSubtitle?: boolean
    theme?: 'light' | 'dark' | 'auto'
  }>(),
  {
    size: 'md',
    showText: true,
    showSubtitle: true,
    theme: 'auto',
  }
)

const imageFailed = ref(false)

const badgeSizeClass = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'size-7'
    case 'lg':
      return 'size-12'
    case 'xl':
      return 'size-16'
    case 'md':
    default:
      return 'size-9 sm:size-10'
  }
})

const textPrimaryColor = computed(() => {
  if (props.theme === 'dark') return 'text-white'
  if (props.theme === 'light') return 'text-slate-900'
  return 'text-slate-900 dark:text-white'
})

const textSecondaryColor = computed(() => {
  if (props.theme === 'dark') return 'text-slate-300'
  if (props.theme === 'light') return 'text-slate-500'
  return 'text-slate-500 dark:text-slate-400'
})
</script>

