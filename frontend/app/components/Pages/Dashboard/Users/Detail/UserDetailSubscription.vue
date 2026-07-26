<script setup lang="ts">
import type { AdminUserItem, AdminFibSubscription } from '~/common/types/admin-types'

const props = defineProps<{ user: AdminUserItem }>()

const PLAN_COLOR: Record<string, string> = {
  FREE:    'bg-surface-raised text-text-muted',
  GOLD:    'bg-amber-500/15 text-amber-500',
  PREMIUM: 'bg-violet-500/15 text-violet-500',
}

// Named separately so the template can fall back to it without TS treating the
// indexed lookup as possibly-undefined.
const STATUS_FALLBACK = { bg: 'var(--status-inactive-bg)', text: 'var(--status-inactive-text)' }

const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  ACTIVE:    { bg: 'var(--status-active-bg)',   text: 'var(--status-active-text)' },
  INACTIVE:  STATUS_FALLBACK,
  CANCELLED: { bg: 'var(--status-expired-bg)',  text: 'var(--status-expired-text)' },
  PAST_DUE:  { bg: 'var(--status-blocked-bg)',  text: 'var(--status-blocked-text)' },
}

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="space-y-5">

    <!-- Current subscription -->
    <div class="dash-card p-6 space-y-4">
      <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Current subscription</p>

      <div v-if="user.subscription" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Plan</p>
          <span :class="['mt-1 inline-block text-[15px] font-semibold px-2.5 py-0.5 rounded-md font-poppins', PLAN_COLOR[user.subscription.plan ?? 'FREE']]">
            {{ user.subscription.plan ?? 'FREE' }}
          </span>
        </div>
        <div class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Status</p>
          <span class="mt-1 inline-block text-[15px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
            :style="`background:${STATUS_COLOR[user.subscription.status]?.bg ?? STATUS_FALLBACK.bg};color:${STATUS_COLOR[user.subscription.status]?.text ?? STATUS_FALLBACK.text}`">
            {{ (user.subscription.status ?? 'INACTIVE').charAt(0) + (user.subscription.status ?? 'INACTIVE').slice(1).toLowerCase() }}
          </span>
        </div>
        <div v-if="user.subscription.paymentProvider" class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Payment provider</p>
          <p class="text-[15px] font-semibold font-poppins mt-0.5" :style="`color:var(--text-heading)`">
            {{ user.subscription.paymentProvider }}
          </p>
        </div>
        <div v-if="user.subscription.currentPeriodStart" class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Period start</p>
          <p class="text-[15px] font-mono mt-0.5" :style="`color:var(--text-heading)`">
            {{ fmt(user.subscription.currentPeriodStart) }}
          </p>
        </div>
        <div v-if="user.subscription.currentPeriodEnd" class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Period end</p>
          <p class="text-[15px] font-mono mt-0.5" :style="`color:var(--text-heading)`">
            {{ fmt(user.subscription.currentPeriodEnd) }}
          </p>
        </div>
        <div v-if="user.subscription.monthlyTtsUsage !== undefined" class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Monthly TTS usage</p>
          <p class="text-[15px] font-semibold font-poppins mt-0.5" :style="`color:var(--text-heading)`">
            {{ user.subscription.monthlyTtsUsage }} chars
          </p>
        </div>
      </div>
      <div v-else class="py-6">
        <UiEmpty>
          <UiEmptyMedia>
            <AppIconsax name="Crown1" color="var(--color-text-subtle)" :size="28" />
          </UiEmptyMedia>
          <UiEmptyContent>
            <UiEmptyTitle>No subscription</UiEmptyTitle>
            <UiEmptyDescription>This user has no subscription record.</UiEmptyDescription>
          </UiEmptyContent>
        </UiEmpty>
      </div>
    </div>

    <!-- FIB payment history -->
    <div class="dash-card p-6 space-y-4">
      <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">FIB payment history</p>

      <div v-if="user.fibSubscriptions && user.fibSubscriptions.length" class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr style="border-bottom:1px solid var(--border-inner); background:var(--surface-raised)">
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Plan</th>
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Amount (IQD)</th>
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Interval</th>
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Status</th>
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Activated</th>
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Cancelled</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fib in user.fibSubscriptions" :key="fib.id"
              class="transition-colors hover:bg-surface-raised"
              style="border-bottom:1px solid var(--border-inner)">
              <td class="px-4 py-3">
                <span :class="['text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins', PLAN_COLOR[fib.plan] ?? 'bg-surface-raised text-text-muted']">
                  {{ fib.plan }}
                </span>
              </td>
              <td class="px-4 py-3">
                <p class="text-[14px] font-mono" :style="`color:var(--text-heading)`">{{ fib.amountIQD.toLocaleString() }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">{{ fib.intervalMonths }} mo</p>
              </td>
              <td class="px-4 py-3">
                <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
                  style="background:var(--surface-raised);color:var(--text-muted)">
                  {{ fib.fibStatus }}
                </span>
              </td>
              <td class="px-4 py-3">
                <p class="text-[14px] font-mono" :style="`color:var(--text-subtle)`">{{ fmt(fib.activatedAt) }}</p>
              </td>
              <td class="px-4 py-3">
                <p class="text-[14px] font-mono" :style="`color:var(--text-subtle)`">{{ fmt(fib.cancelledAt) }}</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="py-6">
        <UiEmpty>
          <UiEmptyMedia>
            <AppIconsax name="Receipt" color="var(--color-text-subtle)" :size="28" />
          </UiEmptyMedia>
          <UiEmptyContent>
            <UiEmptyTitle>No FIB payments</UiEmptyTitle>
            <UiEmptyDescription>No FIB payment history found for this user.</UiEmptyDescription>
          </UiEmptyContent>
        </UiEmpty>
      </div>
    </div>

  </div>
</template>
