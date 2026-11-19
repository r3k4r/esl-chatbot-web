<script setup lang="ts">
import type { WordListFormValues } from '~/common/schemas/WordListSchema'
import WordFormCard from './WordFormCard.vue'

type Row = WordListFormValues['words'][number]
type RowErrors = Partial<Record<keyof Row, string>>

// The words of the list: one box per word with its meaning, example and part of speech.
// The teacher writes them, or types only the words and lets the AI fill what is empty.
// When editing, words already in the list can be changed but not removed.
const props = defineProps<{
  rows: Row[]
  errors?: RowErrors[] | string
  editing?: boolean
  filling?: boolean
  max: number
}>()
const emit = defineEmits<{ add: []; remove: [id: string]; fill: []; paste: [id: string, text: string, done: () => void] }>()

const PARTS = ['noun', 'verb', 'adjective', 'adverb', 'phrase', 'preposition', 'pronoun', 'conjunction', 'other']
const NONE = 'NONE' // UiSelect forbids an empty value
const rowError = (i: number): RowErrors => (Array.isArray(props.errors) ? props.errors[i] ?? {} : {})

function onPaste(e: ClipboardEvent, id: string) {
  const text = e.clipboardData?.getData('text') ?? ''
  if (/[\n,;]/.test(text)) emit('paste', id, text, () => e.preventDefault())
}
</script>

<template>
  <WordFormCard
    title="Words"
    description="Write each word's meaning, or type only the words and let the AI fill the rest. Paste a list into a Word box to add many at once."
  >
    <template #action>
      <AppButton
        variant="secondary"
        size="38"
        radius="8"
        icon="Magicpen"
        :text="filling ? 'Filling…' : 'Fill meanings with AI'"
        :loading="filling"
        class-list="text-[14px]"
        @click="emit('fill')"
      />
    </template>

    <TransitionGroup tag="div" class="grid gap-4 lg:grid-cols-2" move-class="transition-transform duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] motion-reduce:transition-none">
      <div v-for="(row, i) in rows" :key="row.id" class="rounded-lg bg-surface-raised" dir="ltr">
        <div class="flex items-center gap-2 px-4 pt-3">
          <AppText size="14" weight="medium">Word {{ i + 1 }}</AppText>
          <span v-if="editing && !row.locked" class="rounded-md bg-brand-primary/10 px-1.5 py-0.5 font-poppins text-[13px] font-medium text-brand-primary">New</span>
          <AppButton
            v-if="!row.locked"
            variant="ghost"
            size="32"
            radius="8"
            aspect="square"
            icon="Trash"
            :icon-config="{ color: '#ef4444' }"
            :aria-label="`Remove word ${i + 1}`"
            class-list="ms-auto"
            @click="emit('remove', row.id)"
          />
        </div>

        <div class="grid gap-4 px-4 pt-2 pb-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
          <FormInput
            :id="`word-${row.id}`"
            v-model="row.word"
            label="Word"
            placeholder="e.g. borrow"
            :disabled="row.locked"
            :error="rowError(i).word"
            @paste="onPaste($event, row.id)"
          />
          <div>
            <FormLabel :for-id="`pos-${row.id}`" label="Part of speech" />
            <UiSelect :model-value="row.partOfSpeech || NONE" @update:model-value="row.partOfSpeech = $event === NONE ? '' : String($event)">
              <UiSelectTrigger :id="`pos-${row.id}`" class="mt-1.5 w-full text-[14px]">
                <UiSelectValue />
              </UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem :value="NONE">Not set</UiSelectItem>
                <UiSelectItem v-for="p in PARTS" :key="p" :value="p" class="capitalize">{{ p }}</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
          <div class="sm:col-span-2">
            <FormLabel :for-id="`meaning-${row.id}`" label="Meaning" />
            <UiTextarea
              :id="`meaning-${row.id}`"
              v-model="row.definition"
              rows="2"
              placeholder="What it means, in simple words"
              :aria-invalid="!!rowError(i).definition || undefined"
              class="mt-1.5 min-h-0 resize-y text-[14px]"
            />
            <FormError v-if="rowError(i).definition" :error="rowError(i).definition" />
          </div>
          <div class="sm:col-span-2">
            <FormInput
              :id="`example-${row.id}`"
              v-model="row.example"
              label="Example sentence"
              placeholder="Optional"
              :error="rowError(i).example"
            />
          </div>
        </div>
      </div>
    </TransitionGroup>

    <div class="mt-4 flex flex-wrap items-center gap-3">
      <AppButton
        variant="outline"
        size="36"
        radius="8"
        icon="Add"
        text="Add word"
        class-list="text-[14px]"
        @click="emit('add')"
      />
      <AppText size="13" color="neutral-400" class-list="tabular-nums">{{ rows.length }} / {{ max }}</AppText>
    </div>
    <FormError v-if="typeof errors === 'string'" :error="errors" />
  </WordFormCard>
</template>
