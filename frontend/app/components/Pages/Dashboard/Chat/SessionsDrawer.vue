<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import type { ChatSession } from '~/common/types/dashboard-types'

// Mobile counterpart of SessionsSidebar. Portrait phones previously had no way
// to reach the session list at all (the rail was `hidden md:flex`).
const props = defineProps<{
  open: boolean
  sessions: ChatSession[]
  todayList: ChatSession[]
  earlierList: ChatSession[]
  creating: boolean
  search: string
  dailyLimitReached?: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  'new-session': []
  'open-session': [id: string | number]
  'update:search': [val: string]
}>()

// Resizing up to desktop reveals the inline rail, so the sheet (and its
// overlay) must not be left hanging over it.
const isDesktop = useMediaQuery('(min-width: 48rem)')
watch(isDesktop, (desktop) => {
  if (desktop && props.open) emit('update:open', false)
})

// Picking or creating a session should reveal the thread, not leave the sheet
// covering it.
function pick(id: string | number) {
  emit('open-session', id)
  emit('update:open', false)
}

function create() {
  emit('new-session')
  emit('update:open', false)
}
</script>

<template>
  <UiSheet :open="open" @update:open="emit('update:open', $event)">
    <UiSheetContent
      side="left"
      class="w-[85vw] max-w-sm p-0 gap-0 md:hidden"
      style="background:var(--surface-card)"
    >
      <UiSheetHeader class="px-4 py-3 border-b" style="border-color:var(--border-inner)">
        <UiSheetTitle class="text-[15px]" style="color:var(--text-heading)">
          Your sessions
        </UiSheetTitle>
      </UiSheetHeader>

      <div class="flex-1 min-h-0">
        <PagesDashboardChatSessionsPanel
          :sessions="sessions"
          :today-list="todayList"
          :earlier-list="earlierList"
          :creating="creating"
          :search="search"
          :daily-limit-reached="dailyLimitReached"
          @new-session="create"
          @open-session="pick"
          @update:search="emit('update:search', $event)"
        />
      </div>
    </UiSheetContent>
  </UiSheet>
</template>
