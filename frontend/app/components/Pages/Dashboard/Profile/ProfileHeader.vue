<script setup lang="ts">
import type { MyProfileData } from '~/common/types/profile-types'

// Who this is, in one row: photo, name, @username and email together, plan or role and level.
// While editing, a camera button on the photo changes it (saved with the rest of the form).
const props = defineProps<{
  profile: MyProfileData
  editing: boolean
  isStaff: boolean
  initials: string
  planLabel: string
  planColor: string
  avatarPreview: string
  avatarError: string
  saving: boolean
}>()
const emit = defineEmits<{ edit: []; cancel: []; pick: [file: File] }>()

const fileInput = ref<HTMLInputElement | null>(null)
const avatarSrc = computed(() => props.avatarPreview || props.profile.avatarUrl || '')
const roleLabel = computed(() => (props.profile.role === 'ADMIN' ? 'Admin' : 'Teacher'))

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
        <UiAvatarImage v-if="avatarSrc" :src="avatarSrc" :alt="profile.displayName" class="object-cover" />
        <UiAvatarFallback class="bg-surface-well font-poppins text-[24px] font-semibold text-text-heading">{{ initials }}</UiAvatarFallback>
      </UiAvatar>
      <template v-if="editing">
        <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/gif" class="hidden" @change="onFile">
        <AppButton
          variant="secondary" size="28" radius="8" aspect="square" icon="Camera"
          :icon-config="{ color: 'currentColor', size: 16 }"
          class-list="absolute -bottom-1 -end-1 border-surface-page"
          aria-label="Change photo" title="Change photo"
          @click="fileInput?.click()"
        />
      </template>
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h1 class="truncate font-poppins text-[22px] font-semibold tracking-tight text-text-heading">
          {{ profile.displayName || profile.username }}
        </h1>
        <span v-if="isStaff" class="rounded-md bg-status-active-bg px-2 py-0.5 font-poppins text-[14px] font-medium text-status-active-text">{{ roleLabel }}</span>
        <span v-else :class="['rounded-md px-2 py-0.5 font-poppins text-[14px] font-medium', planColor]">{{ planLabel }} plan</span>
        <span v-if="!isStaff && profile.learnerProfile?.currentLevel" class="rounded-md bg-surface-raised px-2 py-0.5 font-poppins text-[14px] font-medium text-text-heading">
          Level {{ profile.learnerProfile.currentLevel }}
        </span>
      </div>
      <AppText size="14" color="neutral-400" class-list="mt-0.5 break-all">
        @{{ profile.username }} · {{ profile.email }}
      </AppText>
      <FormError v-if="avatarError" :error="avatarError" />
    </div>

    <!-- One place for the page's actions: Edit, then Cancel + Save while editing (Save submits the form) -->
    <div class="flex shrink-0 items-center gap-2">
      <AppButton
        v-if="!editing"
        variant="secondary" size="38" radius="8" icon="Edit2"
        :icon-config="{ color: 'currentColor', size: 16 }"
        text="Edit profile" class-list="gap-2 text-[14px]"
        @click="emit('edit')"
      />
      <template v-else>
        <AppButton variant="secondary" size="38" radius="8" text="Cancel" class-list="text-[14px]" :disabled="saving" @click="emit('cancel')" />
        <AppButton
          type="submit" variant="primary" size="38" radius="8" icon="TickCircle"
          :icon-config="{ color: 'white', size: 16 }"
          text="Save profile" class-list="gap-2 text-[14px]" :loading="saving"
        />
      </template>
    </div>
  </header>
</template>
