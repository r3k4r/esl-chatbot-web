<script setup lang="ts">
import type { AdminUserSession } from '~/common/types/admin-types'

const props = defineProps<{ sessions: AdminUserSession[] }>()

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDuration(secs: number | null | undefined) {
  if (!secs) return '—'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
</script>

<template>
  <div class="dash-card p-6 space-y-4">
    <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
      Sessions <span class="text-[14px] font-normal" :style="`color:var(--text-muted)`">({{ sessions.length }} recent)</span>
    </p>

    <div v-if="sessions.length" class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr style="border-bottom:1px solid var(--border-inner); background:var(--surface-raised)">
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Mode</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Topic</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden sm:table-cell" :style="`color:var(--text-muted)`">Started</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden md:table-cell" :style="`color:var(--text-muted)`">Duration</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden md:table-cell" :style="`color:var(--text-muted)`">Messages</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden lg:table-cell" :style="`color:var(--text-muted)`">Overall</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden lg:table-cell" :style="`color:var(--text-muted)`">CEFR</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="s in sessions" :key="s.id"
            class="transition-colors hover:bg-surface-raised"
            style="border-bottom:1px solid var(--border-inner)">
            <td class="px-4 py-3">
              <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
                :style="s.mode === 'VOICE'
                  ? 'background:#ede9fe;color:#5b21b6'
                  : 'background:var(--surface-raised);color:var(--text-muted)'">
                {{ s.mode.charAt(0) + s.mode.slice(1).toLowerCase() }}
              </span>
            </td>
            <td class="px-4 py-3">
              <p class="text-[14px] font-poppins max-w-40 truncate" :style="`color:var(--text-heading)`">
                {{ s.topic ?? 'General chat' }}
              </p>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell">
              <p class="text-[14px] font-mono" :style="`color:var(--text-subtle)`">{{ fmt(s.startedAt) }}</p>
            </td>
            <td class="px-4 py-3 hidden md:table-cell">
              <p class="text-[14px] font-mono" :style="`color:var(--text-subtle)`">{{ formatDuration(s.durationSeconds) }}</p>
            </td>
            <td class="px-4 py-3 hidden md:table-cell">
              <p class="text-[14px] font-poppins" :style="`color:var(--text-heading)`">{{ s.messageCount }}</p>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <p class="text-[14px] font-semibold font-mono" style="color:var(--color-brand-primary)">
                {{ s.evaluation ? s.evaluation.avgOverallScore.toFixed(0) : '—' }}
              </p>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <span v-if="s.evaluation?.detectedCefrLevel"
                class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
                style="background:var(--surface-raised);color:var(--text-heading)">
                {{ s.evaluation.detectedCefrLevel }}
              </span>
              <span v-else class="text-[14px] font-poppins" :style="`color:var(--text-subtle)`">—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="py-6">
      <UiEmpty>
        <UiEmptyMedia>
          <AppIconsax name="MessageText" color="var(--color-text-subtle)" :size="28" />
        </UiEmptyMedia>
        <UiEmptyContent>
          <UiEmptyTitle>No sessions</UiEmptyTitle>
          <UiEmptyDescription>This student hasn't had any conversation sessions yet.</UiEmptyDescription>
        </UiEmptyContent>
      </UiEmpty>
    </div>
  </div>
</template>
