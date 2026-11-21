<script setup lang="ts">
import type { TutorClassHealth } from '~/common/types/tutor-types'
import { skillBand, toneStyle } from '~/lib/progress'

// One row per active class: how many practise, how reliably they hand in, what's waiting.
// The admin dashboard reuses it for every class, with each class's teacher.
withDefaults(defineProps<{
  classes: (TutorClassHealth & { teacher?: { id: string; name: string } | null })[]
  title?: string
  emptyText?: string
}>(), { title: 'Your classes', emptyText: 'No active classes yet. Create one and share its code with your students.' })

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0)
</script>

<template>
  <section aria-labelledby="tutor-classes" class="dash-card flex flex-col overflow-hidden">
    <div class="flex items-baseline justify-between gap-3 px-5 pt-5">
      <AppText id="tutor-classes" size="16" weight="semibold">{{ title }}</AppText>
      <AppLink to="/dashboard/classes" class="text-[14px] text-text-muted hover:text-text-heading">All classes</AppLink>
    </div>

    <div v-if="classes.length" class="mt-3 overflow-x-auto">
      <table class="w-full min-w-[40rem] text-start text-[14px]">
        <thead>
          <tr class="border-b border-border-inner text-text-muted">
            <th class="px-5 py-2.5 text-start font-medium">Class</th>
            <th class="px-3 py-2.5 text-start font-medium">Practised this week</th>
            <th class="px-3 py-2.5 text-start font-medium">Hand-in rate</th>
            <th class="px-3 py-2.5 text-end font-medium">Missing</th>
            <th class="px-3 py-2.5 text-end font-medium">To review</th>
            <th class="px-5 py-2.5 text-start font-medium">Skill</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border-inner">
          <tr v-for="c in classes" :key="c.id" class="hover:bg-surface-raised">
            <td class="px-5 py-3">
              <AppLink :to="`/dashboard/classes/${c.id}`" class="font-medium text-text-heading hover:underline">{{ c.name }}</AppLink>
              <div class="text-[13px] text-text-muted">{{ c.students }} student{{ c.students === 1 ? '' : 's' }}<template v-if="c.teacher !== undefined"> · {{ c.teacher?.name ?? 'No teacher' }}</template></div>
            </td>
            <td class="px-3 py-3 tabular-nums text-text-body">
              {{ c.activeThisWeek }} of {{ c.students }}
              <span class="text-text-muted">· {{ pct(c.activeThisWeek, c.students) }}%</span>
            </td>
            <td class="px-3 py-3 tabular-nums text-text-body">{{ c.handInRate === null ? '–' : `${c.handInRate}%` }}</td>
            <td class="px-3 py-3 text-end tabular-nums" :class="c.missing ? 'text-destructive' : 'text-text-muted'">{{ c.missing }}</td>
            <td class="px-3 py-3 text-end tabular-nums" :class="c.toReview ? 'font-semibold text-text-heading' : 'text-text-muted'">{{ c.toReview }}</td>
            <td class="px-5 py-3">
              <UiBadge class="rounded-md border-0 text-[12px] font-semibold" :style="toneStyle(skillBand(c.avgSkill).tone)">
                {{ skillBand(c.avgSkill).label }}
              </UiBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppText v-else size="14" color="neutral-400" class-list="px-5 pb-5 pt-3">{{ emptyText }}</AppText>
    <AppText v-if="classes.length" size="13" color="neutral-400" class-list="mt-auto border-t border-border-inner px-5 py-3">
      Hand-in rate counts tasks whose deadline has passed.
    </AppText>
  </section>
</template>
