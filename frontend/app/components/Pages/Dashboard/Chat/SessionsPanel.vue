<script setup lang="ts">
import type { ChatSession } from '~/common/types/dashboard-types'

// The chat list itself, with no shell of its own. Rendered twice: inline by
// SessionsSidebar.vue on desktop, and inside SessionsDrawer.vue on mobile.
const props = defineProps<{
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

const groups = computed(() =>
  [
    { label: 'Pinned', items: props.pinnedList },
    { label: 'Today', items: props.todayList },
    { label: 'Earlier', items: props.earlierList },
  ].filter((g) => g.items.length),
)

// Keyed off the rendered groups: a search that matches nothing still has
// `sessions`, which would otherwise render a blank list with no explanation.
const visibleCount = computed(() => groups.value.reduce((n, g) => n + g.items.length, 0))

// ── Delete, after a confirm ───────────────────────────────────────────────────
// The target is kept apart from `deleteOpen`: the dialog closes itself before the
// Delete click handler runs, so clearing the target on close would lose it.
const toDelete = ref<ChatSession | null>(null)
const deleteOpen = ref(false)
function askDelete(s: ChatSession) {
  toDelete.value = s
  deleteOpen.value = true
}
function confirmDelete() {
  if (toDelete.value) emit('delete-session', toDelete.value.id)
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- New chat: a blank thread; the session is created by its first message -->
    <div class="px-3 pt-3 shrink-0">
      <AppButton
        variant="primary"
        size="40"
        radius="8"
        icon="Edit2"
        :icon-config="{ color: 'white', size: 18 }"
        text="New chat"
        class-list="w-full justify-center text-[14px]"
        :disabled="dailyLimitReached || creating"
        @click="emit('new-session')"
      />
      <AppText v-if="dailyLimitReached" size="13" color="neutral-400" class-list="mt-2 text-center">
        Daily session limit reached. Come back tomorrow.
      </AppText>
    </div>

    <div class="px-3 pt-3 shrink-0">
      <FormInput
        id="chat-session-search"
        :model-value="search"
        placeholder="Search chats"
        icon="SearchNormal"
        rounded="lg"
        :icon-config="{ color: 'var(--color-text-subtle)', size: 16 }"
        class-list="h-10 text-[14px] ps-10"
        @update:model-value="emit('update:search', String($event ?? ''))"
      />
    </div>

    <div class="px-2 py-2 overflow-y-auto flex-1 min-h-0">
      <UiEmpty v-if="!visibleCount" class="border-0 px-2 py-8">
        <UiEmptyMedia variant="icon">
          <AppIconsax name="Messages" color="var(--color-text-subtle)" :size="22" />
        </UiEmptyMedia>
        <UiEmptyTitle class="text-[14px]">{{ search ? 'No matches' : 'No chats yet' }}</UiEmptyTitle>
        <UiEmptyDescription class="text-[14px]">
          {{ search ? 'Try a different word.' : 'Your conversations will appear here.' }}
        </UiEmptyDescription>
      </UiEmpty>

      <template v-else>
      <section v-for="(group, gi) in groups" :key="group.label" :class="{ 'mt-3': gi > 0 }">
        <AppText size="12" weight="semibold" color="neutral-400" class-list="px-2.5 pb-1 pt-1">
          {{ group.label }}
        </AppText>
        <div class="space-y-0.5">
          <PagesDashboardChatSessionItem
            v-for="s in group.items"
            :key="s.id"
            :session="s"
            @open="emit('open-session', s.id)"
            @rename="emit('rename-session', s.id, $event)"
            @pin="emit('pin-session', s.id)"
            @delete="askDelete(s)"
          />
        </div>
      </section>
      </template>
    </div>

    <UiAlertDialog v-model:open="deleteOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Delete this chat?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            “{{ toDelete?.title }}” will be removed from your list. This can't be undone.
            It still counts toward today's session limit.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
          <UiAlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="confirmDelete">
            Delete
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
