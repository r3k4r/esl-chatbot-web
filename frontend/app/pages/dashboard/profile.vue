<script setup lang="ts">
import { useProfilePage } from '~/composables/useProfilePage'
import ProfileHeader from '~/components/Pages/Dashboard/Profile/ProfileHeader.vue'
import ProfileSection from '~/components/Pages/Dashboard/Profile/ProfileSection.vue'
import AccountFields from '~/components/Pages/Dashboard/Profile/AccountFields.vue'
import LearningFields from '~/components/Pages/Dashboard/Profile/LearningFields.vue'
import TutorFields from '~/components/Pages/Dashboard/Profile/TutorFields.vue'
import PracticeFields from '~/components/Pages/Dashboard/Profile/PracticeFields.vue'
import EmailFields from '~/components/Pages/Dashboard/Profile/EmailFields.vue'

definePageMeta({ layout: 'dashboard', requiresAuth: true })

const {
  profile, loading, isStaff, memberSince, planLabel, planColor, initials,
  editing, saving, form, schema, avatar,
  startEdit, cancel, pickAvatar, save,
} = useProfilePage()
</script>

<template>
  <div class="h-full overflow-y-auto page-padding">
    <div v-if="loading && !profile" class="space-y-4">
      <div class="flex items-center gap-4">
        <UiSkeleton class="size-16 rounded-full" />
        <div class="space-y-2"><UiSkeleton class="h-6 w-48" /><UiSkeleton class="h-4 w-64" /></div>
      </div>
      <div class="grid gap-4 lg:grid-cols-2"><UiSkeleton v-for="n in 2" :key="n" class="h-72 rounded-xl" /></div>
    </div>

    <Form v-else-if="profile" :schema="schema" :form-data="form" @submit="save">
      <template #default="{ errors }">
        <ProfileHeader
          :profile="profile" :editing="editing" :is-staff="isStaff" :initials="initials"
          :plan-label="planLabel" :plan-color="planColor" :avatar-preview="avatar.preview" :avatar-error="avatar.error"
          :saving="saving" @edit="startEdit" @cancel="cancel" @pick="pickAvatar"
        />

        <!-- From 1200px: Account beside Learning + tutor (stretched to one bottom edge), then
             Daily goal (two thirds) beside Weekly email (one third). -->
        <div class="grid gap-4 lg:grid-cols-2">
          <ProfileSection title="Account" description="Your name and how you sign in.">
            <AccountFields v-model:form="form" :profile="profile" :editing="editing" :member-since="memberSince" :errors="errors" />
          </ProfileSection>

          <template v-if="!isStaff">
            <div class="flex flex-col gap-4">
              <ProfileSection title="Learning" description="Your tutor uses this to choose words and topics." class="flex-1">
                <LearningFields v-model:form="form" :learner="profile.learnerProfile" :editing="editing" :errors="errors" />
              </ProfileSection>
              <ProfileSection title="Your AI tutor" description="How the tutor talks to you and sounds.">
                <TutorFields v-model:form="form" :learner="profile.learnerProfile" :editing="editing" />
              </ProfileSection>
            </div>
          </template>
        </div>

        <div v-if="!isStaff" class="mt-4 grid gap-4 lg:grid-cols-3">
          <ProfileSection title="Daily goal" description="The dashboard measures each day against it." class="lg:col-span-2">
            <PracticeFields v-model:form="form" :learner="profile.learnerProfile" :editing="editing" :errors="errors" />
          </ProfileSection>
          <ProfileSection title="Weekly email" description="A summary of your week, every Sunday.">
            <EmailFields v-model:form="form" :learner="profile.learnerProfile" :editing="editing" />
          </ProfileSection>
        </div>

      </template>
    </Form>
  </div>
</template>
