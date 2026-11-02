<template>
  <div class="relative">
    <div class="absolute -inset-10 rounded-4xl bg-[radial-gradient(closest-side,rgba(185,28,28,0.25),transparent_70%)] blur-2xl pointer-events-none" />
    <div class="relative rounded-2xl p-4 sm:p-5 w-90 sm:w-105 h-125 sm:h-135 flex flex-col overflow-hidden animate-[float-anim_6s_ease-in-out_infinite] bg-linear-to-b from-[#0F172A]/90 to-[#0B132B]/95 border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)_inset,0_0_80px_-20px_rgba(185,28,28,0.3)] backdrop-blur-lg">

      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-white/10">
        <div class="flex items-center gap-2.5">
          <div class="relative">
            <div class="w-9 h-9 rounded-xl overflow-hidden border border-white/15 shadow-sm">
              <img src="/leo-logo.jpg" alt="LEO" class="w-full h-full object-cover" />
            </div>
            <span class="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0F172A]" />
          </div>
          <div class="leading-tight">
            <AppText size="14" weight="semibold" color="white" class-list="text-sm font-semibold">{{ t('chatMockup.tutorName') }}</AppText>
            <div class="text-neutral-50/60 text-[11px] flex items-center gap-1.5 mt-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <AppText size="11" color="white" class-list="text-neutral-50/60">{{ t('chatMockup.sessionLabel') }}</AppText>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <div class="px-2 py-1 rounded-md bg-[#B91C1C]/20 border border-[#B91C1C]/30 text-[10px] font-semibold text-red-300">
            LEO AI
          </div>
          <button class="w-8 h-8 rounded-lg bg-neutral-50/5 border border-neutral-50/5 flex items-center justify-center text-neutral-50/70 hover:text-neutral-50">
            <Icon icon="lucide:mic" width="14" />
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="py-4 space-y-2.5 flex-1 min-h-0 overflow-y-auto pe-1">
        <template v-for="(msg, i) in visibleMessages" :key="i">
          <div class="flex gap-2" :class="msg.who === 'user' ? 'justify-end' : 'justify-start'">
            <div
              v-if="msg.who === 'ai'"
              class="w-6 h-6 rounded-md overflow-hidden shrink-0 mt-0.5 border border-white/10"
            >
              <img src="/leo-logo.jpg" alt="LEO" class="w-full h-full object-cover" />
            </div>
            <div
              class="max-w-[78%] text-[13px] leading-relaxed px-3 py-2 rounded-[12px]"
              :class="msg.who === 'user' ? userBubbleClasses : aiBubbleClasses"
            >
              <div
                v-if="msg.tip"
                class="text-[10px] font-semibold uppercase tracking-wider text-amber-300 mb-1 flex items-center gap-1"
              >
                <Icon icon="lucide:sparkles" width="10" /> Phrasing tip
              </div>
              {{ msg.text }}
              <div class="text-[10px] mt-1" :class="msg.who === 'user' ? 'text-white/60' : 'text-neutral-50/40'">
                {{ msg.t }}
              </div>
            </div>
          </div>
        </template>

        <div v-if="typing" class="flex gap-2 items-center text-neutral-50/40 text-[11px] ps-8">
          <span class="inline-flex gap-1 items-center">
            <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style="animation-delay: 0ms;" />
            <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style="animation-delay: 150ms;" />
            <span class="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style="animation-delay: 300ms;" />
          </span>
          <span>LEO AI is coaching…</span>
        </div>
      </div>

      <!-- Input Bar -->
      <div class="pt-2 border-t border-white/10">
        <div class="relative flex items-center bg-white/5 rounded-xl border border-white/10 px-3 py-2 focus-within:border-[#B91C1C]">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse me-2" />
          <span class="text-[12px] text-neutral-50/40 font-mono flex-1">Can I have a double espresso and...</span>
          <div class="flex items-center gap-1 me-2">
            <span
              v-for="(h, i) in waveBars"
              :key="i"
              class="w-0.5 bg-red-400/80 rounded-full animate-[wave_1s_ease-in-out_infinite]"
              :style="{ height: `${h * 16}px`, animationDelay: `${i * 120}ms` }"
            />
          </div>
          <button class="w-8 h-8 rounded-lg bg-[#B91C1C] text-white flex items-center justify-center shadow hover:bg-[#991B1B]">
            <Icon icon="lucide:send" width="14" />
          </button>
        </div>
        <div class="flex items-center justify-between mt-2 px-1">
          <div class="flex items-center gap-3 text-[10px] text-neutral-50/50">
            <span class="flex items-center gap-1">
              <Icon icon="lucide:mic" width="10" /> {{ t('chatMockup.voiceMode') }}
            </span>
            <span>·</span>
            <span>{{ t('chatMockup.pronunciation') }} <span class="text-emerald-400 font-medium">96%</span></span>
          </div>
          <span class="text-[10px] text-neutral-50/40 font-mono">Leo Cafeteria #104</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'

type ConvoMessage = {
  who: 'ai' | 'user'
  text: string
  t: string
  tip?: boolean
}

const { t, ta } = useLocale()

const convoMeta: { who: 'ai' | 'user'; t: string }[] = [
  { who: 'ai',   t: '10:04' },
  { who: 'user', t: '10:04' },
  { who: 'ai',   t: '10:05' },
  { who: 'user', t: '10:05' },
]

const convo = computed<ConvoMessage[]>(() => {
  const messages = ta('chatMockup.messages')
  return convoMeta.map((meta, i) => ({
    who: meta.who,
    t: meta.t,
    text: messages[i] ?? '',
  }))
})

const waveBars = [0.3, 0.7, 0.5, 0.9, 0.4, 0.8, 0.5]

const userBubbleClasses = 'bg-linear-to-br from-[#B91C1C] to-[#991B1B] text-white rounded-be-sm rounded-es-[12px] rounded-ss-[12px] shadow-sm'
const aiBubbleClasses = 'bg-white/5 border border-white/10 text-neutral-100 rounded-be-sm'

const visible = ref(0)
const typing  = ref(false)

const visibleMessages = computed(() => convo.value.slice(0, visible.value))

onMounted(() => {
  const timers: ReturnType<typeof setTimeout>[] = []

  function step(i: number) {
    if (i >= convo.value.length) {
      timers.push(setTimeout(() => { visible.value = 0; step(0) }, 3500))
      return
    }
    const current = convo.value[i]
    if (!current) return

    typing.value = current.who === 'ai' && i > 0
    timers.push(setTimeout(() => {
      typing.value = false
      visible.value = i + 1
      timers.push(setTimeout(() => step(i + 1), 1400))
    }, i === 0 ? 400 : 900))
  }

  step(0)

  onUnmounted(() => timers.forEach(clearTimeout))
})
</script>

<style scoped>
@keyframes float-anim {
  0%,
  100% {
    transform: translateY(0px);
  }

  50% {
    transform: translateY(-6px);
  }
}
</style>
