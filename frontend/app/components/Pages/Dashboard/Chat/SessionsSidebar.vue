<script setup lang="ts">
import type { ChatSession } from '~/common/types/dashboard-types'

// Desktop-only shell. Below `md` the same panel is rendered inside
// SessionsDrawer.vue instead — see chat.vue.
defineProps<{
  sessions: ChatSession[]
  todayList: ChatSession[]
  earlierList: ChatSession[]
  creating: boolean
  search: string
  dailyLimitReached?: boolean
}>()

const emit = defineEmits<{
  'new-session': []
  'open-session': [id: string | number]
  'update:search': [val: string]
}>()
</script>

<template>
  <div
    class="w-64 lg:w-72 border-r hidden md:flex flex-col shrink-0 overflow-hidden relative z-0"
    style="background:var(--surface-card);border-color:var(--border-inner)"
  >
    <PagesDashboardChatSessionsPanel
      :sessions="sessions"
      :today-list="todayList"
      :earlier-list="earlierList"
      :creating="creating"
      :search="search"
      :daily-limit-reached="dailyLimitReached"
      @new-session="emit('new-session')"
      @open-session="emit('open-session', $event)"
      @update:search="emit('update:search', $event)"
    />
  </div>
</template>
