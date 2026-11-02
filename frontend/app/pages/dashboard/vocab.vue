<script setup lang="ts">
definePageMeta({ layout: 'dashboard', requiresAuth: true })

const {
  loading,
  stats,
  dueCards,
  reviewIndex,
  reviewing,
  words,
  wordsTotal,
  listLoading,
  search,
  sourceFilter,
  addOpen,
  adding,
  currentCard,
  reviewDone,
  dueCount,
  rate,
  restartReview,
  submitWord,
  removeWord,
} = useVocabPage()
</script>

<template>
  <div class="h-full overflow-y-auto p-5 sm:p-7 space-y-5">
    <!-- Header -->
    <div class="flex items-end justify-between flex-wrap gap-3 animate-card-enter" style="--delay:0ms">
      <div>
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#B91C1C]/10 border border-[#B91C1C]/20 mb-2">
          <img src="/leo-logo.jpg" alt="Leo" class="size-3.5 rounded-full object-cover" />
          <span class="text-[10px] font-semibold text-[#B91C1C] dark:text-red-400 uppercase tracking-widest font-poppins">
            Leo Vocabulary Lab · پەیمانگای لیۆ
          </span>
        </div>
        <h1 class="text-[28px] font-semibold tracking-[-0.02em] text-brand-ink dark:text-white font-poppins">Vocabulary &amp; Spaced Repetition</h1>
        <p class="text-[14px] text-zinc-500 dark:text-zinc-400 mt-1 font-poppins">
          <span class="text-brand-primary font-medium">{{ dueCount }} card{{ dueCount === 1 ? '' : 's' }}</span> due · spaced repetition
        </p>
      </div>
      <div class="flex items-center gap-2">
        <AppButton variant="secondary" size="36" radius="8" icon="Add" text="Add word" @click="addOpen = true" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <UiSkeleton class="lg:col-span-2 h-95 rounded-2xl" />
      <UiSkeleton class="h-95 rounded-2xl" />
    </div>

    <template v-else>
      <!-- Flashcard review + stats sidebar -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Review queue -->
        <div class="animate-card-enter lg:col-span-2 flex" style="--delay:80ms">
          <PagesDashboardVocabFlashcard
            v-if="currentCard"
            class="w-full"
            :card="currentCard"
            :card-index="reviewIndex + 1"
            :total="dueCards.length"
            :reviewing="reviewing"
            @rate="rate"
          />
          <!-- All caught up / nothing due -->
          <div v-else class="dash-card p-8 w-full flex flex-col items-center justify-center text-center min-h-95">
            <div class="size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <AppIconsax name="TickCircle" color="#10b981" :size="26" />
            </div>
            <h2 class="text-[20px] font-semibold text-brand-ink dark:text-white font-poppins">
              {{ reviewDone ? 'Review complete!' : 'Nothing due right now' }}
            </h2>
            <p class="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs font-poppins">
              {{ reviewDone
                ? 'You cleared every card due today. Come back later for the next batch.'
                : 'Your cards are scheduled. Add words or chat with the AI to grow your list.' }}
            </p>
            <AppButton
              v-if="reviewDone"
              variant="secondary"
              size="36"
              radius="8"
              icon="Refresh"
              text="Check for more"
              class="mt-5"
              @click="restartReview"
            />
          </div>
        </div>

        <!-- Stats -->
        <div class="animate-card-enter" style="--delay:160ms">
          <PagesDashboardVocabStatsPanel :stats="stats" />
        </div>
      </div>

      <!-- Full word list -->
      <div class="animate-card-enter" style="--delay:240ms">
        <PagesDashboardVocabWordList
          :words="words"
          :total="wordsTotal"
          :loading="listLoading"
          :search="search"
          :source="sourceFilter"
          @update:search="search = $event"
          @update:source="sourceFilter = $event"
          @delete="removeWord"
        />
      </div>
    </template>

    <!-- Add word modal -->
    <PagesDashboardVocabAddWordModal v-model:open="addOpen" :adding="adding" @submit="submitWord" />
  </div>
</template>
