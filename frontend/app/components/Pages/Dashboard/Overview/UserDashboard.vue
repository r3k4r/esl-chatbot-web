<script setup lang="ts">
// Learner home: the welcome hero (next step, today's goal, streak) and four stat cards on
// top, then skills and practice on the left, class work, words and goals on the right.
// Paired cards stretch to the same height so each row lines up.
const { data, loading, error, fetchOverview, nextStep, stats } = useDashboardOverview()
onMounted(fetchOverview)
</script>

<template>
  <div class="h-full overflow-y-auto page-padding md:p-6">
    <div class="space-y-5">
      <BlockLoadError
        v-if="error"
        title="We couldn't load your dashboard"
        :detail="error"
        :retrying="loading"
        @retry="fetchOverview"
      />

      <template v-else-if="data && nextStep">
        <PagesDashboardOverviewGreetingHero class="animate-card-enter" :today="data.today" :next="nextStep" :vocab-due="data.vocab.due" />

        <div class="grid grid-cols-2 gap-5 md-lg:grid-cols-4">
          <PagesDashboardOverviewStatCard
            v-for="(s, i) in stats" :key="s.label" :stat="s"
            class="animate-card-enter" :style="`--delay:${60 + i * 50}ms`"
          />
        </div>

        <div class="grid items-start gap-5 md-lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
          <div class="min-w-0 space-y-5">
            <div class="grid gap-5 xl:grid-cols-2">
              <PagesDashboardOverviewLearnerSkills :skills="data.skills" />
              <PagesDashboardOverviewLearnerWeek :week="data.week" :daily-goal-minutes="data.today.dailyGoalMinutes" :today-date="data.today.date" />
            </div>
            <div class="grid gap-5 xl:grid-cols-2">
              <PagesDashboardOverviewRecentChats :chats="data.recentChats" />
              <PagesDashboardOverviewLearnerActivity :activity="data.activity" :daily-goal-minutes="data.today.dailyGoalMinutes" />
            </div>
          </div>
          <div class="min-w-0 space-y-5">
            <PagesDashboardOverviewLearnerTasks v-if="data.tasks.length" :tasks="data.tasks" />
            <PagesDashboardOverviewLearnerVocab :vocab="data.vocab" />
            <PagesDashboardOverviewLearnerGoals :goals="data.goals" />
          </div>
        </div>
      </template>

      <template v-else>
        <UiSkeleton class="h-56 rounded-xl" />
        <div class="grid grid-cols-2 gap-5 md-lg:grid-cols-4">
          <UiSkeleton v-for="n in 4" :key="n" class="h-28 rounded-xl" />
        </div>
        <div class="grid gap-5 md-lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-cols-[minmax(0,1fr)_24rem] xl:grid-cols-[minmax(0,1fr)_26rem]">
          <UiSkeleton class="h-80 rounded-xl" />
          <UiSkeleton class="h-80 rounded-xl" />
        </div>
      </template>
    </div>
  </div>
</template>
