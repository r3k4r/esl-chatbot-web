<template>
  <!-- The app's real path, from sign-up to progress. Desktop: pinned horizontal timeline;
       phones and reduced motion (and the server render): vertical timeline. -->
  <MilestoneTrack v-if="desktop" id="how" :steps="steps" :counter="counter">
    <template #header><HowItWorksHeader /></template>
  </MilestoneTrack>
  <MilestoneList v-else id="how" :steps="steps" :still="motion === 'reduce'">
    <template #header><HowItWorksHeader /></template>
  </MilestoneList>
</template>

<script setup lang="ts">
import { useMediaQuery, usePreferredReducedMotion } from '@vueuse/core'
import MilestoneTrack from './MilestoneTrack.vue'
import MilestoneList from './MilestoneList.vue'
import HowItWorksHeader from './HowItWorksHeader.vue'

const { t } = useLocale()

const wide = useMediaQuery('(min-width: 1024px)')
const motion = usePreferredReducedMotion()
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const desktop = computed(() => mounted.value && wide.value && motion.value !== 'reduce')

// The order a new learner really goes through. Icons are structural; words are localized.
const STEPS = [
  { key: 's1', icon: 'lucide:user-plus' },
  { key: 's2', icon: 'lucide:badge-check' },
  { key: 's3', icon: 'lucide:message-circle' },
  { key: 's4', icon: 'lucide:mic' },
  { key: 's5', icon: 'lucide:brain' },
  { key: 's6', icon: 'lucide:bar-chart-2' },
] as const

const steps = computed(() => STEPS.map(s => ({
  icon: s.icon,
  title: t(`howItWorks.steps.${s.key}.title`),
  text: t(`howItWorks.steps.${s.key}.description`),
})))
const counter = (current: number, total: number) => t('howItWorks.stepOf', { current, total })
</script>
