<script setup lang="ts">
import { calendarDays } from '~/lib/progress'
import type { TaskItem } from '~/common/types/task-types'

const props = defineProps<{
  task: TaskItem
  canManage: boolean
  isStudent: boolean
}>()

const emit = defineEmits<{
  open: []
  edit: []
  delete: []
  toggleClosed: []
}>()

function fmtDeadline(iso: string): { label: string; overdue: boolean } {
  const diff = Math.floor((new Date(iso).getTime() - Date.now()) / 1000 / 60)
  if (diff < 0) {
    const over = -diff
    if (over < 60) return { label: 'Just overdue', overdue: true }
    if (over < 1440) return { label: `Overdue by ${Math.floor(over / 60)}h`, overdue: true }
    return { label: `Overdue by ${calendarDays(iso)}d`, overdue: true }
  }
  if (diff < 60) return { label: 'Due soon', overdue: false }
  if (diff < 1440) return { label: `Due in ${Math.floor(diff / 60)}h`, overdue: false }
  const days = calendarDays(new Date(), iso)
  if (days === 0) return { label: 'Due today', overdue: false }
  return { label: `Due in ${days}d`, overdue: false }
}

const deadlineInfo = computed(() =>
  props.task.deadline ? fmtDeadline(props.task.deadline) : null,
)

const submissionState = computed(() => {
  if (!props.isStudent) return null
  if (!props.task.mySubmission) return 'none'
  if (props.task.mySubmission.feedback) return 'feedback'
  return 'submitted'
})
</script>

<template>
  <div class="rounded-xl p-4 cursor-pointer transition-colors animate-card-enter"
    style="background:var(--surface-raised);border:1px solid var(--border-inner)"
    :onmouseenter="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--surface-well)'"
    :onmouseleave="(e: MouseEvent) => (e.currentTarget as HTMLElement).style.background = 'var(--surface-raised)'"
    @click="emit('open')">
    <div class="flex items-start gap-3">
      <!-- Left content -->
      <div class="flex-1 min-w-0">
        <!-- Title row -->
        <div class="flex items-center gap-2 flex-wrap mb-1">
          <AppText size="14" weight="semibold" class-list="truncate" :style="`color:var(--text-heading)`">
            {{ task.title }}
          </AppText>
          <!-- Status badge -->
          <span class="text-[11px] font-semibold font-poppins px-2 py-0.5 rounded-lg shrink-0" :style="task.status === 'OPEN'
            ? 'background:var(--status-active-bg);color:var(--status-active-text)'
            : 'background:var(--status-inactive-bg);color:var(--status-inactive-text)'">
            {{ task.status === 'OPEN' ? 'Open' : 'Closed' }}
          </span>
        </div>

        <!-- Description preview -->
        <AppText size="13" class-list="block truncate mb-2" :style="`color:var(--text-muted)`">
          {{ task.description }}
        </AppText>

        <!-- Meta chips row -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Author -->
          <div class="flex items-center gap-1">
            <AppIconsax name="Profile" color="var(--color-text-subtle)" :size="11" />
            <AppText size="11" :style="`color:var(--text-subtle)`">{{ task.createdBy.displayName }}</AppText>
          </div>

          <!-- Deadline chip -->
          <template v-if="deadlineInfo">
            <span style="color:var(--text-subtle);font-size:10px">·</span>
            <div class="flex items-center gap-1">
              <AppIconsax name="Clock" :size="11"
                :style="deadlineInfo.overdue && task.status === 'OPEN' ? 'color:var(--status-expired-text)' : 'color:var(--color-text-subtle)'" />
              <AppText size="11" :style="deadlineInfo.overdue && task.status === 'OPEN'
                ? 'color:var(--status-expired-text)'
                : 'color:var(--text-subtle)'">
                {{ deadlineInfo.label }}
              </AppText>
            </div>
          </template>

          <!-- Submission count (tutor/admin) -->
          <template v-if="canManage && task.submissionCount !== undefined">
            <span style="color:var(--text-subtle);font-size:10px">·</span>
            <div class="flex items-center gap-1">
              <AppIconsax name="DirectboxReceive" color="var(--color-text-subtle)" :size="11" />
              <AppText size="11" :style="`color:var(--text-subtle)`">{{ task.submissionCount }} submission{{
                task.submissionCount === 1 ? '' : 's' }}</AppText>
            </div>
          </template>

          <!-- Comments + files -->
          <template v-if="task.commentCount">
            <span style="color:var(--text-subtle);font-size:10px">·</span>
            <div class="flex items-center gap-1">
              <AppIconsax name="Messages2" color="var(--color-text-subtle)" :size="11" />
              <AppText size="11" :style="`color:var(--text-subtle)`">{{ task.commentCount }}</AppText>
            </div>
          </template>
          <template v-if="task.attachments?.length">
            <span style="color:var(--text-subtle);font-size:10px">·</span>
            <div class="flex items-center gap-1">
              <AppIconsax name="Paperclip2" color="var(--color-text-subtle)" :size="11" />
              <AppText size="11" :style="`color:var(--text-subtle)`">{{ task.attachments.length }}</AppText>
            </div>
          </template>

          <!-- Student submission state -->
          <template v-if="submissionState === 'none'">
            <span style="color:var(--text-subtle);font-size:10px">·</span>
            <AppText size="11" :style="`color:var(--text-muted)`">Not submitted</AppText>
          </template>
          <template v-else-if="submissionState === 'submitted'">
            <span style="color:var(--text-subtle);font-size:10px">·</span>
            <AppText size="11" :style="`color:var(--status-active-text)`">Submitted</AppText>
          </template>
          <template v-else-if="submissionState === 'feedback'">
            <span style="color:var(--text-subtle);font-size:10px">·</span>
            <AppText size="11" class-list="font-semibold" :style="`color:var(--color-brand-primary)`">Feedback received
            </AppText>
          </template>
        </div>
      </div>

      <!-- 3-dot actions (tutor/admin only) -->
      <div v-if="canManage" class="shrink-0" @click.stop>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <AppButton aria-label="Task actions" variant="secondary" size="28" radius="8" aspect="square" icon="More"
              :icon-config="{ color: 'currentColor', size: 16 }" />
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end" :style="`background:var(--surface-card);border-color:var(--border-card)`">
            <UiDropdownMenuItem class="cursor-pointer font-poppins text-[13px]" :style="`color:var(--text-body)`"
              @click="emit('edit')">
              <AppIconsax name="Edit2" color="var(--color-text-muted)" :size="14" class="mr-2" />
              Edit
            </UiDropdownMenuItem>
            <UiDropdownMenuItem class="cursor-pointer font-poppins text-[13px]" :style="`color:var(--text-body)`"
              @click="emit('toggleClosed')">
              <AppIconsax :name="task.status === 'OPEN' ? 'Lock1' : 'Unlock'" color="var(--color-text-muted)" :size="14"
                class="mr-2" />
              {{ task.status === 'OPEN' ? 'Close task' : 'Reopen task' }}
            </UiDropdownMenuItem>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem class="cursor-pointer font-poppins text-[13px] text-red-500 focus:text-red-500"
              @click="emit('delete')">
              <AppIconsax name="Trash" color="rgb(239,68,68)" :size="14" class="mr-2" />
              Delete
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>

      <!-- Arrow for student click hint -->
      <AppIconsax v-else name="ArrowRight3" color="var(--color-text-subtle)" :size="14" class="shrink-0 mt-0.5" />
    </div>
  </div>
</template>
