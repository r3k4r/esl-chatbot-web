<script setup lang="ts">
import { calendarDays } from '~/lib/progress'
import type { TaskItem } from '~/common/types/task-types'

const props = defineProps<{
  task: TaskItem
  className?: string
  backTo: string
  canManage: boolean
  busy: boolean
}>()

const emit = defineEmits<{ edit: []; toggleClosed: []; delete: [] }>()

const deleteOpen = ref(false)

const posted = computed(() => new Date(props.task.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }))

// "Due Mon, Nov 24, 2:00 PM · in 6 days"; overdue only matters while the task is open.
const due = computed(() => {
  if (!props.task.deadline) return null
  const d = new Date(props.task.deadline)
  const days = calendarDays(new Date(), d)
  const when = d.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  const overdue = days < 0 && props.task.status === 'OPEN'
  const rel = days < 0 ? `${-days} day${days === -1 ? '' : 's'} late` : days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`
  return { label: `Due ${when}`, rel, overdue }
})
</script>

<template>
  <header class="space-y-3">
    <AppLink :to="backTo" class="inline-flex items-center gap-1.5 rounded-md text-[14px] font-medium text-text-muted transition-colors hover:text-text-heading">
      <AppIconsax name="ArrowLeft" color="currentColor" :size="16" />
      {{ className || 'Back to tasks' }}
    </AppLink>

    <div class="flex flex-wrap items-start gap-x-4 gap-y-3">
      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2.5">
          <AppText role="heading" aria-level="1" size="24" weight="semibold" class-list="leading-tight">{{ task.title }}</AppText>
          <UiBadge class="rounded-md border-0 text-[13px] font-semibold"
            :style="task.status === 'OPEN'
              ? 'background:var(--status-active-bg);color:var(--status-active-text)'
              : 'background:var(--status-inactive-bg);color:var(--status-inactive-text)'">
            {{ task.status === 'OPEN' ? 'Open' : 'Closed' }}
          </UiBadge>
        </div>
        <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[14px] text-text-muted">
          <span>{{ task.createdBy.displayName }} · posted {{ posted }}</span>
          <span v-if="due" class="inline-flex items-center gap-1.5 font-medium"
            :class="due.overdue ? 'text-destructive' : 'text-text-body'">
            <AppIconsax name="Clock" color="currentColor" :size="16" />
            {{ due.label }}
            <span class="font-normal" :class="due.overdue ? 'text-destructive' : 'text-text-muted'">· {{ due.rel }}</span>
          </span>
          <span v-else>No deadline</span>
        </div>
      </div>

      <div v-if="canManage" class="flex items-center gap-2">
        <AppButton variant="secondary" size="36" radius="8" icon="Edit2" text="Edit"
          :icon-config="{ color: 'currentColor', size: 16 }" class-list="text-[14px]" @click="emit('edit')" />
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <AppButton variant="secondary" size="36" radius="8" aspect="square" icon="More"
              :icon-config="{ color: 'currentColor', size: 18 }" aria-label="More task actions" :disabled="busy" />
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end" class="w-48">
            <UiDropdownMenuItem class="gap-2.5 cursor-pointer text-[14px]" @select="emit('toggleClosed')">
              <AppIconsax :name="task.status === 'OPEN' ? 'Lock1' : 'Unlock'" color="currentColor" :size="16" />
              {{ task.status === 'OPEN' ? 'Close task' : 'Reopen task' }}
            </UiDropdownMenuItem>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem variant="destructive" class="gap-2.5 cursor-pointer text-[14px]" @select="deleteOpen = true">
              <AppIconsax name="Trash" color="currentColor" :size="16" />
              Delete task
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>
    </div>

    <UiAlertDialog v-model:open="deleteOpen">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Delete this task?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            “{{ task.title }}” and all its submissions, comments and files are removed for the whole class. This can't be undone.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Cancel</UiAlertDialogCancel>
          <UiAlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="emit('delete')">
            Delete
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </header>
</template>
