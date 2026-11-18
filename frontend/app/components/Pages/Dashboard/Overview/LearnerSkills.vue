<script setup lang="ts">
import type { LearnerSkills } from '~/common/types/dashboard-overview-types'

// The learner's four skills from their recent AI chats, next to the level they think they
// are, the level the AI hears, and the level they're aiming for.
const props = defineProps<{ skills: LearnerSkills }>()

const rows = computed(() => [
  { key: 'Grammar', value: props.skills.grammar, help: 'Correct sentences and word forms' },
  { key: 'Vocabulary', value: props.skills.vocabulary, help: 'Range and fit of your words' },
  { key: 'Fluency', value: props.skills.fluency, help: 'How naturally your sentences flow' },
  { key: 'Speaking', value: props.skills.speaking, help: 'Pronunciation in voice chats' },
])

const levels = computed(() => [
  { label: 'Your level', value: props.skills.selfLevel },
  { label: 'AI hears', value: props.skills.level },
  { label: 'Aiming for', value: props.skills.targetLevel },
].filter(l => l.value))

const basis = computed(() => {
  const s = props.skills
  if (!s.basedOnMessages) return 'Chat with the AI tutor and your scores appear here.'
  const spoken = s.basedOnSpoken ? `, ${s.basedOnSpoken} of them spoken` : ''
  return `From your last ${s.basedOnMessages} scored messages${spoken}.`
})
</script>

<template>
  <section aria-labelledby="learner-skills" class="dash-card p-5 md:p-6">
    <div class="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div>
        <AppText id="learner-skills" size="16" weight="semibold">Skills</AppText>
        <AppText size="14" color="neutral-400" class-list="mt-1">{{ basis }}</AppText>
      </div>
      <dl v-if="levels.length" class="flex gap-5">
        <div v-for="l in levels" :key="l.label">
          <dt><AppText size="13" color="neutral-400">{{ l.label }}</AppText></dt>
          <dd><AppText size="16" weight="semibold">{{ l.value }}</AppText></dd>
        </div>
      </dl>
    </div>
    <PagesDashboardSharedSkillBars :rows="rows" class="mt-5" />
  </section>
</template>
