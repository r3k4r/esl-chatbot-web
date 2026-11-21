<script setup lang="ts">
import type { AdminDashboardData } from '~/common/types/admin-types'

// Things an admin can act on: paid plans ending this week, and accounts or payments stuck
// half-way.
const props = defineProps<{
  expiring: AdminDashboardData['expiringSoon']
  attention: AdminDashboardData['attention']
  expiredNotDowngraded: number
}>()

const ends = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

const issues = computed(() => [
  { n: props.attention.unverifiedOver24h, text: 'signed up over a day ago and never verified, so they can\'t use the AI', to: '/dashboard/users' },
  { n: props.attention.fibPaymentsStuck, text: 'FIB payments started over an hour ago and never paid', to: '/dashboard/users' },
  { n: props.expiredNotDowngraded, text: 'paid plans past their end date; they move to Free on their next chat', to: '/dashboard/users' },
].filter(i => i.n > 0))
</script>

<template>
  <section aria-labelledby="admin-follow" class="dash-card p-5">
    <AppText id="admin-follow" size="16" weight="semibold">Follow up</AppText>

    <AppText size="14" weight="medium" class-list="mt-4">Plans ending in the next 7 days</AppText>
    <ul v-if="expiring.length" class="mt-1 divide-y divide-border-inner">
      <li v-for="e in expiring.slice(0, 3)" :key="e.userId">
        <AppLink :to="`/dashboard/users/${e.userId}`" class="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-raised">
          <div class="min-w-0 flex-1">
            <AppText size="14" weight="medium" class-list="truncate">{{ e.name }}</AppText>
            <AppText size="13" color="neutral-400">{{ e.plan.charAt(0) + e.plan.slice(1).toLowerCase() }} · ends {{ ends(e.endsAt) }}{{ e.cancelling ? ' · cancelling' : '' }}</AppText>
          </div>
          <AppIconsax name="ArrowRight2" :size="16" color="var(--color-text-subtle)" />
        </AppLink>
      </li>
    </ul>
    <AppLink v-if="expiring.length > 3" to="/dashboard/users" class="mt-1 block text-[14px] text-text-muted hover:text-text-heading">{{ expiring.length - 3 }} more in Users</AppLink>
    <AppText v-else-if="!expiring.length" size="14" color="neutral-400" class-list="mt-1">None this week.</AppText>

    <div class="mt-4 border-t border-border-inner pt-4">
      <AppText size="14" weight="medium">Needs attention</AppText>
      <ul v-if="issues.length" class="mt-2 space-y-2">
        <li v-for="i in issues" :key="i.text">
          <AppLink :to="i.to" class="flex items-start gap-3 rounded-lg bg-surface-raised px-3 py-2.5 hover:bg-surface-well">
            <AppText size="14" weight="semibold" class-list="tabular-nums">{{ i.n }}</AppText>
            <AppText size="14" color="neutral-600">{{ i.text }}</AppText>
          </AppLink>
        </li>
      </ul>
      <AppText v-else size="14" color="neutral-400" class-list="mt-1">Nothing stuck.</AppText>
    </div>
  </section>
</template>
