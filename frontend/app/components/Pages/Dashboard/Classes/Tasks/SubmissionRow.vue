<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { TaskSubmissionItem } from '~/common/types/task-types'

const props = defineProps<{
  taskId: string
  submission: TaskSubmissionItem
}>()

const emit = defineEmits<{
  updated: [submission: TaskSubmissionItem]
}>()

const { giveFeedback } = useTasks()

const feedbackDraft = ref(props.submission.feedback ?? '')
const editing = ref(false)
const saving = ref(false)
const feedbackError = ref('')

function avatarInitial(name: string) { return name.charAt(0).toUpperCase() }

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(diff / 3_600_000)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(diff / 86_400_000)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

function startEditing() {
  feedbackDraft.value = props.submission.feedback ?? ''
  feedbackError.value = ''
  editing.value = true
}

async function saveFeedback() {
  const text = feedbackDraft.value.trim()
  if (!text) { feedbackError.value = 'Feedback cannot be empty'; return }
  if (text.length > 5000) { feedbackError.value = 'Feedback must be at most 5000 characters'; return }
  if (saving.value) return
  saving.value = true
  feedbackError.value = ''
  const res = await giveFeedback(props.taskId, props.submission.id, text)
  saving.value = false
  if (!res.success) {
    feedbackError.value = res.message || 'Could not save feedback'
    return
  }
  const updated = (res.data as any)?.data as TaskSubmissionItem
  emit('updated', updated)
  editing.value = false
  toast.success('Feedback saved.')
}
</script>

<template>
  <div class="rounded-xl overflow-hidden" style="border:1px solid var(--border-inner)">
    <!-- Student header -->
    <div class="flex items-center gap-3 px-4 py-3" style="background:var(--surface-raised);border-bottom:1px solid var(--border-inner)">
      <UiAvatar class="size-8 shrink-0">
        <UiAvatarImage v-if="submission.student.avatarUrl" :src="submission.student.avatarUrl" :alt="submission.student.displayName ?? ''" />
        <UiAvatarFallback class="text-[12px] font-semibold font-poppins" style="background:rgba(245,158,11,0.15);color:var(--color-brand-primary)">
          {{ avatarInitial(submission.student.displayName ?? '?') }}
        </UiAvatarFallback>
      </UiAvatar>
      <AppText size="13" weight="semibold" class-list="flex-1 truncate" :style="`color:var(--text-heading)`">
        {{ submission.student.displayName }}
      </AppText>
      <AppText size="11" :style="`color:var(--text-subtle)`">{{ relativeDate(submission.createdAt) }}</AppText>
    </div>

    <div class="p-4 space-y-3" style="background:var(--surface-card)">
      <!-- Submitted content -->
      <div v-if="submission.content">
        <AppText size="13" class-list="whitespace-pre-wrap leading-relaxed" :style="`color:var(--text-body)`">
          {{ submission.content }}
        </AppText>
      </div>

      <!-- File link -->
      <div v-if="submission.fileUrl" class="flex items-center gap-2">
        <AppIconsax name="AttachCircle" color="var(--color-brand-primary)" :size="14" />
        <AppLink :to="submission.fileUrl" target="_blank" rel="noopener noreferrer" class="text-[13px] text-brand-primary underline underline-offset-2 truncate max-w-xs">
          {{ submission.fileUrl }}
        </AppLink>
      </div>

      <!-- Feedback area -->
      <div class="pt-1" style="border-top:1px solid var(--border-inner)">
        <!-- Existing feedback (non-editing view) -->
        <template v-if="submission.feedback && !editing">
          <div class="rounded-lg p-3 space-y-1.5" style="background:var(--surface-raised);border-left:3px solid var(--color-brand-primary)">
            <div class="flex items-center justify-between">
              <AppText size="11" weight="semibold" :uppercase="true" class-list="tracking-[0.1em]" :style="`color:var(--color-brand-primary)`">Your feedback</AppText>
              <AppButton aria-label="Edit feedback"
                variant="secondary"
                size="24"
                radius="8"
                icon="Edit2"
                :icon-config="{ color: 'currentColor', size: 11 }"
                @click="startEditing"
              />
            </div>
            <AppText size="13" class-list="whitespace-pre-wrap leading-relaxed" :style="`color:var(--text-body)`">
              {{ submission.feedback }}
            </AppText>
            <AppText v-if="submission.feedbackAt" size="11" :style="`color:var(--text-subtle)`">
              {{ relativeDate(submission.feedbackAt) }}
            </AppText>
          </div>
        </template>

        <!-- Write / Edit feedback form -->
        <template v-else-if="editing || !submission.feedback">
          <div class="space-y-2">
            <AppText size="11" weight="semibold" :uppercase="true" class-list="tracking-[0.1em] block" :style="`color:var(--text-subtle)`">
              {{ submission.feedback ? 'Edit feedback' : 'Write feedback' }}
            </AppText>
            <UiTextarea
              v-model="feedbackDraft"
              placeholder="Write feedback for this student…"
              rows="3"
              maxlength="5000"
              class="resize-none font-poppins text-[13px] w-full"
              :style="`color:var(--text-body);background:var(--surface-raised);border-color:var(--border-inner)`"
            />
            <div v-if="feedbackError" class="text-[12px] text-red-500 font-poppins">{{ feedbackError }}</div>
            <div class="flex items-center gap-2 justify-end">
              <AppButton
                v-if="editing"
                variant="secondary"
                size="28"
                radius="8"
                text="Cancel"
                class="text-[12px]!"
                @click="editing = false"
              />
              <AppButton
                variant="primary"
                size="28"
                radius="8"
                icon="Send2"
                :icon-config="{ color: 'white', size: 12 }"
                text="Save"
                class="text-[12px]!"
                :loading="saving"
                :disabled="!feedbackDraft.trim()"
                @click="saveFeedback"
              />
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
