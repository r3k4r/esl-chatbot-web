<script setup lang="ts">
import { AI_PERSONALITIES, CEFR_LEVELS } from '~/common/data/profile-options'
import type { AdminUserFormValues } from '~/common/schemas/ProfileSchema'
import ProfileRow from '~/components/Pages/Dashboard/Profile/ProfileRow.vue'

// A student's learning settings as an admin sets them. Unlike the student, an admin can set
// the current level. The AI tutor reads all of it.
defineProps<{ errors: Record<string, string> }>()
const form = defineModel<AdminUserFormValues>('form', { required: true })

const topic = ref('')
function addTopic() {
  const t = topic.value.trim().slice(0, 50)
  if (t && !form.value.topics.some((x) => x.toLowerCase() === t.toLowerCase())) form.value.topics.push(t)
  topic.value = ''
}
const removeTopic = (t: string) => { form.value.topics = form.value.topics.filter((x) => x !== t) }
</script>

<template>
  <ProfileRow label="Level now">
    <UiSelect v-model="form.currentLevel">
      <UiSelectTrigger class="max-w-md text-[14px]"><UiSelectValue /></UiSelectTrigger>
      <UiSelectContent>
        <UiSelectItem value="NONE">Not set</UiSelectItem>
        <UiSelectItem v-for="l in CEFR_LEVELS" :key="l.value" :value="l.value">{{ l.label }}</UiSelectItem>
      </UiSelectContent>
    </UiSelect>
  </ProfileRow>
  <ProfileRow label="Level wanted">
    <UiSelect v-model="form.targetLevel">
      <UiSelectTrigger class="max-w-md text-[14px]"><UiSelectValue /></UiSelectTrigger>
      <UiSelectContent>
        <UiSelectItem value="NONE">Not set</UiSelectItem>
        <UiSelectItem v-for="l in CEFR_LEVELS" :key="l.value" :value="l.value">{{ l.label }}</UiSelectItem>
      </UiSelectContent>
    </UiSelect>
  </ProfileRow>
  <ProfileRow label="Tutor style">
    <UiSelect v-model="form.aiPersonality">
      <UiSelectTrigger class="max-w-md text-[14px]"><UiSelectValue /></UiSelectTrigger>
      <UiSelectContent>
        <UiSelectItem value="NONE">Default</UiSelectItem>
        <UiSelectItem v-for="p in AI_PERSONALITIES" :key="p.value" :value="p.value">{{ p.label }}</UiSelectItem>
      </UiSelectContent>
    </UiSelect>
  </ProfileRow>

  <ProfileRow label="Why they learn" field-id="ue-purpose">
    <UiTextarea id="ue-purpose" v-model="form.learningPurpose" :rows="2" placeholder="e.g. IELTS in March" class="max-w-md resize-none text-[14px]" />
    <FormError v-if="errors.learningPurpose" :error="errors.learningPurpose" />
  </ProfileRow>

  <ProfileRow label="Topics" field-id="ue-topic">
    <div v-if="form.topics.length" class="mb-2 flex flex-wrap items-center gap-2">
      <span v-for="t in form.topics" :key="t" class="inline-flex items-center gap-1 rounded-md bg-surface-raised px-2.5 py-1 text-[14px] text-text-heading">
        {{ t }}
        <AppButton variant="ghost" size="24" radius="4" aspect="square" icon="CloseCircle" :icon-config="{ color: 'currentColor', size: 16 }" class-list="-me-1 text-text-muted" :aria-label="`Remove ${t}`" @click="removeTopic(t)" />
      </span>
    </div>
    <div class="flex max-w-md gap-2">
      <FormInput id="ue-topic" v-model="topic" placeholder="Add a topic, e.g. football" class-list="flex-1" @keydown.enter.prevent="addTopic" />
      <AppButton variant="secondary" size="40" radius="8" text="Add" class-list="text-[14px]" @click="addTopic" />
    </div>
    <FormError v-if="errors.topics" :error="errors.topics" />
  </ProfileRow>
</template>
