<script setup lang="ts">
import type { AddVocabularyInput } from '~/common/types/vocabulary-types'
import type { CreateGoalInput } from '~/composables/useGoals'

definePageMeta({ layout: 'dashboard', requiresAuth: true })
useSeo({ title: 'Student progress', noindex: true })

const route = useRoute()
const classId = computed(() => String(route.params.id))
const studentId = computed(() => String(route.params.studentId))

const page = useClassStudentPage(classId, studentId)
const { student, className, loading, backTo, name, assigningWord, assigningGoal } = page

const wordOpen = ref(false)
const goalOpen = ref(false)
async function onAssignWord(input: AddVocabularyInput) { if (await page.assignWord(input)) wordOpen.value = false }
async function onAssignGoal(input: CreateGoalInput) { if (await page.assignGoal(input)) goalOpen.value = false }
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div class="page-padding">
      <div v-if="loading || !student" class="space-y-4">
        <UiSkeleton class="h-5 w-40" />
        <UiSkeleton class="h-14 w-72" />
        <UiSkeleton class="h-56 w-full rounded-xl" />
      </div>

      <template v-else>
        <PagesDashboardClassesStudentDetailStudentHeader :student="student" :class-name="className" :back-to="backTo"
          @assign-word="wordOpen = true" @assign-goal="goalOpen = true" />

        <div class="mt-6 grid items-start gap-5 md-lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
          <div class="min-w-0 space-y-5">
            <PagesDashboardClassesStudentDetailStudentSkills :skills="student.skills"
              :last-practice-at="student.practice.lastPracticeAt" />
            <PagesDashboardClassesStudentDetailStudentTasks :class-id="classId" :tasks="student.tasks"
              :summary="student.taskSummary" />
            <PagesDashboardClassesStudentDetailStudentMistakes :mistakes="student.mistakes"
              :practised="student.skills.basedOnMessages > 0" />
          </div>
          <PagesDashboardClassesStudentDetailStudentPractice :student="student" />
        </div>

        <PagesDashboardClassesAssignVocabularyModal v-model:open="wordOpen" :student-name="name" :assigning="assigningWord"
          @submit="onAssignWord" />
        <PagesDashboardGoalsGoalFormModal v-model:open="goalOpen" :submitting="assigningGoal" @create="onAssignGoal" />
      </template>
    </div>
  </div>
</template>
