<script setup lang="ts">
import type { StudentTaskItem, TaskRecord } from '~/common/types/class-types'
import { taskStateLabel, toneStyle } from '~/lib/progress'

// This student's record on the class's tasks; each row opens the task page.
const props = defineProps<{ classId: string; tasks: StudentTaskItem[]; summary: TaskRecord }>()

const fmt = (iso: string) => new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
const detail = (t: StudentTaskItem) =>
  t.handedInAt ? `Handed in ${fmt(t.handedInAt)}` : t.deadline ? `Due ${fmt(t.deadline)}` : 'No deadline'

const facts = computed(() => [
  { label: 'Handed in', value: `${props.summary.handedIn}/${props.summary.total}` },
  { label: 'Missing', value: props.summary.missing, warn: props.summary.missing > 0 },
  { label: 'Late', value: props.summary.late },
  { label: 'Reviewed', value: props.summary.reviewed },
])
</script>

<template>
  <section aria-labelledby="student-tasks" class="dash-card p-5 md:p-6">
    <div class="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
      <AppText id="student-tasks" size="16" weight="semibold">Class tasks</AppText>
      <dl v-if="summary.total" class="flex gap-5">
        <div v-for="f in facts" :key="f.label" class="flex items-baseline gap-1.5">
          <dt><AppText size="13" color="neutral-400">{{ f.label }}</AppText></dt>
          <dd><AppText size="14" weight="semibold" :color="f.warn ? 'error' : 'black'">{{ f.value }}</AppText></dd>
        </div>
      </dl>
    </div>

    <AppText v-if="!tasks.length" size="14" color="neutral-400" class-list="mt-3">This class has no tasks yet.</AppText>

    <ul v-else class="mt-3 divide-y divide-border-inner">
      <li v-for="t in tasks" :key="t.id">
        <AppLink :to="`/dashboard/classes/${classId}/tasks/${t.id}`"
          class="-mx-2 flex items-center gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-surface-raised">
          <span class="min-w-0 flex-1">
            <AppText size="14" weight="medium" class-list="truncate">{{ t.title }}</AppText>
            <AppText size="13" color="neutral-400">{{ detail(t) }}</AppText>
          </span>
          <UiBadge class="shrink-0 rounded-md border-0 text-[12px] font-semibold" :style="toneStyle(taskStateLabel[t.state].tone)">
            {{ taskStateLabel[t.state].label }}
          </UiBadge>
          <AppIconsax name="ArrowRight2" color="var(--color-text-subtle)" :size="16" class="shrink-0" />
        </AppLink>
      </li>
    </ul>
  </section>
</template>
