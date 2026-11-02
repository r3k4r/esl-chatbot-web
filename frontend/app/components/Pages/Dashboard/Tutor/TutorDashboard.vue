<script setup lang="ts">
const {
  loading,
  fetchTutorDashboard,
  classes,
  students,
  skills,
  sessionsToday,
  recentActivity,
} = useTutorDashboard()

onMounted(fetchTutorDashboard)

const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

const statCards = computed(() => [
  { label: 'Classes', value: classes.value.total, sub: `${classes.value.active} active`, icon: 'BookSaved', accent: 'default' as const },
  { label: 'Students', value: students.value.total, sub: `${students.value.activeToday} active today`, icon: 'People', accent: 'green' as const },
  { label: 'Weekly active', value: students.value.activeThisWeek, sub: `of ${students.value.total} students`, icon: 'Activity', accent: 'premium' as const },
  { label: 'Sessions today', value: sessionsToday.value, sub: 'Across all students', icon: 'Messages', accent: 'gold' as const },
])

// Skill sparkbars — lower score = higher priority to address
const skillBars = computed(() => [
  { label: 'Grammar', value: skills.value.avgGrammar, max: 100, color: '#f59e0b', suffix: '%' },
  { label: 'Vocabulary', value: skills.value.avgVocabulary, max: 100, color: '#8b5cf6', suffix: '%' },
  { label: 'Fluency', value: skills.value.avgFluency, max: 100, color: '#22c55e', suffix: '%' },
  { label: 'Speaking', value: skills.value.avgSpeaking, max: 100, color: '#06b6d4', suffix: '%' },
])

// Weakest skill — surface a suggested action for the tutor
const weakestSkill = computed(() => {
  const bars = skillBars.value
  if (!bars.length || !students.value.total) return null
  return bars.reduce((a, b) => (b.value < a.value ? b : a))
})

// Student engagement donut
const engagementSegments = computed(() => [
  { label: 'Active today', value: students.value.activeToday, color: '#22c55e' },
  { label: 'Active this week', value: Math.max(0, students.value.activeThisWeek - students.value.activeToday), color: 'var(--color-brand-primary)' },
  { label: 'Inactive', value: Math.max(0, students.value.total - students.value.activeThisWeek), color: 'var(--color-text-subtle)' },
])

const inactiveCount = computed(() =>
  Math.max(0, students.value.total - students.value.activeThisWeek)
)
</script>

<template>
  <div class="h-full overflow-y-auto p-5 sm:p-7 space-y-6">

    <!-- Header — ONE action: Create class (primary tutor action, not already in sidebar nav) -->
    <div class="flex items-center justify-between gap-4 flex-wrap animate-card-enter" style="--delay:0ms">
      <div>
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#B91C1C]/10 border border-[#B91C1C]/20 mb-2">
          <img src="/leo-logo.jpg" alt="Leo" class="size-3.5 rounded-full object-cover" />
          <span class="text-[10px] font-semibold text-[#B91C1C] dark:text-red-400 uppercase tracking-widest font-poppins">
            Leo Faculty &amp; Tutor Portal · پەیمانگای لیۆ
          </span>
        </div>
        <p class="text-[24px] font-bold font-poppins" :style="`color:var(--text-heading)`">Student Speech Analytics &amp; Classes</p>
        <p class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">{{ today }}</p>
      </div>
      <AppButton
        variant="primary"
        size="36"
        radius="8"
        icon="Add"
        text="Create class"
        :icon-config="{ color: 'white', size: 15 }"
        @click="$router.push('/dashboard/classes/create')"
      />
    </div>

    <!-- Stat cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-card-enter" style="--delay:80ms">
      <template v-if="loading">
        <UiSkeleton v-for="n in 4" :key="n" class="h-24 rounded-xl" />
      </template>
      <template v-else>
        <PagesDashboardSharedDashStatCard
          v-for="card in statCards"
          :key="card.label"
          :label="card.label"
          :value="card.value"
          :sub="card.sub"
          :icon="card.icon"
          :accent="card.accent"
        />
      </template>
    </div>

    <!-- Charts row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-card-enter" style="--delay:160ms">

      <!-- Avg class skills — footer links to Goals so tutor can assign goals based on weak areas -->
      <PagesDashboardSharedDashSectionCard
        title="Average class skills"
        icon="Chart"
        to="/dashboard/goals"
        link-label="Assign goals to improve skills"
      >
        <template v-if="loading">
          <UiSkeleton v-for="n in 4" :key="n" class="h-10 rounded-xl" />
        </template>
        <template v-else>
          <PagesDashboardSharedDashSparkbar :bars="skillBars" />
          <!-- Weakest-skill nudge -->
          <div
            v-if="weakestSkill && weakestSkill.value < 70"
            class="mt-3 flex items-center gap-2.5 p-3 rounded-xl"
            :style="`background:var(--surface-raised)`"
          >
            <AppIconsax name="Danger" color="#f59e0b" :size="15" />
            <p class="text-[13px] font-poppins" :style="`color:var(--text-muted)`">
              <span class="font-semibold" :style="`color:var(--text-heading)`">{{ weakestSkill.label }}</span>
              is the weakest area ({{ weakestSkill.value }}%). Consider assigning focused goals.
            </p>
          </div>
        </template>
      </PagesDashboardSharedDashSectionCard>

      <!-- Student engagement donut — footer links to classes for student details -->
      <PagesDashboardSharedDashSectionCard
        title="Student engagement"
        icon="Activity"
        :to="students.total > 0 ? '/dashboard/classes' : undefined"
        link-label="View student details"
      >
        <template v-if="loading">
          <UiSkeleton class="h-36 rounded-xl" />
        </template>
        <template v-else-if="students.total === 0">
          <UiEmpty class="py-4">
            <UiEmptyMedia>
              <AppIconsax name="People" color="var(--color-text-subtle)" :size="28" />
            </UiEmptyMedia>
            <UiEmptyContent>
              <UiEmptyTitle>No students yet</UiEmptyTitle>
              <UiEmptyDescription>Create a class and share the join code.</UiEmptyDescription>
            </UiEmptyContent>
          </UiEmpty>
        </template>
        <template v-else>
          <PagesDashboardSharedDashDonutChart :segments="engagementSegments" />
          <!-- Inactive nudge -->
          <div
            v-if="inactiveCount > 0"
            class="mt-3 flex items-center gap-2.5 p-3 rounded-xl"
            :style="`background:var(--surface-raised)`"
          >
            <AppIconsax name="InfoCircle" color="var(--color-text-subtle)" :size="15" />
            <p class="text-[13px] font-poppins" :style="`color:var(--text-muted)`">
              <span class="font-semibold" :style="`color:var(--text-heading)`">{{ inactiveCount }}</span>
              student{{ inactiveCount !== 1 ? 's' : '' }} inactive this week. Check their class progress.
            </p>
          </div>
        </template>
      </PagesDashboardSharedDashSectionCard>

    </div>

    <!-- Recent activity — footer links to classes (where you can drill into student details) -->
    <div class="animate-card-enter" style="--delay:240ms">
      <PagesDashboardSharedDashSectionCard
        title="Recent student activity"
        icon="Clock"
        :to="recentActivity.length ? '/dashboard/classes' : undefined"
        link-label="See all student activity"
      >
        <template v-if="loading">
          <div class="grid sm:grid-cols-2 gap-2">
            <UiSkeleton v-for="n in 6" :key="n" class="h-14 rounded-xl" />
          </div>
        </template>
        <template v-else-if="recentActivity.length === 0">
          <UiEmpty class="py-6">
            <UiEmptyMedia>
              <AppIconsax name="Activity" color="var(--color-text-subtle)" :size="30" />
            </UiEmptyMedia>
            <UiEmptyContent>
              <UiEmptyTitle>No student activity yet</UiEmptyTitle>
              <UiEmptyDescription>Students will appear here once they start sessions.</UiEmptyDescription>
            </UiEmptyContent>
            <AppButton variant="primary" size="32" radius="8" icon="Add" text="Create a class" :icon-config="{ color: 'white', size: 13 }" @click="$router.push('/dashboard/classes/create')" />
          </UiEmpty>
        </template>
        <template v-else>
          <div class="grid sm:grid-cols-2 gap-2">
            <PagesDashboardTutorTutorActivityRow
              v-for="item in recentActivity"
              :key="`${item.userId}-${item.startedAt}`"
              :item="item"
            />
          </div>
        </template>
      </PagesDashboardSharedDashSectionCard>
    </div>

  </div>
</template>
