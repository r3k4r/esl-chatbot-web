<script setup lang="ts">
import { DAILY_GOAL_OPTIONS, dailyGoalOf } from '~/common/data/practice-goals'
import type { ProfileFormValues } from '~/common/schemas/ProfileSchema'
import type { MyLearnerProfile } from '~/common/types/profile-types'

// The daily goal: the dashboard measures each day against it.
// The goal is one of the presets or any number of minutes in the Custom box (5-120, checked on Save).
const props = defineProps<{ learner: MyLearnerProfile | null; editing: boolean; errors: Record<string, string> }>()
const form = defineModel<ProfileFormValues>('form', { required: true })

const daily = computed(() => dailyGoalOf(props.learner?.weeklyGoalMinutes))
const presetMinutes = DAILY_GOAL_OPTIONS.map((o) => o.minutes)

// The Custom box keeps its own text (typing 1 then 5 must not jump to the 15 preset).
// It starts filled when the saved goal isn't a preset; picking a preset empties it.
const customText = ref('')
watch(() => props.editing, (on) => {
  if (on) customText.value = presetMinutes.includes(form.value.dailyGoal) ? '' : String(form.value.dailyGoal)
}, { immediate: true })
const custom = computed({
  get: () => customText.value,
  set: (v: string) => {
    customText.value = v
    form.value.dailyGoal = v === '' ? Number.NaN : Number(v)
  },
})
function pickPreset(minutes: number) {
  customText.value = ''
  form.value.dailyGoal = minutes
}
const isPicked = (minutes: number) => !customText.value && form.value.dailyGoal === minutes
</script>

<template>
  <div class="py-3">
    <template v-if="editing">
      <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Daily goal">
        <AppButton
          v-for="o in DAILY_GOAL_OPTIONS"
          :key="o.minutes"
          variant="outline"
          size="auto"
          radius="8"
          role="radio"
          :aria-checked="isPicked(o.minutes)"
          :class-list="[
            'w-22 flex-col items-start gap-0 px-3 py-2 text-start font-normal',
            isPicked(o.minutes) ? 'border-brand-primary bg-surface-well hover:bg-surface-well' : '',
          ].join(' ')"
          @click="pickPreset(o.minutes)"
        >
          <span class="font-poppins text-[15px] font-semibold tabular-nums text-text-heading">{{ o.minutes }} min</span>
          <span class="font-poppins text-[14px] text-text-muted">{{ o.label }}</span>
        </AppButton>
        <label
          for="pf-goal"
          class="flex w-28 flex-col justify-center rounded-lg border px-3 py-1.5"
          :class="customText ? 'border-brand-primary bg-surface-well' : 'border-border-card'"
        >
          <span class="font-poppins text-[14px] text-text-muted">Custom</span>
          <span class="flex items-center gap-1.5">
            <FormInput id="pf-goal" v-model="custom" accept-only="numbers" inputmode="numeric" placeholder="25" rounded="lg" class-list="h-7 w-14 px-2 text-[15px] tabular-nums" />
            <span class="font-poppins text-[14px] text-text-muted">min</span>
          </span>
        </label>
      </div>
      <FormError v-if="errors.dailyGoal" :error="errors.dailyGoal" />
    </template>
    <AppText v-else size="15" class-list="text-text-heading">
      {{ daily }} minutes a day <span class="text-text-muted">· {{ daily * 7 }} a week</span>
    </AppText>
  </div>
</template>
