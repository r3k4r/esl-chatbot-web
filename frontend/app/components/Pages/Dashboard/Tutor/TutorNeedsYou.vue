<script setup lang="ts">
import type { TutorDashboardData } from '~/common/types/tutor-types'
import { daysAgo } from '~/lib/progress'

// The tutor's to-do list across classes: work to review (oldest first), deadlines this week
// with how many have handed in, and students who haven't practised for a week.
const props = defineProps<{ needs: TutorDashboardData['needsYou'] }>()

const taskLink = (classId: string, taskId: string) => `/dashboard/classes/${classId}/tasks/${taskId}`
const dueLabel = (iso: string) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
const moreInactive = computed(() => props.needs.inactiveCount - props.needs.inactive.length)
</script>

<template>
  <div class="grid gap-5 md-lg:grid-cols-3">
    <section aria-labelledby="tutor-review" class="dash-card p-5">
      <div class="flex items-baseline justify-between gap-3">
        <AppText id="tutor-review" size="16" weight="semibold">To review</AppText>
        <AppText size="14" color="neutral-400" class-list="tabular-nums">{{ needs.toReview.length }}</AppText>
      </div>
      <ul v-if="needs.toReview.length" class="mt-3 divide-y divide-border-inner">
        <li v-for="r in needs.toReview" :key="r.submissionId">
          <AppLink :to="taskLink(r.classId, r.taskId)" class="-mx-2 block rounded-lg px-2 py-2.5 hover:bg-surface-raised">
            <AppText size="14" weight="medium" class-list="truncate">{{ r.studentName }}</AppText>
            <AppText size="13" color="neutral-400" class-list="truncate">{{ r.taskTitle }} · handed in {{ daysAgo(r.handedInAt) }}</AppText>
          </AppLink>
        </li>
      </ul>
      <AppText v-else size="14" color="neutral-400" class-list="mt-3">Every hand-in has feedback.</AppText>
    </section>

    <section aria-labelledby="tutor-due" class="dash-card p-5">
      <AppText id="tutor-due" size="16" weight="semibold">Due this week</AppText>
      <ul v-if="needs.dueSoon.length" class="mt-3 divide-y divide-border-inner">
        <li v-for="t in needs.dueSoon" :key="t.taskId">
          <AppLink :to="taskLink(t.classId, t.taskId)" class="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-raised">
            <div class="min-w-0 flex-1">
              <AppText size="14" weight="medium" class-list="truncate">{{ t.title }}</AppText>
              <AppText size="13" color="neutral-400" class-list="truncate">{{ t.className }} · {{ dueLabel(t.deadline) }}</AppText>
            </div>
            <AppText size="14" weight="medium" class-list="shrink-0 tabular-nums" :title="`${t.handedIn} of ${t.students} handed in`">
              {{ t.handedIn }}/{{ t.students }}
            </AppText>
          </AppLink>
        </li>
      </ul>
      <AppText v-else size="14" color="neutral-400" class-list="mt-3">No deadlines in the next 7 days.</AppText>
    </section>

    <section aria-labelledby="tutor-inactive" class="dash-card p-5">
      <div class="flex items-baseline justify-between gap-3">
        <AppText id="tutor-inactive" size="16" weight="semibold">Worth a nudge</AppText>
        <AppText size="14" color="neutral-400" class-list="tabular-nums">{{ needs.inactiveCount }}</AppText>
      </div>
      <AppText size="13" color="neutral-400" class-list="mt-1">No AI practice for 7 days or more.</AppText>
      <ul v-if="needs.inactive.length" class="mt-2 divide-y divide-border-inner">
        <li v-for="s in needs.inactive" :key="`${s.classId}-${s.userId}`">
          <AppLink :to="`/dashboard/classes/${s.classId}/students/${s.userId}`" class="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 hover:bg-surface-raised">
            <UiAvatar class="size-8 shrink-0">
              <UiAvatarImage v-if="s.avatarUrl" :src="s.avatarUrl" :alt="s.displayName" />
              <UiAvatarFallback class="bg-surface-well text-[13px] font-semibold">{{ s.displayName.charAt(0).toUpperCase() }}</UiAvatarFallback>
            </UiAvatar>
            <div class="min-w-0 flex-1">
              <AppText size="14" weight="medium" class-list="truncate">{{ s.displayName }}</AppText>
              <AppText size="13" color="neutral-400" class-list="truncate">{{ s.className }} · {{ s.lastPracticeAt ? `last ${daysAgo(s.lastPracticeAt)}` : 'never practised' }}</AppText>
            </div>
          </AppLink>
        </li>
      </ul>
      <AppText v-else size="14" color="neutral-400" class-list="mt-3">Everyone practised this week.</AppText>
      <AppText v-if="moreInactive > 0" size="13" color="neutral-400" class-list="mt-2">and {{ moreInactive }} more</AppText>
    </section>
  </div>
</template>
