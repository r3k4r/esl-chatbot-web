<script setup lang="ts">
import type { Goal, GoalType, GoalDifficulty } from '~/common/model/goal'
import type { CreateGoalInput, UpdateGoalInput } from '~/composables/useGoals'

const props = defineProps<{
  open: boolean
  submitting: boolean
  editGoal?: Goal | null
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  create: [input: CreateGoalInput]
  update: [id: string, input: UpdateGoalInput]
}>()

const form = reactive({
  type: 'VOCABULARY' as GoalType,
  description: '',
  target: 10,
  difficulty: '' as GoalDifficulty | '',
  targetDate: '',
  actionPlan: '',
})

const errors = reactive({ description: '', target: '' })
const isEdit = computed(() => !!props.editGoal)

watch(() => props.editGoal, (g) => {
  if (g) {
    form.type = g.type
    form.description = g.description
    form.target = g.target
    form.difficulty = g.difficulty ?? ''
    form.targetDate = g.targetDate ? g.targetDate.slice(0, 10) : ''
    form.actionPlan = g.actionPlan ?? ''
  } else {
    form.type = 'VOCABULARY'
    form.description = ''
    form.target = 10
    form.difficulty = ''
    form.targetDate = ''
    form.actionPlan = ''
  }
}, { immediate: true })

watch(() => props.open, (v) => {
  if (v) return
  // Always reset on close so the next open starts clean
  errors.description = ''
  errors.target = ''
  form.type = 'VOCABULARY'
  form.description = ''
  form.target = 10
  form.difficulty = ''
  form.targetDate = ''
  form.actionPlan = ''
})

const TYPES: { value: GoalType; label: string; icon: string }[] = [
  { value: 'VOCABULARY',   label: 'Vocabulary',   icon: 'Book1'      },
  { value: 'SPEAKING',     label: 'Speaking',     icon: 'Microphone' },
  { value: 'GRAMMAR',      label: 'Grammar',      icon: 'Teacher'     },
  { value: 'CONVERSATION', label: 'Conversation', icon: 'Messages'   },
  { value: 'STUDY_TIME',   label: 'Study Time',   icon: 'Clock'      },
]

const DIFFICULTIES: { value: GoalDifficulty; label: string; color: string }[] = [
  { value: 'EASY',   label: 'Easy',   color: 'border-emerald-300 text-emerald-600 dark:text-emerald-400' },
  { value: 'MEDIUM', label: 'Medium', color: 'border-amber-300 text-amber-600 dark:text-amber-400'       },
  { value: 'HARD',   label: 'Hard',   color: 'border-orange-300 text-orange-600 dark:text-orange-400'    },
  { value: 'EXPERT', label: 'Expert', color: 'border-red-300 text-red-600 dark:text-red-400'             },
]

const TARGET_UNIT = computed(() => {
  const map: Record<GoalType, string> = {
    VOCABULARY: 'words', SPEAKING: 'minutes', GRAMMAR: 'exercises',
    CONVERSATION: 'sessions', STUDY_TIME: 'minutes',
  }
  return map[form.type]
})

function validate(): boolean {
  errors.description = form.description.trim().length < 3 ? 'At least 3 characters required.' : ''
  errors.target = form.target < 1 ? 'Must be at least 1.' : ''
  return !errors.description && !errors.target
}

function submit() {
  if (!validate()) return
  const targetDate = form.targetDate ? new Date(form.targetDate).toISOString() : undefined
  if (isEdit.value && props.editGoal) {
    emit('update', props.editGoal.id, {
      description: form.description.trim(),
      target: form.target,
      difficulty: (form.difficulty as GoalDifficulty) || null,
      targetDate: targetDate ?? null,
      actionPlan: form.actionPlan.trim() || null,
    })
  } else {
    emit('create', {
      type: form.type,
      description: form.description.trim(),
      target: form.target,
      ...(form.difficulty ? { difficulty: form.difficulty as GoalDifficulty } : {}),
      ...(targetDate ? { targetDate } : {}),
      ...(form.actionPlan.trim() ? { actionPlan: form.actionPlan.trim() } : {}),
    })
  }
}
</script>

<template>
  <UiDialog :open="open" @update:open="emit('update:open', $event)">
    <UiDialogContent class="max-w-lg">
      <UiDialogHeader>
        <UiDialogTitle class="font-poppins text-[18px]">{{ isEdit ? 'Edit goal' : 'New goal' }}</UiDialogTitle>
        <UiDialogDescription class="font-poppins text-[13px]">
          {{ isEdit ? 'Update the details of your goal.' : 'Set a target and start tracking your progress.' }}
        </UiDialogDescription>
      </UiDialogHeader>

      <div class="space-y-5 py-2">

        <!-- Type selector — create only -->
        <div v-if="!isEdit">
          <AppText size="12" weight="semibold" color="neutral-400" class-list="uppercase tracking-[0.14em] font-poppins mb-2">Type</AppText>
          <div class="grid grid-cols-5 gap-2">
            <AppButton
              v-for="t in TYPES"
              :key="t.value"
              variant="secondary"
              size="36"
              radius="12"
              :icon="t.icon as any"
              :text="t.label"
              :class-list="[
                'flex-col! h-auto! py-2.5! text-[10px]! gap-1!',
                form.type === t.value
                  ? 'border-brand-primary! bg-brand-primary/10! text-brand-primary!'
                  : 'text-text-muted!'
              ].join(' ')"
              :icon-config="{ color: form.type === t.value ? 'var(--color-brand-primary)' : 'currentColor', size: 15 }"
              @click="form.type = t.value"
            />
          </div>
        </div>

        <!-- Description -->
        <FormInput
          id="goal-description"
          v-model="form.description"
          label="Description"
          placeholder="e.g. Learn 200 business vocabulary words"
          :error="errors.description"
        />

        <!-- Target + difficulty -->
        <div class="grid grid-cols-2 gap-4">
          <FormInput
            id="goal-target"
            v-model.number="form.target"
            :label="`Target (${TARGET_UNIT})`"
            type="number"
            placeholder="e.g. 200"
            :error="errors.target"
          />

          <div>
            <AppText size="12" weight="semibold" color="neutral-400" class-list="uppercase tracking-[0.14em] font-poppins block mb-2">Difficulty</AppText>
            <div class="grid grid-cols-2 gap-1.5">
              <AppButton
                v-for="d in DIFFICULTIES"
                :key="d.value"
                variant="secondary"
                size="32"
                radius="8"
                :text="d.label"
                :class-list="[
                  'text-[11px]! justify-center!',
                  form.difficulty === d.value ? `${d.color} border-current! bg-current/5!` : 'text-text-muted!'
                ].join(' ')"
                @click="form.difficulty = form.difficulty === d.value ? '' : d.value"
              />
            </div>
          </div>
        </div>

        <!-- Target date -->
        <FormInput
          id="goal-target-date"
          v-model="form.targetDate"
          label="Target date (optional)"
          type="date"
          :min="new Date().toISOString().slice(0, 10)"
        />

        <!-- Action plan -->
        <div>
          <AppText size="12" weight="semibold" color="neutral-400" class-list="uppercase tracking-[0.14em] font-poppins block mb-2">Action plan (optional)</AppText>
          <UiTextarea
            v-model="form.actionPlan"
            placeholder="How will you achieve this goal?"
            class="font-poppins text-[13px] min-h-16 resize-none"
          />
        </div>

      </div>

      <UiDialogFooter>
        <AppButton variant="secondary" size="38" radius="8" text="Cancel" :disabled="submitting" @click="emit('update:open', false)" />
        <AppButton
          variant="primary" size="38" radius="8"
          :icon="isEdit ? 'Edit' : 'Add'" :icon-config="{ color: 'white' }"
          :text="submitting ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save changes' : 'Create goal')"
          :loading="submitting"
          @click="submit"
        />
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
