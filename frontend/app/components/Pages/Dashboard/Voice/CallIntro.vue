<script setup lang="ts">
// Before the call: what it is, one button, and words to start with (beginners freeze
// most on the first sentence).
defineProps<{ disabled?: boolean }>()
const emit = defineEmits<{ start: [] }>()

const starters = ['Hi, my name is …', 'Can we talk about my day?', 'Help me practise for a job interview.']
const steps = [
  'The tutor says hello first and asks you a question.',
  'Answer out loud. Talk over it any time, like a real call.',
  'Your scores update after every answer.',
]
</script>

<template>
  <div class="dash-card flex h-full min-h-[540px] flex-col items-center justify-center px-6 py-10 text-center">
    <PagesDashboardVoiceCallOrb />

    <AppText size="24" weight="semibold" class-list="mt-6 tracking-tight">Call Tutelage AI</AppText>
    <AppText size="15" color="neutral-400" class-list="mt-2 max-w-md">
      A live English call with a patient tutor. It answers right away, in a real voice.
    </AppText>

    <AppButton
      variant="primary"
      size="48"
      radius="12"
      icon="Call"
      :icon-config="{ color: 'white' }"
      text="Start call"
      :disabled="disabled"
      class-list="mt-7 min-w-44 px-6 text-[15px]"
      @click="emit('start')"
    />

    <div class="mt-9 w-full max-w-lg">
      <AppText size="14" color="neutral-400">Not sure what to say? Try</AppText>
      <ul class="mt-3 flex flex-wrap justify-center gap-2" dir="ltr">
        <li
          v-for="line in starters"
          :key="line"
          class="rounded-lg border border-border-inner bg-surface-raised px-3 py-1.5 text-[14px] text-text-body"
        >
          “{{ line }}”
        </li>
      </ul>
    </div>

    <ol class="mt-9 grid w-full max-w-2xl gap-4 border-t border-border-inner pt-6 text-start sm:grid-cols-3">
      <li v-for="(step, i) in steps" :key="i" class="flex gap-3">
        <span class="font-poppins text-[14px] font-semibold tabular-nums text-brand-primary">{{ i + 1 }}</span>
        <AppText size="14" color="neutral-400">{{ step }}</AppText>
      </li>
    </ol>
  </div>
</template>
