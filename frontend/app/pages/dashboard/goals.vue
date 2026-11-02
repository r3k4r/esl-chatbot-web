<script setup lang="ts">
import type { Goal, GoalStatus, GoalType } from '~/common/model/goal'
import type { CreateGoalInput, UpdateGoalInput } from '~/composables/useGoals'

definePageMeta({ layout: 'dashboard', requiresAuth: true })

const {
  goals, loading, submitting,
  fetchGoals, createGoal, updateGoal, deleteGoal,
  activeGoals, completedGoals, filterStatus, filterType,
} = useGoals()

const streak = ref(0)
const totalStudyMinutes = ref(0)
const totalSessions = ref(0)
const totalWords = ref(0)

async function fetchMetrics() {
  const [m, s, v] = await Promise.all([
    useHttp<any>({ method: 'GET', url: '/metrics/me', requireAuth: true, showToast: false }),
    useHttp<any>({ method: 'GET', url: '/sessions?limit=1', requireAuth: true, showToast: false }),
    useHttp<any>({ method: 'GET', url: '/vocabulary?limit=1', requireAuth: true, showToast: false }),
  ])
  if (m.success && m.data?.data) {
    streak.value = m.data.data.currentStreak ?? 0
    totalStudyMinutes.value = m.data.data.totalStudyTimeMinutes ?? 0
  }
  if (s.success) totalSessions.value = (s.data as any)?.meta?.total ?? 0
  if (v.success) totalWords.value = (v.data as any)?.meta?.total ?? 0
}

onMounted(() => Promise.all([fetchGoals(), fetchMetrics()]))
watch([filterStatus, filterType], fetchGoals)

const modalOpen = ref(false)
const editingGoal = ref<Goal | null>(null)
const deleteTarget = ref<string | null>(null)

function openCreate() { editingGoal.value = null; modalOpen.value = true }
function openEdit(goal: Goal) { editingGoal.value = goal; modalOpen.value = true }
async function handleCreate(input: CreateGoalInput) { if (await createGoal(input)) modalOpen.value = false }
async function handleUpdate(id: string, input: UpdateGoalInput) { if (await updateGoal(id, input)) modalOpen.value = false }
async function confirmDelete() { if (deleteTarget.value) { await deleteGoal(deleteTarget.value); deleteTarget.value = null } }
async function handleStatusChange(id: string, status: GoalStatus) { await updateGoal(id, { status }) }

const STATUS_FILTERS: { value: GoalStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PAUSED', label: 'Paused' },
]

// 'ALL' is a sentinel so UiSelect never receives an empty string (Reka UI requirement)
const TYPE_FILTERS: { value: GoalType | 'ALL'; label: string }[] = [
  { value: 'ALL',         label: 'All types'   },
  { value: 'VOCABULARY',  label: 'Vocabulary'  },
  { value: 'SPEAKING',    label: 'Speaking'    },
  { value: 'GRAMMAR',     label: 'Grammar'     },
  { value: 'CONVERSATION',label: 'Conversation'},
  { value: 'STUDY_TIME',  label: 'Study Time'  },
]

const typeSelectValue = computed({
  get: () => filterType.value || 'ALL',
  set: (v: string) => { filterType.value = v === 'ALL' ? '' : v as GoalType },
})

const emptyMessage = computed(() =>
  filterStatus.value || filterType.value
    ? 'No goals match the current filters.'
    : 'Set your first learning goal to start tracking progress.'
)
</script>

<template>
  <div class="h-full overflow-y-auto p-5 sm:p-7 space-y-6">

    <!-- Header -->
    <div class="flex items-start justify-between gap-4 animate-card-enter" style="--delay:0ms">
      <div>
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#B91C1C]/10 border border-[#B91C1C]/20 mb-2">
          <img src="/leo-logo.jpg" alt="Leo" class="size-3.5 rounded-full object-cover" />
          <span class="text-[10px] font-semibold text-[#B91C1C] dark:text-red-400 uppercase tracking-widest font-poppins">
            Leo Institute Milestones · پەیمانگای لیۆ
          </span>
        </div>
        <AppText size="28" weight="semibold" color="brand-ink" class-list="tracking-tight font-poppins dark:text-white! block">Learning Goals &amp; Targets</AppText>
        <AppText size="14" color="neutral-400" class-list="mt-1 font-poppins">Targets you set. Progress we measure.</AppText>
      </div>
      <AppButton variant="primary" size="38" radius="8" icon="Add" :icon-config="{ color: 'white' }" text="New goal" @click="openCreate" />
    </div>

    <!-- Stats strip -->
    <div class="grid grid-cols-3 gap-4 animate-card-enter" style="--delay:60ms">
      <div class="dash-card p-4 text-center">
        <AppText size="30" weight="semibold" color="brand-ink" class-list="font-poppins leading-none dark:text-white!">{{ activeGoals.length }}</AppText>
        <AppText size="11" color="neutral-400" class-list="uppercase tracking-[0.14em] font-poppins mt-1">Active</AppText>
      </div>
      <div class="dash-card p-4 text-center">
        <AppText size="30" weight="semibold" color="brand-primary" class-list="font-poppins leading-none">{{ completedGoals.length }}</AppText>
        <AppText size="11" color="neutral-400" class-list="uppercase tracking-[0.14em] font-poppins mt-1">Completed</AppText>
      </div>
      <div class="dash-card p-4 text-center">
        <AppText size="30" weight="semibold" color="brand-ink" class-list="font-poppins leading-none dark:text-white!">{{ goals.length }}</AppText>
        <AppText size="11" color="neutral-400" class-list="uppercase tracking-[0.14em] font-poppins mt-1">Total</AppText>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-2 animate-card-enter" style="--delay:120ms">
      <!-- Status pill tabs -->
      <div class="flex items-center gap-1 bg-surface-card border border-border-card rounded-lg p-1">
        <AppButton
          v-for="f in STATUS_FILTERS"
          :key="f.value"
          :variant="filterStatus === f.value ? 'primary' : 'secondary'"
          size="28"
          radius="8"
          :text="f.label"
          :class-list="filterStatus !== f.value ? 'border-0! shadow-none! bg-transparent! text-[12px]!' : 'text-[12px]!'"
          @click="filterStatus = f.value"
        />
      </div>
      <!-- Type select -->
      <UiSelect v-model="typeSelectValue">
        <UiSelectTrigger class="h-9 min-w-36 text-[12px] font-poppins rounded-lg border-border-card bg-surface-card">
          <UiSelectValue placeholder="All types" />
        </UiSelectTrigger>
        <UiSelectContent>
          <UiSelectItem v-for="f in TYPE_FILTERS" :key="f.value" :value="f.value" class="text-[12px] font-poppins">
            {{ f.label }}
          </UiSelectItem>
        </UiSelectContent>
      </UiSelect>
    </div>

    <!-- Loading skeletons -->
    <div v-if="loading" class="grid md:grid-cols-2 gap-4">
      <UiSkeleton v-for="n in 4" :key="n" class="h-48 rounded-2xl" />
    </div>

    <!-- Goal cards -->
    <template v-else-if="goals.length">
      <div class="grid md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
        <PagesDashboardGoalsGoalCard
          v-for="(goal, i) in goals"
          :key="goal.id"
          :goal="goal"
          :delay="80 + i * 60"
          @edit="openEdit"
          @delete="id => deleteTarget = id"
          @update-status="handleStatusChange"
          @update-progress="(id, p) => updateGoal(id, { progress: p })"
        />
      </div>
    </template>

    <!-- Empty state -->
    <template v-else>
      <UiEmpty class="dash-card py-16 animate-card-enter" style="--delay:80ms">
        <UiEmptyMedia>
          <div class="w-14 h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center">
            <AppIconsax name="Flag" color="var(--color-brand-primary)" :size="22" />
          </div>
        </UiEmptyMedia>
        <UiEmptyContent>
          <UiEmptyTitle class="font-poppins">No goals yet</UiEmptyTitle>
          <UiEmptyDescription class="font-poppins">{{ emptyMessage }}</UiEmptyDescription>
          <AppButton
            v-if="!filterStatus && !filterType"
            variant="primary" size="36" radius="8"
            icon="Add" :icon-config="{ color: 'white' }"
            text="Create first goal" class="mt-2"
            @click="openCreate"
          />
        </UiEmptyContent>
      </UiEmpty>
    </template>

    <!-- Achievements -->
    <PagesDashboardGoalsAchievementGrid
      :goals="goals" :streak="streak"
      :total-study-minutes="totalStudyMinutes"
      :total-sessions="totalSessions" :total-words="totalWords"
    />

  </div>

  <!-- Create / Edit modal -->
  <PagesDashboardGoalsGoalFormModal
    v-model:open="modalOpen"
    :submitting="submitting"
    :edit-goal="editingGoal"
    @create="handleCreate"
    @update="handleUpdate"
  />

  <!-- Delete confirmation -->
  <UiAlertDialog :open="!!deleteTarget" @update:open="v => { if (!v) deleteTarget = null }">
    <UiAlertDialogContent>
      <UiAlertDialogHeader>
        <UiAlertDialogTitle class="font-poppins">Delete goal?</UiAlertDialogTitle>
        <UiAlertDialogDescription class="font-poppins">This action cannot be undone.</UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel class="font-poppins" @click="deleteTarget = null">Cancel</UiAlertDialogCancel>
        <UiAlertDialogAction class="bg-red-500 hover:bg-red-600 font-poppins" @click="confirmDelete">Delete</UiAlertDialogAction>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>
