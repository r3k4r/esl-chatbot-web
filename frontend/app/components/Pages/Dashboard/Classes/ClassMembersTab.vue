<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ClassMember } from '~/common/types/class-types'

const props = defineProps<{
  classId: string
  members: ClassMember[]
  isTutorOrAdmin: boolean
  isAdmin: boolean
  currentUserId: string
}>()

const emit = defineEmits<{
  removed: [userId: string]
  roleChanged: [payload: { userId: string; role: 'STUDENT' | 'TUTOR' }]
}>()

const { removeMember, setMemberRole } = useClasses()
const removingId = ref<string | null>(null)
const roleChangingId = ref<string | null>(null)
const confirmUserId = ref<string | null>(null)

const tutors = computed(() => props.members.filter(m => m.role === 'TUTOR'))
const students = computed(() => props.members.filter(m => m.role === 'STUDENT'))

// A row is "busy" while its own role change or removal is in flight.
function isBusy(userId: string) { return removingId.value === userId || roleChangingId.value === userId }

// When the user acts on their own membership it's a "leave", not a "remove".
const isSelfLeave = computed(() => confirmUserId.value === props.currentUserId)

function confirmRemove(userId: string) { confirmUserId.value = userId }

async function doRemove() {
  if (!confirmUserId.value) return
  const userId = confirmUserId.value
  confirmUserId.value = null
  removingId.value = userId
  const res = await removeMember(props.classId, userId)
  removingId.value = null
  if (!res.success) {
    // Surfaces the backend's inline messages (e.g. 409 "Cannot remove the last tutor").
    toast.error(res.message || 'Could not remove member')
    return
  }
  const isSelf = userId === props.currentUserId
  toast.success(isSelf ? 'You left the class.' : 'Member removed.')
  emit('removed', userId)
}

async function setRole(m: ClassMember, role: 'STUDENT' | 'TUTOR') {
  roleChangingId.value = m.user.id
  const res = await setMemberRole(props.classId, m.user.id, role)
  roleChangingId.value = null
  if (!res.success) {
    // e.g. 409 "Cannot demote the last tutor of a class"
    toast.error(res.message || 'Could not change role')
    return
  }
  const name = m.user.displayName || m.user.username
  toast.success(role === 'TUTOR' ? `${name} is now a tutor.` : `${name} is now a student.`)
  emit('roleChanged', { userId: m.user.id, role })
}
</script>

<template>
  <div class="space-y-6">

    <!-- Confirm remove / leave dialog -->
    <UiDialog :open="!!confirmUserId" @update:open="v => { if (!v) confirmUserId = null }">
      <UiDialogContent>
        <UiDialogHeader>
          <UiDialogTitle>{{ isSelfLeave ? 'Leave class?' : 'Remove member?' }}</UiDialogTitle>
          <UiDialogDescription>
            {{ isSelfLeave
              ? 'You will be removed from this class immediately and lose access to its sessions and announcements. You can rejoin later with the class code.'
              : 'This will remove them from the class immediately. They can rejoin with the class code.' }}
          </UiDialogDescription>
        </UiDialogHeader>
        <UiDialogFooter>
          <AppButton variant="secondary" size="36" radius="8" text="Cancel" @click="confirmUserId = null" />
          <AppButton variant="primary" size="36" radius="8" :text="isSelfLeave ? 'Leave class' : 'Remove'" :icon-config="{ color: 'white' }" @click="doRemove" />
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>

    <!-- Tutors & Admins -->
    <div v-if="tutors.length">
      <AppText size="10" weight="semibold" :uppercase="true" class-list="tracking-[0.18em] block mb-3" :style="`color:var(--text-subtle)`">
        Tutors ({{ tutors.length }})
      </AppText>
      <div class="space-y-0.5">
        <PagesDashboardClassesClassMemberRow
          v-for="m in tutors" :key="m.id"
          :member="m" :is-tutor-or-admin="isTutorOrAdmin" :is-admin="isAdmin"
          :current-user-id="currentUserId" :tutor-count="tutors.length" :busy="isBusy(m.user.id)"
          @change-role="(role) => setRole(m, role)" @remove="confirmRemove(m.user.id)"
        />
      </div>
    </div>

    <!-- Students -->
    <div v-if="students.length">
      <AppText size="10" weight="semibold" :uppercase="true" class-list="tracking-[0.18em] block mb-3" :style="`color:var(--text-subtle)`">
        Students ({{ students.length }})
      </AppText>
      <div class="space-y-0.5">
        <PagesDashboardClassesClassMemberRow
          v-for="m in students" :key="m.id"
          :member="m" :is-tutor-or-admin="isTutorOrAdmin" :is-admin="isAdmin"
          :current-user-id="currentUserId" :tutor-count="tutors.length" :busy="isBusy(m.user.id)"
          @change-role="(role) => setRole(m, role)" @remove="confirmRemove(m.user.id)"
        />
      </div>
    </div>

    <div v-if="!members.length" class="text-center py-10">
      <AppIconsax name="People" color="var(--color-text-subtle)" :size="36" />
      <AppText size="14" class-list="block mt-2" :style="`color:var(--text-muted)`">No members yet</AppText>
    </div>

  </div>
</template>
