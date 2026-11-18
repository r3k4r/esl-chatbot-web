<script setup lang="ts">
import type { AdminDashboardData } from '~/common/types/admin-types'

// Plans people are on right now, FIB money in this month vs last, and who uses the AI.
const props = defineProps<{ plans: AdminDashboardData['plans']; revenue: AdminDashboardData['revenue']; aiUsage: AdminDashboardData['aiUsage'] }>()

const PLANS = ['FREE', 'GOLD', 'PREMIUM'] as const
const label = (p: string) => p.charAt(0) + p.slice(1).toLowerCase()
const iqd = (n: number) => `${n.toLocaleString()} IQD`

const planTotal = computed(() => PLANS.reduce((a, p) => a + props.plans[p], 0))
const aiTotal = computed(() => PLANS.reduce((a, p) => a + props.aiUsage[p], 0))
const rows = computed(() => PLANS.map(p => ({
  plan: label(p),
  people: props.plans[p],
  share: planTotal.value ? Math.round((props.plans[p] / planTotal.value) * 100) : 0,
  messages: props.aiUsage[p],
  aiShare: aiTotal.value ? Math.round((props.aiUsage[p] / aiTotal.value) * 100) : 0,
})))
const providers = computed(() => Object.entries(props.revenue.payingByProvider).filter(([, n]) => n > 0))
const change = computed(() => props.revenue.fibThisMonthIQD - props.revenue.fibLastMonthIQD)
</script>

<template>
  <section aria-labelledby="admin-plans" class="dash-card p-5 md:p-6">
    <AppText id="admin-plans" size="16" weight="semibold">Plans and money</AppText>

    <table class="mt-4 w-full text-[14px]">
      <thead>
        <tr class="border-b border-border-inner text-text-muted">
          <th class="py-2 text-start font-medium">Plan</th>
          <th class="py-2 text-end font-medium">People</th>
          <th class="py-2 text-end font-medium">AI messages, 7 days</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border-inner">
        <tr v-for="r in rows" :key="r.plan">
          <td class="py-2.5 font-medium text-text-heading">{{ r.plan }}</td>
          <td class="py-2.5 text-end tabular-nums text-text-body">{{ r.people.toLocaleString() }} <span class="text-text-muted">· {{ r.share }}%</span></td>
          <td class="py-2.5 text-end tabular-nums text-text-body">{{ r.messages.toLocaleString() }} <span class="text-text-muted">· {{ r.aiShare }}%</span></td>
        </tr>
      </tbody>
    </table>

    <div class="mt-5 grid gap-4 border-t border-border-inner pt-5 sm:grid-cols-2">
      <div>
        <AppText size="14" color="neutral-400">FIB this month</AppText>
        <AppText size="20" weight="semibold" class-list="tabular-nums">{{ iqd(revenue.fibThisMonthIQD) }}</AppText>
        <AppText size="13" color="neutral-400">
          {{ revenue.fibThisMonthCount }} payment{{ revenue.fibThisMonthCount === 1 ? '' : 's' }} ·
          {{ change === 0 ? 'same as' : `${change > 0 ? '+' : '−'}${Math.abs(change).toLocaleString()} vs` }} last month
        </AppText>
      </div>
      <div>
        <AppText size="14" color="neutral-400">Paying, by how they paid</AppText>
        <AppText v-if="!providers.length" size="14" color="neutral-400" class-list="mt-1">No paid plans right now.</AppText>
        <ul v-else class="mt-1 space-y-0.5">
          <li v-for="[p, n] in providers" :key="p" class="flex justify-between gap-3 text-[14px]">
            <span class="text-text-body">{{ label(p) }}</span><span class="tabular-nums text-text-heading">{{ n }}</span>
          </li>
        </ul>
      </div>
    </div>
    <AppText size="13" color="neutral-400" class-list="mt-4">
      FIB money counts subscriptions started in the month; renewals aren't recorded separately. Cash and Stripe amounts aren't stored.
    </AppText>
  </section>
</template>
