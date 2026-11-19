<script setup lang="ts">
import type { KeyFigure } from '~/common/types/dashboard-types'

// Tutor home: what needs them now, then how each class is doing, then what the students
// as a whole find hard. Archived classes are left out (backend).
const { data, loading, error, fetchTutorDashboard } = useTutorDashboard()
onMounted(fetchTutorDashboard)

const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

const figures = computed<KeyFigure[]>(() => {
  const t = data.value?.totals
  if (!t) return []
  return [
    { label: 'Students', value: t.students, hint: `in ${t.classes} class${t.classes === 1 ? '' : 'es'}` },
    { label: 'Practised this week', value: t.activeThisWeek, hint: t.students ? `${Math.round((t.activeThisWeek / t.students) * 100)}% of your students` : 'No students yet' },
    { label: 'To review', value: t.toReview, hint: 'Hand-ins without feedback' },
    { label: 'Missing work', value: t.missing, hint: 'Past the deadline, not handed in' },
  ]
})

const skillRows = computed(() => {
  const s = data.value?.skills
  if (!s) return []
  const v = (n: number) => (s.practisingStudents ? n : null)
  return [
    { key: 'Grammar', value: v(s.grammar) },
    { key: 'Vocabulary', value: v(s.vocabulary) },
    { key: 'Fluency', value: v(s.fluency) },
    { key: 'Speaking', value: v(s.speaking) || null },
  ]
})
</script>

<template>
  <div class="h-full overflow-y-auto page-padding md:p-6">
    <div class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <AppText size="24" weight="semibold" font-family="poppins" class-list="tracking-tight">Your classes today</AppText>
          <AppText size="14" color="neutral-400" class-list="mt-0.5">{{ today }}</AppText>
        </div>
        <AppButton variant="primary" size="36" radius="8" icon="Add" text="Create class" :icon-config="{ color: 'white', size: 16 }" to="/dashboard/classes/create" class-list="px-4" />
      </header>

      <BlockLoadError
        v-if="error"
        title="We couldn't load your classes overview"
        description="Your classes and students are safe. This is usually a brief connection problem, so give it another try in a moment."
        :detail="error"
        :retrying="loading"
        @retry="fetchTutorDashboard"
      />

      <template v-else-if="data">
        <PagesDashboardSharedKeyFigures data-guide="tutor-figures" :items="figures" />
        <PagesDashboardTutorNeedsYou data-guide="tutor-needs" :needs="data.needsYou" />
        <div class="grid gap-5 xl:grid-cols-3">
          <PagesDashboardTutorClassTable data-guide="tutor-classes" class="xl:col-span-2" :classes="data.classes" />
          <section aria-labelledby="tutor-skills" class="dash-card p-5 md:p-6">
            <AppText id="tutor-skills" size="16" weight="semibold">Class skills</AppText>
            <AppText size="14" color="neutral-400" class-list="mt-1">
              {{ data.skills.practisingStudents
                ? `Average of the ${data.skills.practisingStudents} student${data.skills.practisingStudents === 1 ? '' : 's'} who practise with the AI tutor.`
                : 'Appears once your students chat with the AI tutor.' }}
            </AppText>
            <PagesDashboardSharedSkillBars :rows="skillRows" class="mt-5" />
          </section>
        </div>
        <PagesDashboardClassesStudentDetailStudentMistakes :mistakes="data.commonMistakes" :practised="data.skills.practisingStudents > 0" />
      </template>

      <template v-else>
        <UiSkeleton class="h-24 rounded-xl" />
        <div class="grid gap-5 md-lg:grid-cols-3">
          <UiSkeleton v-for="n in 3" :key="n" class="h-56 rounded-xl" />
        </div>
        <UiSkeleton class="h-64 rounded-xl" />
      </template>
    </div>
  </div>
</template>
