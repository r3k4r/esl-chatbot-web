<script setup lang="ts">
import type { LearnerVocab } from '~/common/types/dashboard-overview-types'

// The learner's word deck: what's waiting for review (with a peek at the words) and how
// the deck is growing.
const props = defineProps<{ vocab: LearnerVocab }>()

const figures = computed(() => [
  { label: 'Saved', value: props.vocab.total },
  { label: 'Mastered', value: props.vocab.mastered },
  { label: 'New this week', value: props.vocab.addedThisWeek },
])
</script>

<template>
  <section aria-labelledby="learner-vocab" class="dash-card p-5">
    <div class="flex items-baseline justify-between gap-3">
      <AppText id="learner-vocab" size="16" weight="semibold">Vocabulary</AppText>
      <AppText size="14" :color="vocab.due ? 'black' : 'neutral-400'" weight="medium">
        {{ vocab.due ? `${vocab.due} to review` : 'Nothing due' }}
      </AppText>
    </div>

    <ul v-if="vocab.dueWords.length" class="mt-3 space-y-2">
      <li v-for="w in vocab.dueWords" :key="w.word" class="rounded-lg bg-surface-raised px-3 py-2">
        <AppText size="14" weight="medium">{{ w.word }}</AppText>
        <AppText size="13" color="neutral-400" class-list="line-clamp-1">{{ w.definition }}</AppText>
      </li>
    </ul>

    <dl class="mt-4 grid grid-cols-3 gap-2">
      <div v-for="f in figures" :key="f.label">
        <dt><AppText size="13" color="neutral-400">{{ f.label }}</AppText></dt>
        <dd><AppText size="16" weight="semibold" class-list="tabular-nums">{{ f.value }}</AppText></dd>
      </div>
    </dl>

    <AppButton
      :variant="vocab.due ? 'primary' : 'secondary'" size="36" radius="8" to="/dashboard/vocab"
      :text="vocab.due ? 'Review words' : 'Open vocabulary'"
      :icon-config="{ color: vocab.due ? 'white' : 'currentColor', size: 16 }"
      icon="Book1" class-list="mt-4 w-full"
    />
  </section>
</template>
