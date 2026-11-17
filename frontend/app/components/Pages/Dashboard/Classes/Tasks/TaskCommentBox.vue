<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { CommentDraft, TaskAttachment } from '~/common/types/task-types'
import { TASK_FILE_ACCEPT, TASK_FILES_PER_UPLOAD, checkTaskFiles } from '~/lib/files'

// Text + files. New comment: clears itself after a successful post.
// Editing: starts from the comment's text and files; any of them can be removed.
const props = withDefaults(defineProps<{
  id: string
  busy?: boolean
  placeholder?: string
  initialContent?: string | null
  initialFiles?: TaskAttachment[]
  editing?: boolean
}>(), { placeholder: 'Add a class comment', initialFiles: () => [] })

const emit = defineEmits<{
  /** `done(ok)` lets the parent say whether to reset the box */
  submit: [draft: CommentDraft, done: (ok: boolean) => void]
  cancel: []
}>()

const content = ref(props.initialContent ?? '')
const files = ref<File[]>([])
const kept = ref<TaskAttachment[]>([...props.initialFiles])
const picker = useTemplateRef<HTMLInputElement>('picker')

const room = computed(() => TASK_FILES_PER_UPLOAD - kept.value.length - files.value.length)
const canSend = computed(() => !props.busy && (!!content.value.trim() || files.value.length + kept.value.length > 0))

function onPick(e: Event) {
  const input = e.target as HTMLInputElement
  const { ok, error } = checkTaskFiles(Array.from(input.files ?? []), room.value)
  if (error) toast.error(error)
  files.value = [...files.value, ...ok]
  input.value = ''
}

function send() {
  if (!canSend.value) return
  const removed = props.initialFiles.filter(f => !kept.value.includes(f)).map(f => f.id)
  emit('submit', { content: content.value.trim(), files: files.value, removeAttachmentIds: removed }, (ok) => {
    if (ok && !props.editing) { content.value = ''; files.value = [] }
  })
}

// Enter sends, Shift+Enter makes a new line
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send() }
  if (e.key === 'Escape' && props.editing) emit('cancel')
}
</script>

<template>
  <div class="rounded-xl border border-border-card bg-surface-card transition-colors duration-150 focus-within:border-text-subtle">
    <UiTextarea :id="id" v-model="content" :placeholder="placeholder" rows="1" maxlength="2000"
      :aria-label="editing ? 'Edit comment' : 'Class comment'"
      class="max-h-40 min-h-11 resize-none border-0 bg-transparent px-3.5 py-3 text-[15px] leading-6 shadow-none focus-visible:ring-0 dark:bg-transparent"
      @keydown="onKeydown" />

    <div v-if="kept.length || files.length" class="grid gap-1.5 px-2.5 pb-1">
      <PagesDashboardClassesTasksTaskFileRow v-for="f in kept" :key="f.id" :name="f.fileName" :mime-type="f.mimeType"
        :size="f.size" draft @remove="kept = kept.filter(k => k !== f)" />
      <PagesDashboardClassesTasksTaskFileRow v-for="(f, i) in files" :key="`${f.name}-${i}`" :name="f.name"
        :mime-type="f.type" :size="f.size" draft @remove="files = files.filter((_, j) => j !== i)" />
    </div>

    <div class="flex items-center justify-between gap-2 px-1.5 pb-1.5">
      <input ref="picker" type="file" multiple :accept="TASK_FILE_ACCEPT" class="hidden" @change="onPick">
      <AppButton variant="ghost" size="36" radius="8" icon="Paperclip2" text="Attach"
        :icon-config="{ color: 'currentColor', size: 18 }" class-list="text-[14px] text-text-muted"
        :disabled="room <= 0 || busy" :aria-label="`Attach files (up to ${TASK_FILES_PER_UPLOAD})`" @click="picker?.click()" />
      <div class="flex items-center gap-1.5">
        <AppButton v-if="editing" variant="ghost" size="36" radius="8" text="Cancel" class-list="text-[14px]"
          @click="emit('cancel')" />
        <AppButton variant="primary" size="36" radius="8" :icon="editing ? undefined : 'Send2'"
          :icon-config="{ color: 'white', size: 16 }" :text="editing ? 'Save' : 'Post'" class-list="text-[14px] px-3.5"
          :loading="busy" :disabled="!canSend" @click="send" />
      </div>
    </div>
  </div>
</template>
