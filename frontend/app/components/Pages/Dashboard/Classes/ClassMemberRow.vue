<script setup lang="ts">
import type { ClassMember } from '~/common/types/class-types'
import AppLink from '~/components/App/Link.vue'

// One person in the class People list. `to` turns the row into a link (a teacher opening
// a student's progress page); the default slot holds extra columns (that student's progress).
const props = defineProps<{
  member: ClassMember
  isTutorOrAdmin: boolean
  isAdmin: boolean
  currentUserId: string
  tutorCount: number
  busy: boolean
  to?: string
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
const initials = computed(() => displayName.value.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())
</script>

<template>
  <div class="flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors duration-150 hover:bg-surface-raised">
    <component :is="to ? AppLink : 'div'" :to="to"
      class="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40">
      <UiAvatar class="size-10 shrink-0">
        <UiAvatarImage v-if="member.user.avatarUrl" :src="member.user.avatarUrl" :alt="displayName" />
        <UiAvatarFallback class="text-[13px] font-semibold"
          :class="isTutor ? 'bg-brand-primary/15 text-brand-ink dark:text-brand-primary' : 'bg-surface-well text-text-muted'">
          {{ initials }}
        </UiAvatarFallback>
      </UiAvatar>

      <div class="min-w-0 sm:w-52 sm:shrink-0">
        <AppText size="14" weight="semibold" class-list="truncate">
          {{ displayName }}<span v-if="isMe" class="ms-1.5 font-normal text-text-subtle">(you)</span>
        </AppText>
        <AppText size="13" color="neutral-400" class-list="truncate">@{{ member.user.username }}</AppText>
      </div>

      <slot />
    </component>

    <!-- Row actions (3-dot menu) — never hover-only, per the design rules -->
    <UiDropdownMenu v-if="hasMenu">
      <UiDropdownMenuTrigger as-child>
        <AppButton :aria-label="`Actions for ${displayName}`" variant="ghost" size="32" radius="8" aspect="square"
          icon="More" :icon-config="{ color: 'var(--color-text-muted)', size: 18 }" :loading="busy" />
      </UiDropdownMenuTrigger>
      <UiDropdownMenuContent align="end" class="w-48">
        <UiDropdownMenuItem v-if="canPromote" class="gap-2.5 cursor-pointer text-[14px]" @select="emit('changeRole', 'TUTOR')">
          <AppIconsax name="Teacher" color="currentColor" :size="16" />
          Make teacher
        </UiDropdownMenuItem>
        <UiDropdownMenuItem v-if="canDemote" class="gap-2.5 cursor-pointer text-[14px]" @select="emit('changeRole', 'STUDENT')">
          <AppIconsax name="Profile" color="currentColor" :size="16" />
          Make student
        </UiDropdownMenuItem>

        <UiDropdownMenuSeparator v-if="(canPromote || canDemote) && (canRemoveOther || canLeave)" />

        <UiDropdownMenuItem v-if="canRemoveOther" variant="destructive" class="gap-2.5 cursor-pointer text-[14px]" @select="emit('remove')">
          <AppIconsax name="Trash" color="currentColor" :size="16" />
          Remove from class
        </UiDropdownMenuItem>
        <UiDropdownMenuItem v-else-if="canLeave" variant="destructive" class="gap-2.5 cursor-pointer text-[14px]" @select="emit('remove')">
          <AppIconsax name="Logout" color="currentColor" :size="16" />
          Leave class
        </UiDropdownMenuItem>
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  </div>
</template>
