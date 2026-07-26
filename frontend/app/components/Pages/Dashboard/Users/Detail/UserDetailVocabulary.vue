<script setup lang="ts">
import type { AdminUserVocab } from '~/common/types/admin-types'

const props = defineProps<{ vocabularies: AdminUserVocab[] }>()

// masteryLevel: 0=new/gray, 1=seen/blue, 2=learning/yellow, 3=familiar/orange, 4=proficient/teal, 5=mastered/green
// Named separately so the template can fall back to it without TS treating the
// indexed lookup as possibly-undefined.
const MASTERY_NEW = { label: 'New', style: 'background:var(--surface-raised);color:var(--text-muted)' }

const MASTERY_STYLE: Record<number, { label: string; style: string }> = {
  0: MASTERY_NEW,
  1: { label: 'Seen',       style: 'background:#dbeafe;color:#1e40af' },
  2: { label: 'Learning',   style: 'background:#fef3c7;color:#92400e' },
  3: { label: 'Familiar',   style: 'background:#ffedd5;color:#c2410c' },
  4: { label: 'Proficient', style: 'background:#ccfbf1;color:#0f766e' },
  5: { label: 'Mastered',   style: 'background:#dcfce7;color:#166534' },
}

const SOURCE_STYLE: Record<string, string> = {
  MANUAL:   'background:var(--surface-raised);color:var(--text-muted)',
  SESSION:  'background:#ede9fe;color:#5b21b6',
  ASSIGNED: 'background:#dbeafe;color:#1e40af',
}

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
</script>

<template>
  <div class="dash-card p-6 space-y-4">
    <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
      Vocabulary <span class="text-[14px] font-normal" :style="`color:var(--text-muted)`">({{ vocabularies.length }} words)</span>
    </p>

    <div v-if="vocabularies.length" class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr style="border-bottom:1px solid var(--border-inner); background:var(--surface-raised)">
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Word</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden md:table-cell" :style="`color:var(--text-muted)`">Definition</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden sm:table-cell" :style="`color:var(--text-muted)`">Type</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">Mastery</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden lg:table-cell" :style="`color:var(--text-muted)`">Source</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden lg:table-cell" :style="`color:var(--text-muted)`">Correct</th>
            <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden xl:table-cell" :style="`color:var(--text-muted)`">Practiced</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="v in vocabularies" :key="v.id"
            class="transition-colors hover:bg-surface-raised"
            style="border-bottom:1px solid var(--border-inner)">
            <td class="px-4 py-3">
              <p class="text-[14px] font-semibold font-poppins" :style="`color:var(--text-heading)`">{{ v.word }}</p>
              <p v-if="v.partOfSpeech" class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">{{ v.partOfSpeech }}</p>
            </td>
            <td class="px-4 py-3 hidden md:table-cell">
              <p class="text-[14px] font-poppins max-w-48 truncate" :style="`color:var(--text-body)`">{{ v.definition }}</p>
              <p v-if="v.assignedByTutor" class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">
                by {{ v.assignedByTutor.displayName }}
              </p>
            </td>
            <td class="px-4 py-3 hidden sm:table-cell">
              <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">{{ v.partOfSpeech ?? '—' }}</p>
            </td>
            <td class="px-4 py-3">
              <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
                :style="MASTERY_STYLE[v.masteryLevel]?.style ?? MASTERY_NEW.style">
                {{ MASTERY_STYLE[v.masteryLevel]?.label ?? 'New' }}
              </span>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
                :style="SOURCE_STYLE[v.source] ?? SOURCE_STYLE.MANUAL">
                {{ v.source.charAt(0) + v.source.slice(1).toLowerCase() }}
              </span>
            </td>
            <td class="px-4 py-3 hidden lg:table-cell">
              <p class="text-[14px] font-mono" :style="`color:var(--text-subtle)`">
                {{ v.correctCount }}/{{ v.reviewCount }}
              </p>
            </td>
            <td class="px-4 py-3 hidden xl:table-cell">
              <p class="text-[14px] font-mono" :style="`color:var(--text-subtle)`">{{ fmt(v.lastPracticed) }}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="py-6">
      <UiEmpty>
        <UiEmptyMedia>
          <AppIconsax name="Book1" color="var(--color-text-subtle)" :size="28" />
        </UiEmptyMedia>
        <UiEmptyContent>
          <UiEmptyTitle>No vocabulary</UiEmptyTitle>
          <UiEmptyDescription>This student hasn't added any vocabulary words yet.</UiEmptyDescription>
        </UiEmptyContent>
      </UiEmpty>
    </div>
  </div>
</template>
