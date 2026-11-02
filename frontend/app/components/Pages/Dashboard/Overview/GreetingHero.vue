<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'

const props = defineProps<{
  streak: number
  doneMins: number
  goalMins: number
  dueVocabCount?: number
}>()

const emit = defineEmits<{
  navChat: []
  navVoice: []
  navVocab: []
}>()

const authStore = useAuthStore()
const name = computed(() => authStore.getUser?.username ?? 'there')

const greetingTime = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 18) return 'afternoon'
  return 'evening'
})

const R = 48
const circumference = 2 * Math.PI * R
const displayDone = computed(() => Math.min(props.doneMins, props.goalMins))
const goalPct = computed(() => Math.min(1, props.doneMins / Math.max(1, props.goalMins)))
const offset = computed(() => circumference * (1 - goalPct.value))
const goalMet = computed(() => props.doneMins >= props.goalMins)
const minsLeft = computed(() => Math.max(0, props.goalMins - props.doneMins))
</script>

<template>
  <div class="dash-card relative overflow-hidden">
    <!-- dot texture -->
    <div class="dot-bg absolute inset-0 opacity-80 pointer-events-none" />
    <!-- glow orb -->
    <div class="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#B91C1C]/10 blur-3xl pointer-events-none" />

    <div class="relative p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center gap-6 justify-between">
      <!-- Text + CTA -->
      <div>
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#B91C1C]/10 border border-[#B91C1C]/20 mb-2.5">
          <img src="/leo-logo.jpg" alt="Leo" class="size-4 rounded-full object-cover" />
          <span class="text-[10px] font-semibold text-[#B91C1C] dark:text-red-400 uppercase tracking-widest font-poppins">
            LEO Institute · پەیمانگای لیۆ
          </span>
          <span class="text-zinc-400 text-[10px]">·</span>
          <span class="text-zinc-500 text-[10px] hidden sm:inline">Mamostayan Campus</span>
        </div>
        <p class="text-[11px] uppercase tracking-[0.2em] text-zinc-400 font-semibold font-poppins">Good {{ greetingTime }}</p>
        <h1
          class="mt-1 text-[30px] sm:text-[36px] font-semibold tracking-[-0.03em] text-brand-ink dark:text-white leading-[1.1] font-poppins">
          Welcome back, {{ name }}.
        </h1>
        <p class="mt-2 text-[14px] text-zinc-500 dark:text-zinc-400 max-w-md font-poppins">
          <template v-if="goalMet">
            <span class="text-emerald-500 font-medium">Daily goal complete!</span> Outstanding progress today. Your practice is synced with the Leo faculty portal.
          </template>
          <template v-else-if="doneMins === 0">
            Start an AI session to begin your daily goal — <span class="text-[#B91C1C] font-semibold">{{ goalMins }} min</span> today.
          </template>
          <template v-else>
            <span class="text-[#B91C1C] font-semibold">{{ minsLeft }} min left</span> to hit today's target. Keep your fluency streak going!
          </template>
        </p>

        <div class="mt-5 flex flex-wrap items-center gap-2">
          <AppButton variant="primary" size="38" radius="8" icon="Messages" :icon-config="{ color: 'white' }"
            text="LEO AI Speaking Coach" @click="emit('navChat')" />
          <AppButton variant="secondary" size="38" radius="8" icon="Microphone" text="Voice Lab (Call)"
            @click="emit('navVoice')" />
          <AppButton variant="secondary" size="38" radius="8" icon="Book1" :text="`Review ${dueVocabCount ?? 0} words`"
            @click="emit('navVocab')" />
        </div>
      </div>

      <!-- Ring + streak -->
      <div class="flex items-center gap-5 shrink-0">
        <!-- Goal progress ring with CSS draw-in -->
        <div class="relative w-32 h-32">
          <svg viewBox="0 0 120 120" class="w-full h-full -rotate-90">
            <defs>
              <linearGradient id="ringGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stop-color="#1B365D" />
                <stop offset="100%" stop-color="#B91C1C" />
              </linearGradient>
            </defs>
            <!-- track -->
            <circle cx="60" cy="60" :r="R" stroke="currentColor" class="text-zinc-200 dark:text-white/10"
              stroke-width="10" fill="none" />
            <!-- animated fill -->
            <circle cx="60" cy="60" :r="R" stroke="url(#ringGrad)" stroke-width="10" fill="none" stroke-linecap="round"
              :stroke-dasharray="circumference" :stroke-dashoffset="offset" class="ring-animate" />
          </svg>
          <div class="absolute inset-0 flex flex-col items-center justify-center">
            <span
              class="text-[26px] font-semibold tracking-tight text-brand-ink dark:text-white leading-none font-poppins">
              {{ displayDone }}<span class="text-[13px] text-zinc-400 font-normal">/{{ goalMins }}</span>
            </span>
            <span class="text-[14px] uppercase tracking-wider text-zinc-400 mt-0.5 font-poppins">min today</span>
          </div>
        </div>

        <!-- Streak flame -->
        <div class="text-center">
          <div
            class="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#B91C1C]/10 border border-[#B91C1C]/20">
            <AppIconsax name="Flash" color="#B91C1C" :size="26" />
          </div>
          <div
            class="mt-2 text-[22px] font-semibold tracking-tight text-brand-ink dark:text-white leading-none font-poppins">
            {{ streak }}</div>
          <div class="text-[10px] uppercase tracking-wider text-zinc-400 mt-1 font-poppins">day streak</div>
        </div>
      </div>
    </div>
  </div>
</template>
