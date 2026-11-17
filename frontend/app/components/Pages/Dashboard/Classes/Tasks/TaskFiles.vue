<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { TaskAttachment } from '~/common/types/task-types'
import { TASK_FILE_ACCEPT, TASK_FILES_PER_UPLOAD, checkTaskFiles } from '~/lib/files'

// Files the teacher attached to the task itself. Hidden for students when there are none.
const props = defineProps<{
  taskId: string
  files: TaskAttachment[]
  canManage: boolean
}>()

const emit = defineEmits<{ change: [files: TaskAttachment[]] }>()

const { addTaskFiles, deleteTaskFile } = useTasks()
const picker = useTemplateRef<HTMLInputElement>('picker')
const uploading = ref(false)
const MAX_PER_TASK = 10

async function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const room = Math.min(TASK_FILES_PER_UPLOAD, MAX_PER_TASK - props.files.length)
  const { ok, error } = checkTaskFiles(Array.from(input.files ?? []), room)
  input.value = ''
  if (error) toast.error(error)
  if (!ok.length) return
  uploading.value = true
  const res = await addTaskFiles(props.taskId, ok)
  uploading.value = false
  if (!res.success) { toast.error(res.message || 'Could not upload the files'); return }
  emit('change', [...props.files, ...((res.data as any)?.data ?? [])])
}

const toRemove = ref<TaskAttachment | null>(null)
const removeOpen = ref(false)
function askRemove(f: TaskAttachment) { toRemove.value = f; removeOpen.value = true }
async function confirmRemove() {
  const f = toRemove.value
  if (!f) return
  const res = await deleteTaskFile(props.taskId, f.id)
  if (!res.success) { toast.error(res.message || 'Could not remove the file'); return }
  emit('change', props.files.filter(x => x.id !== f.id))
}
</script>

<template>
  <section v-if="files.length || canManage" aria-labelledby="task-files-title">
    <div class="flex items-center justify-between gap-3">
      <AppText id="task-files-title" size="16" weight="semibold">
        Files<template v-if="files.length"> · {{ files.length }}</template>
      </AppText>
      <template v-if="canManage">
        <input ref="picker" type="file" multiple :accept="TASK_FILE_ACCEPT" class="hidden" @change="onPick">
        <AppButton variant="ghost" size="32" radius="8" icon="Paperclip2" text="Add files"
          :icon-config="{ color: 'currentColor', size: 16 }" class-list="text-[14px] text-text-muted"
          :loading="uploading" :disabled="files.length >= MAX_PER_TASK" @click="picker?.click()" />
      </template>
    </div>

    <PagesDashboardClassesTasksTaskFileList v-if="files.length" class="mt-3" :task-id="taskId" :files="files"
      :removable="canManage" @remove="askRemove" />
    <AppText v-else size="14" color="neutral-400" class-list="mt-1">
      Add a worksheet, audio or example for the class. Up to {{ MAX_PER_TASK }} files, 15 MB each.
    </AppText>

    <UiAlertDialog v-model:open="removeOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Remove this file?</UiAlertDialogTitle>
          <UiAlertDialogDescription>“{{ toRemove?.fileName }}” will be removed from the task for everyone.</UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
          <UiAlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="confirmRemove">
            Remove
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </section>
</template>
