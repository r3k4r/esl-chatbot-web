<script setup lang="ts">
import type { AdminUserItem } from '~/common/types/admin-types'
import ProfileRow from '~/components/Pages/Dashboard/Profile/ProfileRow.vue'

// Access: role and whether the account can sign in. Both apply at once (not with Save).
defineProps<{ user: AdminUserItem; toggling: boolean }>()
const emit = defineEmits<{ changeRole: []; setActive: [active: boolean] }>()

const ROLE = {
  STUDENT: { label: 'Student', hint: 'Learner access only.' },
  TUTOR: { label: 'Teacher', hint: 'Creates classes and manages students.' },
  ADMIN: { label: 'Admin', hint: 'Full platform control.' },
} as const
</script>

<template>
  <ProfileRow label="Role" :hint="ROLE[user.role].hint">
    <div class="flex items-center justify-between gap-3">
      <span>{{ ROLE[user.role].label }}</span>
      <AppButton variant="secondary" size="32" radius="8" text="Change" class-list="text-[14px]" @click="emit('changeRole')" />
    </div>
  </ProfileRow>
  <ProfileRow label="Can sign in" field-id="ue-active" :hint="user.isActive ? undefined : 'Banned: they can\'t sign in until you turn this back on.'">
    <div class="flex items-center justify-between gap-3">
      <span :style="user.isActive ? 'color:var(--status-active-text)' : 'color:var(--status-expired-text)'">
        {{ user.isActive ? 'Yes, active' : 'No, banned' }}
      </span>
      <UiSwitch id="ue-active" :model-value="user.isActive" :disabled="toggling" @update:model-value="emit('setActive', $event)" />
    </div>
  </ProfileRow>
</template>
