<script setup lang="ts">
import type { CommentDraft, TaskCommentItem } from '~/common/types/task-types'

const props = defineProps<{
  comment: TaskCommentItem
  canEdit: boolean
  canDelete: boolean
  saving: boolean
}>()

const emit = defineEmits<{
  save: [draft: CommentDraft, done: (ok: boolean) => void]
  delete: []
}>()

const editing = ref(false)

const initials = computed(() =>
  props.comment.author.displayName.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())

const when = computed(() => {
  const d = new Date(props.comment.createdAt)
  const sameDay = d.toDateString() === new Date().toDateString()
  return sameDay
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
})

function onSave(draft: CommentDraft, done: (ok: boolean) => void) {
  emit('save', draft, (ok) => { if (ok) editing.value = false; done(ok) })
}
</script>

<template>
  <article class="flex gap-3">
    <UiAvatar class="size-9 shrink-0">
      <UiAvatarImage v-if="comment.author.avatarUrl" :src="comment.author.avatarUrl" :alt="comment.author.displayName" />
      <UiAvatarFallback class="bg-surface-well text-[13px] font-semibold text-text-muted">{{ initials }}</UiAvatarFallback>
    </UiAvatar>

    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <AppText size="14" weight="semibold" class-list="truncate">{{ comment.author.displayName }}</AppText>
        <UiBadge v-if="comment.author.classRole !== 'STUDENT'"
          class="shrink-0 rounded-md border-0 bg-brand-primary/12 px-1.5 text-[12px] font-semibold text-brand-ink dark:text-brand-primary">
          {{ comment.author.classRole === 'TUTOR' ? 'Teacher' : 'Admin' }}
        </UiBadge>
        <AppText size="13" color="neutral-400" class-list="shrink-0">
          {{ when }}<template v-if="comment.editedAt"> · edited</template>
        </AppText>

        <UiDropdownMenu v-if="(canEdit || canDelete) && !editing">
          <UiDropdownMenuTrigger as-child>
            <AppButton variant="ghost" size="28" radius="8" aspect="square" icon="More"
              :icon-config="{ color: 'var(--color-text-muted)', size: 18 }" class-list="ms-auto shrink-0"
              :aria-label="`Options for ${comment.author.displayName}'s comment`" />
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end" class="w-40">
            <UiDropdownMenuItem v-if="canEdit" class="gap-2.5 cursor-pointer text-[14px]" @select="editing = true">
              <AppIconsax name="Edit2" color="currentColor" :size="16" />
              Edit
            </UiDropdownMenuItem>
            <UiDropdownMenuSeparator v-if="canEdit && canDelete" />
            <UiDropdownMenuItem v-if="canDelete" variant="destructive" class="gap-2.5 cursor-pointer text-[14px]"
              @select="emit('delete')">
              <AppIconsax name="Trash" color="currentColor" :size="16" />
              Delete
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>

      <PagesDashboardClassesTasksTaskCommentBox v-if="editing" :id="`edit-${comment.id}`" class="mt-2" editing
        :busy="saving" :initial-content="comment.content" :initial-files="comment.attachments"
        @submit="onSave" @cancel="editing = false" />

      <template v-else>
        <AppText v-if="comment.content" size="15" color="neutral-600" class-list="mt-0.5 whitespace-pre-wrap break-words leading-6">
          {{ comment.content }}
        </AppText>
        <PagesDashboardClassesTasksTaskFileList v-if="comment.attachments.length" class="mt-2"
          :task-id="comment.taskId" :files="comment.attachments" />
      </template>
    </div>
  </article>
</template>
