<script setup lang="ts">
import type { CallLock } from '~/common/types/voice-types'
import type { SessionUsage } from '~/common/types/chat-types'

// Laid over the blurred call screen when a call can't start, so learners see why
// before they try, instead of a call that never answers.
const props = defineProps<{ lock: Exclude<CallLock, null>; usage: SessionUsage | null }>()

const resetsIn = computed(() => {
  const s = props.usage?.resetsInSeconds ?? 0
  if (s >= 3600) return `${Math.ceil(s / 3600)} hours`
  return `${Math.max(1, Math.ceil(s / 60))} minutes`
})
const canUpgrade = computed(() => props.usage?.plan !== 'PREMIUM')

const copy = computed(() => {
  switch (props.lock) {
    case 'verify':
      return { title: 'Verify your email to start calling', body: 'The AI tutor is free with your account. Verify your email or link Google and calls unlock.', to: '/verify-email', cta: 'Verify my email' }
    case 'inactive':
      return { title: 'Your plan is not active', body: 'Calls need an active plan. Open Billing to get talking again.', to: '/dashboard/billing', cta: 'Open billing' }
    case 'sessions':
      return {
        title: `You've had today's ${props.usage?.sessionsPerDay ?? ''} conversations`,
        body: `Chats and calls both count. You get new ones in ${resetsIn.value}${canUpgrade.value ? ', or upgrade for more each day.' : '.'}`,
        to: canUpgrade.value ? '/dashboard/billing' : null,
        cta: 'See plans',
      }
    default:
      return {
        title: `You've used today's ${props.usage?.messagesPerDay ?? ''} free messages`,
        body: `Each thing you say on a call is one message. More in ${resetsIn.value}, or upgrade for no daily limit.`,
        to: '/dashboard/billing',
        cta: 'See plans',
      }
  }
})
</script>

<template>
  <div class="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-surface-card/60 p-6 backdrop-blur-sm">
    <div class="dash-card w-full max-w-sm p-6 text-center shadow-lg">
      <span class="mx-auto grid size-12 place-items-center rounded-xl bg-surface-well">
        <AppIconsax name="Lock1" :size="22" color="var(--color-text-muted)" />
      </span>
      <AppText size="18" weight="semibold" class-list="mt-4">{{ copy.title }}</AppText>
      <AppText size="14" color="neutral-400" class-list="mt-2">{{ copy.body }}</AppText>
      <AppButton
        v-if="copy.to"
        :to="copy.to"
        variant="primary"
        size="44"
        radius="12"
        icon="ArrowRight"
        icon-position="end"
        :icon-config="{ color: 'white' }"
        :text="copy.cta"
        class-list="mx-auto mt-5 text-[15px]"
      />
    </div>
  </div>
</template>
