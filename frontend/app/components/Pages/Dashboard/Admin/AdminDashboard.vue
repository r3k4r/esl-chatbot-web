<script setup lang="ts">
const {
  loading,
  fetchAdminDashboard,
  totalUsers,
  usersByRole,
  subscriptions,
  activeUsers,
  sessionsToday,
  revenueByProvider,
} = useAdminDashboard()

onMounted(fetchAdminDashboard)

const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

const paidTotal = computed(() => (subscriptions.value.GOLD ?? 0) + (subscriptions.value.PREMIUM ?? 0))

function pctOfUsers(n: number): number {
  return totalUsers.value ? Math.round((n / totalUsers.value) * 100) : 0
}

const weeklyEngagement = computed(() => pctOfUsers(activeUsers.value.weekly))

// ── Donut: subscriptions ───────────────────────────────────────────────────
const subscriptionSegments = computed(() => [
  { label: 'Free', value: subscriptions.value.FREE, color: 'var(--color-text-subtle)' },
  { label: 'Gold', value: subscriptions.value.GOLD, color: '#1B365D' },
  { label: 'Premium', value: subscriptions.value.PREMIUM, color: '#B91C1C' },
])

// ── Donut: user roles ──────────────────────────────────────────────────────
const roleSegments = computed(() => [
  { label: 'Students', value: usersByRole.value.STUDENT, color: 'var(--color-brand-primary)', role: 'STUDENT' },
  { label: 'Tutors', value: usersByRole.value.TUTOR, color: '#06b6d4', role: 'TUTOR' },
  { label: 'Admins', value: usersByRole.value.ADMIN, color: '#8b5cf6', role: 'ADMIN' },
])

// ── Sparkbars: platform engagement ────────────────────────────────────────
const engagementBars = computed(() => [
  { label: 'Active today', value: activeUsers.value.daily, max: totalUsers.value, color: '#22c55e', suffix: '' },
  { label: 'Active this week', value: activeUsers.value.weekly, max: totalUsers.value, color: 'var(--color-brand-primary)', suffix: '' },
])

// ── Revenue rows ───────────────────────────────────────────────────────────
const revenueRows = computed(() =>
  Object.entries(revenueByProvider.value).map(([provider, count]) => ({ provider, count }))
)
const revenueTotal = computed(() => revenueRows.value.reduce((s, r) => s + r.count, 0))

// Inactive users = total - weekly active
const inactiveUsers = computed(() =>
  Math.max(0, totalUsers.value - activeUsers.value.weekly)
)
</script>

<template>
  <div class="h-full overflow-y-auto p-5 sm:p-7 space-y-6">

    <!-- Header — TWO distinct CTAs: user management + class management (different destinations) -->
    <div class="flex items-center justify-between gap-4 flex-wrap animate-card-enter" style="--delay:0ms">
      <div>
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#B91C1C]/10 border border-[#B91C1C]/20 mb-2">
          <img src="/leo-logo.jpg" alt="Leo" class="size-3.5 rounded-full object-cover" />
          <span class="text-[10px] font-semibold text-[#B91C1C] dark:text-red-400 uppercase tracking-widest font-poppins">
            Leo Institute Administration · سلێمانی
          </span>
        </div>
        <p class="text-[24px] font-bold font-poppins" :style="`color:var(--text-heading)`">Campus Operations &amp; AI Analytics</p>
        <p class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">{{ today }}</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <AppButton variant="secondary" size="36" radius="8" icon="People" text="Users" @click="$router.push('/dashboard/users')" />
        <AppButton variant="primary" size="36" radius="8" icon="BookSaved" text="Classes" :icon-config="{ color: 'white', size: 15 }" @click="$router.push('/dashboard/classes')" />
      </div>
    </div>

    <!-- Top stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-card-enter" style="--delay:80ms">
      <template v-if="loading">
        <UiSkeleton v-for="n in 4" :key="n" class="h-24 rounded-xl" />
      </template>
      <template v-else>
        <PagesDashboardSharedDashStatCard
          label="Total users" :value="totalUsers"
          :sub="`${usersByRole.STUDENT} students · ${usersByRole.TUTOR} tutors`"
          icon="People"
        />
        <PagesDashboardSharedDashStatCard
          label="Paid subscribers" :value="paidTotal"
          :sub="`${subscriptions.GOLD} Gold · ${subscriptions.PREMIUM} Premium`"
          icon="Crown1" accent="gold"
        />
        <PagesDashboardSharedDashStatCard
          label="Active today" :value="activeUsers.daily"
          :sub="`${weeklyEngagement}% active this week`"
          icon="Activity" accent="green"
        />
        <PagesDashboardSharedDashStatCard
          label="Sessions today" :value="sessionsToday"
          sub="Across all users"
          icon="Messages" accent="premium"
        />
      </template>
    </div>

    <!-- Donut charts row — each links to a different filtered view -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-card-enter" style="--delay:160ms">

      <!-- Subscription breakdown → view active paid subscribers -->
      <PagesDashboardSharedDashSectionCard
        title="Subscription breakdown"
        icon="Crown1"
        to="/dashboard/users?subscriptionStatus=ACTIVE"
        link-label="View active subscribers"
      >
        <template v-if="loading">
          <UiSkeleton class="h-36 rounded-xl" />
        </template>
        <template v-else>
          <PagesDashboardSharedDashDonutChart :segments="subscriptionSegments" />
        </template>
      </PagesDashboardSharedDashSectionCard>

      <!-- Users by role — each role badge is a clickable filter link -->
      <PagesDashboardSharedDashSectionCard
        title="Users by role"
        icon="People"
      >
        <template v-if="loading">
          <UiSkeleton class="h-36 rounded-xl" />
        </template>
        <template v-else>
          <PagesDashboardSharedDashDonutChart :segments="roleSegments" />
          <!-- Clickable role tiles — distinct links per role -->
          <div class="mt-4 grid grid-cols-3 gap-2">
            <NuxtLink
              v-for="row in roleSegments"
              :key="row.label"
              :to="`/dashboard/users?role=${row.role}`"
              class="flex flex-col items-center gap-1 p-3 rounded-xl text-center transition-opacity hover:opacity-80 cursor-pointer"
              :style="`background:var(--surface-raised)`"
            >
              <span class="text-[20px] font-bold font-poppins leading-none" :style="`color:${row.color}`">{{ row.value }}</span>
              <span class="text-[13px] font-poppins" :style="`color:var(--text-muted)`">{{ row.label }}</span>
            </NuxtLink>
          </div>
        </template>
      </PagesDashboardSharedDashSectionCard>

    </div>

    <!-- Platform engagement + revenue -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-card-enter" style="--delay:240ms">

      <!-- Platform engagement (2 cols) — no footer CTA since data already shown above (no duplicate) -->
      <div class="lg:col-span-2">
        <PagesDashboardSharedDashSectionCard
          title="Platform engagement"
          icon="Activity"
        >
          <template v-if="loading">
            <UiSkeleton v-for="n in 2" :key="n" class="h-10 rounded-xl" />
          </template>
          <template v-else>
            <PagesDashboardSharedDashSparkbar :bars="engagementBars" />

            <!-- Contextual insight below the bars -->
            <div class="mt-4 grid grid-cols-3 gap-3">
              <div class="p-3 rounded-xl text-center" :style="`background:var(--surface-raised)`">
                <p class="text-[20px] font-bold font-poppins leading-none" style="color:#22c55e">{{ activeUsers.daily }}</p>
                <p class="text-[13px] font-poppins mt-1" :style="`color:var(--text-muted)`">Active today</p>
              </div>
              <div class="p-3 rounded-xl text-center" :style="`background:var(--surface-raised)`">
                <p class="text-[20px] font-bold font-poppins leading-none" style="color:var(--color-brand-primary)">{{ activeUsers.weekly }}</p>
                <p class="text-[13px] font-poppins mt-1" :style="`color:var(--text-muted)`">This week</p>
              </div>
              <div class="p-3 rounded-xl text-center" :style="`background:var(--surface-raised)`">
                <p class="text-[20px] font-bold font-poppins leading-none" :style="`color:var(--text-subtle)`">{{ inactiveUsers }}</p>
                <p class="text-[13px] font-poppins mt-1" :style="`color:var(--text-muted)`">Inactive</p>
              </div>
            </div>
          </template>
        </PagesDashboardSharedDashSectionCard>
      </div>

      <!-- Revenue by provider — no duplicate link needed, standalone informational card -->
      <PagesDashboardSharedDashSectionCard
        title="Paid by provider"
        icon="Wallet2"
      >
        <template v-if="loading">
          <UiSkeleton v-for="n in 3" :key="n" class="h-12 rounded-xl" />
        </template>
        <template v-else-if="revenueRows.length === 0">
          <UiEmpty class="py-4">
            <UiEmptyMedia>
              <AppIconsax name="Wallet2" color="var(--color-text-subtle)" :size="28" />
            </UiEmptyMedia>
            <UiEmptyContent>
              <UiEmptyTitle>No paid subscriptions</UiEmptyTitle>
              <UiEmptyDescription>Assign a plan to a user to track payment providers.</UiEmptyDescription>
            </UiEmptyContent>
          </UiEmpty>
        </template>
        <template v-else>
          <div class="space-y-2.5">
            <div
              v-for="row in revenueRows"
              :key="row.provider"
              class="flex items-center justify-between p-3 rounded-xl"
              :style="`background:var(--surface-raised)`"
            >
              <div class="flex items-center gap-2.5">
                <AppIconsax name="Wallet2" color="var(--color-brand-primary)" :size="15" />
                <span class="text-[14px] font-medium font-poppins" :style="`color:var(--text-body)`">{{ row.provider }}</span>
              </div>
              <div class="text-right">
                <p class="text-[15px] font-bold font-poppins" :style="`color:var(--text-heading)`">{{ row.count }}</p>
                <p class="text-[13px] font-poppins" :style="`color:var(--text-subtle)`">
                  {{ revenueTotal ? Math.round((row.count / revenueTotal) * 100) : 0 }}%
                </p>
              </div>
            </div>
          </div>
        </template>
      </PagesDashboardSharedDashSectionCard>

    </div>

  </div>
</template>
