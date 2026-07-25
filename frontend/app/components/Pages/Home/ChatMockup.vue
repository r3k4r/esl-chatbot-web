<template>
  <div class="relative">
    <div class="absolute -inset-10 rounded-4xl bg-[radial-gradient(closest-side,rgba(245,158,11,0.35),transparent_70%)] blur-2xl pointer-events-none" />
    <div class="relative rounded-2xl p-4 sm:p-5 w-90 sm:w-105 h-125 sm:h-135 flex flex-col overflow-hidden animate-[float-anim_6s_ease-in-out_infinite] bg-linear-to-b from-brand-dark2/85 to-brand-ink/90 border border-neutral-50/8 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.02)_inset,0_0_80px_-20px_rgba(245,158,11,0.3)] backdrop-blur-lg">

      <!-- Header -->
      <div class="flex items-center justify-between pb-3 border-b border-neutral-50/5">
        <div class="flex items-center gap-2.5">
          <div class="relative">
            <div class="w-9 h-9 rounded-full bg-linear-to-br from-brand-primary to-brand-accent flex items-center justify-center text-brand-ink">
              <Icon icon="lucide:sparkles" width="16" />
            </div>
            <span class="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-brand-dark" />
          </div>
          <div class="leading-tight">
            <AppText size="14" weight="semibold" color="white" class-list="text-sm">{{ t('chatMockup.tutorName') }}</AppText>
            <div class="text-neutral-50/50 text-[11px] flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <AppText size="11" color="white" class-list="text-neutral-50/50">{{ t('chatMockup.sessionLabel') }}</AppText>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          <button class="w-8 h-8 rounded-lg bg-neutral-50/5 border border-neutral-50/5 flex items-center justify-center text-neutral-50/70 hover:text-neutral-50">
            <Icon icon="lucide:mic" width="14" />
          </button>
          <button class="w-8 h-8 rounded-lg bg-neutral-50/5 border border-neutral-50/5 flex items-center justify-center text-neutral-50/70 hover:text-neutral-50">
            <Icon icon="lucide:chevron-down" width="14" />
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="py-4 space-y-2.5 flex-1 min-h-0 overflow-y-auto pe-1">
        <template v-for="(msg, i) in visibleMessages" :key="i">
          <div class="flex gap-2" :class="msg.who === 'user' ? 'justify-end' : 'justify-start'">
            <div
              v-if="msg.who === 'ai'"
              class="w-6 h-6 rounded-full bg-linear-to-br from-brand-primary to-brand-accent flex items-center justify-center shrink-0 mt-0.5"
            >
              <Icon icon="lucide:sparkles" width="11" />
            </div>
            <div
              class="max-w-[78%] text-[13px] leading-relaxed px-3 py-2 rounded-[12px]"
              :class="msg.who === 'user' ? userBubbleClasses : aiBubbleClasses"
            >
              <div
                v-if="msg.tip"
                class="text-[10px] font-semibold uppercase tracking-wider text-brand-primary mb-1 flex items-center gap-1"
              >
                <Icon icon="lucide:sparkles" width="10" /> Phrasing tip
              </div>
              {{ msg.text }}
              <div class="text-[10px] mt-1" :class="msg.who === 'user' ? 'text-brand-ink/50' : 'text-neutral-50/40'">
                {{ msg.t }}
              </div>
            </div>
          </div>
        </template>

        <!-- Typing indicator -->
        <div v-if="typing" class="flex items-center gap-2">
          <div class="w-6 h-6 rounded-full bg-linear-to-br from-brand-primary to-brand-accent flex items-center justify-center shrink-0">
            <Icon icon="lucide:sparkles" width="11" />
          </div>
          <div :class="`${aiBubbleClasses} px-3 py-2.5 rounded-[12px] rounded-bs-sm`">
            <div class="flex gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-neutral-50/50 animate-bounce" style="animation-delay: 0ms" />
              <span class="w-1.5 h-1.5 rounded-full bg-neutral-50/50 animate-bounce" style="animation-delay: 120ms" />
              <span class="w-1.5 h-1.5 rounded-full bg-neutral-50/50 animate-bounce" style="animation-delay: 240ms" />
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="mt-1 pt-3 border-t border-neutral-50/5">
        <div class="flex items-center gap-2 bg-neutral-50/3 border border-neutral-50/5 rounded-xl px-3 py-2">
          <div class="flex items-end gap-0.5 h-5">
            <span
              v-for="(h, i) in waveBars"
              :key="i"
              class="w-0.75 rounded-full bg-brand-primary/80 animate-[wave_1.1s_ease-in-out_infinite]"
              style="height: 100%"
              :style="{ transform: `scaleY(${h})`, animationDelay: `${i * 120}ms` }"
            />
          </div>
          <div class="flex-1 text-[13px] text-neutral-50/60">
            {{ t('chatMockup.listening') }}<span class="animate-[blink_1s_steps(1)_infinite]">…</span>
          </div>
          <button class="w-8 h-8 rounded-lg bg-brand-primary text-brand-ink flex items-center justify-center shadow">
            <Icon icon="lucide:send" width="14" />
          </button>
        </div>
        <div class="flex items-center justify-between mt-2 px-1">
          <div class="flex items-center gap-3 text-[10px] text-neutral-50/40">
            <span class="flex items-center gap-1">
              <Icon icon="lucide:mic" width="10" /> {{ t('chatMockup.voiceMode') }}
            </span>
            <span>·</span>
            <span>{{ t('chatMockup.pronunciation') }} <span class="text-emerald-400 font-medium">92%</span></span>
          </div>
          <span class="text-[10px] text-neutral-50/40 font-mono">Session 14:22</span>
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

// Structural metadata (speaker + timestamp) stays here; the message text is
// pulled from the active locale by index, so the demo translates live.
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

const userBubbleClasses = 'bg-linear-to-br from-brand-primary to-brand-accent text-brand-ink rounded-be-sm rounded-es-[12px] rounded-ss-[12px]'
const aiBubbleClasses = 'bg-neutral-50/4 border border-neutral-50/8 text-neutral-100 rounded-be-sm'

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

@keyframes blink {
  50% {
    opacity: 0;
  }
}

@keyframes wave {
  0%,
  100% {
    transform: scaleY(0.3);
  }

  50% {
    transform: scaleY(1);
  }
}
</style>
