<script setup lang="ts">
import type { AdminUserItem } from '~/common/types/admin-types'
import { PLAN_BADGE } from '~/common/data/plan-limits'
import { toneStyle } from '~/lib/progress'

// Who this account is, above every tab (same shape as the learner's own profile header).
// Badges only for what an admin acts on: role, plan, and a problem (deactivated, email not verified).
const props = defineProps<{ user: AdminUserItem }>()

const ROLE_LABEL = { STUDENT: 'Student', TUTOR: 'Teacher', ADMIN: 'Admin' } as const
const plan = computed(() => PLAN_BADGE[props.user.subscription?.plan ?? 'FREE'])
const signIn = computed(() => (props.user.authProvider === 'GOOGLE' ? 'Google sign-in' : 'Password sign-in'))
const joined = computed(() => new Date(props.user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }))
</script>

<template>
  <header class="flex flex-wrap items-center gap-x-4 gap-y-3">
    <UiAvatar class="size-16 shrink-0 rounded-full">
      <UiAvatarImage v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.displayName" class="object-cover" />
      <UiAvatarFallback class="bg-surface-well font-poppins text-[24px] font-semibold text-text-heading">
        {{ (user.displayName || user.username).charAt(0).toUpperCase() }}
      </UiAvatarFallback>
    </UiAvatar>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 class="truncate font-poppins text-[22px] font-semibold tracking-tight text-text-heading">
          {{ user.displayName || user.username }}
        </h1>
        <span class="rounded-md bg-surface-raised px-2 py-0.5 font-poppins text-[14px] font-medium text-text-heading">{{ ROLE_LABEL[user.role] }}</span>
        <span v-if="user.role === 'STUDENT'" :class="['rounded-md px-2 py-0.5 font-poppins text-[14px] font-medium', plan.class]">{{ plan.label }} plan</span>
        <span v-if="!user.isActive" class="rounded-md px-2 py-0.5 font-poppins text-[14px] font-medium" :style="toneStyle('expired')">Deactivated</span>
        <span v-if="user.emailVerified === false" class="rounded-md px-2 py-0.5 font-poppins text-[14px] font-medium" :style="toneStyle('blocked')">Email not verified</span>
      </div>
      <AppText size="14" color="neutral-400" class-list="mt-0.5 break-words">
        @{{ user.username }} · {{ user.email }}
      </AppText>
      <AppText size="14" color="neutral-400" class-list="mt-0.5">
        {{ signIn }} · Joined {{ joined }}
      </AppText>
    </div>

    <!-- Own row on phones so the name and email keep the width -->
    <div class="max-md:w-full">
      <AppButton
        variant="secondary" size="38" radius="8" icon="Edit2"
        :icon-config="{ color: 'currentColor', size: 16 }"
        text="Edit profile" class-list="gap-2 text-[14px]"
        :to="`/dashboard/users/${user.id}/profile`"
      />
    </div>
  </header>
</template>
