<script setup lang="ts">
import type { ChatSession } from '~/common/types/dashboard-types'

// The session list itself, with no shell of its own. Rendered twice: inline by
// SessionsSidebar.vue on desktop, and inside SessionsDrawer.vue on mobile — so
// phones get the same list instead of the old `hidden md:flex` dead end.
const props = defineProps<{
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

// Keyed off the rendered groups, not the raw session count: with a search term
// that matches nothing, `sessions` is still non-empty, which would otherwise
// render an entirely blank list with no explanation.
const visibleCount = computed(() => props.todayList.length + props.earlierList.length)

// AppButton never binds its `disabled` prop to the element, so the disabled look
// comes from the call site (see the note in Composer.vue).
const newSessionClass = computed(
  () => `w-full justify-center text-[14px]${props.dailyLimitReached ? ' opacity-50 pointer-events-none' : ''}`,
)
</script>

<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- New session -->
    <div class="p-3 border-b shrink-0" style="border-color:var(--border-inner)">
      <AppButton
        variant="primary"
        size="40"
        radius="8"
        icon="Add"
        :icon-config="{ color: 'white', size: 18 }"
        :text="creating ? 'Starting…' : 'New session'"
        :class-list="newSessionClass"
        :loading="creating"
        @click="emit('new-session')"
      />
      <AppText
        v-if="dailyLimitReached"
        size="12"
        color="neutral-400"
        class-list="mt-2 text-center"
      >
        Daily session limit reached — come back tomorrow.
      </AppText>
    </div>

    <!-- Search -->
    <div class="px-3 pt-3 shrink-0">
      <FormInput
        id="chat-session-search"
        :model-value="search"
        placeholder="Search sessions"
        icon="SearchNormal"
        rounded="lg"
        :icon-config="{ color: 'var(--color-text-subtle)', size: 16 }"
        class-list="h-10 text-[14px] ps-10"
        @update:model-value="emit('update:search', String($event ?? ''))"
      />
    </div>

    <!-- Session list -->
    <div class="px-2.5 py-2 space-y-0.5 overflow-y-auto flex-1 min-h-0">
      <UiEmpty v-if="!visibleCount" class="border-0 px-2 py-8">
        <UiEmptyMedia variant="icon">
          <AppIconsax name="Messages" color="var(--color-text-subtle)" :size="22" />
        </UiEmptyMedia>
        <UiEmptyTitle class="text-[14px]">
          {{ search ? 'No matches' : 'No sessions yet' }}
        </UiEmptyTitle>
        <UiEmptyDescription class="text-[13px]">
          {{ search ? 'Try a different search term.' : 'Start one to begin practising.' }}
        </UiEmptyDescription>
      </UiEmpty>

      <template v-else>
        <template v-if="todayList.length">
          <AppText
            size="12"
            weight="semibold"
            color="neutral-400"
            uppercase
            class-list="px-2 py-1.5 tracking-[0.14em]"
          >
            Today
          </AppText>
          <PagesDashboardChatSessionItem
            v-for="s in todayList"
            :key="s.id"
            :session="s"
            @click="emit('open-session', s.id)"
          />
        </template>

        <template v-if="earlierList.length">
          <AppText
            size="12"
            weight="semibold"
            color="neutral-400"
            uppercase
            class-list="px-2 py-1.5 mt-2 tracking-[0.14em]"
          >
            Earlier
          </AppText>
          <PagesDashboardChatSessionItem
            v-for="s in earlierList"
            :key="s.id"
            :session="s"
            @click="emit('open-session', s.id)"
          />
        </template>
      </template>
    </div>
  </div>
</template>
