<script setup lang="ts">
import type { LearnerTask } from '~/common/types/dashboard-overview-types'
import { toneStyle } from '~/lib/progress'

// Class work still waiting for this learner, most urgent first.
defineProps<{ tasks: LearnerTask[] }>()

function due(t: LearnerTask) {
  if (!t.deadline) return 'No deadline'
  const d = new Date(t.deadline)
  return `${t.state === 'MISSING' ? 'Was due' : 'Due'} ${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`
}
</script>

<template>
  <section aria-labelledby="learner-tasks" class="dash-card p-5">
    <div class="flex items-baseline justify-between gap-3">
      <AppText id="learner-tasks" size="16" weight="semibold">Class work</AppText>
      <AppLink to="/dashboard/classes" class="text-[14px] text-text-muted hover:text-text-heading">Classes</AppLink>
    </div>

    <ul v-if="tasks.length" class="mt-3 divide-y divide-border-inner">
      <li v-for="t in tasks" :key="t.id">
        <AppLink :to="`/dashboard/classes/${t.classId}/tasks/${t.id}`" class="-mx-2 flex items-start gap-3 rounded-lg px-2 py-3 hover:bg-surface-raised">
          <div class="min-w-0 flex-1">
            <AppText size="14" weight="medium" class-list="truncate">{{ t.title }}</AppText>
            <AppText size="13" color="neutral-400" class-list="truncate">{{ t.className }} · {{ due(t) }}</AppText>
          </div>
          <UiBadge v-if="t.state === 'MISSING'" class="shrink-0 rounded-md border-0 text-[12px] font-semibold" :style="toneStyle('expired')">Missing</UiBadge>
        </AppLink>
      </li>
    </ul>
    <AppText v-else size="14" color="neutral-400" class-list="mt-3">Nothing to hand in. You're all caught up.</AppText>
  </section>
</template>
