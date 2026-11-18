<script setup lang="ts">
import type { VoiceTurn } from '~/common/types/voice-types'

// The call so far, newest at the bottom. The full conversation is also saved in AI Chat.
const props = defineProps<{ turns: VoiceTurn[] }>()

const answers = computed(() => props.turns.filter((t) => t.transcript).length)
const list = ref<HTMLElement | null>(null)
watch(() => props.turns.length, async () => {
  await nextTick()
  list.value?.scrollTo({ top: list.value.scrollHeight, behavior: 'smooth' })
})
</script>

<template>
  <section class="dash-card flex min-h-0 flex-col p-5">
    <div class="flex items-center justify-between">
      <AppText size="15" weight="semibold">This call</AppText>
      <AppText v-if="answers" size="13" color="neutral-400">{{ answers }} {{ answers === 1 ? 'answer' : 'answers' }}</AppText>
    </div>
    <AppText v-if="!turns.length" size="14" color="neutral-400" class-list="mt-2">
      What you and the tutor say shows up here. You can find every call later in AI Chat.
    </AppText>
    <ul v-else ref="list" class="mt-3 max-h-96 space-y-4 overflow-y-auto pe-1">
      <PagesDashboardVoiceTurnRow v-for="turn in turns" :key="turn.id" :turn="turn" />
    </ul>
  </section>
</template>
