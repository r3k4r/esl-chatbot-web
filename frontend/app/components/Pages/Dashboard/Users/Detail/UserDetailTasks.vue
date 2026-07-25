<script setup lang="ts">
import type { AdminUserTaskSubmission } from '~/common/types/admin-types'

const props = defineProps<{ taskSubmissions: AdminUserTaskSubmission[] }>()

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function preview(text: string | null) {
  if (!text) return '—'
  return text.length > 60 ? text.slice(0, 60) + '…' : text
}
</script>

<template>
  <div class="dash-card p-6 space-y-4">
    <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
      Task submissions <span class="text-[14px] font-normal" :style="`color:var(--text-muted)`">({{ taskSubmissions.length }} recent)</span>
    </p>

    <div v-if="taskSubmissions.length" class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr style="border-bottom:1px solid var(--border-inner); background:var(--surface-raised)">
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Task</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden sm:table-cell" :style="`color:var(--text-muted)`">Class</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden md:table-cell" :style="`color:var(--text-muted)`">Submitted</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Feedback</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden lg:table-cell" :style="`color:var(--text-muted)`">Preview</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sub in taskSubmissions" :key="sub.id"
            class="transition-colors hover:bg-surface-raised"
            style="border-bottom:1px solid var(--border-inner)">
            <td class="px-4 py-3">
              <p class="text-[14px] font-semibold font-poppins" :style="`color:var(--text-heading)`">{{ sub.task.title }}</p>
              <p v-if="sub.task.deadline" class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">
                Due {{ fmt(sub.task.deadline) }}
              </p>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell">
              <p class="text-[14px] font-poppins" :style="`color:var(--text-body)`">{{ sub.task.class.className }}</p>
            </td>
            <td class="px-4 py-3 hidden md:table-cell">
              <p class="text-[14px] font-mono" :style="`color:var(--text-subtle)`">{{ fmt(sub.createdAt) }}</p>
            </td>
            <td class="px-4 py-3">
              <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
                :style="sub.feedback
                  ? 'background:var(--status-active-bg);color:var(--status-active-text)'
                  : 'background:var(--status-inactive-bg);color:var(--status-inactive-text)'">
                {{ sub.feedback ? 'Yes' : 'No' }}
              </span>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <p class="text-[14px] font-poppins max-w-48 truncate" :style="`color:var(--text-muted)`">
                {{ preview(sub.feedback) }}
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="py-6">
      <UiEmpty>
        <UiEmptyMedia>
          <AppIconsax name="Task" color="var(--color-text-subtle)" :size="28" />
        </UiEmptyMedia>
        <UiEmptyContent>
          <UiEmptyTitle>No task submissions</UiEmptyTitle>
          <UiEmptyDescription>This student hasn't submitted any tasks yet.</UiEmptyDescription>
        </UiEmptyContent>
      </UiEmpty>
    </div>
  </div>
</template>
