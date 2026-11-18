<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ClassAnalytics } from '~/common/types/class-types'
import { skillBand, toneStyle } from '~/lib/progress'

// The class as a whole: average skills of the students who practise with the AI tutor,
// and the grammar points the class gets wrong most (what to teach next).
const props = defineProps<{ classId: string }>()

const { getClassAnalytics } = useClasses()
const analytics = ref<ClassAnalytics | null>(null)
const loading = ref(false)

async function load() {
  loading.value = true
  const res = await getClassAnalytics(props.classId)
  loading.value = false
  if (!res.success) { toast.error(res.message || 'Could not load analytics'); return }
  analytics.value = ((res.data as any)?.data) as ClassAnalytics
}
watch(() => props.classId, load, { immediate: true })

const rows = computed(() => {
  const a = analytics.value?.averageSkills
  if (!a) return []
  return [
    { key: 'Grammar', value: a.grammar },
    { key: 'Vocabulary', value: a.vocabulary },
    { key: 'Fluency', value: a.fluency },
    { key: 'Speaking', value: a.speaking },
  ].map(r => ({ ...r, band: skillBand(r.value), pct: Math.round(Math.min(100, r.value)) }))
})

const basis = computed(() => {
  const a = analytics.value
  if (!a) return ''
  if (!a.practisingStudents) return 'No student has practised with the AI tutor yet.'
  return `Average of the ${a.practisingStudents} of ${a.studentCount} students who practise with the AI tutor.`
})
</script>

<template>
  <div v-if="loading" class="grid gap-5 md-lg:grid-cols-2">
    <UiSkeleton class="h-56 rounded-xl" />
    <UiSkeleton class="h-56 rounded-xl" />
  </div>

  <div v-else-if="analytics" class="grid items-start gap-x-10 gap-y-8 md-lg:grid-cols-2">
    <section aria-labelledby="class-skills">
      <AppText id="class-skills" size="16" weight="semibold">Class skills</AppText>
      <AppText size="14" color="neutral-400" class-list="mt-1">{{ basis }}</AppText>
      <div v-if="analytics.practisingStudents" class="mt-5 space-y-4">
        <div v-for="r in rows" :key="r.key" class="grid grid-cols-[6.5rem_minmax(0,1fr)_2.5rem_7rem] items-center gap-3">
          <AppText size="14" weight="medium">{{ r.key }}</AppText>
          <div class="h-2 overflow-hidden rounded-full bg-surface-well" role="img" :aria-label="`${r.key}: ${r.value || 'no data'}`">
            <div class="h-full rounded-full bg-brand-primary" :style="{ width: `${r.pct}%` }" />
          </div>
          <AppText size="14" weight="semibold" class-list="text-end tabular-nums">{{ r.value ? Math.round(r.value) : '–' }}</AppText>
          <UiBadge class="justify-self-start rounded-md border-0 text-[12px] font-semibold" :style="toneStyle(r.band.tone)">{{ r.band.label }}</UiBadge>
        </div>
      </div>
      <AppText size="14" color="neutral-400" class-list="mt-5">
        Students save {{ Math.round(analytics.vocabularyCoverage) }} words on average.
      </AppText>
    </section>

    <section aria-labelledby="class-mistakes">
      <AppText id="class-mistakes" size="16" weight="semibold">What the class gets wrong most</AppText>
      <AppText size="14" color="neutral-400" class-list="mt-1">Grammar mistakes in AI chats, last 30 days. Good topics for your next lesson.</AppText>
      <AppText v-if="!analytics.mostCommonGrammarErrors.length" size="14" color="neutral-400" class-list="mt-5">
        Nothing yet.
      </AppText>
      <ol v-else class="mt-4 divide-y divide-border-inner">
        <li v-for="item in analytics.mostCommonGrammarErrors" :key="item.error" class="flex items-baseline justify-between gap-4 py-3">
          <AppText size="14" weight="medium" class-list="min-w-0">{{ item.error }}</AppText>
          <AppText size="13" color="neutral-400" class-list="shrink-0">{{ item.count }} times</AppText>
        </li>
      </ol>
    </section>
  </div>
</template>
