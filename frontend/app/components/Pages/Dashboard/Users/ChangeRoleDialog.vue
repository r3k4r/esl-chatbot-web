<script setup lang="ts">
import type { AdminUserItem, UserRole } from '~/common/types/admin-types'
import type { SvgBasedIconName } from '~/common/types/iconsax-types'
import { useAuthStore } from '~~/stores/auth'

const props = defineProps<{
  open: boolean
  user: AdminUserItem | null
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  save: [role: UserRole]
}>()

const authStore = useAuthStore()

const ROLES: { id: UserRole; label: string; icon: SvgBasedIconName; description: string }[] = [
  { id: 'STUDENT', label: 'Student', icon: 'Book1', description: 'Learner access — AI chat, voice lab, vocabulary and goals.' },
  { id: 'TUTOR', label: 'Tutor', icon: 'Teacher', description: 'Creates classes, assigns tasks and reviews student progress.' },
  { id: 'ADMIN', label: 'Admin', icon: 'Lock1', description: 'Full platform control — manages every user, class and subscription.' },
]

const selected = ref<UserRole>('STUDENT')

// Re-seed the selection from the target every time the dialog opens, so a
// cancelled change never leaks into the next one.
watch(() => props.open, (isOpen) => {
  if (isOpen && props.user) selected.value = props.user.role
})

// Mirrors the backend self-lockout guard in admin.service.ts: an admin may not
// change their own role. Only admins reach this screen, so "self" always means
// a demotion out of ADMIN — which the API rejects with 409.
const isSelf = computed(() => !!props.user && props.user.id === authStore.getUser?.id)

const isUnchanged = computed(() => !!props.user && selected.value === props.user.role)
const isPromotingToAdmin = computed(() => selected.value === 'ADMIN' && props.user?.role !== 'ADMIN')
const isDemotingAdmin = computed(() => props.user?.role === 'ADMIN' && selected.value !== 'ADMIN')

function submit() {
  if (isSelf.value || isUnchanged.value) return
  emit('save', selected.value)
}
</script>

<template>
  <UiDialog :open="open" @update:open="emit('update:open', $event)">
    <UiDialogContent class="p-0 gap-0 overflow-hidden max-w-lg" :style="`background:var(--surface-card)`">

      <!-- Header -->
      <UiDialogHeader class="p-5 pb-4">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl flex items-center justify-center shrink-0" style="background:var(--surface-raised)">
            <AppIconsax name="Profile" color="var(--color-brand-primary)" :size="18" />
          </div>
          <div class="min-w-0">
            <UiDialogTitle class="text-[16px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
              Change role
            </UiDialogTitle>
            <UiDialogDescription class="text-[14px] font-poppins mt-0.5 truncate" :style="`color:var(--text-muted)`">
              {{ user?.displayName || user?.username || '—' }} · {{ user?.email }}
            </UiDialogDescription>
          </div>
        </div>
      </UiDialogHeader>

      <!-- Role options -->
      <div class="px-5 pb-2 space-y-2">
        <button
          v-for="r in ROLES"
          :key="r.id"
          type="button"
          class="w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all"
          :class="isSelf ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
          :disabled="isSelf"
          :style="selected === r.id
            ? 'border-color:var(--color-brand-primary);background:var(--surface-raised)'
            : 'border-color:var(--border-inner);background:var(--surface-raised)'"
          @click="selected = r.id"
        >
          <div class="size-9 rounded-lg flex items-center justify-center shrink-0" style="background:var(--surface-well)">
            <AppIconsax
              :name="r.icon"
              :color="selected === r.id ? 'var(--color-brand-primary)' : 'var(--color-text-muted)'"
              :size="18"
            />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="text-[15px] font-semibold font-poppins" :style="`color:var(--text-heading)`">{{ r.label }}</p>
              <span
                v-if="user?.role === r.id"
                class="text-[14px] font-medium px-2 py-0.5 rounded-md font-poppins"
                style="background:var(--status-inactive-bg);color:var(--status-inactive-text)"
              >Current</span>
            </div>
            <p class="text-[14px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">{{ r.description }}</p>
          </div>
          <div
            v-if="selected === r.id"
            class="size-5 rounded-md flex items-center justify-center shrink-0 mt-0.5"
            style="background:var(--color-brand-primary)"
          >
            <AppIconsax name="TickCircle" color="white" :size="14" />
          </div>
        </button>
      </div>

      <!-- Contextual notices -->
      <div class="px-5 pt-2 pb-1">
        <div
          v-if="isSelf"
          class="flex items-start gap-2.5 p-3.5 rounded-xl"
          style="background:var(--status-blocked-bg)"
        >
          <AppIconsax name="InfoCircle" color="var(--status-blocked-text)" :size="16" class="shrink-0 mt-0.5" />
          <p class="text-[14px] font-poppins" style="color:var(--status-blocked-text)">
            You cannot change your own role. Ask another admin to do it for you.
          </p>
        </div>

        <div
          v-else-if="isPromotingToAdmin"
          class="flex items-start gap-2.5 p-3.5 rounded-xl"
          style="background:var(--status-blocked-bg)"
        >
          <AppIconsax name="InfoCircle" color="var(--status-blocked-text)" :size="16" class="shrink-0 mt-0.5" />
          <p class="text-[14px] font-poppins" style="color:var(--status-blocked-text)">
            Admins can manage every user, class and subscription on the platform. Grant this only to people you trust.
          </p>
        </div>

        <div
          v-else-if="isDemotingAdmin"
          class="flex items-start gap-2.5 p-3.5 rounded-xl"
          style="background:var(--status-blocked-bg)"
        >
          <AppIconsax name="InfoCircle" color="var(--status-blocked-text)" :size="16" class="shrink-0 mt-0.5" />
          <p class="text-[14px] font-poppins" style="color:var(--status-blocked-text)">
            This removes their admin access immediately. The last remaining admin cannot be demoted.
          </p>
        </div>
      </div>

      <UiDialogFooter class="px-5 pb-5 pt-3 flex gap-2">
        <UiDialogClose as-child>
          <AppButton variant="secondary" size="38" radius="8" text="Cancel" class="flex-1" />
        </UiDialogClose>
        <AppButton
          variant="primary"
          size="38"
          radius="8"
          icon="TickCircle"
          :icon-config="{ color: 'white', size: 16 }"
          text="Save role"
          class="flex-1"
          :loading="saving"
          :disabled="isSelf || isUnchanged"
          @click="submit"
        />
      </UiDialogFooter>

    </UiDialogContent>
  </UiDialog>
</template>
