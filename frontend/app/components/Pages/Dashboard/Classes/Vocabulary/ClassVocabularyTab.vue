<script setup lang="ts">
import { useVocabulary } from '~/composables/useVocabulary'
import type { ClassWordList } from '~/common/types/vocabulary-types'
import WordListRow from './WordListRow.vue'

// Class tab (tutors + admins): word lists given to this class and how far students got.
const props = defineProps<{ classId: string; canManage: boolean }>()
const { listClassWordLists } = useVocabulary()

const lists = ref<ClassWordList[]>([])
const loading = ref(true)

onMounted(async () => {
  const res = await listClassWordLists(props.classId)
  loading.value = false
  if (res.success && res.data?.data) lists.value = res.data.data
})
</script>

<template>
  <div>
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <AppText size="15" weight="semibold">Assigned words</AppText>
        <AppText size="14" color="neutral-400">Words you give the class land in each student's Vocabulary, ready to review.</AppText>
      </div>
      <AppButton
        v-if="canManage"
        :to="`/dashboard/classes/${classId}/vocabulary/assign`"
        variant="primary"
        size="38"
        radius="8"
        icon="Add"
        :icon-config="{ color: 'white' }"
        text="Assign words"
        class-list="text-[14px]"
      />
    </div>

    <div v-if="loading" class="space-y-2">
      <UiSkeleton v-for="i in 3" :key="i" class="h-16 rounded-xl" />
    </div>

    <UiEmpty v-else-if="!lists.length" class="rounded-xl border border-dashed border-border-card py-10">
      <UiEmptyMedia variant="icon">
        <AppIconsax name="Book1" color="var(--color-brand-primary)" :size="22" />
      </UiEmptyMedia>
      <UiEmptyContent>
        <UiEmptyTitle>No word lists yet</UiEmptyTitle>
        <UiEmptyDescription>
          Type the words; the AI writes simple meanings and examples for you to check.
        </UiEmptyDescription>
      </UiEmptyContent>
    </UiEmpty>

    <ul v-else class="divide-y divide-border-inner overflow-hidden rounded-xl border border-border-card">
      <WordListRow v-for="list in lists" :key="list.id" :list="list" :class-id="classId" :can-manage="canManage" />
    </ul>
  </div>
</template>
