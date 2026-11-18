<script setup lang="ts">
import type { StudentMistake } from '~/common/types/class-types'

// What to teach this student next: the grammar points they got wrong most in the last
// 30 days of AI chats, each with one real sentence of theirs and the fix.
defineProps<{ mistakes: StudentMistake[]; practised: boolean }>()
</script>

<template>
  <section aria-labelledby="student-mistakes" class="dash-card @container p-5 md:p-6">
    <AppText id="student-mistakes" size="16" weight="semibold">Common mistakes</AppText>
    <AppText size="14" color="neutral-400" class-list="mt-1">From their AI chats in the last 30 days.</AppText>

    <AppText v-if="!mistakes.length" size="14" color="neutral-400" class-list="mt-4">
      {{ practised ? 'No repeated mistakes in the last 30 days.' : 'Nothing yet. This fills in once they chat with the AI tutor.' }}
    </AppText>

    <ol v-else class="mt-4 grid gap-3 @3xl:grid-cols-2 @6xl:grid-cols-3">
      <li v-for="m in mistakes" :key="m.rule" class="rounded-xl bg-surface-raised p-3.5">
        <div class="flex items-start justify-between gap-3">
          <AppText size="14" weight="semibold" class-list="min-w-0">{{ m.rule }}</AppText>
          <AppText size="13" color="neutral-400" class-list="shrink-0">{{ m.count }}×</AppText>
        </div>
        <div v-if="m.example" class="mt-2 grid gap-1 text-[14px] sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-x-3">
          <AppText size="13" color="neutral-400">They wrote</AppText>
          <AppText size="14" color="error" class-list="line-through decoration-1">{{ m.example.said }}</AppText>
          <AppText size="13" color="neutral-400">Better</AppText>
          <AppText size="14" style="color:var(--status-active-text)">{{ m.example.better }}</AppText>
        </div>
      </li>
    </ol>
  </section>
</template>
