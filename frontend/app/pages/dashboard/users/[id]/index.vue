<script setup lang="ts">
import { useAdmin } from '~/composables/useAdmin'
import type { AdminUserItem } from '~/common/types/admin-types'

definePageMeta({ layout: 'dashboard', requiresAuth: true, requiresAdmin: true })
useSeo({ title: 'User', noindex: true })

const route = useRoute()
const { getUser } = useAdmin()

const userId = computed(() => route.params.id as string)
const user = ref<AdminUserItem | null>(null)
// Names the id crumb in the header breadcrumb.
const { setTitle } = useBreadcrumbs()
watch(() => user.value?.displayName || user.value?.username, setTitle, { immediate: true })
const loading = ref(true)
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

    <!-- Loading (the header's shape, then a card) -->
    <div v-if="loading" class="space-y-6 p-4 md:p-6">
      <div class="flex items-center gap-4">
        <UiSkeleton class="size-16 rounded-full" />
        <div class="space-y-2"><UiSkeleton class="h-6 w-48 rounded-md" /><UiSkeleton class="h-4 w-64 rounded-md" /></div>
      </div>
      <UiSkeleton class="h-10 w-96 max-w-full rounded-lg" />
      <UiSkeleton class="h-64 rounded-xl" />
    </div>

    <template v-else-if="user">
      <div class="space-y-5 p-4 md:p-6">
        <PagesDashboardUsersDetailUserDetailHeader :user="user" />

        <UiTabs v-model="activeTab">
          <!-- One row that scrolls sideways on phones, instead of wrapping into uneven rows -->
          <UiTabsList class="h-auto max-w-full justify-start gap-1 overflow-x-auto [scrollbar-width:none]">
            <UiTabsTrigger v-for="tab in tabs" :key="tab.id" :value="tab.id" class="flex-none px-3 text-[14px] font-poppins">
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
    <div v-else class="p-4 md:p-6">
      <UiEmpty>
        <UiEmptyMedia>
          <AppIconsax name="Profile" color="var(--color-text-subtle)" :size="32" />
        </UiEmptyMedia>
        <UiEmptyContent>
          <UiEmptyTitle>User not found</UiEmptyTitle>
          <UiEmptyDescription>This account may have been deleted, or the link is wrong.</UiEmptyDescription>
        </UiEmptyContent>
        <AppButton variant="secondary" size="38" radius="8" icon="ArrowLeft" :icon-config="{ color: 'currentColor', size: 16 }"
          text="All users" to="/dashboard/users" />
      </UiEmpty>
    </div>

  </div>
</template>
