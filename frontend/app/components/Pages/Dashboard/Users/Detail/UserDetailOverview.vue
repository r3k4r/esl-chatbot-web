<script setup lang="ts">
import type { AdminUserItem } from '~/common/types/admin-types'

const props = defineProps<{ user: AdminUserItem }>()

const PLAN_COLOR: Record<string, string> = {
  FREE:    'bg-surface-raised text-text-muted',
  GOLD:    'bg-amber-500/15 text-amber-500',
  PREMIUM: 'bg-violet-500/15 text-violet-500',
}

function fmt(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function skillPct(val: number | undefined) {
  return Math.round((val ?? 0) * 100) / 100
}
</script>

<template>
  <div class="space-y-5">

    <!-- Identity card -->
    <div class="dash-card p-6">
      <div class="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <!-- Avatar -->
        <UiAvatar class="w-20 h-20 rounded-2xl shrink-0">
          <UiAvatarImage v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.displayName" class="object-cover" />
          <UiAvatarFallback class="w-full h-full rounded-2xl text-[28px] font-semibold font-poppins text-white"
            style="background:linear-gradient(135deg,var(--color-brand-primary),#b45309)">
            {{ (user.displayName || user.username).charAt(0).toUpperCase() }}
          </UiAvatarFallback>
        </UiAvatar>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <p class="text-[22px] font-semibold font-poppins truncate" :style="`color:var(--text-heading)`">
            {{ user.displayName || user.username }}
          </p>
          <p class="text-[15px] font-poppins mt-0.5 truncate" :style="`color:var(--text-muted)`">{{ user.email }}</p>

          <!-- Badges -->
          <div class="flex flex-wrap gap-2 mt-3">
            <!-- Role -->
            <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
              style="background:var(--surface-raised);color:var(--text-heading)">
              {{ user.role.charAt(0) + user.role.slice(1).toLowerCase() }}
            </span>
            <!-- Plan -->
            <span :class="['text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins', PLAN_COLOR[user.subscription?.plan ?? 'FREE']]">
              {{ user.subscription?.plan ?? 'FREE' }}
            </span>
            <!-- Account status -->
            <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
              :style="user.isActive
                ? 'background:var(--status-active-bg);color:var(--status-active-text)'
                : 'background:var(--status-expired-bg);color:var(--status-expired-text)'">
              {{ user.isActive ? 'Active' : 'Banned' }}
            </span>
            <!-- Auth provider -->
            <span v-if="user.authProvider" class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
              style="background:var(--surface-raised);color:var(--text-muted)">
              {{ user.authProvider }}
            </span>
            <!-- Email verified -->
            <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
              :style="user.emailVerified
                ? 'background:var(--status-active-bg);color:var(--status-active-text)'
                : 'background:var(--status-blocked-bg);color:var(--status-blocked-text)'">
              {{ user.emailVerified ? 'Email verified' : 'Email unverified' }}
            </span>
          </div>
        </div>

        <!-- Dates -->
        <div class="text-right shrink-0 hidden sm:block">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Joined</p>
          <p class="text-[14px] font-mono mt-0.5" :style="`color:var(--text-subtle)`">{{ fmt(user.createdAt) }}</p>
          <p class="text-[14px] font-poppins mt-3" :style="`color:var(--text-muted)`">Last updated</p>
          <p class="text-[14px] font-mono mt-0.5" :style="`color:var(--text-subtle)`">{{ fmt(user.updatedAt) }}</p>
        </div>
      </div>
    </div>

    <!-- Metrics -->
    <div v-if="user.metrics" class="dash-card p-6 space-y-4">
      <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Learning metrics</p>

      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="p-4 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Streak</p>
          <p class="text-[22px] font-semibold font-poppins mt-1" :style="`color:var(--text-heading)`">
            {{ user.metrics.currentStreak }}d
          </p>
          <p class="text-[14px] font-poppins" :style="`color:var(--text-subtle)`">best {{ user.metrics.longestStreak }}d</p>
        </div>
        <div class="p-4 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Study time</p>
          <p class="text-[22px] font-semibold font-poppins mt-1" :style="`color:var(--text-heading)`">
            {{ user.metrics.totalStudyTimeMinutes }}m
          </p>
          <p class="text-[14px] font-poppins" :style="`color:var(--text-subtle)`">total</p>
        </div>
        <div class="p-4 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Words typed</p>
          <p class="text-[22px] font-semibold font-poppins mt-1" :style="`color:var(--text-heading)`">
            {{ user.metrics.totalWordsTyped.toLocaleString() }}
          </p>
          <p class="text-[14px] font-poppins" :style="`color:var(--text-subtle)`">total</p>
        </div>
        <div class="p-4 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Est. CEFR</p>
          <p class="text-[22px] font-semibold font-poppins mt-1" :style="`color:var(--text-heading)`">
            {{ user.metrics.estimatedLevel ?? '—' }}
          </p>
          <p class="text-[14px] font-poppins" :style="`color:var(--text-subtle)`">AI detected</p>
        </div>
      </div>

      <!-- Skill bars -->
      <div class="space-y-3">
        <div v-for="skill in [
          { label: 'Grammar', value: user.metrics.grammarSkill },
          { label: 'Vocabulary', value: user.metrics.vocabularySkill },
          { label: 'Fluency', value: user.metrics.fluencySkill },
          { label: 'Speaking', value: user.metrics.speakingSkill },
        ]" :key="skill.label" class="flex items-center gap-3">
          <p class="text-[14px] font-poppins w-24 shrink-0" :style="`color:var(--text-muted)`">{{ skill.label }}</p>
          <div class="flex-1 h-2 rounded-md overflow-hidden" style="background:var(--surface-raised)">
            <div class="h-full rounded-md transition-all" style="background:var(--color-brand-primary)"
              :style="`width:${skillPct(skill.value)}%`" />
          </div>
          <p class="text-[14px] font-mono w-10 text-right shrink-0" :style="`color:var(--text-subtle)`">
            {{ skillPct(skill.value) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Learner settings -->
    <div v-if="user.learnerProfile" class="dash-card p-6 space-y-4">
      <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Learning settings</p>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Current level</p>
          <p class="text-[15px] font-semibold font-poppins mt-0.5" :style="`color:var(--text-heading)`">
            {{ user.learnerProfile.currentLevel ?? '—' }}
          </p>
        </div>
        <div class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Target level</p>
          <p class="text-[15px] font-semibold font-poppins mt-0.5" :style="`color:var(--text-heading)`">
            {{ user.learnerProfile.targetLevel ?? '—' }}
          </p>
        </div>
        <div class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">AI personality</p>
          <p class="text-[15px] font-semibold font-poppins mt-0.5" :style="`color:var(--text-heading)`">
            {{ user.learnerProfile.aiPersonality ?? 'Default' }}
          </p>
        </div>
        <div class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Voice speed</p>
          <p class="text-[15px] font-semibold font-poppins mt-0.5" :style="`color:var(--text-heading)`">
            {{ user.learnerProfile.voiceSpeed }}×
          </p>
        </div>
        <div class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Weekly goal</p>
          <p class="text-[15px] font-semibold font-poppins mt-0.5" :style="`color:var(--text-heading)`">
            {{ user.learnerProfile.weeklyGoalMinutes }} min/wk
          </p>
        </div>
        <div class="p-3.5 rounded-xl" style="background:var(--surface-raised)">
          <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">Timezone</p>
          <p class="text-[15px] font-semibold font-poppins mt-0.5 truncate" :style="`color:var(--text-heading)`">
            {{ user.learnerProfile.timezone }}
          </p>
        </div>
      </div>

      <!-- Topics -->
      <div v-if="Array.isArray(user.learnerProfile.topicsOfInterest) && user.learnerProfile.topicsOfInterest.length">
        <p class="text-[14px] font-poppins mb-2" :style="`color:var(--text-muted)`">Topics of interest</p>
        <div class="flex flex-wrap gap-2">
          <span v-for="t in (user.learnerProfile.topicsOfInterest as string[])" :key="t"
            class="text-[14px] font-medium font-poppins px-3 py-1 rounded-lg"
            style="background:var(--surface-raised);color:var(--text-heading)">
            {{ t }}
          </span>
        </div>
      </div>
    </div>

    <!-- Classes -->
    <div v-if="user.classUsers && user.classUsers.length" class="dash-card p-6 space-y-3">
      <p class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Classes</p>
      <div class="space-y-2">
        <div v-for="cu in user.classUsers" :key="cu.id"
          class="flex items-center justify-between p-3.5 rounded-xl"
          style="background:var(--surface-raised)">
          <div>
            <p class="text-[14px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
              {{ cu.class.className }}
            </p>
            <p class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">
              Code: {{ cu.class.classCode }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
              :style="cu.class.classStatus === 'ACTIVE'
                ? 'background:var(--status-active-bg);color:var(--status-active-text)'
                : 'background:var(--status-inactive-bg);color:var(--status-inactive-text)'">
              {{ cu.class.classStatus.charAt(0) + cu.class.classStatus.slice(1).toLowerCase() }}
            </span>
            <span class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
              style="background:var(--surface-raised);color:var(--text-muted)">
              {{ cu.role.charAt(0) + cu.role.slice(1).toLowerCase() }}
            </span>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>
