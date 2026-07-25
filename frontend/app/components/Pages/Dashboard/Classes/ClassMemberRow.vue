<script setup lang="ts">
import type { ClassMember } from '~/common/types/class-types'

const props = defineProps<{
  member: ClassMember
  isTutorOrAdmin: boolean
  isAdmin: boolean
  currentUserId: string
  tutorCount: number
  busy: boolean
}>()

const emit = defineEmits<{
  changeRole: [role: 'STUDENT' | 'TUTOR']
  remove: []
}>()

const isMe = computed(() => props.member.user.id === props.currentUserId)
const isTutor = computed(() => props.member.role === 'TUTOR')
// A class must always keep at least one tutor — the last tutor can't be demoted or removed.
const isLastTutor = computed(() => isTutor.value && props.tutorCount <= 1)

// Role actions: any tutor of the class or an admin can promote/demote OTHER members.
const canPromote = computed(() => props.isTutorOrAdmin && !isMe.value && props.member.role === 'STUDENT')
const canDemote = computed(() => props.isTutorOrAdmin && !isMe.value && isTutor.value && !isLastTutor.value)

// Removal: tutors/admins can remove students; only an admin can remove another tutor
// (never the last one). Anyone can leave themselves.
const canRemoveOther = computed(() =>
  !isMe.value && (
    (props.member.role === 'STUDENT' && props.isTutorOrAdmin) ||
    (isTutor.value && props.isAdmin && !isLastTutor.value)
  ),
)
const canLeave = computed(() => isMe.value)

const hasMenu = computed(() => canPromote.value || canDemote.value || canRemoveOther.value || canLeave.value)

const displayName = computed(() => props.member.user.displayName || props.member.user.username)
function avatarInitial(name: string) { return name.charAt(0).toUpperCase() }
</script>

<template>
  <div
    class="flex items-center gap-3 p-2.5 rounded-xl"
    :onmouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)'"
    :onmouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = ''"
  >
    <UiAvatar class="size-10 shrink-0">
      <UiAvatarImage v-if="member.user.avatarUrl" :src="member.user.avatarUrl" :alt="displayName" />
      <UiAvatarFallback
        class="text-[13px] font-semibold font-poppins"
        :style="isTutor
          ? 'background:rgba(245,158,11,0.15);color:var(--color-brand-primary)'
          : 'background:var(--surface-well);color:var(--text-muted)'"
      >
        {{ avatarInitial(displayName) }}
      </UiAvatarFallback>
    </UiAvatar>

    <div class="flex-1 min-w-0">
      <AppText size="14" weight="medium" class-list="truncate block" :style="`color:var(--text-heading)`">
        {{ displayName }}<span v-if="isMe" class="ml-1.5 text-[12px] font-normal" :style="`color:var(--text-subtle)`">(you)</span>
      </AppText>
      <AppText size="12" :style="`color:var(--text-muted)`">@{{ member.user.username }}</AppText>
    </div>

    <span
      class="text-[11px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-md font-poppins shrink-0"
      :class="isTutor ? 'bg-brand-primary/10 text-brand-primary' : ''"
      :style="isTutor ? '' : 'background:var(--surface-well);color:var(--text-muted)'"
    >{{ member.role }}</span>

    <!-- Row actions (3-dot menu) — never hover-only, per the design rules -->
    <UiDropdownMenu v-if="hasMenu">
      <UiDropdownMenuTrigger as-child>
        <AppButton
          variant="secondary" size="28" radius="8" aspect="square" icon="More"
          :icon-config="{ color: 'currentColor', size: 16 }" :loading="busy"
        />
      </UiDropdownMenuTrigger>
      <UiDropdownMenuContent align="end" :style="`background:var(--surface-card);border-color:var(--border-card)`">
        <UiDropdownMenuItem
          v-if="canPromote" class="cursor-pointer font-poppins text-[13px]" :style="`color:var(--text-body)`"
          @click="emit('changeRole', 'TUTOR')"
        >
          <AppIconsax name="Teacher" color="var(--color-text-muted)" :size="14" class="mr-2" />
          Make tutor
        </UiDropdownMenuItem>
        <UiDropdownMenuItem
          v-if="canDemote" class="cursor-pointer font-poppins text-[13px]" :style="`color:var(--text-body)`"
          @click="emit('changeRole', 'STUDENT')"
        >
          <AppIconsax name="Profile" color="var(--color-text-muted)" :size="14" class="mr-2" />
          Make student
        </UiDropdownMenuItem>

        <template v-if="(canPromote || canDemote) && (canRemoveOther || canLeave)">
          <UiDropdownMenuSeparator />
        </template>

        <UiDropdownMenuItem
          v-if="canRemoveOther" class="cursor-pointer font-poppins text-[13px] text-red-500 focus:text-red-500"
          @click="emit('remove')"
        >
          <AppIconsax name="Trash" color="rgb(239,68,68)" :size="14" class="mr-2" />
          Remove from class
        </UiDropdownMenuItem>
        <UiDropdownMenuItem
          v-else-if="canLeave" class="cursor-pointer font-poppins text-[13px] text-red-500 focus:text-red-500"
          @click="emit('remove')"
        >
          <AppIconsax name="Logout" color="rgb(239,68,68)" :size="14" class="mr-2" />
          Leave class
        </UiDropdownMenuItem>
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  </div>
</template>
