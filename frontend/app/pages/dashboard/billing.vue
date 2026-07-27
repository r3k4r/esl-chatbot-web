<script setup lang="ts">
definePageMeta({ layout: 'dashboard', requiresAuth: true })

const { getMySubscription } = useSubscription()

const loading = ref(true)
const subscription = ref<import('~/common/types/subscription-types').UserSubscriptionDetail | null>(null)

async function fetchSub() {
  loading.value = true
  const res = await getMySubscription()
  if (res.success && res.data) {
    subscription.value = (res.data as any).data ?? (res.data as any)
  }
  loading.value = false
}

onMounted(fetchSub)

const comparisonRows = [
  { label: 'Sessions/day',  free: '3',     gold: '15',        premium: '50'      },
  { label: 'Msgs/session',  free: '20',    gold: '100',       premium: '150'     },
  { label: 'AI model',      free: 'Lite',  gold: 'Flash',     premium: 'GPT-5'   },
  { label: 'Voice TTS',     free: '—',     gold: 'Azure',     premium: 'HD'      },
  { label: 'SRS vocab',     free: 'Basic', gold: 'Full',      premium: 'Full'    },
  { label: 'Analytics',     free: 'Basic', gold: 'Full',      premium: 'Full'    },
]

const paymentPoints = [
  'Paid securely through First Iraqi Bank (FIB)',
  'IQD currency — no foreign exchange fees',
  'Cancel anytime, keep access until period ends',
  'Save up to 40% with a 12-month plan',
]
</script>

<template>
  <div class="h-full overflow-y-auto" style="background:var(--surface-page)">
    <div class="max-w-5xl mx-auto p-5 sm:p-8">

      <!-- Header -->
      <div class="mb-8 animate-card-enter" style="--delay:0ms">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl flex items-center justify-center shrink-0" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2)">
            <AppIconsax name="Wallet2" color="var(--color-brand-primary)" :size="18" />
          </div>
          <div>
            <AppText size="22" weight="semibold" class-list="block tracking-[-0.02em]" :style="`color:var(--text-heading)`">
              Billing &amp; Subscription
            </AppText>
            <AppText size="13" class-list="block" :style="`color:var(--text-muted)`">
              Manage your plan and payment method.
            </AppText>
          </div>
        </div>
      </div>

      <!-- Two-column layout -->
      <div class="grid lg:grid-cols-[1fr_320px] gap-6">

        <!-- Left: subscription panel + payment history -->
        <div class="space-y-5 animate-card-enter" style="--delay:60ms">
          <UiSkeleton v-if="loading" class="h-96 rounded-2xl" />
          <PagesDashboardSettingsSubscriptionPanel
            v-else
            :subscription="subscription"
            @refreshed="fetchSub"
          />
          <PagesDashboardSettingsPaymentHistory v-if="!loading" />
        </div>

        <!-- Right: plan comparison + payment info -->
        <div class="space-y-5 animate-card-enter" style="--delay:100ms">

          <!-- Plan comparison -->
          <div class="dash-card overflow-hidden">
            <div class="px-5 py-3" style="background:var(--surface-raised);border-bottom:1px solid var(--border-inner)">
              <div class="grid grid-cols-4 text-center">
                <div />
                <AppText size="10" weight="semibold" :uppercase="true" class-list="tracking-[0.12em]" :style="`color:var(--text-subtle)`">Free</AppText>
                <AppText size="10" weight="semibold" :uppercase="true" class-list="tracking-[0.12em]" style="color:#f59e0b">Gold</AppText>
                <AppText size="10" weight="semibold" :uppercase="true" class-list="tracking-[0.12em]" style="color:var(--color-brand-primary)">Premium</AppText>
              </div>
            </div>
            <div class="divide-y" style="border-color:var(--border-inner)">
              <div
                v-for="row in comparisonRows"
                :key="row.label"
                class="grid grid-cols-4 px-4 py-2.5 text-center items-center"
              >
                <AppText size="12" class-list="text-left" :style="`color:var(--text-body)`">{{ row.label }}</AppText>
                <AppText size="12" weight="medium" :style="`color:var(--text-muted)`">{{ row.free }}</AppText>
                <AppText size="12" weight="semibold" style="color:#f59e0b">{{ row.gold }}</AppText>
                <AppText size="12" weight="semibold" style="color:var(--color-brand-primary)">{{ row.premium }}</AppText>
              </div>
            </div>
          </div>

          <!-- Payment info -->
          <div class="dash-card p-5 space-y-3">
            <div class="flex items-center gap-2 mb-1">
              <AppIconsax name="SecuritySafe" color="var(--color-brand-primary)" :size="15" />
              <AppText size="13" weight="semibold" :style="`color:var(--text-heading)`">Secure payment via FIB</AppText>
            </div>
            <div v-for="point in paymentPoints" :key="point" class="flex items-start gap-2.5">
              <AppIconsax name="TickCircle" color="var(--color-brand-primary)" :size="13" class="shrink-0 mt-0.5" />
              <AppText size="12" :style="`color:var(--text-muted)`">{{ point }}</AppText>
            </div>
          </div>

        </div>
      </div>

    </div>
  </div>
</template>
