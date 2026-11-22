<script setup lang="ts">
import type { UserSubscriptionDetail } from '~/common/types/subscription-types'

definePageMeta({ layout: 'dashboard', requiresAuth: true, learnerOnly: true })

const { getMySubscription } = useSubscription()

const loading = ref(true)
const subscription = ref<UserSubscriptionDetail | null>(null)

async function fetchSub() {
  loading.value = true
  const res = await getMySubscription()
  if (res.success && res.data) {
    subscription.value = (res.data as any).data ?? (res.data as any)
  }
  loading.value = false
}

onMounted(fetchSub)
</script>

<template>
  <!-- Full width: current plan | compare | paying with FIB, then the checkout, then history -->
  <div class="h-full overflow-y-auto page-padding md:p-6">
    <div class="space-y-5">
      <header>
        <AppText size="24" weight="semibold" font-family="poppins" class-list="tracking-tight">Billing</AppText>
        <AppText size="14" color="neutral-400" class-list="mt-0.5">Your plan, changing it, and every payment you've made.</AppText>
      </header>

      <template v-if="loading">
        <div class="grid gap-5 md-lg:grid-cols-2 xl:grid-cols-3">
          <UiSkeleton v-for="n in 3" :key="n" class="h-64 rounded-xl" />
        </div>
        <UiSkeleton class="h-96 rounded-xl" />
      </template>
      <PagesDashboardSettingsSubscriptionPanel v-else :subscription="subscription" @refreshed="fetchSub">
        <template #beside>
          <PagesDashboardSettingsPlanComparison />
          <PagesDashboardSettingsFibPaymentInfo />
        </template>
      </PagesDashboardSettingsSubscriptionPanel>

      <PagesDashboardSettingsPaymentHistory v-if="!loading" />
    </div>
  </div>
</template>
