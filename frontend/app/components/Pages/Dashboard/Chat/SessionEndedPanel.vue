<script setup lang="ts">
import type { SessionEvaluation } from '~/common/types/chat-types'

// Replaces the composer once a session ends. Previously this state was just a
// greyed-out text box with a placeholder, which read as "broken" rather than
// "finished" — and the scores only ever appeared in a toast that timed out.
const props = defineProps<{
  evaluation: SessionEvaluation | null
  creating: boolean
  dailyLimitReached?: boolean
}>()

const emit = defineEmits<{ 'new-session': [] }>()

const score = computed(() =>
  props.evaluation ? Math.round(props.evaluation.avgOverallScore ?? 0) : null,
)

// AppButton never binds its `disabled` prop to the element (see Composer.vue).
const newSessionClass = computed(
  () => `justify-center text-[14px]${props.dailyLimitReached ? ' opacity-50 pointer-events-none' : ''}`,
)

const highlights = computed(() => {
  const e = props.evaluation
  if (!e) return []
  return [
    ...(e.strengths ?? []).slice(0, 2).map((t) => ({ kind: 'strength' as const, text: t })),
    ...(e.recommendations ?? []).slice(0, 1).map((t) => ({ kind: 'tip' as const, text: t })),
  ]
})
</script>

<template>
  <div class="border-t p-3 sm:p-4 shrink-0" style="border-color:var(--border-inner)">
    <div class="max-w-3xl mx-auto dash-card p-4 sm:p-5">
      <div class="flex items-start gap-3 sm:gap-4">
        <div
          class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style="background:var(--surface-raised)"
        >
          <AppIconsax name="TickCircle" color="var(--color-brand-primary)" :size="20" />
        </div>

        <div class="flex-1 min-w-0">
          <AppText size="15" weight="semibold">Session complete</AppText>
          <AppText size="13" color="neutral-400" class-list="mt-0.5">
            <template v-if="evaluation">
              You scored {{ score }}/100 · CEFR {{ evaluation.detectedCefrLevel }} ·
              {{ evaluation.totalUserMessages }} messages
            </template>
            <template v-else>
              Your progress has been saved. Start a new session to keep practising.
            </template>
          </AppText>

          <ul v-if="highlights.length" class="mt-3 space-y-1.5">
            <li v-for="(h, i) in highlights" :key="i" class="flex items-start gap-2">
              <AppIconsax
                :name="h.kind === 'strength' ? 'TickCircle' : 'Lamp'"
                :color="h.kind === 'strength' ? '#10b981' : 'var(--color-brand-primary)'"
                :size="14"
                class="mt-0.5 shrink-0"
              />
              <AppText size="13" color="neutral-600">{{ h.text }}</AppText>
            </li>
          </ul>
        </div>
      </div>

      <div class="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
        <AppButton
          variant="outline"
          size="40"
          radius="8"
          to="/dashboard"
          text="Back to dashboard"
          class-list="justify-center text-[14px]"
        />
        <AppButton
          variant="primary"
          size="40"
          radius="8"
          icon="Add"
          :icon-config="{ color: 'white', size: 18 }"
          :text="creating ? 'Starting…' : 'New session'"
          :loading="creating"
          :class-list="newSessionClass"
          @click="emit('new-session')"
        />
      </div>

      <AppText v-if="dailyLimitReached" size="12" color="neutral-400" class-list="mt-2 text-right">
        You've used all of today's sessions on your plan.
      </AppText>
    </div>
  </div>
</template>
