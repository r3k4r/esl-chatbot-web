<script setup lang="ts">
import type { Goal, GoalStatus, GoalDifficulty } from '~/common/model/goal'

const props = defineProps<{
  goal: Goal
  delay?: number
}>()

const emit = defineEmits<{
  edit: [goal: Goal]
  delete: [id: string]
  updateStatus: [id: string, status: GoalStatus]
  updateProgress: [id: string, progress: number]
}>()

const TYPE_META: Record<string, { icon: string; color: string }> = {
  VOCABULARY: { icon: 'Book1', color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
  SPEAKING: { icon: 'Microphone', color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
  GRAMMAR: { icon: 'Teacher', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  CONVERSATION: { icon: 'Messages', color: 'text-brand-primary bg-brand-primary/10 border-brand-primary/20' },
  STUDY_TIME: { icon: 'Clock', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
}

const DIFFICULTY_META: Record<GoalDifficulty, { label: string; color: string }> = {
  EASY: { label: 'Easy', color: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400' },
  MEDIUM: { label: 'Medium', color: 'text-amber-600 bg-amber-500/10 dark:text-amber-400' },
  HARD: { label: 'Hard', color: 'text-orange-600 bg-orange-500/10 dark:text-orange-400' },
  EXPERT: { label: 'Expert', color: 'text-red-600 bg-red-500/10 dark:text-red-400' },
}

const STATUS_META: Record<GoalStatus, { label: string; dotColor: string }> = {
  ACTIVE: { label: 'Active', dotColor: 'bg-emerald-400' },
  COMPLETED: { label: 'Completed', dotColor: 'bg-brand-primary' },
  PAUSED: { label: 'Paused', dotColor: 'bg-zinc-400' },
  CANCELLED: { label: 'Cancelled', dotColor: 'bg-red-400' },
}

const typeMeta = computed(() => TYPE_META[props.goal.type] ?? TYPE_META.VOCABULARY)
const diffMeta = computed(() => props.goal.difficulty ? DIFFICULTY_META[props.goal.difficulty] : null)
const statusMeta = computed(() => STATUS_META[props.goal.status])
const isCompleted = computed(() => props.goal.status === 'COMPLETED')

const dueDateLabel = computed(() => {
  if (!props.goal.targetDate) return null
  const diff = new Date(props.goal.targetDate).getTime() - Date.now()
  const days = Math.round(diff / 86_400_000)
  if (days < 0) return { text: `${Math.abs(days)}d overdue`, urgent: true }
  if (days === 0) return { text: 'Due today', urgent: true }
  if (days === 1) return { text: 'Due tomorrow', urgent: false }
  if (days <= 7) return { text: `${days}d left`, urgent: false }
  return { text: new Date(props.goal.targetDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), urgent: false }
})

const barColor = computed(() => {
  if (props.goal.status === 'COMPLETED' || props.goal.progress >= 80) return 'from-brand-primary to-brand-accent'
  if (props.goal.progress >= 40) return 'from-blue-500 to-brand-primary'
  return 'from-zinc-400 to-zinc-500'
})
</script>

<template>
  <div class="dash-card p-5 animate-card-enter flex flex-col gap-4" :style="`--delay:${delay ?? 0}ms`">

    <!-- Top row: type badge + status + 3-dot menu -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-2">
        <div :class="['w-8 h-8 rounded-lg border flex items-center justify-center shrink-0', typeMeta?.color]">
          <AppIconsax :name="(typeMeta?.icon ?? 'Flag') as any" color="currentColor" :size="14" />
        </div>
        <AppText size="11" weight="semibold" color="neutral-400" class-list="uppercase tracking-[0.14em] font-poppins">
          {{ goal.type.replace('_', ' ') }}
        </AppText>
      </div>

      <div class="flex items-center gap-2">
        <!-- Status dot -->
        <div class="flex items-center gap-1.5">
          <span :class="['w-1.5 h-1.5 rounded-full shrink-0', statusMeta.dotColor]" />
          <AppText size="11" color="neutral-400" class-list="font-poppins">{{ statusMeta.label }}</AppText>
        </div>

        <!-- 3-dot actions menu -->
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <AppButton variant="secondary" size="28" radius="8" aspect="square" icon="More"
              :icon-config="{ color: 'var(--color-text-subtle)', size: 14 }"
              class-list="border-0! shadow-none! bg-transparent! hover:bg-surface-raised!" />
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end" class="w-44 font-poppins">
            <UiDropdownMenuItem class="gap-2 cursor-pointer" @click="emit('edit', goal)">
              <AppIconsax name="Edit" color="currentColor" :size="13" />
              Edit goal
            </UiDropdownMenuItem>
            <template v-if="!isCompleted">
              <UiDropdownMenuItem class="gap-2 cursor-pointer" @click="emit('updateStatus', goal.id, 'COMPLETED')">
                <AppIconsax name="TickCircle" color="currentColor" :size="13" />
                Mark as done
              </UiDropdownMenuItem>
              <UiDropdownMenuItem class="gap-2 cursor-pointer"
                @click="emit('updateStatus', goal.id, goal.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED')">
                <AppIconsax :name="goal.status === 'PAUSED' ? 'Play' : 'Pause'" color="currentColor" :size="13" />
                {{ goal.status === 'PAUSED' ? 'Resume' : 'Pause' }}
              </UiDropdownMenuItem>
            </template>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem class="gap-2 cursor-pointer bg-destructive text-white focus:bg-destructive hover:text-white"
              @click="emit('delete', goal.id)">
              <AppIconsax name="Trash" color="white" :size="13" />
              Delete
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>
    </div>

    <!-- Description -->
    <div class="flex-1">
      <AppText size="15" weight="semibold" color="brand-ink"
        class-list="tracking-tight font-poppins leading-snug line-clamp-2 dark:text-white!">
        {{ goal.description }}
      </AppText>
      <AppText v-if="goal.actionPlan" size="12" color="neutral-400" class-list="mt-1 font-poppins line-clamp-1">
        {{ goal.actionPlan }}
      </AppText>
    </div>

    <!-- Progress -->
    <div>
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center gap-2">
          <AppText size="22" weight="semibold" color="brand-ink"
            class-list="font-poppins leading-none dark:text-white!">
            {{ Math.round(goal.progress) }}<span class="text-[13px] text-text-muted font-normal">%</span>
          </AppText>
          <span v-if="diffMeta"
            :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full font-poppins', diffMeta.color]">
            {{ diffMeta.label }}
          </span>
        </div>
        <AppText v-if="dueDateLabel" size="11" weight="medium" class-list="font-poppins"
          :color="dueDateLabel.urgent ? 'error' : 'neutral-400'">
          {{ dueDateLabel.text }}
        </AppText>
      </div>

      <div class="h-2 rounded-full bg-surface-raised overflow-hidden">
        <div :class="['h-full bg-linear-to-r rounded-full animate-fill-bar', barColor]"
          :style="`width:${Math.min(100, goal.progress)}%; --delay:${(delay ?? 0) + 200}ms`" />
      </div>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between pt-1 border-t border-border-inner">
      <div class="flex items-center gap-1.5">
        <AppIconsax name="Teacher" color="var(--color-text-subtle)" :size="11" />
        <AppText size="11" color="neutral-400" class-list="font-poppins">
          {{ goal.assignedByTutor ? `Assigned by ${goal.assignedByTutor.displayName}` : 'Self-assigned' }}
        </AppText>
      </div>

      <div v-if="isCompleted" class="flex items-center gap-1">
        <AppIconsax name="TickCircle" color="var(--color-brand-primary)" :size="12" />
        <AppText size="11" weight="semibold" color="brand-primary" class-list="font-poppins">Completed</AppText>
      </div>
    </div>

  </div>
</template>
