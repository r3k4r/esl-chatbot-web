<script setup lang="ts">
import type { FibPaymentRecord } from '~/common/types/subscription-types'
import { PLAN_META, INTERVAL_LABELS } from '~/common/types/subscription-types'

// Users could see a plan and a price but had no record of what they were actually
// charged, which makes any billing question impossible to answer for themselves.
const { listFibPayments } = useSubscription()

const payments = ref<FibPaymentRecord[]>([])
const loading = ref(true)

onMounted(async () => {
  const res = await listFibPayments()
  payments.value = res.success ? ((res.data as any)?.data ?? []) : []
  loading.value = false
})

function fmtIQD(n: number) {
  return n.toLocaleString('en-IQ') + ' IQD'
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IQ', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// What actually happened to the user's money, in their words.
function outcome(p: FibPaymentRecord): { label: string; bg: string; color: string } {
  if (p.wasCharged && p.fibStatus === 'CANCELLED') {
    return { label: 'Paid · cancelled', bg: 'var(--status-inactive-bg)', color: 'var(--status-inactive-text)' }
  }
  if (p.wasCharged) {
    return { label: 'Paid', bg: 'var(--status-active-bg)', color: 'var(--status-active-text)' }
  }
  if (p.fibStatus === 'DRAFT') {
    return { label: 'Awaiting payment', bg: 'var(--surface-raised)', color: 'var(--text-muted)' }
  }
  return { label: 'Not paid', bg: 'var(--status-inactive-bg)', color: 'var(--status-inactive-text)' }
}
</script>

<template>
  <div class="dash-card p-5">
    <div class="flex items-center gap-3 mb-4">
      <div
        class="size-10 rounded-xl flex items-center justify-center shrink-0"
        style="background:var(--surface-well)"
      >
        <AppIconsax name="Receipt2" color="var(--color-text-muted)" :size="18" />
      </div>
      <div>
        <AppText size="14" weight="semibold" class-list="block" :style="`color:var(--text-heading)`">
          Payment history
        </AppText>
        <AppText size="12" :style="`color:var(--text-muted)`">
          Every payment you've started, and what happened to it
        </AppText>
      </div>
    </div>

    <div v-if="loading" class="space-y-2">
      <UiSkeleton v-for="i in 3" :key="i" class="h-14 w-full rounded-xl" />
    </div>

    <UiEmpty v-else-if="payments.length === 0">
      <UiEmptyMedia>
        <AppIconsax name="Receipt2" color="var(--color-text-subtle)" :size="28" />
      </UiEmptyMedia>
      <UiEmptyContent>
        <UiEmptyTitle>No payments yet</UiEmptyTitle>
        <UiEmptyDescription>Your FIB payments will appear here once you subscribe.</UiEmptyDescription>
      </UiEmptyContent>
    </UiEmpty>

    <div v-else class="space-y-2">
      <div
        v-for="p in payments"
        :key="p.fibSubscriptionId"
        class="flex items-center justify-between gap-3 px-4 py-3 rounded-xl"
        style="background:var(--surface-raised);border:1px solid var(--border-inner)"
      >
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <AppText size="14" weight="semibold" :style="`color:var(--text-heading)`">
              {{ PLAN_META[p.plan].name }} · {{ INTERVAL_LABELS[p.intervalMonths] }}
            </AppText>
            <span
              class="text-[12px] font-semibold px-2 py-0.5 rounded-md font-poppins"
              :style="`background:${outcome(p).bg};color:${outcome(p).color}`"
            >
              {{ outcome(p).label }}
            </span>
          </div>
          <AppText size="12" class-list="block mt-0.5" :style="`color:var(--text-muted)`">
            Started {{ fmtDate(p.createdAt) }}
            <template v-if="p.activatedAt"> · Activated {{ fmtDate(p.activatedAt) }}</template>
            <template v-if="p.cancelledAt"> · Cancelled {{ fmtDate(p.cancelledAt) }}</template>
          </AppText>
        </div>
        <AppText
          size="14" weight="bold" class-list="shrink-0"
          :style="`color:${p.wasCharged ? 'var(--text-heading)' : 'var(--text-subtle)'}`"
        >
          {{ fmtIQD(p.amountIQD) }}
        </AppText>
      </div>
    </div>
  </div>
</template>
