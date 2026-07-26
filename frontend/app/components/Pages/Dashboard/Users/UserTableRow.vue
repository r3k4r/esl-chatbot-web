<script setup lang="ts">
import type { AdminUserItem } from '~/common/types/admin-types'

defineProps<{ user: AdminUserItem; toggling?: boolean }>()

const emit = defineEmits<{
  toggleStatus: [userId: string, isActive: boolean]
  changeRole: [user: AdminUserItem]
  assignSubscription: [user: AdminUserItem]
  cancelSubscription: [user: AdminUserItem]
}>()

const ROLE_LABEL: Record<string, string> = {
  STUDENT: 'Student',
  TUTOR: 'Tutor',
  ADMIN: 'Admin',
}

const PLAN_COLOR: Record<string, string> = {
  FREE:    'bg-surface-raised text-text-muted',
  GOLD:    'bg-amber-500/15 text-amber-500',
  PREMIUM: 'bg-violet-500/15 text-violet-500',
}

const STATUS_COLOR: Record<string, string> = {
  ACTIVE:    'var(--status-active-bg)',
  INACTIVE:  'var(--status-inactive-bg)',
  CANCELLED: 'var(--status-expired-bg)',
  PAST_DUE:  'var(--status-blocked-bg)',
}

const STATUS_TEXT: Record<string, string> = {
  ACTIVE:    'var(--status-active-text)',
  INACTIVE:  'var(--status-inactive-text)',
  CANCELLED: 'var(--status-expired-text)',
  PAST_DUE:  'var(--status-blocked-text)',
}
</script>

<template>
  <tr class="transition-colors hover:bg-surface-raised" style="border-bottom:1px solid var(--border-inner)">

    <!-- Avatar + name -->
    <td class="px-4 py-3">
      <div class="flex items-center gap-3">
        <UiAvatar class="w-9 h-9 rounded-xl shrink-0">
          <UiAvatarImage v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.displayName" class="object-cover" />
          <UiAvatarFallback
            class="w-full h-full rounded-xl text-[14px] font-semibold font-poppins text-white"
            style="background:linear-gradient(135deg,var(--color-brand-primary),#b45309)"
          >
            {{ (user.displayName || user.username).charAt(0).toUpperCase() }}
          </UiAvatarFallback>
        </UiAvatar>
        <div class="min-w-0">
          <p class="text-[14px] font-semibold font-poppins truncate" :style="`color:var(--text-heading)`">
            {{ user.displayName || user.username }}
          </p>
          <p class="text-[14px] font-poppins truncate" :style="`color:var(--text-muted)`">{{ user.email }}</p>
        </div>
      </div>
    </td>

    <!-- Role -->
    <td class="px-4 py-3 hidden sm:table-cell">
      <span class="text-[14px] font-medium font-poppins" :style="`color:var(--text-muted)`">
        {{ ROLE_LABEL[user.role] ?? user.role }}
      </span>
    </td>

    <!-- Plan -->
    <td class="px-4 py-3 hidden md:table-cell">
      <span :class="['text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins', PLAN_COLOR[user.subscription?.plan ?? 'FREE']]">
        {{ user.subscription?.plan ?? 'FREE' }}
      </span>
    </td>

    <!-- Subscription status -->
    <td class="px-4 py-3 hidden lg:table-cell">
      <span
        class="text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins"
        :style="`background:${STATUS_COLOR[user.subscription?.status ?? 'INACTIVE']};color:${STATUS_TEXT[user.subscription?.status ?? 'INACTIVE']}`"
      >
        {{ (user.subscription?.status ?? 'INACTIVE').charAt(0) + (user.subscription?.status ?? 'INACTIVE').slice(1).toLowerCase() }}
      </span>
    </td>

    <!-- isActive switch -->
    <td class="px-4 py-3 hidden xl:table-cell">
      <div class="flex items-center gap-2">
        <UiSwitch
          :model-value="user.isActive"
          :disabled="toggling"
          @update:model-value="emit('toggleStatus', user.id, $event)"
        />
        <span
          class="text-[14px] font-poppins"
          :style="user.isActive ? 'color:var(--status-active-text)' : 'color:var(--status-expired-text)'"
        >
          {{ user.isActive ? 'Active' : 'Banned' }}
        </span>
      </div>
    </td>

    <!-- Joined -->
    <td class="px-4 py-3 hidden xl:table-cell">
      <p class="text-[14px] font-mono" :style="`color:var(--text-subtle)`">
        {{ new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
      </p>
    </td>

    <!-- Detail button -->
    <td class="px-2 py-3">
      <AppButton
        variant="secondary"
        size="32"
        radius="8"
        aspect="square"
        icon="InfoCircle"
        :to="`/dashboard/users/${user.id}`"
      />
    </td>

    <!-- Actions -->
    <td class="px-4 py-3 text-right">
      <UiDropdownMenu>
        <UiDropdownMenuTrigger as-child>
          <AppButton variant="secondary" size="32" radius="8" aspect="square" icon="More" />
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent align="end" class="w-52">
          <NuxtLink :to="`/dashboard/users/${user.id}/profile`">
            <UiDropdownMenuItem class="cursor-pointer gap-2.5">
              <AppIconsax name="Edit" color="currentColor" :size="16" />
              <span class="text-[14px]">Edit profile</span>
            </UiDropdownMenuItem>
          </NuxtLink>
          <UiDropdownMenuItem class="cursor-pointer gap-2.5" @click="emit('changeRole', user)">
            <AppIconsax name="Profile" color="currentColor" :size="16" />
            <span class="text-[14px]">Change role</span>
          </UiDropdownMenuItem>
          <UiDropdownMenuSeparator />
          <UiDropdownMenuItem class="cursor-pointer gap-2.5" @click="emit('assignSubscription', user)">
            <AppIconsax name="Crown1" color="currentColor" :size="16" />
            <span class="text-[14px]">Assign subscription</span>
          </UiDropdownMenuItem>
          <UiDropdownMenuItem
            v-if="user.subscription?.status === 'ACTIVE' && user.subscription?.plan !== 'FREE'"
            class="cursor-pointer gap-2.5"
            @click="emit('cancelSubscription', user)"
          >
            <AppIconsax name="CloseCircle" color="currentColor" :size="16" />
            <span class="text-[14px]">Cancel subscription</span>
          </UiDropdownMenuItem>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
    </td>

  </tr>
</template>
