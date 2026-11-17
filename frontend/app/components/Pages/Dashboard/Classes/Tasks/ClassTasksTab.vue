<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { TaskItem } from '~/common/types/task-types'

const props = defineProps<{
  classId: string
  canManage: boolean
  isStudent: boolean
}>()

const { listClassTasks, updateTask, deleteTask } = useTasks()

const tasks = ref<TaskItem[]>([])
const loading = ref(false)
const page = ref(1)
const totalPages = ref(1)
const totalCount = ref(0)
const loadingMore = ref(false)

// Dialog state
const formOpen = ref(false)
const editingTask = ref<TaskItem | null>(null)
const deleteTarget = ref<TaskItem | null>(null)
const deleteConfirmOpen = ref(false)
const deleting = ref(false)
const toggling = ref<string | null>(null) // taskId being toggled

async function load(reset = false) {
  if (reset) { page.value = 1; tasks.value = [] }
  loading.value = reset
  loadingMore.value = !reset
  const res = await listClassTasks(props.classId, { page: page.value, limit: 15 })
  loading.value = false
  loadingMore.value = false
  if (!res.success) {
    toast.error(res.message || 'Could not load tasks')
    return
  }
  const fetched = (res.data as any)?.data as TaskItem[] ?? []
  const meta = (res.data as any)?.meta
  totalPages.value = meta?.totalPages ?? 1
  if (meta?.total !== undefined) totalCount.value = meta.total
  if (reset) tasks.value = fetched
  else tasks.value = [...tasks.value, ...fetched]
}

async function loadMore() {
  if (page.value >= totalPages.value) return
  page.value++
  await load(false)
}

function handleOpenTask(task: TaskItem) {
  navigateTo(`/dashboard/classes/${props.classId}/tasks/${task.id}`)
}

function handleCreate() {
  editingTask.value = null
  formOpen.value = true
}

function handleEdit(task: TaskItem) {
  editingTask.value = task
  formOpen.value = true
}

function handleDeletePrompt(task: TaskItem) {
  deleteTarget.value = task
  deleteConfirmOpen.value = true
}

async function handleConfirmDelete() {
  if (!deleteTarget.value || deleting.value) return
  deleting.value = true
  const res = await deleteTask(deleteTarget.value.id)
  deleting.value = false
  deleteConfirmOpen.value = false
  if (!res.success) { toast.error(res.message || 'Could not delete task'); return }
  tasks.value = tasks.value.filter(t => t.id !== deleteTarget.value!.id)
  totalCount.value = Math.max(0, totalCount.value - 1)
  deleteTarget.value = null
  toast.success('Task deleted.')
}

async function handleToggleClosed(task: TaskItem) {
  if (toggling.value) return
  toggling.value = task.id
  const res = await updateTask(task.id, { closed: task.status === 'OPEN' })
  toggling.value = null
  if (!res.success) { toast.error(res.message || 'Could not update task'); return }
  const updated = (res.data as any)?.data as TaskItem
  if (updated) {
    tasks.value = tasks.value.map(t => t.id === updated.id ? updated : t)
  }
  toast.success(task.status === 'OPEN' ? 'Task closed.' : 'Task reopened.')
}

function handleTaskSaved(saved: TaskItem) {
  const idx = tasks.value.findIndex(t => t.id === saved.id)
  if (idx >= 0) {
    tasks.value = tasks.value.map(t => t.id === saved.id ? saved : t)
  } else {
    tasks.value = [saved, ...tasks.value]
    totalCount.value++
  }
}

watch(() => props.classId, () => load(true), { immediate: true })
</script>

<template>
  <div class="flex flex-col gap-4">

    <!-- Header row -->
    <div class="flex items-center justify-between">
      <AppText size="14" :style="`color:var(--text-muted)`">
        {{ totalCount ? `${totalCount} task${totalCount === 1 ? '' : 's'}` : '' }}
      </AppText>
      <AppButton
        v-if="canManage"
        variant="primary"
        size="36"
        radius="8"
        icon="Add"
        :icon-config="{ color: 'white', size: 16 }"
        text="New task"
        class-list="text-[14px]"
        @click="handleCreate"
      />
    </div>

    <!-- Loading skeletons -->
    <template v-if="loading">
      <div v-for="i in 4" :key="i" class="rounded-xl p-4 space-y-2" style="background:var(--surface-raised);border:1px solid var(--border-inner)">
        <div class="flex items-center gap-2">
          <UiSkeleton class="h-4 w-48 rounded" />
          <UiSkeleton class="h-5 w-14 rounded-lg ml-2" />
        </div>
        <UiSkeleton class="h-3 w-full rounded" />
        <UiSkeleton class="h-3 w-3/5 rounded" />
      </div>
    </template>

    <!-- Empty state -->
    <div v-else-if="!tasks.length" class="flex flex-col items-center justify-center py-10 gap-3">
      <div class="size-12 rounded-2xl flex items-center justify-center" style="background:var(--surface-raised)">
        <AppIconsax name="TaskSquare" color="var(--color-text-subtle)" :size="22" />
      </div>
      <div class="text-center">
        <AppText size="14" weight="semibold" class-list="block" :style="`color:var(--text-heading)`">No tasks yet</AppText>
        <AppText v-if="canManage" size="13" class-list="block mt-1" :style="`color:var(--text-muted)`">Create one to assign work to your students.</AppText>
        <AppText v-else size="13" class-list="block mt-1" :style="`color:var(--text-muted)`">No tasks have been assigned yet.</AppText>
      </div>
    </div>

    <!-- Task list -->
    <template v-else>
      <PagesDashboardClassesTasksTaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        :can-manage="canManage"
        :is-student="isStudent"
        @open="handleOpenTask(task)"
        @edit="handleEdit(task)"
        @delete="handleDeletePrompt(task)"
        @toggle-closed="handleToggleClosed(task)"
      />

      <!-- Load more -->
      <div v-if="page < totalPages" class="flex justify-center pt-1">
        <AppButton
          variant="secondary"
          size="32"
          radius="8"
          text="Load older"
          :loading="loadingMore"
          class="text-[12px]!"
          @click="loadMore"
        />
      </div>
    </template>

    <!-- Create / Edit dialog -->
    <PagesDashboardClassesTasksTaskFormDialog
      v-model:open="formOpen"
      :class-id="classId"
      :task="editingTask"
      @saved="handleTaskSaved"
    />

    <!-- Delete confirmation -->
    <UiAlertDialog v-model:open="deleteConfirmOpen">
      <UiAlertDialogContent :style="`background:var(--surface-card)`">
        <UiAlertDialogHeader>
          <UiAlertDialogTitle :style="`color:var(--text-heading)`">Delete task?</UiAlertDialogTitle>
          <UiAlertDialogDescription :style="`color:var(--text-muted)`">
            <strong :style="`color:var(--text-body)`">{{ deleteTarget?.title }}</strong> and all its submissions will be permanently deleted. This cannot be undone.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel
            :style="`background:var(--surface-raised);color:var(--text-body);border-color:var(--border-card)`"
            @click="deleteConfirmOpen = false"
          >
            Cancel
          </UiAlertDialogCancel>
          <UiAlertDialogAction
            class="bg-red-500 hover:bg-red-600 text-white"
            :disabled="deleting"
            @click="handleConfirmDelete"
          >
            {{ deleting ? 'Deleting…' : 'Delete' }}
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>

  </div>
</template>
