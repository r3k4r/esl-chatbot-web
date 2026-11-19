<script setup lang="ts">
import type { ClassMember } from '~/common/types/class-types'
import type { WordListTargetMode } from '~/common/types/vocabulary-types'
import WordFormCard from './WordFormCard.vue'

// Who gets the list: every student, only the ticked ones, or everyone except the ticked ones.
const props = defineProps<{
  students: ClassMember[]
  mode: WordListTargetMode
  picked: string[]
  error?: string
}>()
const emit = defineEmits<{ 'update:mode': [WordListTargetMode]; toggle: [id: string]; set: [ids: string[]] }>()

// Big classes: find a student by name, tick or clear everyone shown.
const query = ref('')
const shown = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? props.students.filter((s) => s.user.displayName.toLowerCase().includes(q)) : props.students
})
const selectShown = () => emit('set', [...new Set([...props.picked, ...shown.value.map((s) => s.user.id)])])
const clearShown = () => emit('set', props.picked.filter((id) => !shown.value.some((s) => s.user.id === id)))

const modes: { key: WordListTargetMode; label: string; help: string }[] = [
  { key: 'ALL', label: 'All students', help: 'Every student in the class' },
  { key: 'ONLY', label: 'Only some', help: 'Tick the students who get it' },
  { key: 'EXCEPT', label: 'All except', help: 'Tick the students to leave out' },
]
const initials = (name: string) => name.split(/\s+/).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
const count = computed(() => {
  if (props.mode === 'ALL') return props.students.length
  const n = props.students.filter((s) => props.picked.includes(s.user.id)).length
  return props.mode === 'ONLY' ? n : props.students.length - n
})
</script>

<template>
  <WordFormCard title="Who gets them" :description="`${count} of ${students.length} ${students.length === 1 ? 'student' : 'students'}`">
    <div class="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Who gets the words">
      <AppButton
        v-for="m in modes"
        :key="m.key"
        variant="outline"
        size="auto"
        radius="8"
        role="radio"
        :aria-checked="mode === m.key"
        :class-list="[
          'justify-start items-start gap-3 whitespace-normal px-4 py-3 text-start font-normal',
          mode === m.key ? 'border-brand-primary/60 bg-brand-primary/5 hover:bg-brand-primary/5' : '',
        ].join(' ')"
        @click="emit('update:mode', m.key)"
      >
        <span
          class="mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border"
          :class="mode === m.key ? 'border-brand-primary' : 'border-border-card'"
          aria-hidden="true"
        >
          <span v-if="mode === m.key" class="size-2 rounded-full bg-brand-primary" />
        </span>
        <span>
          <span class="block font-poppins text-[14px] font-medium text-text-heading">{{ m.label }}</span>
          <span class="block font-poppins text-[13px] text-text-muted">{{ m.help }}</span>
        </span>
      </AppButton>
    </div>

    <div v-if="mode !== 'ALL' && students.length > 8" class="mt-4 flex flex-wrap items-center gap-2">
      <FormInput id="student-search" v-model="query" placeholder="Find a student" icon="SearchNormal1" class-list="w-64" />
      <AppButton variant="ghost" size="36" radius="8" text="Select all" class-list="text-[14px]" @click="selectShown" />
      <AppButton variant="ghost" size="36" radius="8" text="Clear" class-list="text-[14px]" @click="clearShown" />
    </div>
    <ul v-if="mode !== 'ALL'" class="mt-3 grid max-h-80 gap-1 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
      <li v-if="!shown.length" class="px-3 py-2">
        <AppText size="14" color="neutral-400">No student matches “{{ query }}”.</AppText>
      </li>
      <li v-for="s in shown" :key="s.id">
        <label class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised">
          <UiCheckbox :model-value="picked.includes(s.user.id)" @update:model-value="emit('toggle', s.user.id)" />
          <UiAvatar class="size-8">
            <UiAvatarImage v-if="s.user.avatarUrl" :src="s.user.avatarUrl" :alt="s.user.displayName" />
            <UiAvatarFallback class="bg-surface-well text-[13px] text-text-muted">{{ initials(s.user.displayName) }}</UiAvatarFallback>
          </UiAvatar>
          <span
            class="min-w-0 flex-1 truncate font-poppins text-[14px] text-text-body"
            :class="{ 'text-text-subtle line-through': mode === 'EXCEPT' && picked.includes(s.user.id) }"
          >{{ s.user.displayName }}</span>
        </label>
      </li>
    </ul>
    <FormError v-if="error" :error="error" />
  </WordFormCard>
</template>
