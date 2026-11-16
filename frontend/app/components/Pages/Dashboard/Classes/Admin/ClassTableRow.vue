<script setup lang="ts">
import type { AdminClassItem } from '~/common/types/class-types'

defineProps<{ cls: AdminClassItem }>()
defineEmits<{
  open: [id: string]
  edit: [id: string]
  delete: [id: string]
}>()

function intervalLabel(sec: number | null) {
  if (!sec) return '—'
  if (sec === 86400) return 'Daily'
  if (sec === 604800) return 'Weekly'
  if (sec === 2592000) return 'Monthly'
  if (sec === 31536000) return 'Yearly'
  return `${sec}s`
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}
</script>

<template>
  <tr style="border-bottom:1px solid var(--border-inner)" class="transition-colors" :style="`background:transparent`">
    <!-- Class name -->
    <td class="px-4 py-3.5">
      <div class="flex items-center gap-3">
        <div class="size-8 rounded-lg flex items-center justify-center shrink-0" style="background:var(--surface-well);border:1px solid var(--border-inner)">
          <AppIconsax name="Buildings2" color="var(--color-text-muted)" :size="13" />
        </div>
        <div>
          <AppText size="13" weight="semibold" color="black" class-list="block" :style="`color:var(--text-heading)`">{{ cls.className }}</AppText>
          <AppText v-if="cls.classCategory" size="11" color="neutral-400" :style="`color:var(--text-muted)`">{{ cls.classCategory }}</AppText>
        </div>
      </div>
    </td>

    <!-- Code -->
    <td class="px-4 py-3.5">
      <div class="flex items-center gap-2">
        <AppText size="12" color="black" class-list="font-mono tracking-wider" :style="`color:var(--text-body)`">{{ cls.classCode }}</AppText>
        <span
          v-if="cls.classCodeBlocked"
          class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full font-poppins"
          style="background:var(--status-blocked-bg);color:var(--status-blocked-text)"
        >Blocked</span>
        <span
          v-else-if="isExpired(cls.classCodeExpiresAt)"
          class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full font-poppins"
          style="background:var(--status-expired-bg);color:var(--status-expired-text)"
        >Expired</span>
      </div>
    </td>

    <!-- Status -->
    <td class="px-4 py-3.5">
      <span
        class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold font-poppins"
        :style="cls.classStatus === 'ACTIVE'
          ? 'background:var(--status-active-bg);color:var(--status-active-text)'
          : 'background:var(--status-expired-bg);color:var(--status-expired-text)'"
      >
        <span class="size-1.5 rounded-full" :style="cls.classStatus === 'ACTIVE' ? 'background:var(--status-active-text)' : 'background:var(--status-inactive-text)'" />
        {{ cls.classStatus === 'ACTIVE' ? 'Active' : 'Inactive' }}
      </span>
    </td>

    <!-- Members -->
    <td class="px-4 py-3.5">
      <div class="flex items-center gap-1.5">
        <AppIconsax name="People" color="var(--color-text-subtle)" :size="12" />
        <AppText size="13" color="black" :style="`color:var(--text-body)`">{{ cls.memberCount }}</AppText>
      </div>
    </td>

    <!-- Refresh -->
    <td class="px-4 py-3.5">
      <AppText size="12" color="neutral-400" :style="`color:var(--text-muted)`">{{ intervalLabel(cls.classCodeRefreshIntervalSeconds) }}</AppText>
    </td>

    <!-- Created -->
    <td class="px-4 py-3.5">
      <AppText size="12" color="neutral-400" :style="`color:var(--text-muted)`">{{ formatDate(cls.createdAt) }}</AppText>
    </td>

    <!-- Actions — always visible -->
    <td class="px-4 py-3.5">
      <div class="flex items-center gap-1.5">
        <AppButton aria-label="View class"
          variant="primary"
          size="28"
          radius="8"
          icon="Eye"
          :icon-config="{ color: 'white', size: 13 }"
          @click="$emit('open', cls.id)"
        />
        <AppButton aria-label="Edit class"
          variant="secondary"
          size="28"
          radius="8"
          icon="Edit2"
          :icon-config="{ color: 'currentColor', size: 13 }"
          @click="$emit('edit', cls.id)"
        />
        <AppButton aria-label="Delete class"
          variant="secondary"
          size="28"
          radius="8"
          icon="Trash"
          :icon-config="{ color: '#ef4444', size: 13 }"
          @click="$emit('delete', cls.id)"
        />
      </div>
    </td>
  </tr>
</template>
