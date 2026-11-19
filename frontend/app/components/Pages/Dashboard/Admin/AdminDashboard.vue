<script setup lang="ts">
import type { KeyFigure } from '~/common/types/dashboard-types'

// Admin home: this week against the week before, where students drop off, plans and money,
// and what to follow up on. "Active" = sent the AI tutor a message.
const { data, loading, error, fetchAdminDashboard } = useAdminDashboard()
onMounted(fetchAdminDashboard)

const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

const figures = computed<KeyFigure[]>(() => {
  const d = data.value
  if (!d) return []
  return [
    { label: 'New sign-ups', value: d.users.newThisWeek, now: d.users.newThisWeek, before: d.users.newLastWeek },
    { label: 'Active learners', value: d.activity.activeThisWeek, now: d.activity.activeThisWeek, before: d.activity.activeLastWeek },
    { label: 'AI messages', value: d.activity.messagesThisWeek.toLocaleString(), now: d.activity.messagesThisWeek, before: d.activity.messagesLastWeek },
    { label: 'Paying now', value: d.funnel.paying, hint: `${d.activity.active24h} active in the last 24 h` },
  ]
})
</script>

<template>
  <div class="h-full overflow-y-auto page-padding md:p-6">
    <div class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <AppText size="24" weight="semibold" font-family="poppins" class-list="tracking-tight">This week</AppText>
          <AppText size="14" color="neutral-400" class-list="mt-0.5">
            {{ today }}<template v-if="data"> · {{ data.users.total.toLocaleString() }} accounts ({{ data.users.students }} students, {{ data.users.tutors }} tutors)</template>
          </AppText>
        </div>
        <AppButton variant="secondary" size="36" radius="8" icon="People" text="Users" :icon-config="{ size: 16 }" to="/dashboard/users" class-list="px-4" />
      </header>

      <BlockLoadError
        v-if="error"
        title="We couldn't load the admin overview"
        :detail="error"
        :retrying="loading"
        @retry="fetchAdminDashboard"
      />

      <template v-else-if="data">
        <PagesDashboardSharedKeyFigures data-guide="admin-figures" :items="figures" />
        <AppText size="13" color="neutral-400" class-list="-mt-2">Compared with the 7 days before.</AppText>
        <div class="grid items-start gap-5 md-lg:grid-cols-2 xl:grid-cols-3">
          <PagesDashboardAdminFunnel data-guide="admin-funnel" :funnel="data.funnel" />
          <PagesDashboardAdminFollowUps data-guide="admin-followups" :expiring="data.expiringSoon" :attention="data.attention" :expired-not-downgraded="data.plans.expiredNotDowngraded" />
          <PagesDashboardAdminPlans data-guide="admin-plans" class="md-lg:col-span-2 xl:col-span-1" :plans="data.plans" :revenue="data.revenue" :ai-usage="data.aiUsage" />
        </div>
      </template>

      <template v-else>
        <UiSkeleton class="h-24 rounded-xl" />
        <div class="grid gap-5 md-lg:grid-cols-2 xl:grid-cols-3">
          <UiSkeleton v-for="n in 3" :key="n" class="h-72 rounded-xl" />
        </div>
      </template>
    </div>
  </div>
</template>
