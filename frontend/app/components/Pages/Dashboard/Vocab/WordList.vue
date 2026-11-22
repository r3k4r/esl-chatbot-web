<script setup lang="ts">
import type { VocabularyItem } from '~/common/types/vocabulary-types'
import { MASTERY_LABEL, vocabSourceLabel } from '~/common/types/vocabulary-types'

type SourceFilter = 'ALL' | 'MANUAL' | 'SESSION' | 'ASSIGNED'

defineProps<{
  words: VocabularyItem[]
  total: number
  loading?: boolean
  search: string
  source: SourceFilter
  list: { id: string; title: string } | null
}>()

const emit = defineEmits<{
  'update:search': [val: string]
  'update:source': [val: SourceFilter]
  'update:list': [val: { id: string; title: string } | null]
  delete: [item: VocabularyItem]
}>()

// Style the source badge per origin: assigned (brand), AI chat (muted), self (subtle).
function sourceBadgeStyle(item: VocabularyItem) {
  if (item.source === 'ASSIGNED') return 'background:rgba(245,158,11,0.1);color:var(--color-brand-primary)'
  return 'background:var(--surface-raised);color:var(--text-muted)'
}

const confirmTarget = ref<VocabularyItem | null>(null)

function masteryLabel(level: number) {
  return MASTERY_LABEL[level] ?? 'New'
}

function masteryClass(level: number) {
  if (level === 0) return 'bg-surface-raised text-text-muted'
  if (level === 1) return 'bg-sky-500/10 text-sky-500'
  if (level === 2) return 'bg-amber-500/10 text-amber-500'
  if (level === 3) return 'bg-violet-500/10 text-violet-500'
  if (level === 4) return 'bg-emerald-500/10 text-emerald-500'
  return 'bg-brand-primary/10 text-brand-primary'
}

function confirmDelete() {
  if (confirmTarget.value) emit('delete', confirmTarget.value)
  confirmTarget.value = null
}
</script>

<template>
  <div class="dash-card p-5">
    <!-- Header + filters -->
    <div class="flex items-center justify-between gap-3 flex-wrap mb-5">
      <div>
        <p class="text-[16px] font-semibold font-poppins" style="color:var(--text-heading)">All words</p>
        <p class="text-[14px] font-poppins" style="color:var(--text-muted)">{{ total }} total</p>
      </div>
      <!-- Showing one of the teacher's lists: the chip says which and clears it -->
      <AppButton
        v-if="list"
        variant="secondary"
        size="32"
        radius="8"
        icon="CloseCircle"
        icon-position="end"
        :text="list.title"
        :aria-label="`Show all words, not only ${list.title}`"
        class-list="me-auto text-[14px]"
        @click="emit('update:list', null)"
      />
      <div class="flex flex-wrap items-center gap-2">
        <FormInput
          id="vocab-search"
          :model-value="search"
          placeholder="Search words…"
          icon="SearchNormal1"
          class-list="w-52"
          @update:model-value="emit('update:search', String($event))"
        />
        <UiSelect :model-value="source" @update:model-value="emit('update:source', $event as SourceFilter)">
          <UiSelectTrigger class="w-40 text-[14px]">
            <UiSelectValue placeholder="Source" />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem value="ALL">All sources</UiSelectItem>
            <UiSelectItem value="SESSION">From chat AI</UiSelectItem>
            <UiSelectItem value="ASSIGNED">From my teacher</UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-2">
      <UiSkeleton v-for="n in 5" :key="n" class="h-16 rounded-xl" />
    </div>

    <!-- Empty -->
    <UiEmpty v-else-if="!words.length" class="py-12">
      <UiEmptyMedia>
        <AppIconsax name="Book1" color="var(--color-text-subtle)" :size="32" />
      </UiEmptyMedia>
      <UiEmptyContent>
        <UiEmptyTitle>No words yet</UiEmptyTitle>
        <UiEmptyDescription>
          Words from your teacher, and new words the AI tutor finds in your chats, show up here.
        </UiEmptyDescription>
      </UiEmptyContent>
    </UiEmpty>

    <!-- List -->
    <div v-else class="space-y-1">
      <div
        v-for="w in words"
        :key="w.id"
        class="flex items-center gap-3 px-3 py-3.5 rounded-xl transition-colors hover:bg-surface-raised"
      >
        <!-- Word + definition -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-[16px] font-semibold font-poppins truncate" style="color:var(--text-heading)">{{ w.word }}</p>
            <span v-if="w.partOfSpeech" class="text-[14px] shrink-0" style="color:var(--text-subtle)">{{ w.partOfSpeech }}</span>
            <!-- The teacher's list this word came from; choosing it shows only that list -->
            <AppButton
              v-if="w.list?.title && w.list.id !== list?.id"
              variant="ghost"
              size="24"
              radius="4"
              :text="w.list.title"
              :title="`Show only ${w.list.title}`"
              class-list="h-6 shrink-0 bg-brand-primary/8 px-2 text-[13px] font-medium text-brand-primary hover:bg-brand-primary/14 hover:text-brand-primary"
              @click="emit('update:list', w.list)"
            />
          </div>
          <p class="text-[14px] font-poppins truncate mt-0.5" style="color:var(--text-muted)">{{ w.definition }}</p>
        </div>

        <!-- Mastery badge -->
        <span :class="['text-[14px] font-semibold px-2.5 py-1 rounded-md font-poppins shrink-0', masteryClass(w.masteryLevel)]">
          {{ masteryLabel(w.masteryLevel) }}
        </span>

        <!-- Source attribution — who added this word (you / AI chat / tutor name) -->
        <span
          class="hidden sm:inline-flex items-center gap-1.5 text-[14px] font-medium px-2.5 py-1 rounded-full font-poppins shrink-0 max-w-44"
          :style="sourceBadgeStyle(w)"
          :title="vocabSourceLabel(w).label"
        >
          <AppIconsax :name="vocabSourceLabel(w).icon" color="currentColor" :size="13" />
          <span class="truncate">{{ vocabSourceLabel(w).label }}</span>
        </span>

        <!-- Delete: words from the teacher stay; the space keeps rows aligned -->
        <span v-if="w.source === 'ASSIGNED'" class="size-8 shrink-0" aria-hidden="true" />
        <AppButton v-else aria-label="Delete word"
          variant="outline"
          size="32"
          radius="8"
          aspect="square"
          icon="Trash"
          :icon-config="{ color: '#ef4444', size: 16 }"
          @click="confirmTarget = w"
        />
      </div>
    </div>

    <!-- Delete confirmation — matches manage.vue pattern -->
    <UiDialog :open="!!confirmTarget" @update:open="(v) => { if (!v) confirmTarget = null }">
      <UiDialogContent class="p-0 gap-0 overflow-hidden" :style="`background:var(--surface-card)`">
        <UiDialogHeader class="p-6 pb-4">
          <div class="flex items-start gap-4">
            <div class="size-11 rounded-xl flex items-center justify-center shrink-0" style="background:rgba(239,68,68,0.1)">
              <AppIconsax name="Trash" color="#ef4444" :size="20" />
            </div>
            <div>
              <UiDialogTitle :style="`color:var(--text-heading)`">Delete "{{ confirmTarget?.word }}"?</UiDialogTitle>
              <UiDialogDescription class="mt-1" :style="`color:var(--text-muted)`">
                This removes the word and all its review history permanently. This cannot be undone.
              </UiDialogDescription>
            </div>
          </div>
        </UiDialogHeader>
        <UiDialogFooter class="p-6 pt-0 flex gap-2">
          <UiDialogClose as-child>
            <AppButton variant="secondary" size="40" radius="8" text="Cancel" class="flex-1" />
          </UiDialogClose>
          <AppButton
            variant="primary"
            size="40"
            radius="8"
            icon="Trash"
            :icon-config="{ color: 'white', size: 15 }"
            text="Delete word"
            class="flex-1"
            style="background:#ef4444;border-color:#ef4444"
            @click="confirmDelete"
          />
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>
