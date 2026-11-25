<script setup lang="ts">
// Admin: money and what it costs. Where students drop off before paying, who is on which plan,
// FIB money this month, and how much the AI (the main running cost) is used.
definePageMeta({ layout: 'dashboard', requiresAuth: true, requiresAdmin: true })
useSeo({ title: 'Revenue', noindex: true })

const { data, loading, error, fetchAdminDashboard } = useAdminDashboard()
onMounted(fetchAdminDashboard)
</script>

<template>
  <div class="h-full overflow-y-auto page-padding md:p-6">
    <div class="space-y-5">
      <header>
        <AppText size="24" weight="semibold" font-family="poppins" class-list="tracking-tight">Revenue</AppText>
        <AppText size="14" color="neutral-400" class-list="mt-0.5">From sign-up to paying, plans and money, and AI use.</AppText>
      </header>

      <BlockLoadError v-if="error && !data" title="We couldn't load revenue" :detail="error" :retrying="loading" @retry="fetchAdminDashboard" />

      <div v-else-if="data" class="grid gap-5 md-lg:grid-cols-2 xl:grid-cols-3">
        <PagesDashboardAdminFunnel :funnel="data.funnel" />
        <PagesDashboardAdminPlans :plans="data.plans" :revenue="data.revenue" :ai-usage="data.aiUsage" />
        <PagesDashboardAdminAiUse class="md-lg:col-span-2 xl:col-span-1" :learning="data.learning" />
      </div>

      <SkeletonsAdminPageSkeleton v-else />
    </div>
  </div>
</template>
