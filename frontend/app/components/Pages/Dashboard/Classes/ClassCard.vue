<script setup lang="ts">
import { calendarDays } from '~/lib/progress'
import type { ClassItem } from '~/common/types/class-types'

const props = defineProps<{
  cls: ClassItem
  copying: boolean
}>()

const emit = defineEmits<{
  open: [id: string]
  copy: [code: string]
  refresh: [id: string]
}>()

const isExpired = computed(() => {
  if (!props.cls.classCodeExpiresAt) return false
  return new Date(props.cls.classCodeExpiresAt) < new Date()
})

const expiryLabel = computed(() => {
  if (!props.cls.classCodeExpiresAt) return 'No expiry'
  if (isExpired.value) return 'Code expired'
  const diff = Math.floor((new Date(props.cls.classCodeExpiresAt).getTime() - Date.now()) / 1000 / 60)
  if (diff < 60) return `Code changes in ${diff}m`
  if (diff < 1440) return `Code changes in ${Math.floor(diff / 60)}h`
  return `Code changes in ${calendarDays(new Date(), props.cls.classCodeExpiresAt)}d`
})

// Archived classes are read-only — hide the code actions and show a badge instead.
const isArchived = computed(() => props.cls.archived)
const isTutorOrAdmin = computed(() => props.cls.myRole === 'TUTOR' || props.cls.myRole === 'ADMIN')

const roleStyle = computed(() => {
  if (props.cls.myRole === 'TUTOR') return 'background:rgba(245,158,11,0.1);color:var(--color-brand-primary)'
  if (props.cls.myRole === 'ADMIN') return 'background:rgba(239,68,68,0.1);color:#ef4444'
  return 'background:var(--surface-well);color:var(--text-muted)'
})

const roleLabel = computed(() => {
  if (props.cls.myRole === 'TUTOR') return 'Teacher'
  if (props.cls.myRole === 'ADMIN') return 'Admin'
  return 'Student'
})

const codeStatusStyle = computed(() => {
  if (props.cls.classCodeBlocked) return 'color:var(--status-blocked-text)'
  if (isExpired.value) return 'color:var(--status-expired-text)'
  return 'color:var(--text-subtle)'
})

const codeStatusIcon = computed(() => {
  if (props.cls.classCodeBlocked) return 'Lock'
  if (isExpired.value) return 'CloseCircle'
  return 'Clock'
})
</script>

<template>
  <div
    class="dash-card flex flex-col cursor-pointer transition-all duration-200 hover:border-color-primary"
    @click="emit('open', cls.id)"
  >
    <!-- Card header -->
    <div class="p-5 flex items-start gap-3">
      <div class="size-11 rounded-xl flex items-center justify-center shrink-0" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2)">
        <AppIconsax name="BookSaved" color="var(--color-brand-primary)" :size="18" />
      </div>
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-2">
          <AppText size="14" weight="semibold" color="black" class-list="truncate block leading-snug" :style="`color:var(--text-heading)`">{{ cls.className }}</AppText>
          <div class="flex items-center gap-1.5 shrink-0">
            <span v-if="isArchived" class="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full font-poppins" style="background:var(--surface-well);color:var(--text-muted)">
              Archived
            </span>
            <span class="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full font-poppins" :style="roleStyle">
              {{ roleLabel }}
            </span>
          </div>
        </div>
        <AppText v-if="cls.classCategory" size="12" color="neutral-400" class-list="block mt-0.5 truncate" :style="`color:var(--text-muted)`">{{ cls.classCategory }}</AppText>
      </div>
    </div>

    <!-- Divider -->
    <div style="height:1px;background:var(--border-inner);margin:0 1.25rem" />

    <!-- Stats row -->
    <div class="px-5 py-3 flex items-center gap-5">
      <div class="flex items-center gap-1.5">
        <AppIconsax name="People" color="var(--color-text-subtle)" :size="13" />
        <AppText size="12" color="neutral-400" :style="`color:var(--text-muted)`">{{ cls.memberCount }} member{{ cls.memberCount !== 1 ? 's' : '' }}</AppText>
      </div>
      <div class="flex items-center gap-1.5">
        <AppIconsax name="Calendar" color="var(--color-text-subtle)" :size="13" />
        <AppText size="12" color="neutral-400" :style="`color:var(--text-muted)`">
          {{ new Date(cls.joinedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) }}
        </AppText>
      </div>
      <!-- The join code's lifetime only matters to whoever shares it -->
      <div v-if="isTutorOrAdmin" class="flex items-center gap-1.5 ml-auto">
        <AppIconsax :name="codeStatusIcon" :size="12" :style="codeStatusStyle" />
        <AppText size="12" color="neutral-400" :style="codeStatusStyle">
          {{ cls.classCodeBlocked ? 'Blocked' : expiryLabel }}
        </AppText>
      </div>
    </div>

    <!-- Code row (tutor/admin only, hidden when archived — read-only) -->
    <template v-if="isTutorOrAdmin && !isArchived">
      <div style="height:1px;background:var(--border-inner);margin:0 1.25rem" />
      <div class="px-5 py-3 flex items-center gap-2" @click.stop>
        <div class="flex-1 px-3 py-2 rounded-xl flex items-center" style="background:var(--surface-raised);border:1px solid var(--border-inner)">
          <AppText size="13" weight="semibold" font-family="mono" class-list="tracking-[0.25em] select-all flex-1" :style="`color:var(--text-heading)`">
            {{ cls.classCode }}
          </AppText>
        </div>
        <AppButton aria-label="Copy class code"
          variant="secondary"
          size="32"
          radius="8"
          :icon="copying ? 'TickCircle' : 'Copy'"
          :icon-config="{ color: copying ? 'var(--color-brand-primary)' : 'currentColor', size: 14 }"
          @click.stop="emit('copy', cls.classCode)"
        />
        <AppButton aria-label="Generate a new class code"
          variant="secondary"
          size="32"
          radius="8"
          icon="Refresh2"
          :icon-config="{ color: 'currentColor', size: 14 }"
          @click.stop="emit('refresh', cls.id)"
        />
      </div>
    </template>
    <div v-else class="h-3" />
  </div>
</template>
