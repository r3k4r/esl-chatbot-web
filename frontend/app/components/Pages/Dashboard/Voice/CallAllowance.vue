<script setup lang="ts">
import type { SessionUsage } from '~/common/types/chat-types'

// "2 of 3 conversations left today · 16 messages left", so nobody is surprised mid-call.
const props = defineProps<{ usage: SessionUsage | null }>()

const text = computed(() => {
  const u = props.usage
  if (!u?.active) return ''
  const sessions = Math.max(0, u.sessionsPerDay - u.sessionsToday)
  const parts = [`${sessions} of ${u.sessionsPerDay} conversations left today`]
  if (u.messagesPerDay != null) parts.push(`${Math.max(0, u.messagesPerDay - u.messagesToday)} messages left`)
  return parts.join(' · ')
})
</script>

<template>
  <AppText v-if="text" size="14" color="neutral-400" class-list="tabular-nums">{{ text }}</AppText>
</template>
