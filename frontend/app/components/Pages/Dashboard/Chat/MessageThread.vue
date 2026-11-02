<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'
import type { ChatMessage } from '~/common/types/dashboard-types'
import type { SvgBasedIconName } from '~/common/types/iconsax-types'

defineProps<{
  messages: ChatMessage[]
  thinking: boolean
  subActive: boolean
  /** Inactive because the email isn't verified yet — free to fix, no payment. */
  needsVerification: boolean
  activeSession: { topic?: string | null } | null
  userInitial: string
}>()

const emit = defineEmits<{
  'fill-suggestion': [text: string]
}>()

// Leo Institute Level-Specific Curriculum Presets for Live Pitch Demos
const suggestions: { icon: SvgBasedIconName; text: string; level: string }[] = [
  {
    icon: 'Cup',
    level: 'Level 1',
    text: "Level 1 (Beginner): Ordering at the Leo Campus Cafeteria — Hello! I'd like to order a coffee and a fresh sandwich, please."
  },
  {
    icon: 'Briefcase',
    level: 'Level 3',
    text: "Level 3 (Intermediate): Job Interview & Daily Fluency — Could you interview me for a position and give me feedback on my professional fluency?"
  },
  {
    icon: 'Teacher',
    level: 'IELTS',
    text: "Advanced: IELTS Speaking Part 1 & 2 Mock Examiner — Please act as my IELTS examiner and conduct a mock speaking test with band evaluation."
  },
  {
    icon: 'Location',
    level: 'Campus',
    text: "Sulaymaniyah Dialogue: Can you help me practice giving directions to Leo Institute located in Mamostayan directly opposite Azadi Park?"
  },
  {
    icon: 'Book1',
    level: 'Grammar',
    text: "Leo Speaking Lab: Please correct my grammar and suggest more natural idioms as we talk today."
  },
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
            class="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#B91C1C]/40 shadow-xl"
          >
            <img src="/leo-logo.jpg" alt="LEO Institute" class="w-full h-full object-cover" />
          </div>
          <span class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-surface-page animate-pulse" />
        </div>

        <AppText size="18" weight="semibold" class-list="mb-1 text-lg sm:text-xl font-bold">
          Hi{{ getUser?.displayName ? `, ${getUser.displayName.split(' ')[0]}` : '' }}! Welcome to LEO AI Speaking Lab 👋
        </AppText>
        <div class="text-xs text-[#B91C1C] font-semibold mb-2">
          پەیمانگای لیۆ · بەرامبەر پارکی ئازادی
        </div>
        <AppText size="14" color="neutral-400" class-list="max-w-md text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          <template v-if="needsVerification">
            One step left — verify your email and the LEO AI tutor unlocks on your account. No payment needed.
          </template>
          <template v-else-if="!subActive">
            Your student subscription isn't active right now. Check Billing or your Leo Institute campus enrollment.
          </template>
          <template v-else-if="activeSession">
            Speak or type anything in English — your LEO AI coach will reply naturally and correct your pronunciation.
          </template>
          <template v-else>
            Tap a curriculum scenario preset below to start an interactive speaking simulation:
          </template>
        </AppText>

        <!-- Level-Specific Scenario Presets -->
        <div v-if="subActive" class="mt-6 w-full max-w-xl space-y-2">
          <div class="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-left px-1">
            Curriculum Demo Scenarios (1-Click Pitch)
          </div>
          <div class="grid gap-2 text-left">
            <button
              v-for="s in suggestions"
              :key="s.text"
              class="w-full p-3 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-white/10 hover:border-[#B91C1C] hover:bg-red-50/30 dark:hover:bg-red-950/20 transition-all text-left group flex items-start gap-3 shadow-xs"
              @click="emit('fill-suggestion', s.text)"
            >
              <div class="p-2 rounded-lg bg-slate-100 dark:bg-zinc-800 text-[#B91C1C] group-hover:bg-[#B91C1C] group-hover:text-white transition shrink-0 mt-0.5">
                <AppIconsax :name="s.icon" color="currentColor" :size="16" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[#B91C1C]/10 text-[#B91C1C] uppercase">
                    {{ s.level }}
                  </span>
                </div>
                <div class="text-[12.5px] text-slate-700 dark:text-slate-300 font-medium leading-snug line-clamp-2">
                  {{ s.text }}
                </div>
              </div>
            </button>
          </div>
        </div>

        <AppButton
          v-if="needsVerification"
          to="/verify-email"
          variant="primary"
          size="40"
          radius="8"
          text="Verify my email"
          icon="ArrowRight"
          :icon-config="{ color: 'white' }"
          icon-position="end"
          class-list="mt-5 text-[14px]"
        />
        <AppButton
          v-else-if="!subActive"
          to="/dashboard/billing"
          variant="primary"
          size="40"
          radius="8"
          text="Go to Billing"
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
