<script setup lang="ts">
import { useNotifications } from '~/composables/useNotifications'
import { notificationRoute } from '~/common/data/notification-routes'
import type { Notification } from '~/common/model/notification'

const {
  notifications, unreadCount, loading,
  fetchNotifications, markAllRead, markOneRead,
  connectSocket, disconnectSocket,
} = useNotifications()

const open = ref(false)
const marking = ref(false)

onMounted(async () => {
  connectSocket()
  await fetchNotifications()
})

onUnmounted(() => {
  disconnectSocket()
})

async function onOpen() {
  open.value = true
  await fetchNotifications()
}

function onClose() {
  open.value = false
}

async function onMarkAllRead() {
  marking.value = true
  await markAllRead()
  marking.value = false
}

function onSelect(n: Notification) {
  open.value = false
  markOneRead(n.id)
  navigateTo(notificationRoute(n))
}
</script>

<template>
  <UiDropdownMenu :open="open" @update:open="v => v ? onOpen() : onClose()">
    <UiDropdownMenuTrigger as-child>
      <button
        class="header-circle-btn data-[state=open]:border-brand-primary data-[state=open]:bg-brand-primary data-[state=open]:text-white"
        aria-label="Notifications"
      >
        <AppIconsax name="Notification" color="currentColor" :size="18" />
        <span
          v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 rounded-full flex items-center justify-center text-[10px] font-bold font-mono text-white bg-brand-primary ring-2 ring-surface-card"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </button>
    </UiDropdownMenuTrigger>

    <UiDropdownMenuContent align="end" class="w-80 p-0 overflow-hidden" :side-offset="8">
      <LayoutsDashboardNotificationPanel
        :notifications="notifications"
        :loading="loading"
        :marking="marking"
        @close="onClose"
        @mark-all-read="onMarkAllRead"
        @select="onSelect"
      />
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>
