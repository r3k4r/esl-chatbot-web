<script setup lang="ts">
import { toast } from 'vue-sonner'
import { taskFormSchema, type TaskFormValues } from '~/common/schemas/TaskSchema'
import type { TaskItem } from '~/common/types/task-types'
import { TASK_FILE_ACCEPT, TASK_FILES_PER_UPLOAD, checkTaskFiles } from '~/lib/files'

// Create or edit a task. On create, files picked here are uploaded right after the task
// exists; on edit, files are managed on the task page itself.
const props = defineProps<{
  open: boolean
  classId: string
  task: TaskItem | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: [task: TaskItem]
}>()

const { createTask, updateTask, addTaskFiles } = useTasks()

const isEdit = computed(() => !!props.task)
const submitting = ref(false)
const serverError = ref('')
const files = ref<File[]>([])
const picker = useTemplateRef<HTMLInputElement>('picker')

const formData = ref<TaskFormValues>({ title: '', description: '', deadline: '' })

function reset() {
  serverError.value = ''
  files.value = []
  formData.value = props.task
    ? { title: props.task.title, description: props.task.description, deadline: props.task.deadline ?? '' }
    : { title: '', description: '', deadline: '' }
}

watch(() => props.open, open => { if (open) reset() })

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const { ok, error } = checkTaskFiles(Array.from(input.files ?? []), TASK_FILES_PER_UPLOAD - files.value.length)
  if (error) toast.error(error)
  files.value = [...files.value, ...ok]
  input.value = ''
}

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true
  serverError.value = ''
  const { title, description } = formData.value
  const deadline = formData.value.deadline || null

  const res = isEdit.value && props.task
    ? await updateTask(props.task.id, { title, description, deadline })
    : await createTask(props.classId, { title, description, ...(deadline ? { deadline } : {}) })

  if (!res.success) {
    submitting.value = false
    serverError.value = res.message || 'Something went wrong'
    return
  }

  let saved = (res.data as any)?.data as TaskItem
  if (!isEdit.value && files.value.length) {
    const up = await addTaskFiles(saved.id, files.value)
    if (up.success) saved = { ...saved, attachments: (up.data as any)?.data ?? [] }
    // The task exists either way; the files can be added again from its page.
    else toast.error(`Task created, but the files didn't upload: ${up.message || 'try again from the task page'}`)
  }

  submitting.value = false
  emit('saved', saved)
  emit('update:open', false)
  toast.success(isEdit.value ? 'Task updated.' : 'Task created.')
}
</script>

<template>
  <UiDialog :open="open" @update:open="emit('update:open', $event)">
    <UiDialogContent class="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
      <UiDialogHeader class="border-b border-border-inner px-6 py-4 text-start">
        <UiDialogTitle class="text-[17px]">{{ isEdit ? 'Edit task' : 'New task' }}</UiDialogTitle>
        <UiDialogDescription class="text-[14px]">
          {{ isEdit ? 'Changes show for the whole class right away.' : 'Every student in the class gets a notification.' }}
        </UiDialogDescription>
      </UiDialogHeader>

      <Form :schema="taskFormSchema" :form-data="formData" class="min-h-0 space-y-4 overflow-y-auto p-6" @submit="handleSubmit">
        <template #default="{ errors }">
          <FormServerError :error="serverError" />

          <FormInput id="task-title" v-model="formData.title" label="Title" :error="errors.title" required
            placeholder="e.g. Write a paragraph about your favourite place" />

          <div class="space-y-1">
            <FormLabel for-id="task-description" label="Instructions" :required="true" />
            <UiTextarea id="task-description" v-model="formData.description" rows="5" maxlength="5000"
              placeholder="What should students do? Keep it short and clear." class="resize-none text-[14px] leading-6" />
            <div class="flex items-center justify-between">
              <FormError :error="errors.description" />
              <AppText size="13" color="neutral-400" class-list="ms-auto">{{ (formData.description || '').length }}/5000</AppText>
            </div>
          </div>

          <FormDateInput id="task-deadline" v-model="formData.deadline" label="Deadline (optional)"
            placeholder="No deadline" with-time :min-date="new Date()" :error="errors.deadline" />

          <div v-if="!isEdit" class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <FormLabel for-id="task-files" label="Files (optional)" />
              <input id="task-files" ref="picker" type="file" multiple :accept="TASK_FILE_ACCEPT" class="hidden" @change="onPick">
              <AppButton variant="ghost" size="32" radius="8" icon="Paperclip2" text="Attach"
                :icon-config="{ color: 'currentColor', size: 16 }" class-list="text-[14px] text-text-muted"
                :disabled="files.length >= TASK_FILES_PER_UPLOAD" @click="picker?.click()" />
            </div>
            <div v-if="files.length" class="grid gap-1.5">
              <PagesDashboardClassesTasksTaskFileRow v-for="(f, i) in files" :key="`${f.name}-${i}`" :name="f.name"
                :mime-type="f.type" :size="f.size" draft @remove="files = files.filter((_, j) => j !== i)" />
            </div>
            <AppText v-else size="13" color="neutral-400">Worksheets, audio or examples. Up to 5 files, 15 MB each.</AppText>
          </div>

          <UiDialogFooter class="flex gap-2 pt-2">
            <UiDialogClose as-child>
              <AppButton variant="secondary" size="40" radius="8" text="Cancel" class="flex-1" />
            </UiDialogClose>
            <AppButton type="submit" variant="primary" size="40" radius="8" :icon="isEdit ? 'Edit2' : 'Add'"
              :icon-config="{ color: 'white', size: 16 }" :text="isEdit ? 'Save changes' : 'Create task'"
              class="flex-1" :loading="submitting" />
          </UiDialogFooter>
        </template>
      </Form>
    </UiDialogContent>
  </UiDialog>
</template>
