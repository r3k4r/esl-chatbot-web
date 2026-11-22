<script setup lang="ts">
import { useAdminUserEditPage } from '~/composables/useAdminUserEditPage'
import { useAuthStore } from '~~/stores/auth'
import ProfileSection from '~/components/Pages/Dashboard/Profile/ProfileSection.vue'
import PracticeFields from '~/components/Pages/Dashboard/Profile/PracticeFields.vue'

definePageMeta({ layout: 'dashboard', requiresAuth: true, requiresAdmin: true })

const route = useRoute()
const userId = computed(() => route.params.id as string)
const {
  user, loading, saving, form, schema, avatar, isStudent, detailPath,
  toggling, roleOpen, roleSaving,
  pickAvatar, save, setActive, saveRole,
} = useAdminUserEditPage(userId)

const authStore = useAuthStore()
// Sign-in off asks first; back on applies at once.
const confirmDeactivate = ref(false)
function onSetActive(active: boolean) {
  if (active) setActive(true)
  else confirmDeactivate.value = true
}
async function deactivate() {
  await setActive(false)
  confirmDeactivate.value = false
}
</script>

<template>
  <div class="h-full overflow-y-auto page-padding">
    <div v-if="loading" class="space-y-4">
      <div class="flex items-center gap-4">
        <UiSkeleton class="size-16 rounded-full" />
        <div class="space-y-2"><UiSkeleton class="h-6 w-48" /><UiSkeleton class="h-4 w-64" /></div>
      </div>
      <div class="grid gap-4 lg:grid-cols-2"><UiSkeleton v-for="n in 2" :key="n" class="h-72 rounded-xl" /></div>
    </div>

    <Form v-else-if="user" :schema="schema" :form-data="form" @submit="save">
      <template #default="{ errors }">
        <PagesDashboardUsersEditUserEditHeader
          :user="user" :avatar-preview="avatar.preview" :avatar-error="avatar.error"
          :saving="saving" :back-to="detailPath" @pick="pickAvatar"
        />

        <!-- From 1200px: Account + Access beside Learning + Daily goal (students); staff: Account beside Access -->
        <div class="grid gap-4 lg:grid-cols-2">
          <div :class="isStudent ? 'flex flex-col gap-4' : 'contents'">
            <ProfileSection title="Account" description="Their name, phone and how they sign in.">
              <PagesDashboardUsersEditUserEditAccount v-model:form="form" :user="user" :errors="errors" />
            </ProfileSection>
            <ProfileSection title="Access" description="Changes here apply right away." class="flex-1">
              <PagesDashboardUsersEditUserEditAccess :user="user" :toggling="toggling" :is-self="user.id === authStore.getUser?.id" @change-role="roleOpen = true" @set-active="onSetActive" />
            </ProfileSection>
          </div>

          <div v-if="isStudent" class="flex flex-col gap-4">
            <ProfileSection title="Learning" description="The AI tutor uses this to pitch words and topics." class="flex-1">
              <PagesDashboardUsersEditUserEditLearning v-model:form="form" :errors="errors" />
            </ProfileSection>
            <ProfileSection title="Daily goal" description="Their dashboard measures each day against it.">
              <PracticeFields v-model:form="form" :learner="null" :editing="true" :errors="errors" />
            </ProfileSection>
          </div>
        </div>
      </template>
    </Form>

    <UiEmpty v-else>
      <UiEmptyMedia><AppIconsax name="Profile" color="var(--color-text-subtle)" :size="32" /></UiEmptyMedia>
      <UiEmptyContent>
        <UiEmptyTitle>User not found</UiEmptyTitle>
        <UiEmptyDescription>This account may have been deleted, or the link is wrong.</UiEmptyDescription>
      </UiEmptyContent>
      <AppButton variant="secondary" size="38" radius="8" icon="ArrowLeft" :icon-config="{ color: 'currentColor', size: 16 }" text="All users" to="/dashboard/users" />
    </UiEmpty>

    <PagesDashboardUsersChangeRoleDialog
      v-if="user" :open="roleOpen" :user="user" :saving="roleSaving"
      @update:open="roleOpen = $event" @save="saveRole"
    />
    <PagesDashboardUsersDeactivateUserDialog
      v-if="user" :open="confirmDeactivate" :name="user.displayName || user.username" :saving="toggling"
      @update:open="confirmDeactivate = $event" @confirm="deactivate"
    />
  </div>
</template>
