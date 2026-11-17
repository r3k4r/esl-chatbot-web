<script setup lang="ts">
import type { ChatSession } from '~/common/types/dashboard-types'

// Desktop-only shell. Below `md` the same panel is rendered inside
// SessionsDrawer.vue instead — see chat.vue.
defineProps<{
  sessions: ChatSession[]
  pinnedList: ChatSession[]
  todayList: ChatSession[]
  earlierList: ChatSession[]
  creating: boolean
  search: string
  dailyLimitReached?: boolean
}>()

const emit = defineEmits<{
  'new-session': []
  'open-session': [id: string | number]
  'rename-session': [id: string | number, title: string]
  'pin-session': [id: string | number]
  'delete-session': [id: string | number]
  'update:search': [val: string]
}>()

/** Closed, it slides away; the thread header shows the button to bring it back. */
const open = defineModel<boolean>('open', { required: true })
</script>

<template>
  <aside
    :aria-hidden="!open"
    :inert="!open"
    :class="[
      'relative z-0 hidden shrink-0 overflow-hidden border-border-inner bg-surface-card md:flex',
      'transition-[width,opacity] duration-300 ease-out',
      open ? 'w-72 border-r opacity-100' : 'w-0 opacity-0',
    ]"
  >
    <!-- Fixed inner width, so the content slides instead of squashing -->
    <div class="flex h-full w-72 flex-col">
      <div class="flex h-14 shrink-0 items-center justify-between border-b border-border-inner ps-4 pe-2">
        <AppText size="15" weight="semibold">Chats</AppText>
        <AppButton variant="ghost" size="36" radius="8" aspect="square" icon="SidebarLeft"
          :icon-config="{ color: 'var(--color-text-muted)', size: 20 }"
          class-list="hover:bg-surface-raised dark:hover:bg-surface-raised" aria-label="Hide chats"
          title="Hide chats" @click="open = false" />
      </div>

      <PagesDashboardChatSessionsPanel
        :sessions="sessions"
        :pinned-list="pinnedList"
        :today-list="todayList"
        :earlier-list="earlierList"
        :creating="creating"
        :search="search"
        :daily-limit-reached="dailyLimitReached"
        @new-session="emit('new-session')"
        @open-session="emit('open-session', $event)"
        @rename-session="(id, title) => emit('rename-session', id, title)"
        @pin-session="emit('pin-session', $event)"
        @delete-session="emit('delete-session', $event)"
        @update:search="emit('update:search', $event)"
      />
    </div>
  </aside>
</template>
