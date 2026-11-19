<template>
  <div class="relative">
    <div class="pointer-events-none absolute -inset-10 rounded-4xl bg-[radial-gradient(closest-side,rgba(245,158,11,0.35),transparent_70%)] blur-2xl" />
    <!-- The real AI Chat in dark mode, drawn with the dashboard's own dark tokens (the .dark scope) -->
    <div class="chat-float dark relative flex h-128 w-[min(100%,360px)] flex-col overflow-hidden rounded-2xl border border-border-card bg-surface-page text-start shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),0_0_80px_-20px_rgba(245,158,11,0.3)] sm:h-136 sm:w-105" dir="ltr" aria-hidden="true">
      <!-- Thread header -->
      <div class="flex items-center gap-2.5 border-b border-border-inner px-4 py-3">
        <Icon icon="lucide:messages-square" width="16" class="text-text-muted" />
        <div class="min-w-0 flex-1 leading-tight">
          <div class="truncate text-[14px] font-semibold text-text-heading">{{ t('chatMockup.title') }}</div>
          <div class="text-[12px] text-text-muted">{{ t('chatMockup.level') }} · {{ clock }}</div>
        </div>
        <span class="grid size-8 place-items-center rounded-lg bg-brand-primary text-neutral-50"><Icon icon="lucide:circle-x" width="15" /></span>
      </div>

      <!-- Messages: newest at the bottom, older ones slide up and out -->
      <div class="flex min-h-0 flex-1 flex-col justify-end gap-3 overflow-hidden px-4 pb-3">
        <TransitionGroup name="msg">
          <template v-for="(m, i) in shown" :key="i">
            <div v-if="m.who === 'user'" class="flex flex-col items-end gap-1.5">
              <div class="max-w-[82%] rounded-2xl bg-surface-raised px-3.5 py-2.5 text-[13.5px] leading-relaxed text-text-heading">{{ m.text }}</div>
              <div v-if="m.voice" class="flex w-44 items-center gap-2 rounded-xl border border-border-card bg-surface-card px-2 py-1.5">
                <span class="grid size-6 place-items-center rounded-lg bg-surface-raised text-text-body"><Icon icon="lucide:play" width="11" /></span>
                <span class="h-1 flex-1 rounded-full bg-surface-well" />
                <span class="text-[11px] tabular-nums text-text-subtle">0:04</span>
              </div>
              <div v-if="m.fix" class="max-w-[82%] rounded-xl border border-border-card bg-surface-card px-3 py-2 text-[12.5px] text-text-body">
                <span class="me-1 inline-flex items-center gap-1 font-medium text-brand-primary"><Icon icon="lucide:wand-sparkles" width="12" />{{ t('chatMockup.better') }}</span>
                {{ m.fix[0] }}<strong class="font-semibold text-text-heading">{{ m.fix[1] }}</strong>{{ m.fix[2] }}
              </div>
            </div>
            <div v-else class="flex gap-2.5">
              <AppImage src="/only-logo-black-border-yellow-bg.svg" alt="" width="24" height="24" class="mt-0.5 size-6 shrink-0" />
              <div class="min-w-0">
                <div class="text-[13.5px] leading-relaxed text-text-body">{{ m.text }}</div>
                <div v-if="m.voice" class="mt-1.5 flex w-44 items-center gap-2 rounded-xl border border-border-card bg-surface-card px-2 py-1.5">
                  <span class="grid size-6 place-items-center rounded-lg bg-brand-primary text-neutral-50"><Icon icon="lucide:pause" width="11" /></span>
                  <span class="h-1 flex-1 overflow-hidden rounded-full bg-surface-well"><span class="voice-progress block h-full rounded-full bg-brand-primary" /></span>
                  <span class="text-[11px] tabular-nums text-text-subtle">0:06</span>
                </div>
              </div>
            </div>
          </template>
          <div v-if="thinking" key="thinking" class="flex items-center gap-2.5">
            <AppImage src="/only-logo-black-border-yellow-bg.svg" alt="" width="24" height="24" class="size-6 shrink-0" />
            <span class="flex gap-1"><span v-for="d in 3" :key="d" class="size-1.5 animate-bounce rounded-full bg-text-subtle" :style="{ animationDelay: `${d * 120}ms` }" /></span>
            <span class="text-[13px] text-text-muted">{{ t('chatMockup.thinking') }}</span>
          </div>
        </TransitionGroup>
      </div>

      <!-- Composer: the orange recording strip while a voice message is recorded -->
      <div class="px-3 pb-3">
        <Transition name="msg">
          <div v-if="recording" class="mb-2 flex items-center gap-2.5 rounded-xl border border-brand-primary/25 bg-brand-primary/8 px-3 py-2">
            <span class="size-2 animate-pulse rounded-full bg-brand-primary" />
            <span class="flex h-5 items-end gap-0.5">
              <span v-for="(h, i) in WAVE" :key="i" class="wave w-0.75 rounded-full bg-brand-primary" :style="{ height: '100%', transform: `scaleY(${h})`, animationDelay: `${i * 110}ms` }" />
            </span>
            <span class="text-[12px] tabular-nums text-brand-primary">0:04</span>
            <span class="truncate text-[12.5px] text-text-body">{{ t('chatMockup.listening') }}</span>
          </div>
        </Transition>
        <div class="flex items-end gap-1.5 rounded-2xl border border-border-card bg-surface-card p-2 ps-3">
          <div class="min-h-9 flex-1 py-2 text-[13.5px]" :class="draft ? 'text-text-heading' : 'text-text-subtle'">
            {{ draft || t('chatMockup.placeholder') }}<span v-if="typingText" class="caret">|</span>
          </div>
          <span class="grid size-9 place-items-center text-text-body"><Icon icon="lucide:audio-lines" width="16" /></span>
          <span class="grid size-9 place-items-center" :class="recording ? 'text-brand-primary' : 'text-text-body'"><Icon :icon="recording ? 'lucide:square' : 'lucide:mic'" width="16" /></span>
          <span class="grid size-9 place-items-center rounded-lg bg-brand-primary text-neutral-50"><Icon icon="lucide:send-horizontal" width="15" /></span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useChatMockupScript } from '~/composables/useChatMockupScript'

const { t } = useLocale()
const WAVE = [0.35, 0.8, 0.5, 1, 0.45, 0.9, 0.55, 0.7]
const { shown, thinking, recording, draft, typingText, clock } = useChatMockupScript()
</script>

<style scoped>
.chat-float { animation: chat-float 6s ease-in-out infinite; }
@keyframes chat-float { 50% { transform: translateY(-8px); } }

.msg-enter-active { transition: opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), transform 0.45s cubic-bezier(0.16, 1, 0.3, 1); }
.msg-leave-active { transition: opacity 0.25s ease; }
.msg-enter-from { opacity: 0; transform: translateY(10px); }
.msg-leave-to { opacity: 0; }
.msg-move { transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1); }

.wave { transform-origin: bottom; animation: wave 1s ease-in-out infinite; }
@keyframes wave { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }

.voice-progress { width: 0; animation: voice 6s linear forwards; }
@keyframes voice { to { width: 100%; } }

.caret { animation: blink 1s steps(1) infinite; margin-inline-start: 1px; }
@keyframes blink { 50% { opacity: 0; } }

@media (prefers-reduced-motion: reduce) {
  .chat-float, .wave, .caret { animation: none; }
  .voice-progress { animation: none; width: 40%; }
}
</style>
