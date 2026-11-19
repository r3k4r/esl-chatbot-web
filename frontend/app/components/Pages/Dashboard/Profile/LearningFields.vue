<script setup lang="ts">
import { CEFR_LEVELS, optionLabel } from '~/common/data/profile-options'
import type { ProfileFormValues } from '~/common/schemas/ProfileSchema'
import type { MyLearnerProfile } from '~/common/types/profile-types'
import ProfileRow from './ProfileRow.vue'

// Learning: where the student is, where they want to be, and why. The AI tutor reads all of it.
defineProps<{ learner: MyLearnerProfile | null; editing: boolean; errors: Record<string, string> }>()
const form = defineModel<ProfileFormValues>('form', { required: true })

const topic = ref('')
function addTopic() {
  const t = topic.value.trim().slice(0, 50)
  if (t && !form.value.topics.some((x) => x.toLowerCase() === t.toLowerCase())) form.value.topics.push(t)
  topic.value = ''
}
const removeTopic = (t: string) => { form.value.topics = form.value.topics.filter((x) => x !== t) }
</script>

<template>
  <!-- Only the goal is the student's to choose; their current level comes from the tutor and teachers -->
  <ProfileRow label="Level I want">
    <UiSelect v-if="editing" v-model="form.targetLevel">
      <UiSelectTrigger class="max-w-md text-[14px]"><UiSelectValue /></UiSelectTrigger>
      <UiSelectContent>
        <UiSelectItem value="NONE">Not set</UiSelectItem>
        <UiSelectItem v-for="l in CEFR_LEVELS" :key="l.value" :value="l.value">{{ l.label }}</UiSelectItem>
      </UiSelectContent>
    </UiSelect>
    <template v-else-if="learner?.targetLevel">{{ optionLabel(CEFR_LEVELS, learner.targetLevel) ?? learner.targetLevel }}</template>
    <span v-else class="text-text-muted">Not set</span>
  </ProfileRow>

  <ProfileRow label="Why I'm learning" field-id="pf-purpose">
    <template v-if="editing">
      <UiTextarea id="pf-purpose" v-model="form.learningPurpose" :rows="2" placeholder="e.g. IELTS in March, speaking with customers at work" class="max-w-md resize-none text-[14px]" />
      <FormError v-if="errors.learningPurpose" :error="errors.learningPurpose" />
    </template>
    <template v-else-if="learner?.learningPurpose">{{ learner.learningPurpose }}</template>
    <span v-else class="text-text-muted">Not set</span>
  </ProfileRow>

  <ProfileRow label="Topics I like" field-id="pf-topic">
    <div class="flex flex-wrap items-center gap-2">
      <span
        v-for="t in (editing ? form.topics : learner?.topicsOfInterest ?? [])"
        :key="t"
        class="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2.5 py-1 text-[14px] text-text-heading"
      >
        {{ t }}
        <AppButton v-if="editing" variant="ghost" size="24" radius="4" aspect="square" icon="CloseCircle" :icon-config="{ color: 'currentColor', size: 16 }" class-list="-me-1 text-text-muted" :aria-label="`Remove ${t}`" @click="removeTopic(t)" />
      </span>
      <span v-if="!editing && !learner?.topicsOfInterest?.length" class="text-text-muted">Not set</span>
    </div>
    <div v-if="editing" class="mt-2 flex max-w-md gap-2">
      <FormInput id="pf-topic" v-model="topic" placeholder="Add a topic, e.g. football" class-list="flex-1" @keydown.enter.prevent="addTopic" />
      <AppButton variant="secondary" size="40" radius="8" text="Add" class-list="text-[14px]" @click="addTopic" />
    </div>
    <FormError v-if="errors.topics" :error="errors.topics" />
  </ProfileRow>
</template>
