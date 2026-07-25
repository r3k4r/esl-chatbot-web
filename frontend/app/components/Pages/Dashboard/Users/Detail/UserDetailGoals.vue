<script setup lang="ts">
import type { AdminUserGoal } from '~/common/types/admin-types'

const props = defineProps<{ goals: AdminUserGoal[] }>()

const STATUS_STYLE: Record<string, string> = {
  ACTIVE:    'background:var(--status-active-bg);color:var(--status-active-text)',
  COMPLETED: 'background:var(--status-active-bg);color:var(--status-active-text)',
  PAUSED:    'background:var(--status-inactive-bg);color:var(--status-inactive-text)',
  CANCELLED: 'background:var(--status-expired-bg);color:var(--status-expired-text)',
}

const DIFF_STYLE: Record<string, string> = {
  EASY:   'background:#d1fae5;color:#065f46',
  MEDIUM: 'background:#fef3c7;color:#92400e',
  HARD:   'background:#fee2e2;color:#991b1b',
  EXPERT: 'background:#ede9fe;color:#5b21b6',
}

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="dash-card p-6 space-y-4">
    <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Goals</p>

    <div v-if="goals.length" class="space-y-3">
      <div v-for="goal in goals" :key="goal.id"
        class="p-4 rounded-xl space-y-3"
        style="background:var(--surface-raised)">

        <div class="flex items-start justify-between gap-3 flex-wrap">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <!-- Type -->
              <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
                style="background:var(--surface-card);color:var(--text-muted)">
                {{ goal.type }}
              </span>
              <!-- Difficulty -->
              <span v-if="goal.difficulty" class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
                :style="DIFF_STYLE[goal.difficulty] ?? 'background:var(--surface-raised);color:var(--text-muted)'">
                {{ goal.difficulty.charAt(0) + goal.difficulty.slice(1).toLowerCase() }}
              </span>
              <!-- Status -->
              <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
                :style="STATUS_STYLE[goal.status] ?? STATUS_STYLE.PAUSED">
                {{ goal.status.charAt(0) + goal.status.slice(1).toLowerCase() }}
              </span>
            </div>
            <p class="text-[15px] font-poppins" :style="`color:var(--text-heading)`">{{ goal.description }}</p>
          </div>
          <div class="text-right shrink-0">
            <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Target date</p>
            <p class="text-[14px] font-mono" :style="`color:var(--text-subtle)`">{{ fmt(goal.targetDate) }}</p>
          </div>
        </div>

        <!-- Progress bar -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Progress</p>
            <p class="text-[14px] font-semibold font-poppins" style="color:var(--color-brand-primary)">{{ goal.progress }}%</p>
          </div>
          <div class="h-2 rounded-md overflow-hidden" style="background:var(--surface-card)">
            <div class="h-full rounded-md" style="background:var(--color-brand-primary)"
              :style="`width:${goal.progress}%`" />
          </div>
        </div>

        <!-- Assigned by -->
        <p v-if="goal.assignedByTutor" class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">
          Assigned by <span :style="`color:var(--text-heading)`">{{ goal.assignedByTutor.displayName }}</span>
        </p>
      </div>
    </div>

    <div v-else class="py-6">
      <UiEmpty>
        <UiEmptyMedia>
          <AppIconsax name="Flag" color="var(--color-text-subtle)" :size="28" />
        </UiEmptyMedia>
        <UiEmptyContent>
          <UiEmptyTitle>No goals</UiEmptyTitle>
          <UiEmptyDescription>This student hasn't set any goals yet.</UiEmptyDescription>
        </UiEmptyContent>
      </UiEmpty>
    </div>
  </div>
</template>
