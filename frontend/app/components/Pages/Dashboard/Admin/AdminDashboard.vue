<script setup lang="ts">
import type { KeyFigure } from '~/common/types/dashboard-types'
import { newestRows, quietRows } from '~/lib/admin-people'

// Admin home, one screen: this week against the week before, the last 30 days as three charts,
// then what needs a look (follow-ups, newest accounts, who went quiet). Classes, skills and
// mistakes live on /dashboard/learning; the funnel, plans, money and AI use on /dashboard/revenue.
// "Active" = sent the AI tutor a message.
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

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const charts = computed(() => {
  const t = data.value?.trend ?? []
  const learners = t.map(d => d.activeLearners)
  const messages = t.map(d => d.messages)
  const signUps = t.map(d => d.signUps)
  // Accounts at the end of each day: today's total, walked back through the sign-ups.
  const total = data.value?.users.total ?? 0
  let running = total - sum(signUps)
  const accounts = signUps.map(n => (running += n))
  const plural = (n: number, w: string) => `${n.toLocaleString()} ${w}${n === 1 ? '' : 's'}`
  return [
    {
      title: 'Active learners per day', kind: 'bars' as const, values: learners,
      value: String(Math.max(0, ...learners)), context: 'on the busiest day',
      tip: (v: number) => plural(v, 'learner'),
    },
    {
      title: 'AI messages', kind: 'area' as const, values: messages,
      value: sum(messages).toLocaleString(), context: `in 30 days · ${sum(messages.slice(-7)).toLocaleString()} this week`,
      tip: (v: number) => plural(v, 'message'),
    },
    {
      title: 'Accounts', kind: 'line' as const, values: accounts,
      value: total.toLocaleString(), context: `+${sum(signUps)} in 30 days`,
      tip: (v: number, i: number) => `${plural(v, 'account')}${signUps[i] ? ` (+${signUps[i]})` : ''}`,
    },
  ]
})
</script>

<template>
  <div class="h-full overflow-y-auto page-padding md:p-6">
    <div class="space-y-5">
      <header>
        <AppText size="24" weight="semibold" font-family="poppins" class-list="tracking-tight">This week</AppText>
        <AppText size="14" color="neutral-400" class-list="mt-0.5">
          {{ today }}<template v-if="data"> · {{ data.users.total.toLocaleString() }} accounts ({{ data.users.students }} students, {{ data.users.tutors }} teachers)</template>
        </AppText>
      </header>

      <BlockLoadError
        v-if="error && !data"
        title="We couldn't load the admin overview"
        :detail="error"
        :retrying="loading"
        @retry="fetchAdminDashboard"
      />

      <template v-else-if="data">
        <PagesDashboardSharedKeyFigures data-guide="admin-figures" :items="figures" />

        <div data-guide="admin-trend" class="grid gap-5 md-lg:grid-cols-3">
          <PagesDashboardAdminDayChart
            v-for="c in charts" :key="c.title"
            :title="c.title" :value="c.value" :context="c.context" :kind="c.kind"
            :dates="data.trend.map(d => d.date)" :values="c.values" :tip="c.tip"
          />
        </div>

        <div class="grid gap-5 md-lg:grid-cols-3">
          <PagesDashboardAdminFollowUps data-guide="admin-followups" :expiring="data.expiringSoon" :attention="data.attention" :expired-not-downgraded="data.plans.expiredNotDowngraded" />
          <PagesDashboardAdminPeopleList data-guide="admin-people" title="Newest accounts" :rows="newestRows(data.people).slice(0, 4)" :total="data.people.newest.length > 4 ? data.users.total : undefined" empty="No accounts yet." />
          <PagesDashboardAdminPeopleList
            title="Gone quiet" hint="Practised before, nothing in the last 7 days."
            :rows="quietRows(data.people).slice(0, 4)" :total="data.people.goneQuietCount"
            empty="Everyone who practised came back this week."
          />
        </div>
      </template>

      <SkeletonsAdminDashboardSkeleton v-else />
    </div>
  </div>
</template>
