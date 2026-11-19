<script setup lang="ts">
import type { ClassWordList } from '~/common/types/vocabulary-types'
import { wordListLabel } from '~/common/types/vocabulary-types'

// One assigned list: name, size, reach and how much of it students have practised.
// Opens in place to show the words.
const props = defineProps<{ list: ClassWordList; classId: string; canManage: boolean }>()
const open = ref(false)

const meta = computed(() => {
  const l = props.list
  const date = new Date(l.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
  return [
    `${l.words.length} ${l.words.length === 1 ? 'word' : 'words'}`,
    `${l.studentCount} ${l.studentCount === 1 ? 'student' : 'students'}`,
    l.createdBy ? `${l.createdBy.displayName}, ${date}` : date,
  ].join(' · ')
})
</script>

<template>
  <li>
    <AppButton
      variant="ghost"
      size="auto"
      radius="none"
      class-list="w-full justify-start gap-4 whitespace-normal border-0 px-5 py-3.5 text-start font-normal"
      :aria-expanded="open"
      @click="open = !open"
    >
      <AppIconsax
        name="ArrowRight2"
        :size="16"
        color="var(--color-text-subtle)"
        class="shrink-0 transition-transform duration-200 ease-out rtl:rotate-180"
        :class="{ 'rotate-90 rtl:rotate-90': open }"
      />
      <div class="min-w-0 flex-1">
        <AppText size="15" weight="semibold" class-list="truncate">{{ wordListLabel(list) }}</AppText>
        <AppText size="13" color="neutral-400" class-list="truncate">{{ meta }}</AppText>
      </div>
      <div class="hidden w-40 shrink-0 sm:block">
        <div class="flex items-baseline justify-between">
          <AppText size="13" color="neutral-400">Practised</AppText>
          <AppText size="14" weight="medium" class-list="tabular-nums">{{ list.practisedPct }}%</AppText>
        </div>
        <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-raised">
          <div class="h-full origin-left rounded-full bg-brand-primary transition-transform duration-500 ease-out"
            :style="{ transform: `scaleX(${list.practisedPct / 100})` }" />
        </div>
      </div>
    </AppButton>

    <div v-if="open" class="border-t border-border-inner bg-surface-raised/50 px-5 py-4 ps-14">
      <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
        <AppText size="13" color="neutral-400">{{ list.masteredPct }}% mastered so far</AppText>
        <AppButton
          v-if="canManage"
          :to="`/dashboard/classes/${classId}/vocabulary/${list.id}`"
          variant="secondary"
          size="32"
          radius="8"
          icon="Edit2"
          text="Edit"
          class-list="text-[14px]"
        />
      </div>
      <dl class="grid gap-x-8 gap-y-3 md-lg:grid-cols-2" dir="ltr">
        <div v-for="w in list.words" :key="w.word" class="min-w-0">
          <dt class="font-poppins text-[14px]">
            <span class="font-semibold text-text-heading">{{ w.word }}</span>
            <span v-if="w.partOfSpeech" class="text-text-subtle"> · {{ w.partOfSpeech }}</span>
          </dt>
          <dd class="font-poppins text-[14px] text-text-muted">{{ w.definition }}</dd>
        </div>
      </dl>
    </div>
  </li>
</template>
