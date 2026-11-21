<script setup lang="ts">
import type { AdminUserItem } from '~/common/types/admin-types'
import { PLAN_BADGE } from '~/common/data/plan-limits'
import { toneStyle, type Tone } from '~/lib/progress'
import ProfileSection from '~/components/Pages/Dashboard/Profile/ProfileSection.vue'
import ProfileRow from '~/components/Pages/Dashboard/Profile/ProfileRow.vue'

// The plan now (left) and every FIB payment (right).
const props = defineProps<{ user: AdminUserItem }>()

const sub = computed(() => props.user.subscription)
const STATUS_TONE: Record<string, Tone> = { ACTIVE: 'active', INACTIVE: 'inactive', CANCELLED: 'expired', PAST_DUE: 'blocked' }
const PROVIDER = { CASH: 'Cash', FIB: 'FIB', STRIPE: 'Card (Stripe)' } as const

const cap = (s: string) => (s.charAt(0) + s.slice(1).toLowerCase()).replace(/_/g, ' ')
const fmt = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '–'
const badge = 'rounded-md px-2 py-0.5 font-poppins text-[14px] font-medium'
</script>

<template>
  <div class="grid items-start gap-5 md-lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
    <ProfileSection title="Plan" description="Assigned by an admin, or paid with FIB.">
      <template v-if="sub">
        <ProfileRow label="Plan">
          <span :class="[badge, PLAN_BADGE[sub.plan].class]">{{ PLAN_BADGE[sub.plan].label }}</span>
        </ProfileRow>
        <ProfileRow label="Status">
          <span :class="badge" :style="toneStyle(STATUS_TONE[sub.status] ?? 'inactive')">{{ cap(sub.status) }}</span>
        </ProfileRow>
        <ProfileRow v-if="sub.paymentProvider" label="Paid with">{{ PROVIDER[sub.paymentProvider] }}</ProfileRow>
        <ProfileRow v-if="sub.currentPeriodStart || sub.currentPeriodEnd" label="Period">
          <span class="whitespace-nowrap">{{ fmt(sub.currentPeriodStart) }} –</span> <span class="whitespace-nowrap">{{ fmt(sub.currentPeriodEnd) }}</span>
        </ProfileRow>
        <ProfileRow v-if="sub.monthlyTtsUsage !== undefined" label="Voice this month">
          {{ sub.monthlyTtsUsage.toLocaleString() }} characters
        </ProfileRow>
      </template>
      <ProfileRow v-else label="Plan"><span class="text-text-muted">No subscription record</span></ProfileRow>
    </ProfileSection>

    <section class="dash-card overflow-hidden">
      <div class="px-5 pt-4 pb-3">
        <h2 class="font-poppins text-[16px] font-semibold text-text-heading">FIB payments</h2>
      </div>

      <div v-if="user.fibSubscriptions?.length" class="overflow-x-auto">
        <table class="w-full min-w-[560px] font-poppins text-[14px]">
          <thead class="border-y border-border-inner bg-surface-raised text-start text-text-muted">
            <tr>
              <th class="px-5 py-2.5 text-start font-medium">Plan</th>
              <th class="px-5 py-2.5 text-end font-medium">Amount</th>
              <th class="px-5 py-2.5 text-start font-medium">For</th>
              <th class="px-5 py-2.5 text-start font-medium">Status</th>
              <th class="px-5 py-2.5 text-start font-medium">Activated</th>
              <th class="px-5 py-2.5 text-start font-medium">Cancelled</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-inner text-text-body">
            <tr v-for="fib in user.fibSubscriptions" :key="fib.id">
              <td class="px-5 py-3">
                <span :class="[badge, PLAN_BADGE[fib.plan as keyof typeof PLAN_BADGE]?.class ?? PLAN_BADGE.FREE.class]">
                  {{ PLAN_BADGE[fib.plan as keyof typeof PLAN_BADGE]?.label ?? fib.plan }}
                </span>
              </td>
              <td class="px-5 py-3 text-end tabular-nums text-text-heading">{{ fib.amountIQD.toLocaleString() }} IQD</td>
              <td class="px-5 py-3">{{ fib.intervalMonths }} {{ fib.intervalMonths === 1 ? 'month' : 'months' }}</td>
              <td class="px-5 py-3">{{ cap(fib.fibStatus) }}</td>
              <td class="px-5 py-3 tabular-nums">{{ fmt(fib.activatedAt) }}</td>
              <td class="px-5 py-3 tabular-nums">{{ fmt(fib.cancelledAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <UiEmpty v-else class="border-t border-border-inner py-10">
        <UiEmptyMedia>
          <AppIconsax name="Receipt" color="var(--color-text-subtle)" :size="28" />
        </UiEmptyMedia>
        <UiEmptyContent>
          <UiEmptyTitle>No FIB payments</UiEmptyTitle>
          <UiEmptyDescription>Payments made with FIB show here.</UiEmptyDescription>
        </UiEmptyContent>
      </UiEmpty>
    </section>
  </div>
</template>
