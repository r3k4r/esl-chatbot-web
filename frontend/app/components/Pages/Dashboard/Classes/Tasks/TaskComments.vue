<script setup lang="ts">
import type { CommentDraft, TaskCommentItem } from '~/common/types/task-types'

type CommentsState = ReturnType<typeof useTaskComments>

const props = defineProps<{
  state: CommentsState
  enabled: boolean
  /** Tutor of the class or admin: sees the on/off switch */
  canManage: boolean
  toggling: boolean
}>()

const emit = defineEmits<{ toggle: [on: boolean] }>()

// The state object is created once by the page, so its refs can be unpacked here.
const { comments, loading, savingId, canComment, posting } = props.state

async function onPost(draft: CommentDraft, done: (ok: boolean) => void) {
  done(await props.state.post(draft))
}

// Kept apart from `deleteOpen`: the dialog closes before its action's click runs.
const toDelete = ref<TaskCommentItem | null>(null)
const deleteOpen = ref(false)
function askDelete(c: TaskCommentItem) { toDelete.value = c; deleteOpen.value = true }
function confirmDelete() { if (toDelete.value) props.state.remove(toDelete.value.id) }
</script>

<template>
  <section aria-labelledby="task-comments-title">
    <div class="flex items-center justify-between gap-3">
      <AppText id="task-comments-title" size="16" weight="semibold">
        Class comments<template v-if="comments.length"> · {{ comments.length }}</template>
      </AppText>
      <label v-if="canManage" class="flex cursor-pointer items-center gap-2">
        <AppText size="14" color="neutral-600">{{ enabled ? 'On' : 'Off' }}</AppText>
        <UiSwitch :model-value="enabled" :disabled="toggling" aria-label="Allow students to comment"
          class="data-[state=checked]:bg-brand-primary data-[state=unchecked]:bg-surface-well dark:data-[state=unchecked]:bg-surface-well" @update:model-value="emit('toggle', !!$event)" />
      </label>
    </div>
    <AppText v-if="!enabled" size="14" color="neutral-400" class-list="mt-1">
      {{ canManage ? 'Students can read comments but can\'t add new ones.' : 'Your teacher turned off new comments.' }}
    </AppText>

    <div class="mt-4 space-y-5">
      <template v-if="loading">
        <div v-for="i in 2" :key="i" class="flex gap-3">
          <UiSkeleton class="size-9 shrink-0 rounded-full" />
          <div class="flex-1 space-y-2"><UiSkeleton class="h-4 w-32" /><UiSkeleton class="h-4 w-full" /></div>
        </div>
      </template>
      <AppText v-else-if="!comments.length" size="14" color="neutral-400">
        No comments yet. Questions about this task go here, and the whole class can see them.
      </AppText>
      <PagesDashboardClassesTasksTaskCommentItem v-for="c in comments" v-else :key="c.id" :comment="c"
        :can-edit="state.canEdit(c)" :can-delete="state.canDelete(c)" :saving="savingId === c.id"
        @save="(draft, done) => state.edit(c.id, draft).then(done)" @delete="askDelete(c)" />
    </div>

    <PagesDashboardClassesTasksTaskCommentBox v-if="canComment" id="task-comment-new" class="mt-5" :busy="posting"
      @submit="onPost" />

    <UiAlertDialog v-model:open="deleteOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Delete this comment?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            The comment and its files are removed for the whole class. This can't be undone.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
          <UiAlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="confirmDelete">
            Delete
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </section>
</template>
