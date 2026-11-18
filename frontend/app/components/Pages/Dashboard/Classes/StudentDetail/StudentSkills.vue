<script setup lang="ts">
import type { SkillSnapshot } from '~/common/types/class-types'
import { daysAgo } from '~/lib/progress'

// The four skills as bars with a word, and what they are based on, so a score is never
// read without its context.
const props = defineProps<{ skills: SkillSnapshot; lastPracticeAt: string | null }>()

const rows = computed(() => [
  { key: 'Grammar', value: props.skills.grammar, help: 'Correct sentences and word forms' },
  { key: 'Vocabulary', value: props.skills.vocabulary, help: 'Range and fit of the words used' },
  { key: 'Fluency', value: props.skills.fluency, help: 'How naturally the sentences flow' },
  { key: 'Speaking', value: props.skills.speaking, help: 'Pronunciation in voice chats' },
])

const basis = computed(() => {
  const s = props.skills
  if (!s.basedOnMessages) return 'No AI practice yet. Scores appear after their first chat with the AI tutor.'
  const spoken = s.basedOnSpoken ? `, ${s.basedOnSpoken} spoken` : ''
  return `Average of their last ${s.basedOnMessages} scored messages${spoken} · last practised ${daysAgo(props.lastPracticeAt)}`
})
</script>

<template>
  <section aria-labelledby="student-skills" class="dash-card p-5 md:p-6">
    <AppText id="student-skills" size="16" weight="semibold">Skills</AppText>
    <AppText size="14" color="neutral-400" class-list="mt-1">{{ basis }}</AppText>

    <PagesDashboardSharedSkillBars :rows="rows" class="mt-5" />
  </section>
</template>
