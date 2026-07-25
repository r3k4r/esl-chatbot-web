<script setup lang="ts">
import type { AdminUserProgress } from '~/common/types/admin-types'

const props = defineProps<{ progress: AdminUserProgress[] }>()

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="dash-card p-6 space-y-4">
    <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
      Daily progress <span class="text-[14px] font-normal" :style="`color:var(--text-muted)`">({{ progress.length }} days)</span>
    </p>

    <div v-if="progress.length" class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr style="border-bottom:1px solid var(--border-inner); background:var(--surface-raised)">
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Date</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Sessions</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden sm:table-cell" :style="`color:var(--text-muted)`">Study min</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden md:table-cell" :style="`color:var(--text-muted)`">Messages</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden md:table-cell" :style="`color:var(--text-muted)`">Words typed</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden lg:table-cell" :style="`color:var(--text-muted)`">Vocab practiced</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden lg:table-cell" :style="`color:var(--text-muted)`">Goals advanced</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in progress" :key="p.date"
            class="transition-colors hover:bg-surface-raised"
            style="border-bottom:1px solid var(--border-inner)">
            <td class="px-4 py-3">
              <p class="text-[14px] font-mono" :style="`color:var(--text-heading)`">{{ fmt(p.date) }}</p>
            </td>
            <td class="px-4 py-3">
              <p class="text-[14px] font-poppins" :style="`color:var(--text-heading)`">{{ p.sessionsCount }}</p>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell">
              <p class="text-[14px] font-poppins" :style="`color:var(--text-heading)`">{{ p.studyMinutes }}</p>
            </td>
            <td class="px-4 py-3 hidden md:table-cell">
              <p class="text-[14px] font-poppins" :style="`color:var(--text-heading)`">{{ p.messagesCount }}</p>
            </td>
            <td class="px-4 py-3 hidden md:table-cell">
              <p class="text-[14px] font-mono" :style="`color:var(--text-subtle)`">{{ p.wordsTyped.toLocaleString() }}</p>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <p class="text-[14px] font-poppins" :style="`color:var(--text-heading)`">{{ p.vocabularyPracticed }}</p>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <p class="text-[14px] font-poppins" :style="`color:var(--text-heading)`">{{ p.goalsAdvanced }}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="py-6">
      <UiEmpty>
        <UiEmptyMedia>
          <AppIconsax name="Chart" color="var(--color-text-subtle)" :size="28" />
        </UiEmptyMedia>
        <UiEmptyContent>
          <UiEmptyTitle>No progress data</UiEmptyTitle>
          <UiEmptyDescription>No daily progress records found for this student.</UiEmptyDescription>
        </UiEmptyContent>
      </UiEmpty>
    </div>
  </div>
</template>
