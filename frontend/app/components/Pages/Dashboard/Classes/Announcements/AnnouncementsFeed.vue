<script setup lang="ts">
import type { CommentDraft } from '~/common/types/task-types'

// The class's Announcements tab: a post box for tutors, then the stream, newest first.
// State and rules in useAnnouncementFeed.
const props = defineProps<{
  classId: string
  /** Tutor of the class or admin */
  canManage: boolean
  isAdmin: boolean
  archived: boolean
}>()

const feed = useAnnouncementFeed(toRef(props, 'classId'), {
  canManage: toRef(props, 'canManage'),
  isAdmin: toRef(props, 'isAdmin'),
  archived: toRef(props, 'archived'),
})
const { items, loading, loadingMore, posting, busyId, page, totalPages, canPost, canToggle } = feed

async function onPost(draft: CommentDraft, done: (ok: boolean) => void) {
  done(await feed.post(draft))
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="canPost">
      <AppText size="14" weight="medium" class-list="mb-2">New announcement</AppText>
      <PagesDashboardClassesTasksTaskCommentBox id="announcement-new" :busy="posting" :rows="3" text-required
        label="New announcement" placeholder="Share something with your class. Students are notified."
        @submit="onPost" />
    </div>

    <template v-if="loading">
      <div v-for="i in 2" :key="i" class="space-y-3 rounded-xl border border-border-inner p-5">
        <div class="flex items-center gap-3">
          <UiSkeleton class="size-10 rounded-full" />
          <div class="space-y-1.5"><UiSkeleton class="h-4 w-32" /><UiSkeleton class="h-3.5 w-24" /></div>
        </div>
        <UiSkeleton class="h-4 w-full" />
        <UiSkeleton class="h-4 w-3/4" />
      </div>
    </template>

    <UiEmpty v-else-if="!items.length" class="py-10">
      <UiEmptyMedia variant="icon"><AppIconsax name="Notification" :size="22" /></UiEmptyMedia>
      <UiEmptyContent>
        <UiEmptyTitle>No announcements yet</UiEmptyTitle>
        <UiEmptyDescription>{{ canPost ? 'Post one above. Students get a notification.' : 'Your teacher\'s announcements will appear here.' }}</UiEmptyDescription>
      </UiEmptyContent>
    </UiEmpty>

    <template v-else>
      <PagesDashboardClassesAnnouncementsAnnouncementCard v-for="a in items" :key="a.id" :announcement="a"
        :class-id="classId" :can-edit="feed.canEdit(a)" :can-toggle="canToggle" :can-manage="canManage"
        :archived="archived" :busy="busyId === a.id" :get-download="feed.downloadFor(a.id)"
        @save="(draft, done) => feed.edit(a, draft).then(done)" @toggle-comments="feed.setCommentsEnabled(a, $event)"
        @delete="feed.remove(a)" @count="feed.setCommentCount(a.id, $event)" />

      <div v-if="page < totalPages" class="flex justify-center">
        <AppButton variant="secondary" size="36" radius="8" text="Load older" :loading="loadingMore" class-list="px-4" @click="feed.loadMore" />
      </div>
    </template>
  </div>
</template>
