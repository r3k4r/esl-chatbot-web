<script setup lang="ts">
import { useAssignWordsPage } from '~/composables/useAssignWordsPage'
import WordFormCard from './WordFormCard.vue'
import WordRowsInput from './WordRowsInput.vue'
import WordListTargets from './WordListTargets.vue'
import FormActions from '~/components/Block/FormActions.vue'

// Assign words to a class (no listId) or edit a list (listId): a plain form, checked on submit.
const props = defineProps<{ classId: string; listId?: string }>()
const {
  cls, loading, students, editing, listStudents,
  form, schema, filling, submitting,
  addRow, removeRow, pasteWords, fillWithAi, togglePick, submit, back,
  MAX_WORDS,
} = useAssignWordsPage(props.classId, props.listId)
</script>

<template>
  <div class="flex min-h-full flex-col">
    <div class="mb-5 flex items-center gap-3">
      <AppButton aria-label="Back to the class" variant="secondary" size="36" radius="8" aspect="square" icon="ArrowLeft" @click="back" />
      <div class="min-w-0">
        <AppText size="20" weight="semibold" class-list="tracking-tight">{{ editing ? 'Edit words' : 'Assign words' }}</AppText>
        <AppText v-if="cls" size="14" color="neutral-400" class-list="truncate">{{ cls.className }}</AppText>
        <UiSkeleton v-else class="mt-1 h-4 w-40" />
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <UiSkeleton class="h-32 rounded-xl" />
      <UiSkeleton class="h-72 rounded-xl" />
    </div>

    <Form v-else-if="cls" :schema="schema" :form-data="form" class="flex flex-1 flex-col" @submit="submit">
      <template #default="{ errors }">
        <div class="space-y-4">
          <WordFormCard
            title="List name"
            description="Optional. A name groups the words for students, like Unit 3 verbs. Leave it empty to give the words on their own."
          >
            <FormInput id="list-title" v-model="form.title" label="Name" placeholder="e.g. Unit 3 verbs" :error="errors.title" class-list="max-w-lg" />
          </WordFormCard>

          <WordRowsInput
            :rows="form.words"
            :errors="errors.words"
            :editing="editing"
            :filling="filling"
            :max="MAX_WORDS"
            @add="addRow"
            @remove="removeRow"
            @fill="fillWithAi"
            @paste="(id, text, done) => { if (pasteWords(id, text)) done() }"
          />

          <WordListTargets
            v-if="!editing"
            v-model:mode="form.mode"
            :students="students"
            :picked="form.picked"
            :error="errors.picked"
            @toggle="togglePick"
            @set="form.picked = $event"
          />
          <WordFormCard
            v-else
            title="Who has these words"
            :description="`${listStudents} ${listStudents === 1 ? 'student' : 'students'}. Changes reach every student's copy and keep their progress; new words go to the same students.`"
          />
        </div>

        <FormActions :submit-label="editing ? 'Save changes' : 'Assign words'" :submitting="submitting" @cancel="back" />
      </template>
    </Form>
  </div>
</template>
