<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { TaskSubmissionItem } from '~/common/types/task-types'

// Tutor / admin "Student work" panel: who handed in, then each hand-in with feedback.
const props = defineProps<{
  taskId: string
  /** Students in the class, for the "not yet" count; unknown = hide it */
  studentCount?: number
}>()

const { listSubmissions } = useTasks()
const submissions = ref<TaskSubmissionItem[]>([])
const loading = ref(false)

watch(() => props.taskId, async (id) => {
  submissions.value = []
  loading.value = true
  const res = await listSubmissions(id)
  loading.value = false
  if (id !== props.taskId) return
  if (!res.success) { toast.error(res.message || 'Could not load submissions'); return }
  submissions.value = (res.data as any)?.data ?? []
}, { immediate: true })

const toReview = computed(() => submissions.value.filter(s => !s.feedback).length)
const notYet = computed(() =>
  props.studentCount === undefined ? null : Math.max(0, props.studentCount - submissions.value.length))

function onUpdated(updated: TaskSubmissionItem) {
  submissions.value = submissions.value.map(s => s.id === updated.id ? updated : s)
}
</script>

<template>
  <section aria-labelledby="task-submissions-title">
    <AppText id="task-submissions-title" size="16" weight="semibold">Student work</AppText>

    <div v-if="!loading" class="mt-3 grid grid-cols-3 divide-x divide-border-inner rounded-xl bg-surface-raised py-2.5 text-center">
      <div>
        <AppText size="20" weight="semibold">{{ submissions.length }}</AppText>
        <AppText size="13" color="neutral-400">Handed in</AppText>
      </div>
      <div>
        <AppText size="20" weight="semibold">{{ notYet ?? '–' }}</AppText>
        <AppText size="13" color="neutral-400">Not yet</AppText>
      </div>
      <div>
        <AppText size="20" weight="semibold">{{ toReview }}</AppText>
        <AppText size="13" color="neutral-400">To review</AppText>
      </div>
    </div>

    <div class="mt-4 divide-y divide-border-inner">
      <template v-if="loading">
        <UiSkeleton v-for="i in 2" :key="i" class="mb-3 h-16 rounded-lg" />
      </template>
      <AppText v-else-if="!submissions.length" size="14" color="neutral-400">
        No one has handed in yet. Each student's work shows up here.
      </AppText>
      <PagesDashboardClassesTasksSubmissionRow v-for="s in submissions" :key="s.id" :task-id="taskId" :submission="s"
        @updated="onUpdated" />
    </div>
  </section>
</template>
