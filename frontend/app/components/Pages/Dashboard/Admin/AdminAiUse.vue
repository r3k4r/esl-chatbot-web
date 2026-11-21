<script setup lang="ts">
import type { AdminDashboardData } from '~/common/types/admin-types'
import { PLAN_BADGE } from '~/common/data/plan-limits'

// How the AI is used this week (it's the main running cost): text chat against Voice Lab
// calls, and the students sending it the most messages.
const props = defineProps<{ learning: AdminDashboardData['learning'] }>()

const modes = computed(() => props.learning.modes)
const totalConvos = computed(() => modes.value.chat + modes.value.voice)
const voicePct = computed(() => (totalConvos.value ? Math.round((modes.value.voice / totalConvos.value) * 100) : 0))
</script>

<template>
  <section aria-labelledby="admin-ai" class="dash-card flex flex-col p-5 md:p-6">
    <AppText id="admin-ai" size="16" weight="semibold">AI use this week</AppText>
    <AppText size="14" color="neutral-400" class-list="mt-1">Conversations started in the last 7 days.</AppText>

    <dl class="mt-4 grid grid-cols-2 gap-4">
      <div>
        <dt><AppText size="14" color="neutral-400">AI Chat</AppText></dt>
        <dd><AppText size="24" weight="semibold" class-list="tabular-nums leading-tight">{{ modes.chat }}</AppText></dd>
      </div>
      <div>
        <dt><AppText size="14" color="neutral-400">Voice Lab</AppText></dt>
        <dd>
          <AppText size="24" weight="semibold" class-list="tabular-nums leading-tight">{{ modes.voice }}</AppText>
          <AppText size="13" color="neutral-400">{{ modes.voiceMinutes }} min talking</AppText>
        </dd>
      </div>
    </dl>
    <div v-if="totalConvos" class="mt-3 flex h-2 overflow-hidden rounded-full bg-surface-well" role="img" :aria-label="`Voice Lab ${voicePct}% of conversations`">
      <div class="h-full bg-brand-primary/45" :style="{ width: `${100 - voicePct}%` }" />
      <div class="h-full bg-brand-primary" :style="{ width: `${voicePct}%` }" />
    </div>

    <div class="mt-5 border-t border-border-inner pt-4">
      <AppText size="14" weight="medium">Most AI messages</AppText>
      <ul v-if="learning.heavyUsers.length" class="mt-1.5 divide-y divide-border-inner">
        <li v-for="u in learning.heavyUsers" :key="u.id">
          <AppLink :to="`/dashboard/users/${u.id}`" class="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-raised">
            <AppText size="14" weight="medium" class-list="min-w-0 flex-1 truncate">{{ u.name }}</AppText>
            <span :class="['shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-semibold', PLAN_BADGE[u.plan].class]">{{ PLAN_BADGE[u.plan].label }}</span>
            <AppText size="14" class-list="w-10 shrink-0 text-end tabular-nums">{{ u.messages }}</AppText>
          </AppLink>
        </li>
      </ul>
      <AppText v-else size="14" color="neutral-400" class-list="mt-2">No AI messages this week.</AppText>
    </div>
  </section>
</template>
