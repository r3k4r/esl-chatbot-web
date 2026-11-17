<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { TaskItem, TaskSubmissionItem } from '~/common/types/task-types'
import { TASK_FILE_ACCEPT, TASK_FILES_PER_UPLOAD, checkTaskFiles } from '~/lib/files'

// Student "Your work" panel (Google Classroom style): add files, a link or a written
// answer, then Hand in once. Afterwards: what was handed in + the teacher's feedback.
const props = defineProps<{ task: TaskItem }>()
const emit = defineEmits<{ taskUpdated: [task: TaskItem] }>()

const { submitTask, getTask } = useTasks()
const content = ref('')
const link = ref('')
const showLink = ref(false)
const files = ref<File[]>([])
const picker = useTemplateRef<HTMLInputElement>('picker')
const submitting = ref(false)
const error = ref('')

watch(() => props.task.id, () => {
  content.value = ''; link.value = ''; showLink.value = false; files.value = []; error.value = ''
})

const sub = computed(() => props.task.mySubmission ?? null)
const pastDue = computed(() => !!props.task.deadline && Date.now() > new Date(props.task.deadline).getTime())

// Derived from the real dates only: no extra backend state.
const status = computed(() => {
  const s = sub.value
  if (s?.feedback) return { label: 'Reviewed', tone: 'active' }
  if (s) {
    const late = props.task.deadline && new Date(s.createdAt) > new Date(props.task.deadline)
    return late ? { label: 'Handed in late', tone: 'blocked' } : { label: 'Handed in', tone: 'active' }
  }
  if (pastDue.value) return { label: 'Missing', tone: 'expired' }
  return { label: props.task.status === 'CLOSED' ? 'Closed' : 'Assigned', tone: 'inactive' }
})

const fmt = (iso: string) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
const canHandIn = computed(() => !submitting.value && (!!content.value.trim() || !!link.value.trim() || files.value.length > 0))

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const { ok, error: msg } = checkTaskFiles(Array.from(input.files ?? []), TASK_FILES_PER_UPLOAD - files.value.length)
  if (msg) toast.error(msg)
  files.value = [...files.value, ...ok]
  input.value = ''
}

async function handIn() {
  if (!canHandIn.value) return
  const url = link.value.trim()
  if (url && !/^https?:\/\//i.test(url)) { error.value = 'Links start with https://'; return }
  submitting.value = true
  error.value = ''
  const res = await submitTask(props.task.id, { content: content.value.trim() || undefined, fileUrl: url || undefined, files: files.value })
  submitting.value = false
  if (!res.success) {
    // 409 = already handed in or closed meanwhile: show the real state
    if (res.status === 409) {
      const fresh = await getTask(props.task.id)
      if (fresh.success && (fresh.data as any)?.data) emit('taskUpdated', (fresh.data as any).data)
    }
    error.value = res.message || 'Could not hand in'
    return
  }
  emit('taskUpdated', { ...props.task, mySubmission: (res.data as any)?.data as TaskSubmissionItem })
  toast.success('Handed in!')
}
</script>

<template>
  <section aria-labelledby="task-work-title">
    <div class="flex items-center justify-between gap-2">
      <AppText id="task-work-title" size="16" weight="semibold">Your work</AppText>
      <UiBadge class="rounded-md border-0 text-[12px] font-semibold"
        :style="`background:var(--status-${status.tone}-bg);color:var(--status-${status.tone}-text)`">
        {{ status.label }}
      </UiBadge>
    </div>

    <!-- Handed in -->
    <div v-if="sub" class="mt-4 space-y-3">
      <AppText size="13" color="neutral-400">Handed in {{ fmt(sub.createdAt) }}</AppText>
      <AppText v-if="sub.content" size="14" color="neutral-600" class-list="whitespace-pre-wrap break-words leading-6">{{ sub.content }}</AppText>
      <AppLink v-if="sub.fileUrl" :to="sub.fileUrl" target="_blank" rel="noopener noreferrer"
        class="flex items-center gap-1.5 text-[14px] text-brand-ink underline underline-offset-2 dark:text-brand-primary">
        <AppIconsax name="Link" color="currentColor" :size="16" />
        <span class="truncate">{{ sub.fileUrl }}</span>
      </AppLink>
      <PagesDashboardClassesTasksTaskFileList v-if="sub.attachments?.length" :task-id="task.id" :files="sub.attachments" single />

      <div v-if="sub.feedback" class="rounded-xl bg-surface-raised p-3.5">
        <div class="flex items-center gap-2">
          <AppIconsax name="MessageText1" color="var(--color-brand-primary)" :size="16" />
          <AppText size="14" weight="semibold">Teacher feedback</AppText>
        </div>
        <AppText size="14" color="neutral-600" class-list="mt-1.5 whitespace-pre-wrap leading-6">{{ sub.feedback }}</AppText>
      </div>
    </div>

    <!-- Closed before handing in -->
    <AppText v-else-if="task.status === 'CLOSED'" size="14" color="neutral-600" class-list="mt-4">
      This task is closed, so it can't be handed in any more.
    </AppText>

    <!-- Hand in -->
    <div v-else class="mt-4 space-y-3">
      <div v-if="files.length" class="grid gap-2">
        <PagesDashboardClassesTasksTaskFileRow v-for="(f, i) in files" :key="`${f.name}-${i}`" :name="f.name"
          :mime-type="f.type" :size="f.size" draft @remove="files = files.filter((_, j) => j !== i)" />
      </div>

      <UiTextarea v-model="content" aria-label="Your answer" placeholder="Write your answer (optional)" rows="3"
        maxlength="10000" class="resize-none text-[14px] leading-6" />
      <UiInput v-if="showLink" v-model="link" type="url" aria-label="Link to your work"
        placeholder="https://docs.google.com/…" class="h-10 text-[14px]" />

      <div class="flex flex-wrap gap-1.5">
        <input ref="picker" type="file" multiple :accept="TASK_FILE_ACCEPT" class="hidden" @change="onPick">
        <AppButton variant="secondary" size="36" radius="8" icon="Paperclip2" text="Add files"
          :icon-config="{ color: 'currentColor', size: 16 }" class-list="text-[14px] px-3"
          :disabled="files.length >= TASK_FILES_PER_UPLOAD" @click="picker?.click()" />
        <AppButton v-if="!showLink" variant="secondary" size="36" radius="8" icon="Link" text="Add link"
          :icon-config="{ color: 'currentColor', size: 16 }" class-list="text-[14px] px-3" @click="showLink = true" />
      </div>

      <AppText v-if="error" size="13" color="error">{{ error }}</AppText>
      <AppButton variant="primary" size="40" radius="8" icon="Send2" :icon-config="{ color: 'white', size: 16 }"
        :text="pastDue ? 'Hand in late' : 'Hand in'" class-list="w-full justify-center text-[14px]"
        :loading="submitting" :disabled="!canHandIn" @click="handIn" />
      <AppText size="13" color="neutral-400" class-list="text-center">Only you and your teacher see your work.</AppText>
    </div>
  </section>
</template>
