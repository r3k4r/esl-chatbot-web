<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { TaskSubmissionItem } from '~/common/types/task-types'

// One student's hand-in, with the tutor's feedback (write, or edit what was sent).
const props = defineProps<{
  taskId: string
  submission: TaskSubmissionItem
}>()

const emit = defineEmits<{ updated: [submission: TaskSubmissionItem] }>()

const { giveFeedback } = useTasks()

const draft = ref(props.submission.feedback ?? '')
const editing = ref(!props.submission.feedback)
const saving = ref(false)
const error = ref('')

const initials = computed(() =>
  (props.submission.student.displayName ?? '?').split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(diff / 3_600_000)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(diff / 86_400_000)
  return days === 1 ? 'yesterday' : `${days}d ago`
}

function startEditing() {
  draft.value = props.submission.feedback ?? ''
  error.value = ''
  editing.value = true
}

async function save() {
  const text = draft.value.trim()
  if (!text) { error.value = 'Write some feedback first.'; return }
  if (saving.value) return
  saving.value = true
  error.value = ''
  const res = await giveFeedback(props.taskId, props.submission.id, text)
  saving.value = false
  if (!res.success) { error.value = res.message || 'Could not save feedback'; return }
  emit('updated', (res.data as any)?.data as TaskSubmissionItem)
  editing.value = false
  toast.success('Feedback sent.')
}
</script>

<template>
  <article class="space-y-2.5 py-4 first:pt-0 last:pb-0">
    <div class="flex items-center gap-2.5">
      <UiAvatar class="size-8 shrink-0">
        <UiAvatarImage v-if="submission.student.avatarUrl" :src="submission.student.avatarUrl" :alt="submission.student.displayName ?? ''" />
        <UiAvatarFallback class="bg-surface-well text-[12px] font-semibold text-text-muted">{{ initials }}</UiAvatarFallback>
      </UiAvatar>
      <div class="min-w-0 flex-1">
        <AppText size="14" weight="semibold" class-list="truncate">{{ submission.student.displayName }}</AppText>
        <AppText size="13" color="neutral-400">Handed in {{ relativeDate(submission.createdAt) }}</AppText>
      </div>
      <UiBadge class="shrink-0 rounded-md border-0 text-[12px] font-semibold"
        :style="submission.feedback
          ? 'background:var(--status-active-bg);color:var(--status-active-text)'
          : 'background:var(--status-blocked-bg);color:var(--status-blocked-text)'">
        {{ submission.feedback ? 'Reviewed' : 'To review' }}
      </UiBadge>
    </div>

    <AppText v-if="submission.content" size="14" color="neutral-600" class-list="whitespace-pre-wrap break-words leading-6">
      {{ submission.content }}
    </AppText>
    <AppLink v-if="submission.fileUrl" :to="submission.fileUrl" target="_blank" rel="noopener noreferrer"
      class="flex items-center gap-1.5 text-[14px] text-brand-ink underline underline-offset-2 dark:text-brand-primary">
      <AppIconsax name="Link" color="currentColor" :size="16" />
      <span class="truncate">{{ submission.fileUrl }}</span>
    </AppLink>
    <PagesDashboardClassesTasksTaskFileList v-if="submission.attachments?.length" :task-id="taskId"
      :files="submission.attachments" single />

    <!-- Sent feedback -->
    <div v-if="submission.feedback && !editing" class="rounded-lg bg-surface-raised p-3">
      <div class="flex items-center justify-between gap-2">
        <AppText size="13" weight="semibold" color="neutral-600">Your feedback</AppText>
        <AppButton variant="ghost" size="28" radius="8" icon="Edit2" text="Edit"
          :icon-config="{ color: 'currentColor', size: 16 }" class-list="text-[13px] text-text-muted px-2"
          @click="startEditing" />
      </div>
      <AppText size="14" color="neutral-600" class-list="mt-1 whitespace-pre-wrap leading-6">{{ submission.feedback }}</AppText>
    </div>

    <!-- Write / edit feedback -->
    <div v-else class="space-y-2">
      <UiTextarea v-model="draft" :aria-label="`Feedback for ${submission.student.displayName}`"
        placeholder="Write feedback…" rows="2" maxlength="5000" class="resize-none text-[14px] leading-6" />
      <AppText v-if="error" size="13" color="error">{{ error }}</AppText>
      <div class="flex justify-end gap-1.5">
        <AppButton v-if="submission.feedback" variant="ghost" size="32" radius="8" text="Cancel"
          class-list="text-[14px]" @click="editing = false" />
        <AppButton variant="primary" size="32" radius="8" icon="Send2" :icon-config="{ color: 'white', size: 16 }"
          text="Send feedback" class-list="text-[14px] px-3" :loading="saving" :disabled="!draft.trim()" @click="save" />
      </div>
    </div>
  </article>
</template>
