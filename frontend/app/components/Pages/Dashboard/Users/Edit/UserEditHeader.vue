<script setup lang="ts">
import type { AdminUserItem } from '~/common/types/admin-types'
import { PLAN_BADGE } from '~/common/data/plan-limits'

// The account being edited, in one row (same shape as the learner's own profile header):
// photo with a camera button, name, role and plan, @username · email; Cancel + Save on the right.
const props = defineProps<{ user: AdminUserItem; avatarPreview: string; avatarError: string; saving: boolean; backTo: string }>()
const emit = defineEmits<{ pick: [file: File] }>()

const ROLE_LABEL = { STUDENT: 'Student', TUTOR: 'Teacher', ADMIN: 'Admin' } as const
const fileInput = ref<HTMLInputElement | null>(null)
const avatarSrc = computed(() => props.avatarPreview || props.user.avatarUrl || '')
const plan = computed(() => PLAN_BADGE[props.user.subscription?.plan ?? 'FREE'])

function onFile(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) emit('pick', file)
  input.value = '' // the same file can be chosen again after a size error
}
</script>

<template>
  <header class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-3">
    <div class="relative shrink-0">
      <UiAvatar class="size-16 rounded-full">
        <UiAvatarImage v-if="avatarSrc" :src="avatarSrc" :alt="user.displayName" class="object-cover" />
        <UiAvatarFallback class="bg-surface-well font-poppins text-[24px] font-semibold text-text-heading">
          {{ (user.displayName || user.username).charAt(0).toUpperCase() }}
        </UiAvatarFallback>
      </UiAvatar>
      <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onFile">
      <AppButton
        variant="secondary" size="28" radius="8" aspect="square" icon="Camera"
        :icon-config="{ color: 'currentColor', size: 16 }"
        class-list="absolute -bottom-1 -end-1 border-surface-page"
        aria-label="Change photo" title="Change photo"
        @click="fileInput?.click()"
      />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 class="truncate font-poppins text-[22px] font-semibold tracking-tight text-text-heading">
          {{ user.displayName || user.username }}
        </h1>
        <span class="rounded-md bg-surface-raised px-2 py-0.5 font-poppins text-[14px] font-medium text-text-heading">{{ ROLE_LABEL[user.role] }}</span>
        <span v-if="user.role === 'STUDENT'" :class="['rounded-md px-2 py-0.5 font-poppins text-[14px] font-medium', plan.class]">{{ plan.label }} plan</span>
      </div>
      <AppText size="14" color="neutral-400" class-list="mt-0.5 break-words">@{{ user.username }} · {{ user.email }}</AppText>
      <FormError v-if="avatarError" :error="avatarError" />
      <AppText v-else-if="avatarPreview" size="14" color="neutral-400" class-list="mt-0.5">New photo, saved with the rest.</AppText>
    </div>

    <div class="flex shrink-0 items-center gap-2 max-md:w-full">
      <AppButton variant="secondary" size="38" radius="8" text="Cancel" class-list="text-[14px]" :to="backTo" :disabled="saving" />
      <AppButton
        type="submit" variant="primary" size="38" radius="8" icon="TickCircle"
        :icon-config="{ color: 'white', size: 16 }"
        text="Save changes" class-list="gap-2 text-[14px]" :loading="saving"
      />
    </div>
  </header>
</template>
