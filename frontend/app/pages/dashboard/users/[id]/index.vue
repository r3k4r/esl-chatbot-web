<script setup lang="ts">
import { useAdmin } from '~/composables/useAdmin'
import type { AdminUserItem } from '~/common/types/admin-types'

definePageMeta({ layout: 'dashboard', requiresAuth: true, requiresAdmin: true })

const route = useRoute()
const router = useRouter()
const { getUser } = useAdmin()

const userId = computed(() => route.params.id as string)
const user = ref<AdminUserItem | null>(null)
const loading = ref(false)
const activeTab = ref('overview')

async function load() {
  loading.value = true
  const res = await getUser(userId.value)
  if (res.success && res.data?.data) {
    user.value = res.data.data
  }
  loading.value = false
}

onMounted(load)

const isStudent = computed(() => user.value?.role === 'STUDENT')

const tabs = computed(() => {
  const base = [
    { id: 'overview', label: 'Overview' },
    { id: 'subscription', label: 'Subscription' },
  ]
  if (isStudent.value) {
    base.push(
      { id: 'goals', label: 'Goals' },
      { id: 'vocabulary', label: 'Vocabulary' },
      { id: 'sessions', label: 'Sessions' },
      { id: 'progress', label: 'Progress' },
      { id: 'tasks', label: 'Tasks' },
    )
  }
  return base
})
</script>

<template>
  <div class="h-full overflow-y-auto">

    <!-- Top bar -->
    <div class="sticky top-0 z-10 flex items-center justify-between gap-3 px-6 py-4"
      style="background:var(--surface-page);border-bottom:1px solid var(--border-inner)">
      <div class="flex items-center gap-3 min-w-0">
        <AppButton variant="secondary" size="36" radius="8" icon="ArrowLeft" text="Users"
          @click="router.push('/dashboard/users')" />
        <div v-if="user" class="flex items-center gap-2 ml-2 min-w-0">
          <p class="text-[16px] font-semibold font-poppins truncate" :style="`color:var(--text-heading)`">
            {{ user.displayName || user.username }}
          </p>
        </div>
      </div>
      <AppButton
        v-if="user"
        variant="primary"
        size="36"
        radius="8"
        icon="Edit"
        text="Edit Profile"
        :icon-config="{ color: 'white', size: 16 }"
        :to="`/dashboard/users/${userId}/profile`"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="p-6 space-y-5">
      <UiSkeleton class="h-40 rounded-2xl" />
      <UiSkeleton class="h-64 rounded-2xl" />
      <UiSkeleton class="h-48 rounded-2xl" />
    </div>

    <template v-else-if="user">
      <div class="p-6 space-y-5">

        <!-- Tabs -->
        <UiTabs v-model="activeTab">
          <UiTabsList class="flex-wrap h-auto gap-1">
            <UiTabsTrigger v-for="tab in tabs" :key="tab.id" :value="tab.id" class="text-[14px] font-poppins">
              {{ tab.label }}
            </UiTabsTrigger>
          </UiTabsList>

          <!-- Overview -->
          <UiTabsContent value="overview" class="mt-5">
            <PagesDashboardUsersDetailUserDetailOverview :user="user" />
          </UiTabsContent>

          <!-- Subscription -->
          <UiTabsContent value="subscription" class="mt-5">
            <PagesDashboardUsersDetailUserDetailSubscription :user="user" />
          </UiTabsContent>

          <!-- Goals (STUDENT only) -->
          <UiTabsContent v-if="isStudent" value="goals" class="mt-5">
            <PagesDashboardUsersDetailUserDetailGoals :goals="user.goals ?? []" />
          </UiTabsContent>

          <!-- Vocabulary (STUDENT only) -->
          <UiTabsContent v-if="isStudent" value="vocabulary" class="mt-5">
            <PagesDashboardUsersDetailUserDetailVocabulary :vocabularies="user.vocabularies ?? []" />
          </UiTabsContent>

          <!-- Sessions (STUDENT only) -->
          <UiTabsContent v-if="isStudent" value="sessions" class="mt-5">
            <PagesDashboardUsersDetailUserDetailSessions :sessions="user.sessions ?? []" />
          </UiTabsContent>

          <!-- Progress (STUDENT only) -->
          <UiTabsContent v-if="isStudent" value="progress" class="mt-5">
            <PagesDashboardUsersDetailUserDetailProgress :progress="user.progress ?? []" />
          </UiTabsContent>

          <!-- Tasks (STUDENT only) -->
          <UiTabsContent v-if="isStudent" value="tasks" class="mt-5">
            <PagesDashboardUsersDetailUserDetailTasks :task-submissions="user.taskSubmissions ?? []" />
          </UiTabsContent>
        </UiTabs>

      </div>
    </template>

    <!-- Not found -->
    <div v-else class="p-6">
      <UiEmpty>
        <UiEmptyMedia>
          <AppIconsax name="Profile" color="var(--color-text-subtle)" :size="32" />
        </UiEmptyMedia>
        <UiEmptyContent>
          <UiEmptyTitle>User not found</UiEmptyTitle>
          <UiEmptyDescription>This user may have been deleted or the ID is invalid.</UiEmptyDescription>
        </UiEmptyContent>
      </UiEmpty>
    </div>

  </div>
</template>
