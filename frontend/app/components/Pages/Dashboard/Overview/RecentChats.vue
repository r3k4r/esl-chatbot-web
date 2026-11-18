<script setup lang="ts">
import type { LearnerRecentChat } from '~/common/types/dashboard-overview-types'
import { daysAgo } from '~/lib/progress'

// The learner's latest chats; each reopens in the chat page.
defineProps<{ chats: LearnerRecentChat[] }>()
</script>

<template>
  <section aria-labelledby="learner-chats" class="dash-card p-5 md:p-6">
    <div class="flex items-baseline justify-between gap-3">
      <AppText id="learner-chats" size="16" weight="semibold">Recent chats</AppText>
      <AppLink to="/dashboard/chat" class="text-[14px] text-text-muted hover:text-text-heading">New chat</AppLink>
    </div>

    <ul v-if="chats.length" class="mt-3 divide-y divide-border-inner">
      <li v-for="c in chats" :key="c.id">
        <AppLink :to="`/dashboard/chat?session=${c.id}`" class="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 hover:bg-surface-raised">
          <AppIconsax :name="c.mode === 'VOICE' ? 'Microphone2' : 'MessageText'" :size="18" color="var(--color-text-subtle)" />
          <div class="min-w-0 flex-1">
            <AppText size="14" weight="medium" class-list="truncate">{{ c.title || c.topic || 'Free conversation' }}</AppText>
            <AppText size="13" color="neutral-400">{{ daysAgo(c.startedAt) }} · {{ c.messageCount }} message{{ c.messageCount === 1 ? '' : 's' }}</AppText>
          </div>
          <AppText v-if="c.score !== null" size="14" weight="semibold" class-list="tabular-nums">{{ Math.round(c.score) }}</AppText>
          <AppText v-else size="13" color="neutral-400">Open</AppText>
        </AppLink>
      </li>
    </ul>
    <AppText v-else size="14" color="neutral-400" class-list="mt-3">No chats yet. Your first one takes a minute.</AppText>
  </section>
</template>
