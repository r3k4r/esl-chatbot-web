<script setup lang="ts">
import type { AdminClassItem } from '~/common/types/class-types'

defineProps<{ cls: AdminClassItem }>()
defineEmits<{
  open: [id: string]
  edit: [id: string]
  delete: [id: string]
}>()

function intervalLabel(sec: number | null) {
  if (!sec) return 'Permanent'
  if (sec === 86400) return 'Daily'
  if (sec === 604800) return 'Weekly'
  if (sec === 2592000) return 'Monthly'
  if (sec === 31536000) return 'Yearly'
  return `${sec}s`
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}
</script>

<template>
  <div class="dash-card flex flex-col gap-0 transition-all duration-200 hover:shadow-card">
    <!-- Header -->
    <div class="p-5 flex items-start gap-3">
      <div class="size-10 rounded-xl flex items-center justify-center shrink-0" style="background:var(--surface-well); border:1px solid var(--border-inner)">
        <AppIconsax name="Buildings2" color="var(--color-text-muted)" :size="16" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <AppText size="14" weight="semibold" color="black" class-list="truncate block leading-snug" :style="`color:var(--text-heading)`">{{ cls.className }}</AppText>
          <div class="flex items-center gap-1.5 shrink-0">
            <span v-if="cls.archived" class="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full font-poppins" style="background:var(--surface-well);color:var(--text-muted)">Archived</span>
            <span
              class="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full font-poppins"
              :style="cls.classStatus === 'ACTIVE'
                ? 'background:var(--status-active-bg);color:var(--status-active-text)'
                : 'background:var(--status-expired-bg);color:var(--status-expired-text)'"
            >
              {{ cls.classStatus === 'ACTIVE' ? 'Active' : 'Inactive' }}
            </span>
          </div>
        </div>
        <AppText v-if="cls.classCategory" size="12" color="neutral-400" class-list="block mt-0.5 truncate" :style="`color:var(--text-muted)`">{{ cls.classCategory }}</AppText>
      </div>
    </div>

    <!-- Divider -->
    <div style="height:1px;background:var(--border-inner);margin:0 1.25rem" />

    <!-- Stats -->
    <div class="px-5 py-4 grid grid-cols-2 gap-4">
      <div>
        <AppText size="10" weight="semibold" color="neutral-400" :uppercase="true" class-list="tracking-[0.14em] block mb-1" :style="`color:var(--text-subtle)`">Members</AppText>
        <div class="flex items-center gap-1.5">
          <AppIconsax name="People" color="var(--color-text-muted)" :size="13" />
          <AppText size="14" weight="semibold" color="black" :style="`color:var(--text-heading)`">{{ cls.memberCount }}</AppText>
        </div>
      </div>
      <div>
        <AppText size="10" weight="semibold" color="neutral-400" :uppercase="true" class-list="tracking-[0.14em] block mb-1" :style="`color:var(--text-subtle)`">Refresh</AppText>
        <div class="flex items-center gap-1.5">
          <AppIconsax name="Refresh2" color="var(--color-text-muted)" :size="13" />
          <AppText size="13" weight="semibold" color="black" :style="`color:var(--text-heading)`">{{ intervalLabel(cls.classCodeRefreshIntervalSeconds) }}</AppText>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div style="height:1px;background:var(--border-inner);margin:0 1.25rem" />

    <!-- Code row -->
    <div class="px-5 py-3 flex items-center gap-2">
      <AppIconsax name="Key" color="var(--color-text-subtle)" :size="12" />
      <AppText size="12" color="neutral-400" class-list="font-mono tracking-widest flex-1" :style="`color:var(--text-muted)`">{{ cls.classCode }}</AppText>
      <span
        v-if="cls.classCodeBlocked"
        class="text-[10px] font-semibold px-2 py-0.5 rounded-full font-poppins"
        style="background:var(--status-blocked-bg);color:var(--status-blocked-text)"
      >Blocked</span>
      <span
        v-else-if="isExpired(cls.classCodeExpiresAt)"
        class="text-[10px] font-semibold px-2 py-0.5 rounded-full font-poppins"
        style="background:var(--status-expired-bg);color:var(--status-expired-text)"
      >Expired</span>
    </div>

    <!-- Divider -->
    <div style="height:1px;background:var(--border-inner);margin:0 1.25rem" />

    <!-- Actions footer -->
    <div class="px-4 py-3 flex items-center gap-2">
      <AppButton
        variant="primary"
        size="32"
        radius="8"
        icon="Eye"
        :icon-config="{ color: 'white', size: 13 }"
        text="View details"
        class="flex-1"
        @click="$emit('open', cls.id)"
      />
      <AppButton aria-label="Edit class"
        v-if="!cls.archived"
        variant="secondary"
        size="32"
        radius="8"
        icon="Edit2"
        :icon-config="{ color: 'currentColor', size: 13 }"
        @click="$emit('edit', cls.id)"
      />
      <AppButton aria-label="Delete class"
        variant="secondary"
        size="32"
        radius="8"
        icon="Trash"
        :icon-config="{ color: '#ef4444', size: 13 }"
        @click="$emit('delete', cls.id)"
      />
    </div>
  </div>
</template>
