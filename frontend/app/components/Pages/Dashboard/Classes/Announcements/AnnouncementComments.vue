<script setup lang="ts">
import type { AnnouncementCommentItem, AnnouncementItem } from '~/common/types/class-types'
import type { CommentDraft } from '~/common/types/task-types'

// The class comments under one announcement. Closed by default (just the count); the
// thread loads the first time it's opened. Text only.
const props = defineProps<{
  classId: string
  announcement: AnnouncementItem
  /** Tutor of the class or admin */
  canManage: boolean
  archived: boolean
}>()
const emit = defineEmits<{ count: [n: number] }>()

const state = useAnnouncementComments(toRef(props, 'classId'), toRef(props, 'announcement'), {
  canManage: toRef(props, 'canManage'),
  archived: toRef(props, 'archived'),
  onCount: n => emit('count', n),
})
const { comments, loading, posting, savingId, canComment } = state

const open = ref(false)
const count = computed(() => props.announcement.commentCount)
const toggleLabel = computed(() => {
  if (open.value) return 'Hide comments'
  if (count.value) return `${count.value} class comment${count.value === 1 ? '' : 's'}`
  return canComment.value ? 'Add a class comment' : 'No comments'
})

function toggle() {
  open.value = !open.value
  if (open.value) state.load()
}

async function onPost(draft: CommentDraft, done: (ok: boolean) => void) {
  done(await state.post(draft.content))
}

// Kept apart from `deleteOpen`: the dialog closes before its action's click runs.
const toDelete = ref<AnnouncementCommentItem | null>(null)
const deleteOpen = ref(false)
function askDelete(c: AnnouncementCommentItem) { toDelete.value = c; deleteOpen.value = true }
function confirmDelete() { if (toDelete.value) state.remove(toDelete.value.id) }
</script>

<template>
  <div>
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <AppButton variant="ghost" size="32" radius="8" icon="Messages" :text="toggleLabel"
        :icon-config="{ color: 'currentColor', size: 18 }" class-list="-ms-2 px-2 text-[14px] text-text-muted"
        :aria-expanded="open" :disabled="!count && !canComment" @click="toggle" />
      <AppText v-if="!announcement.commentsEnabled" size="13" color="neutral-400">
        {{ canManage ? 'Comments are off for students' : 'Comments are turned off' }}
      </AppText>
    </div>

    <div v-if="open" class="mt-3 space-y-4">
      <template v-if="loading">
        <div v-for="i in 2" :key="i" class="flex gap-3">
          <UiSkeleton class="size-9 shrink-0 rounded-full" />
          <div class="flex-1 space-y-2"><UiSkeleton class="h-4 w-32" /><UiSkeleton class="h-4 w-full" /></div>
        </div>
      </template>
      <PagesDashboardClassesTasksTaskCommentItem v-for="c in comments" v-else :key="c.id" :comment="c"
        :can-edit="state.canEdit(c)" :can-delete="state.canDelete(c)" :saving="savingId === c.id"
        @save="(draft, done) => state.edit(c.id, draft.content).then(done)" @delete="askDelete(c)" />

      <PagesDashboardClassesTasksTaskCommentBox v-if="canComment" :id="`announcement-comment-${announcement.id}`"
        :busy="posting" no-files text-required @submit="onPost" />
    </div>

    <UiAlertDialog v-model:open="deleteOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Delete this comment?</UiAlertDialogTitle>
          <UiAlertDialogDescription>It's removed for the whole class. This can't be undone.</UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
          <UiAlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="confirmDelete">Delete</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
