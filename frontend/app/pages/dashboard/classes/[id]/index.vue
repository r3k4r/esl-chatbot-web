<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useAuthStore } from '~~/stores/auth'
import type { ClassDetail } from '~/common/types/class-types'
import type { SvgBasedIconName } from '~/common/types/iconsax-types'

definePageMeta({ layout: 'dashboard', requiresAuth: true })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { getClass, refreshCode, archiveClass } = useClasses()

const classId = computed(() => route.params.id as string)
const cls = ref<ClassDetail | null>(null)
const loading = ref(true)
const copying = ref(false)
const refreshing = ref(false)
const archiving = ref(false)
const archiveDialogOpen = ref(false)

const isArchived = computed(() => cls.value?.archived ?? false)


const currentUserId = computed(() => authStore.getUser?.id ?? '')
const { isAdmin } = useRole()

// `myRole` isn't always present on the getClass response, so derive the caller's
// role from the members list as the source of truth, falling back to it / global role.
const myClassRole = computed(() =>
  cls.value?.members?.find(m => m.user.id === currentUserId.value)?.role
  ?? cls.value?.myRole,
)
const isTutorOrAdmin = computed(() => myClassRole.value === 'TUTOR' || isAdmin.value)

type Tab = 'members' | 'students' | 'analytics' | 'announcements' | 'tasks'
const ALL_TABS: Tab[] = ['members', 'students', 'analytics', 'announcements', 'tasks']
function parseTab(raw: unknown): Tab | null {
  return ALL_TABS.includes(raw as Tab) ? (raw as Tab) : null
}
const activeTab = ref<Tab>(parseTab(route.query.tab) ?? 'members')

// Caller is a student in the class (drives submit UI — ADMIN is never a student)
const isStudentInClass = computed(() => myClassRole.value === 'STUDENT' && !isAdmin.value)

// `tutorOrAdmin` tabs are for tutors of the class + admins; `adminOnly` tabs only admins.
const tabs = computed((): { key: Tab; label: string; icon: SvgBasedIconName; show: boolean }[] => [
  { key: 'members', label: 'Members', icon: 'People', show: true },
  { key: 'students', label: 'Students', icon: 'Teacher', show: isTutorOrAdmin.value },
  { key: 'analytics', label: 'Analytics', icon: 'Chart21', show: isTutorOrAdmin.value },
  { key: 'tasks', label: 'Tasks', icon: 'TaskSquare', show: true },
  { key: 'announcements', label: 'Announcements', icon: 'Notification', show: true },
])

const visibleTabs = computed(() => tabs.value.filter(t => t.show))

const roleColorClass: Record<string, string> = {
  TUTOR: 'bg-brand-primary/10 text-brand-primary',
  ADMIN: 'bg-red-500/10 text-red-500',
}

const tutors = computed(() => cls.value?.members?.filter(m => m.role === 'TUTOR') ?? [])
const students = computed(() => cls.value?.members?.filter(m => m.role === 'STUDENT') ?? [])

const isExpired = computed(() =>
  cls.value?.classCodeExpiresAt ? new Date(cls.value.classCodeExpiresAt) < new Date() : false,
)

const statusConfig = computed(() => {
  if (cls.value?.classCodeBlocked) return { label: 'Blocked', icon: 'Lock' as const, style: 'color:var(--status-blocked-text)' }
  if (isExpired.value) return { label: 'Expired', icon: 'CloseCircle' as const, style: 'color:var(--status-expired-text)' }
  if (cls.value?.classCodeExpiresAt) return { label: fmtExpiry(cls.value.classCodeExpiresAt), icon: 'Clock' as const, style: 'color:var(--text-muted)' }
  return { label: 'Permanent', icon: 'Clock' as const, style: 'color:var(--text-muted)' }
})

async function load() {
  loading.value = true
  const res = await getClass(classId.value)
  loading.value = false
  if (!res.success) {
    toast.error(res.message || 'Could not load class')
    router.replace('/dashboard/classes')
    return
  }
  cls.value = res.data?.data as ClassDetail
  // After roles are known, reset to 'members' if the current tab isn't visible to this user
  if (!visibleTabs.value.some(t => t.key === activeTab.value)) {
    activeTab.value = 'members'
  }
}

async function handleCopy() {
  if (!cls.value) return
  useCopyToClipboard(cls.value.classCode)
  copying.value = true
  toast.success('Class code copied!')
  setTimeout(() => { copying.value = false }, 1500)
}

async function handleRefresh() {
  if (!cls.value || refreshing.value) return
  refreshing.value = true
  const res = await refreshCode(cls.value.id)
  refreshing.value = false
  if (!res.success) { toast.error(res.message || 'Could not rotate code'); return }
  toast.success('Class code rotated!')
  await load()
}

async function handleArchive(archived: boolean) {
  if (!cls.value || archiving.value) return
  archiving.value = true
  const res = await archiveClass(cls.value.id, archived)
  archiving.value = false
  archiveDialogOpen.value = false
  if (!res.success) { toast.error(res.message || 'Could not update class'); return }
  toast.success(archived ? 'Class archived.' : 'Class unarchived — full access restored.')
  if (res.data?.data) cls.value = res.data.data as ClassDetail
  // Archiving from the active list context: leave the page so they don't sit on a
  // now-hidden class. Unarchiving keeps them here with full access restored.
  if (archived) router.push('/dashboard/classes')
}

function handleMemberRemoved(userId: string) {
  if (!cls.value) return
  if (userId === currentUserId.value) { router.replace('/dashboard/classes'); return }
  cls.value = { ...cls.value, members: cls.value.members.filter(m => m.user.id !== userId) }
}

function handleRoleChanged({ userId, role }: { userId: string; role: 'STUDENT' | 'TUTOR' }) {
  if (!cls.value) return
  cls.value = {
    ...cls.value,
    members: cls.value.members.map(m => (m.user.id === userId ? { ...m, role } : m)),
  }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtExpiry(iso: string) {
  const d = new Date(iso)
  const diff = Math.floor((d.getTime() - Date.now()) / 1000 / 60)
  if (diff < 0) return 'Expired'
  if (diff < 60) return `Expires in ${diff}m`
  if (diff < 1440) return `Expires in ${Math.floor(diff / 60)}h`
  return `Expires ${fmtDate(iso)}`
}

// Reload when navigating to a different class (e.g. from a notification deep-link)
watch(() => route.params.id, () => { load() })

// Sync active tab when ?tab= query param changes (e.g. navigating from a notification on the same class)
watch(() => route.query.tab, (tab) => {
  const parsed = parseTab(tab)
  if (parsed && visibleTabs.value.some(t => t.key === parsed)) {
    activeTab.value = parsed
  }
})

onMounted(load)
</script>

<template>
  <div class="h-full overflow-y-auto p-5 sm:p-7">

    <!-- Back + header -->
    <div class="flex items-center gap-3 mb-6 animate-card-enter" style="--delay:0ms">
      <AppButton variant="secondary" size="36" radius="8" icon="ArrowLeft"
        :icon-config="{ color: 'currentColor', size: 14 }" @click="router.push('/dashboard/classes')" />
      <div class="flex-1 min-w-0">
        <template v-if="loading">
          <UiSkeleton class="h-5 w-48 rounded mb-1" />
          <UiSkeleton class="h-3 w-28 rounded" />
        </template>
        <template v-else-if="cls">
          <AppText size="20" weight="semibold" class-list="block truncate tracking-[-0.02em]"
            :style="`color:var(--text-heading)`">{{ cls.className }}</AppText>
          <AppText v-if="cls.classCategory" size="12" class-list="block mt-0.5" :style="`color:var(--text-muted)`">{{
            cls.classCategory }}</AppText>
        </template>
      </div>
      <template v-if="cls">
        <!-- Edit only when not archived (archived = read-only) -->
        <AppButton v-if="isTutorOrAdmin && !isArchived" variant="secondary" size="36" radius="8" icon="Edit2"
          :icon-config="{ color: 'currentColor', size: 14 }" text="Edit" class="shrink-0"
          :to="`/dashboard/classes/${classId}/edit`" />
        <!-- Archive / Unarchive (tutor of class or admin) -->
        <AppButton v-if="isTutorOrAdmin && !isArchived" variant="secondary" size="36" radius="8" icon="Archive"
          :icon-config="{ color: 'currentColor', size: 14 }" text="Archive" class="shrink-0"
          @click="archiveDialogOpen = true" />
        <AppButton v-if="isTutorOrAdmin && isArchived" variant="primary" size="36" radius="8" icon="ArchiveTick"
          :icon-config="{ color: 'white', size: 14 }" text="Unarchive" class="shrink-0" :loading="archiving"
          @click="handleArchive(false)" />
        <UiBadge v-if="isArchived" size="lg" :class="'uppercase'" style="background:var(--surface-well);color:var(--text-muted)">
          Archived</UiBadge>
        <UiBadge :class="'uppercase'" size="lg" :style="cls.classStatus === 'ACTIVE'
          ? 'background:var(--status-active-bg);color:var(--status-active-text)'
          : 'background:var(--status-expired-bg);color:var(--status-expired-text)'">{{ cls.classStatus }}</UiBadge>
        <UiBadge v-if="cls.myRole" size="lg" :class="['uppercase', roleColorClass[cls.myRole] || '']"
          :style="!roleColorClass[cls.myRole] ? 'background:var(--surface-well);color:var(--text-muted)' : ''">{{
            cls.myRole }}</UiBadge>
      </template>
    </div>

    <!-- Loading -->
    <template v-if="loading">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <UiSkeleton v-for="i in 4" :key="i" class="h-20 rounded-xl" />
      </div>
      <UiSkeleton class="h-32 rounded-xl mb-6" />
      <UiSkeleton class="h-64 rounded-xl" />
    </template>

    <template v-else-if="cls">

      <!-- Archived banner — read-only notice (tutor/admin can unarchive) -->
      <div v-if="isArchived" class="flex items-center gap-3 p-4 mb-6 rounded-xl animate-card-enter"
        style="--delay:20ms;background:var(--surface-well);border:1px solid var(--border-card)">
        <div class="size-9 rounded-xl flex items-center justify-center shrink-0" style="background:var(--surface-card)">
          <AppIconsax name="Archive" color="var(--color-text-muted)" :size="16" />
        </div>
        <div class="flex-1 min-w-0">
          <AppText size="14" weight="semibold" class-list="block" :style="`color:var(--text-heading)`">This class is
            archived</AppText>
          <AppText size="13" class-list="block mt-0.5" :style="`color:var(--text-muted)`"> 
            It's read-only — editing, code rotation, and new joins are disabled. 
            {{ isTutorOrAdmin ? 'Unarchive it to restore full access.' : '' }}
          </AppText>
        </div>
        <AppButton v-if="isTutorOrAdmin" variant="primary" size="36" radius="8" icon="ArchiveTick"
          :icon-config="{ color: 'white', size: 14 }" text="Unarchive" class="shrink-0" :loading="archiving"
          @click="handleArchive(false)" />
      </div>

      <!-- Stats row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-card-enter" style="--delay:40ms">
        <div class="dash-card p-4">
          <div class="flex items-center gap-2 mb-1">
            <AppIconsax name="People" color="var(--color-text-subtle)" :size="13" />
            <AppText size="10" weight="semibold" :uppercase="true" class-list="tracking-[0.12em]"
              :style="`color:var(--text-subtle)`">Members</AppText>
          </div>
          <AppText size="22" weight="semibold" :style="`color:var(--text-heading)`">{{ cls.members.length }}</AppText>
        </div>
        <div class="dash-card p-4">
          <div class="flex items-center gap-2 mb-1">
            <AppIconsax name="People" color="var(--color-text-subtle)" :size="13" />
            <AppText size="10" weight="semibold" :uppercase="true" class-list="tracking-[0.12em]"
              :style="`color:var(--text-subtle)`">Students</AppText>
          </div>
          <AppText size="22" weight="semibold" :style="`color:var(--text-heading)`">{{ students.length }}</AppText>
        </div>
        <div class="dash-card p-4">
          <div class="flex items-center gap-2 mb-1">
            <AppIconsax name="Teacher" color="var(--color-text-subtle)" :size="13" />
            <AppText size="10" weight="semibold" :uppercase="true" class-list="tracking-[0.12em]"
              :style="`color:var(--text-subtle)`">Tutors</AppText>
          </div>
          <AppText size="22" weight="semibold" :style="`color:var(--text-heading)`">{{ tutors.length }}</AppText>
        </div>
        <div class="dash-card p-4">
          <div class="flex items-center gap-2 mb-1">
            <AppIconsax name="Calendar" color="var(--color-text-subtle)" :size="13" />
            <AppText size="10" weight="semibold" :uppercase="true" class-list="tracking-[0.12em]"
              :style="`color:var(--text-subtle)`">Created</AppText>
          </div>
          <AppText size="13" weight="semibold" :style="`color:var(--text-heading)`">{{ fmtDate(cls.createdAt) }}
          </AppText>
        </div>
      </div>

      <!-- Class code (tutor/admin) -->
      <div v-if="isTutorOrAdmin && !isArchived" class="dash-card overflow-hidden mb-6 animate-card-enter"
        style="--delay:80ms">
        <div class="px-5 py-3 flex items-center justify-between"
          style="background:var(--surface-raised);border-bottom:1px solid var(--border-inner)">
          <div class="flex items-center gap-2">
            <AppIconsax name="Key" color="var(--color-text-subtle)" :size="13" />
            <AppText size="11" weight="semibold" :uppercase="true" class-list="tracking-[0.12em]"
              :style="`color:var(--text-subtle)`">Class code</AppText>
          </div>
          <div class="flex items-center gap-1.5">
            <AppIconsax :name="statusConfig.icon" :size="11" :style="statusConfig.style" />
            <AppText size="11" :style="statusConfig.style">{{ statusConfig.label }}</AppText>
          </div>
        </div>
        <div class="p-5 flex items-center gap-4">
          <AppText size="22" weight="bold" font-family="mono" class-list="tracking-[0.4em] select-all flex-1"
            :style="`color:var(--text-heading)`">
            {{ cls.classCode }}
          </AppText>
          <div class="flex items-center gap-2 shrink-0">
            <AppButton variant="secondary" size="36" radius="8" :icon="copying ? 'TickCircle' : 'Copy'"
              :icon-config="{ color: copying ? 'var(--color-brand-primary)' : 'currentColor', size: 14 }" text="Copy"
              @click="handleCopy" />
            <AppButton variant="secondary" size="36" radius="8" icon="Refresh2"
              :icon-config="{ color: 'currentColor', size: 14 }" text="Rotate" :loading="refreshing"
              @click="handleRefresh" />
          </div>
        </div>
      </div>

      <!-- Tabs card -->
      <div class="dash-card overflow-hidden animate-card-enter" style="--delay:120ms">
        <div class="flex overflow-x-auto" style="border-bottom:1px solid var(--border-inner)">
          <button v-for="tab in visibleTabs" :key="tab.key"
            class="flex items-center gap-1.5 px-5 py-3.5 text-[13px] font-semibold font-poppins transition-colors relative shrink-0 cursor-pointer"
            :style="activeTab === tab.key ? 'color:var(--color-brand-primary)' : 'color:var(--text-muted)'"
            @click="activeTab = tab.key">
            <AppIconsax :name="tab.icon" :size="14"
              :color="activeTab === tab.key ? 'var(--color-brand-primary)' : 'var(--color-text-muted)'" />
            {{ tab.label }}
            <span v-if="activeTab === tab.key"
              class="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-brand-primary" />
          </button>
        </div>

        <div class="p-5">
          <PagesDashboardClassesClassMembersTab v-if="activeTab === 'members'" :class-id="cls.id" :members="cls.members"
            :is-tutor-or-admin="isTutorOrAdmin && !isArchived" :is-admin="isAdmin && !isArchived" :current-user-id="currentUserId"
            @removed="handleMemberRemoved" @role-changed="handleRoleChanged" />
          <PagesDashboardClassesClassStudentsTab v-else-if="activeTab === 'students'" :class-id="cls.id" />
          <PagesDashboardClassesClassAnalyticsTab v-else-if="activeTab === 'analytics'" :class-id="cls.id" />
          <PagesDashboardClassesTasksClassTasksTab v-else-if="activeTab === 'tasks'" :class-id="cls.id"
            :can-manage="isTutorOrAdmin && !isArchived" :is-student="isStudentInClass" />
          <PagesDashboardClassesAnnouncementsFeed v-else-if="activeTab === 'announcements'" :class-id="cls.id"
            :can-post="isTutorOrAdmin && !isArchived" />
        </div>
      </div>

    </template>

    <!-- Archive confirm dialog -->
    <UiDialog v-model:open="archiveDialogOpen">
      <UiDialogContent class="p-0 gap-0 overflow-hidden" :style="`background:var(--surface-card)`">
        <UiDialogHeader class="p-6 pb-4">
          <div class="flex items-start gap-4">
            <div class="size-11 rounded-xl flex items-center justify-center shrink-0"
              style="background:var(--surface-well)">
              <AppIconsax name="Archive" color="var(--color-text-muted)" :size="20" />
            </div>
            <div>
              <UiDialogTitle :style="`color:var(--text-heading)`">Archive this class?</UiDialogTitle>
              <UiDialogDescription class="mt-1" :style="`color:var(--text-muted)`">
                <strong :style="`color:var(--text-body)`">{{ cls?.className }}</strong> will be hidden from your active
                classes and become read-only — no edits, code rotation, or new joins. Members and data are kept, and you
                can
                unarchive it anytime.
              </UiDialogDescription>
            </div>
          </div>
        </UiDialogHeader>
        <UiDialogFooter class="p-6 pt-0 flex gap-2">
          <UiDialogClose as-child>
            <AppButton variant="secondary" size="40" radius="8" text="Cancel" class="flex-1" />
          </UiDialogClose>
          <AppButton variant="primary" size="40" radius="8" icon="Archive" :icon-config="{ color: 'white', size: 15 }"
            text="Archive class" class="flex-1" :loading="archiving" @click="handleArchive(true)" />
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>



  </div>
</template>
