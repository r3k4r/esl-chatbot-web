<script setup lang="ts">
import type { AnnouncementItem } from '~/common/types/class-types'
import type { CommentDraft } from '~/common/types/task-types'

// One announcement: author and time, the text and files (or the edit box), the 3-dot menu
// (Edit and Delete for the author/admin, comments on/off for tutors), then its comments.
const props = defineProps<{
  announcement: AnnouncementItem
  classId: string
  canEdit: boolean
  canToggle: boolean
  canManage: boolean
  archived: boolean
  busy: boolean
  getDownload: (fileId: string) => Promise<{ success: boolean; message?: string; data: any }>
}>()

const emit = defineEmits<{
  save: [draft: CommentDraft, done: (ok: boolean) => void]
  toggleComments: [on: boolean]
  delete: []
  count: [n: number]
}>()

const editing = ref(false)
const deleteOpen = ref(false)

const a = computed(() => props.announcement)
const initials = computed(() => a.value.author.displayName.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase())
const when = computed(() => new Date(a.value.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }))

function onSave(draft: CommentDraft, done: (ok: boolean) => void) {
  emit('save', draft, ok => { if (ok) editing.value = false; done(ok) })
}
</script>

<template>
  <article class="rounded-xl border border-border-inner bg-surface-card">
    <div class="p-4 sm:p-5">
      <header class="flex items-center gap-3">
        <UiAvatar class="size-10 shrink-0">
          <UiAvatarImage v-if="a.author.avatarUrl" :src="a.author.avatarUrl" :alt="a.author.displayName" />
          <UiAvatarFallback class="bg-brand-primary/12 text-[14px] font-semibold text-brand-primary">{{ initials }}</UiAvatarFallback>
        </UiAvatar>
        <div class="min-w-0 flex-1">
          <AppText size="15" weight="semibold" class-list="truncate">{{ a.author.displayName }}</AppText>
          <AppText size="13" color="neutral-400">{{ when }}<template v-if="a.editedAt"> · edited</template></AppText>
        </div>

        <UiDropdownMenu v-if="(canEdit || canToggle) && !editing">
          <UiDropdownMenuTrigger as-child>
            <AppButton variant="ghost" size="32" radius="8" aspect="square" icon="More"
              :icon-config="{ color: 'var(--color-text-muted)', size: 18 }" :loading="busy" aria-label="Announcement options" />
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end" class="w-52">
            <UiDropdownMenuItem v-if="canEdit" class="cursor-pointer gap-2.5 text-[14px]" @select="editing = true">
              <AppIconsax name="Edit2" color="currentColor" :size="16" /> Edit
            </UiDropdownMenuItem>
            <UiDropdownMenuItem v-if="canToggle" class="cursor-pointer gap-2.5 text-[14px]" @select="emit('toggleComments', !a.commentsEnabled)">
              <AppIconsax :name="a.commentsEnabled ? 'MessageRemove' : 'MessageText'" color="currentColor" :size="16" />
              {{ a.commentsEnabled ? 'Turn off comments' : 'Turn on comments' }}
            </UiDropdownMenuItem>
            <template v-if="canEdit">
              <UiDropdownMenuSeparator />
              <UiDropdownMenuItem variant="destructive" class="cursor-pointer gap-2.5 text-[14px]" @select="deleteOpen = true">
                <AppIconsax name="Trash" color="currentColor" :size="16" /> Delete
              </UiDropdownMenuItem>
            </template>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </header>

      <PagesDashboardClassesTasksTaskCommentBox v-if="editing" :id="`edit-announcement-${a.id}`" class="mt-4" editing
        :busy="busy" :initial-content="a.content" :initial-files="a.attachments" :rows="3" text-required
        label="Edit announcement" @submit="onSave" @cancel="editing = false" />
      <template v-else>
        <AppText size="15" color="neutral-600" class-list="mt-3 whitespace-pre-wrap break-words leading-7">{{ a.content }}</AppText>
        <PagesDashboardClassesTasksTaskFileList v-if="a.attachments.length" class="mt-3" :files="a.attachments" :get-download="getDownload" />
      </template>
    </div>

    <div class="border-t border-border-inner px-4 py-2.5 sm:px-5">
      <PagesDashboardClassesAnnouncementsAnnouncementComments :class-id="classId" :announcement="a"
        :can-manage="canManage" :archived="archived" @count="emit('count', $event)" />
    </div>

    <UiAlertDialog v-model:open="deleteOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Delete this announcement?</UiAlertDialogTitle>
          <UiAlertDialogDescription>It's removed for the whole class with its comments and files. This can't be undone.</UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
          <UiAlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="emit('delete')">Delete</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </article>
</template>
