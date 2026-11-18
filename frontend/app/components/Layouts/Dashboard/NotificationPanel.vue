<script setup lang="ts">
import type { Notification, NotificationType } from '~/common/model/notification'

const props = defineProps<{
  notifications: Notification[]
  loading?: boolean
  marking?: boolean
}>()

const emit = defineEmits<{
  close: []
  markAllRead: []
  select: [n: Notification]
}>()

const TYPE_ICON: Record<NotificationType, string> = {
  STREAK_MILESTONE: 'Flash',
  GOAL_COMPLETED: 'TickCircle',
  GOAL_ASSIGNED: 'Flag',
  VOCABULARY_ASSIGNED: 'Book1',
  CLASS_ANNOUNCEMENT: 'Notification',
  TASK_ASSIGNED: 'TaskSquare',
  TASK_SUBMITTED: 'DirectboxReceive',
  ANNOUNCEMENT_COMMENT: 'MessageText',
}

const TYPE_COLOR: Record<NotificationType, string> = {
  STREAK_MILESTONE: 'bg-amber-500/15 text-amber-500',
  GOAL_COMPLETED: 'bg-emerald-500/15 text-emerald-500',
  GOAL_ASSIGNED: 'bg-brand-primary/15 text-brand-primary',
  VOCABULARY_ASSIGNED: 'bg-violet-500/15 text-violet-500',
  CLASS_ANNOUNCEMENT: 'bg-sky-500/15 text-sky-500',
  TASK_ASSIGNED: 'bg-brand-primary/15 text-brand-primary',
  TASK_SUBMITTED: 'bg-teal-500/15 text-teal-500',
  ANNOUNCEMENT_COMMENT: 'bg-sky-500/15 text-sky-500',
}

const hasUnread = computed(() => props.notifications.some(n => !n.read))

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(diff / 3_600_000)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(diff / 86_400_000)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid var(--border-inner)">
      <p class="text-[15px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
        Notifications
      </p>
      <button
        class="text-[14px] font-medium font-poppins px-2.5 py-1 rounded-lg transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        :style="hasUnread
          ? 'color:var(--color-brand-primary);background:var(--color-brand-primary)/8'
          : 'color:var(--text-subtle)'" :class="hasUnread ? 'hover:opacity-80' : ''" :disabled="!hasUnread || marking"
        @click="emit('markAllRead')">
        {{ marking ? 'Marking…' : 'Mark all read' }}
      </button>
    </div>

    <!-- Loading skeletons -->
    <div v-if="loading" class="p-3 space-y-2">
      <UiSkeleton v-for="n in 3" :key="n" class="h-15 rounded-xl" />
    </div>

    <!-- Empty state -->
    <div v-else-if="!notifications.length" class="flex flex-col items-center justify-center py-10 px-4 gap-2">
      <div class="size-12 rounded-2xl flex items-center justify-center" style="background:var(--surface-raised)">
        <AppIconsax name="Notification" color="var(--color-text-subtle)" :size="22" />
      </div>
      <p class="text-[15px] font-semibold font-poppins" :style="`color:var(--text-heading)`">All caught up</p>
      <p class="text-[14px] font-poppins text-center" :style="`color:var(--text-muted)`">No notifications yet.</p>
    </div>

    <!-- Notification list -->
    <div v-else class="max-h-90 overflow-y-auto">
      <div v-for="n in notifications" :key="n.id"
        role="button"
        class="flex items-start gap-3 px-4 py-3.5 transition-colors duration-150 cursor-pointer"
        :style="!n.read ? 'background:var(--surface-raised)' : ''"
        style="border-bottom:1px solid var(--border-inner)"
        :onmouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--surface-well)'"
        :onmouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = !n.read ? 'var(--surface-raised)' : ''"
        @click="emit('select', n)">
        <!-- Type icon -->
        <div :class="['size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', TYPE_COLOR[n.type]]">
          <AppIconsax :name="(TYPE_ICON[n.type]) as any" color="currentColor" :size="16" />
        </div>

        <!-- Message + time -->
        <div class="flex-1 min-w-0">
          <p class="text-[14px] font-medium font-poppins leading-snug" :style="`color:var(--text-heading)`">
            {{ n.message }}
          </p>
          <p class="text-[14px] font-mono mt-0.5" :style="`color:var(--text-subtle)`">
            {{ relativeTime(n.createdAt) }}
          </p>
        </div>

        <!-- Unread dot -->
        <span v-if="!n.read" class="size-2 rounded-full bg-brand-primary shrink-0 mt-2" />
      </div>
    </div>
  </div>
</template>
