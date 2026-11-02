<script setup lang="ts">
defineProps<{
  disabled?: boolean
  connecting?: boolean
}>()
const emit = defineEmits<{ start: [] }>()

const tips = [
  { icon: 'Microphone2', text: 'Just talk — it listens and replies on its own, like a phone call.' },
  { icon: 'Sound', text: 'Pause when you finish a sentence; the AI takes its turn automatically.' },
  { icon: 'Chart', text: 'Every turn is scored on grammar, vocabulary, and fluency.' },
] as const
</script>

<template>
  <div class="dash-card relative flex min-h-[560px] flex-col items-center justify-center overflow-hidden p-6 text-center sm:p-8">
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute left-1/2 top-1/3 size-80 -translate-x-1/2 rounded-full bg-brand-primary/10 blur-3xl" />
      <div class="dot-bg absolute inset-0 opacity-50" />
    </div>

    <div class="relative flex flex-col items-center">
      <!-- idle orb -->
      <div class="relative grid size-36 place-content-center rounded-full bg-linear-to-br from-[#1B365D] to-[#B91C1C] shadow-[0_20px_60px_-15px_rgba(185,28,28,0.45)]">
        <div class="absolute inset-2 rounded-full bg-white/5" />
        <AppIconsax name="Microphone" color="#ffffff" :size="52" class="relative" />
      </div>

      <h2 class="mt-7 font-poppins text-[24px] font-semibold tracking-tight text-text-heading">
        Call LEO AI Speaking Coach
      </h2>
      <AppText size="15" color="neutral-400" class-list="mt-1.5 max-w-md font-poppins">
        A hands-free speaking call. Talk naturally, get spoken replies, and see how you sound.
      </AppText>

      <!-- start -->
      <button
        type="button"
        :disabled="disabled || connecting"
        class="group mt-7 flex items-center gap-2.5 rounded-full bg-brand-primary px-7 py-3.5 text-white transition hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        @click="emit('start')"
      >
        <span v-if="connecting" class="size-5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
        <AppIconsax v-else name="Call" color="white" :size="20" />
        <span class="font-poppins text-[15px] font-semibold">{{ connecting ? 'Connecting…' : 'Start call' }}</span>
      </button>

      <!-- tips -->
      <div class="mt-9 grid w-full max-w-md gap-3 text-left">
        <div v-for="(tip, i) in tips" :key="i" class="flex items-center gap-3 rounded-xl bg-surface-raised px-3.5 py-3">
          <div class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
            <AppIconsax :name="tip.icon" color="var(--color-brand-primary)" :size="17" />
          </div>
          <AppText size="14" color="neutral-600" class-list="font-poppins">{{ tip.text }}</AppText>
        </div>
      </div>
    </div>
  </div>
</template>
