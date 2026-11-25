<script setup lang="ts">
definePageMeta({ layout: 'dashboard', requiresAuth: true })
useSeo({ title: 'Task', noindex: true })

const route = useRoute()
const classId = computed(() => String(route.params.id))
const taskId = computed(() => String(route.params.taskId))

const page = useTaskPage(classId, taskId)
const { cls, task, loading, busy, toggling, backTo, archived, isStudent, canManage, studentCount } = page

const comments = useTaskComments(task, { canManage, archived })
const formOpen = ref(false)
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div class="page-padding">
      <div v-if="loading || !task" class="space-y-4">
        <UiSkeleton class="h-5 w-40" />
        <UiSkeleton class="h-8 w-2/3" />
        <UiSkeleton class="h-48 w-full rounded-xl" />
      </div>

      <template v-else>
        <PagesDashboardClassesTasksTaskPageHeader :task="task" :class-name="cls?.className" :back-to="backTo"
          :can-manage="canManage" :busy="busy" @edit="formOpen = true" @toggle-closed="page.toggleClosed"
          @delete="page.remove" />

        <!-- Mobile order: instructions, your work, comments. Desktop: work sits on the right. -->
        <div class="mt-6 grid items-start gap-5 md-lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]">
          <div class="dash-card space-y-6 p-5 md:p-6">
            <AppText size="15" color="neutral-600" class-list="max-w-[70ch] whitespace-pre-wrap break-words leading-7">
              {{ task.description }}
            </AppText>
            <PagesDashboardClassesTasksTaskFiles :task-id="task.id" :files="task.attachments ?? []"
              :can-manage="canManage" @change="files => page.onTaskUpdated({ ...task!, attachments: files })" />
          </div>

          <aside v-if="canManage || isStudent"
            class="dash-card p-5 md-lg:sticky md-lg:top-6 md-lg:col-start-2 md-lg:row-span-2 md-lg:row-start-1">
            <PagesDashboardClassesTasksTaskSubmissions v-if="canManage" :task-id="task.id" :student-count="studentCount" />
            <PagesDashboardClassesTasksTaskStudentWork v-else :task="task" @task-updated="page.onTaskUpdated" />
          </aside>

          <div class="dash-card p-5 md:p-6 md-lg:col-start-1">
            <PagesDashboardClassesTasksTaskComments :state="comments" :enabled="task.commentsEnabled"
              :can-manage="canManage" :toggling="toggling" @toggle="page.toggleComments" />
          </div>
        </div>

        <PagesDashboardClassesTasksTaskFormDialog v-model:open="formOpen" :class-id="classId" :task="task"
          @saved="page.onTaskUpdated" />
      </template>
    </div>
  </div>
</template>
