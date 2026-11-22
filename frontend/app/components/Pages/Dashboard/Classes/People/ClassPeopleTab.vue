<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ClassMember, ClassStudentSummary } from '~/common/types/class-types'

// Everyone in the class: teachers first, then students. Teachers (and admins) also see each
// student's progress and open their detail page; students just see who is in the class.
const props = defineProps<{
  classId: string
  members: ClassMember[]
  /** Tutor of this class or admin: sees progress (also in an archived class) */
  canSeeProgress: boolean
  /** Can change roles / remove (false in an archived class) */
  canManage: boolean
  isAdmin: boolean
  currentUserId: string
}>()

const emit = defineEmits<{
  removed: [userId: string]
  roleChanged: [payload: { userId: string; role: 'STUDENT' | 'TUTOR' }]
}>()

const { removeMember, setMemberRole, getClassStudents } = useClasses()

const teachers = computed(() => props.members.filter(m => m.role === 'TUTOR'))
const students = computed(() => props.members.filter(m => m.role === 'STUDENT'))

// ── Progress (teachers only) ──────────────────────────────────────────────────
const progress = ref<Map<string, ClassStudentSummary>>(new Map())
const loadingProgress = ref(false)

async function loadProgress() {
  if (!props.canSeeProgress) return
  loadingProgress.value = true
  const res = await getClassStudents(props.classId)
  loadingProgress.value = false
  if (!res.success) { toast.error(res.message || 'Could not load student progress'); return }
  const rows = ((res.data as any)?.data ?? []) as ClassStudentSummary[]
  progress.value = new Map(rows.map(r => [r.userId, r]))
}
watch(() => props.classId, loadProgress, { immediate: true })

const studentLink = (userId: string) =>
  props.canSeeProgress ? `/dashboard/classes/${props.classId}/students/${userId}` : undefined

// ── Role changes + removal ────────────────────────────────────────────────────
const busyId = ref<string | null>(null)
// Kept apart from the dialog's open state: it closes before its action's click runs.
const confirmUserId = ref<string | null>(null)
const confirmOpen = ref(false)
const isSelfLeave = computed(() => confirmUserId.value === props.currentUserId)

function askRemove(userId: string) { confirmUserId.value = userId; confirmOpen.value = true }

async function doRemove() {
  const userId = confirmUserId.value
  if (!userId) return
  busyId.value = userId
  const res = await removeMember(props.classId, userId)
  busyId.value = null
  // Surfaces the backend's message, e.g. 409 "Cannot remove the last tutor".
  if (!res.success) { toast.error(res.message || 'Could not remove member'); return }
  toast.success(userId === props.currentUserId ? 'You left the class.' : 'Removed from the class.')
  emit('removed', userId)
}

async function setRole(m: ClassMember, role: 'STUDENT' | 'TUTOR') {
  busyId.value = m.user.id
  const res = await setMemberRole(props.classId, m.user.id, role)
  busyId.value = null
  if (!res.success) { toast.error(res.message || 'Could not change role'); return }
  const name = m.user.displayName || m.user.username
  toast.success(role === 'TUTOR' ? `${name} is now a teacher.` : `${name} is now a student.`)
  emit('roleChanged', { userId: m.user.id, role })
  loadProgress()
}

const rowProps = (m: ClassMember) => ({
  member: m, isTutorOrAdmin: props.canManage, isAdmin: props.isAdmin && props.canManage,
  currentUserId: props.currentUserId, tutorCount: teachers.value.length, busy: busyId.value === m.user.id,
})
</script>

<template>
  <div class="space-y-8">
    <section v-if="teachers.length" aria-labelledby="people-teachers">
      <AppText id="people-teachers" size="15" weight="semibold" class-list="mb-2 px-3">
        Teachers <span class="font-normal text-text-subtle">{{ teachers.length }}</span>
      </AppText>
      <PagesDashboardClassesClassMemberRow v-for="m in teachers" :key="m.id" v-bind="rowProps(m)"
        @change-role="(role) => setRole(m, role)" @remove="askRemove(m.user.id)" />
    </section>

    <section aria-labelledby="people-students">
      <div class="mb-2 flex items-center gap-2 px-3">
        <AppText id="people-students" size="15" weight="semibold" class-list="sm:w-[16.5rem] sm:shrink-0">
          Students <span class="font-normal text-text-subtle">{{ students.length }}</span>
        </AppText>
        <!-- Column labels line up with StudentProgressCells -->
        <div v-if="canSeeProgress && students.length"
          class="hidden flex-1 grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1fr)_8rem] gap-4 pe-10 md-lg:grid">
          <AppText v-for="h in ['Level', 'Tasks', 'AI practice', 'Skills']" :key="h" size="13" color="neutral-400">{{ h }}</AppText>
        </div>
      </div>

      <AppText v-if="!students.length" size="14" color="neutral-400" class-list="px-3">
        No students yet. Share the class code so they can join.
      </AppText>

      <PagesDashboardClassesClassMemberRow v-for="m in students" :key="m.id" v-bind="rowProps(m)" :to="studentLink(m.user.id)"
        @change-role="(role) => setRole(m, role)" @remove="askRemove(m.user.id)">
        <template v-if="canSeeProgress">
          <PagesDashboardClassesPeopleStudentProgressCells v-if="progress.get(m.user.id)" :s="progress.get(m.user.id)!" />
          <UiSkeleton v-else-if="loadingProgress" class="hidden h-5 flex-1 md-lg:block" />
        </template>
      </PagesDashboardClassesClassMemberRow>
    </section>

    <UiAlertDialog v-model:open="confirmOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>{{ isSelfLeave ? 'Leave this class?' : 'Remove from class?' }}</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            {{ isSelfLeave
              ? 'You lose access to its tasks and announcements right away. You can rejoin later with the class code.'
              : 'They lose access right away and can rejoin with the class code. Their work and progress are kept.' }}
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
          <UiAlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="doRemove">
            {{ isSelfLeave ? 'Leave class' : 'Remove' }}
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
