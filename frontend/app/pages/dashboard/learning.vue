<script setup lang="ts">
import { activeRows } from '~/lib/admin-people'

// Admin: how learning is going across the platform. Every class with its teacher, the students
// practising most this week, average skills and levels, and the most common mistakes.
definePageMeta({ layout: 'dashboard', requiresAuth: true, requiresAdmin: true })
useSeo({ title: 'Learning', noindex: true })

const { data, loading, error, fetchAdminDashboard } = useAdminDashboard()
onMounted(fetchAdminDashboard)
</script>

<template>
  <div class="h-full overflow-y-auto page-padding md:p-6">
    <div class="space-y-5">
      <header>
        <AppText size="24" weight="semibold" font-family="poppins" class-list="tracking-tight">Learning</AppText>
        <AppText size="14" color="neutral-400" class-list="mt-0.5">Classes, skills and mistakes across every student.</AppText>
      </header>

      <BlockLoadError v-if="error && !data" title="We couldn't load learning" :detail="error" :retrying="loading" @retry="fetchAdminDashboard" />

      <template v-else-if="data">
        <div class="grid gap-5 xl:grid-cols-3">
          <PagesDashboardTutorClassTable
            class="xl:col-span-2" :classes="data.classes"
            title="Classes" empty-text="No active classes yet. Teachers create them from Classes."
          />
          <PagesDashboardAdminPeopleList
            title="Most active this week" hint="Practice time in the last 7 days."
            :rows="activeRows(data.people)" empty="Nobody has practised in the last 7 days."
          />
        </div>
        <div class="grid gap-5 xl:grid-cols-3">
          <PagesDashboardAdminLearning :learning="data.learning" />
          <PagesDashboardClassesStudentDetailStudentMistakes
            class="xl:col-span-2" :mistakes="data.learning.commonMistakes" :practised="data.learning.skills.practisingStudents > 0"
          />
        </div>
      </template>

      <SkeletonsAdminPageSkeleton v-else wide />
    </div>
  </div>
</template>
