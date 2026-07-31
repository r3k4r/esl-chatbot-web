<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'
import type { ChatMessage } from '~/common/types/dashboard-types'
import type { SvgBasedIconName } from '~/common/types/iconsax-types'

defineProps<{
  messages: ChatMessage[]
  thinking: boolean
  subActive: boolean
  activeSession: { topic?: string | null } | null
  userInitial: string
}>()

const emit = defineEmits<{
  'fill-suggestion': [text: string]
}>()

const suggestions: { icon: SvgBasedIconName; text: string }[] = [
  { icon: 'Messages2', text: "Let's practice small-talk at work." },
  { icon: 'Cup', text: 'Help me order coffee in English.' },
  { icon: 'Briefcase', text: 'Coach me for a job interview.' },
  { icon: 'Airplane', text: "Let's talk about planning a trip." },
  { icon: 'Book1', text: 'Correct my grammar as we chat.' },
  { icon: 'People', text: "Tell me about today's English idiom." },
]

const { getUser } = useAuthStore()

const scrollEl = ref<HTMLElement | null>(null)
defineExpose({ scrollEl })
</script>

<template>
  <div ref="scrollEl" class="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 sm:py-6">
    <div class="max-w-3xl mx-auto space-y-4 h-full">

      <!-- Empty state -->
      <div
        v-if="!messages.length"
        class="flex flex-col items-center justify-center h-full text-center animate-card-enter pb-4"
      >
        <div class="relative mb-4">
          <div
            class="w-16 h-16 rounded-2xl bg-linear-to-br from-brand-primary to-brand-accent flex items-center justify-center shadow-lg"
          >
            <AppIconsax name="Candle" color="#000" :size="26" />
          </div>
          <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 ring-2 ring-surface-page" />
        </div>

        <AppText size="18" weight="semibold" class-list="mb-1">
          Hi{{ getUser?.displayName ? `, ${getUser.displayName.split(' ')[0]}` : '' }}! I'm Tutelage AI 👋
        </AppText>
        <AppText size="14" color="neutral-400" class-list="max-w-sm">
          <template v-if="!subActive">
            You need an active plan to chat. Choose one to get started.
          </template>
          <template v-else-if="activeSession">
            Say anything in English — I'll reply naturally and correct you as we go.
          </template>
          <template v-else>
            Type a message below, tap the mic, or pick a topic to start a conversation.
          </template>
        </AppText>

        <div v-if="subActive" class="mt-5 flex flex-wrap gap-2 justify-center">
          <AppButton
            v-for="s in suggestions"
            :key="s.text"
            variant="outline"
            size="36"
            radius="8"
            :icon="s.icon"
            :icon-config="{ color: 'var(--color-text-subtle)', size: 16 }"
            :text="s.text"
            class-list="text-[13px] px-3 animate-card-enter"
            style="--delay:80ms"
            @click="emit('fill-suggestion', s.text)"
          />
        </div>

        <AppButton
          v-if="!subActive"
          to="/dashboard/billing"
          variant="primary"
          size="40"
          radius="8"
          text="Choose a plan"
          icon="ArrowRight"
          :icon-config="{ color: 'white' }"
          icon-position="end"
          class-list="mt-5 text-[14px]"
        />
      </div>

      <!-- Messages -->
      <template v-else>
        <PagesDashboardChatMessageBubble
          v-for="(m, i) in messages"
          :key="i"
          :message="m"
          :user-initial="userInitial"
        />
        <PagesDashboardChatThinkingIndicator v-if="thinking" />
      </template>
    </div>
  </div>
</template>
