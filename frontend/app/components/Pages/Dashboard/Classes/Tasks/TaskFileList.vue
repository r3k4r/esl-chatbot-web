<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { FileListItem as TaskAttachment } from '~/common/types/task-types'
import type { PreviewFile } from '~/common/types/file-types'

type DownloadLink = { success: boolean; message?: string; data: any }

// Saved files of a task, a comment, a hand-in or an announcement: images open in the
// in-app viewer, everything downloads under its own name. Removing is the parent's call
// (it confirms). Task files pass `taskId`; other owners pass their own `getDownload`.
const props = withDefaults(defineProps<{
  taskId?: string
  getDownload?: (fileId: string) => Promise<DownloadLink>
  files: TaskAttachment[]
  removable?: boolean
  /** One column in narrow places (the Your work panel) */
  single?: boolean
}>(), { removable: false, single: false })
const emit = defineEmits<{ remove: [file: TaskAttachment] }>()

const { getTaskFileDownload } = useTasks()

const current = ref<TaskAttachment | null>(null)
const viewerOpen = ref(false)
const downloading = ref(false)

const viewed = computed<PreviewFile | null>(() => current.value && {
  name: current.value.fileName, url: current.value.fileUrl, mimeType: current.value.mimeType, size: current.value.size,
})

function view(f: TaskAttachment) {
  current.value = f
  viewerOpen.value = true
}

async function download(f: TaskAttachment | null) {
  if (!f || downloading.value) return
  downloading.value = true
  const res = props.getDownload ? await props.getDownload(f.id) : await getTaskFileDownload(props.taskId ?? '', f.id)
  downloading.value = false
  const url = (res.data as any)?.data?.url as string | undefined
  if (!res.success || !url) { toast.error(res.message || 'Could not download the file'); return }
  // The link answers with "attachment", so the browser saves it and stays on this page.
  window.location.assign(url)
}
</script>

<template>
  <div>
    <div :class="['grid gap-2', !single && 'sm:grid-cols-2']">
      <PagesDashboardClassesTasksTaskFileRow v-for="f in files" :key="f.id" :name="f.fileName" :mime-type="f.mimeType"
        :size="f.size" :url="f.fileUrl" :removable="removable" @open="view(f)" @download="download(f)"
        @remove="emit('remove', f)" />
    </div>
    <BlockImagePreviewDialog v-model:open="viewerOpen" :file="viewed" :downloading="downloading"
      @download="download(current)" />
  </div>
</template>
