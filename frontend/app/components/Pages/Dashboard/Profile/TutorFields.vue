<script setup lang="ts">
import { AI_PERSONALITIES, optionLabel } from '~/common/data/profile-options'
import { TUTOR_ACCENTS, TUTOR_VOICES } from '~/common/data/tutor-voice'
import type { ProfileFormValues } from '~/common/schemas/ProfileSchema'
import type { MyLearnerProfile } from '~/common/types/profile-types'

// The AI tutor: how it talks to you and how it sounds (the same voice setting as the chat and
// Voice Lab pickers). Three short choices side by side, label above each, so the card stays one row.
const props = defineProps<{ learner: MyLearnerProfile | null; editing: boolean }>()
const form = defineModel<ProfileFormValues>('form', { required: true })

const fields = computed(() => [
  { key: 'aiPersonality' as const, label: 'Personality', options: [{ value: 'NONE', label: 'Friendly (default)' }, ...AI_PERSONALITIES], shown: optionLabel(AI_PERSONALITIES, props.learner?.aiPersonality) ?? 'Friendly (default)' },
  { key: 'tutorAccent' as const, label: 'Accent', options: TUTOR_ACCENTS, shown: optionLabel(TUTOR_ACCENTS, props.learner?.tutorAccent ?? 'US') },
  { key: 'tutorVoice' as const, label: 'Voice', options: TUTOR_VOICES, shown: optionLabel(TUTOR_VOICES, props.learner?.tutorVoice ?? 'FEMALE') },
])
</script>

<template>
  <div class="grid gap-4 py-3 sm:grid-cols-3">
    <div v-for="f in fields" :key="f.key" class="min-w-0">
      <AppText size="14" color="neutral-400">{{ f.label }}</AppText>
      <UiSelect v-if="editing" v-model="form[f.key]">
        <UiSelectTrigger class="mt-1.5 w-full text-[14px]"><UiSelectValue /></UiSelectTrigger>
        <UiSelectContent>
          <UiSelectItem v-for="o in f.options" :key="o.value" :value="o.value">{{ o.label }}</UiSelectItem>
        </UiSelectContent>
      </UiSelect>
      <AppText v-else size="15" class-list="mt-1 truncate text-text-heading">{{ f.shown }}</AppText>
    </div>
  </div>
</template>
