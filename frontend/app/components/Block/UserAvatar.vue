<script setup lang="ts">
import { useAuthStore } from '~~/stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const user = computed(() => authStore.getUser)
const router = useRouter()

const initials = computed(() => {
  const name = user.value?.displayName ?? user.value?.username ?? user.value?.email ?? 'U'
  return name.charAt(0).toUpperCase()
})

const planLabel: Record<string, string> = {
  FREE: 'Free',
  GOLD: 'Gold',
  PREMIUM: 'Premium',
}

const plan = computed(() => planLabel[user.value?.subscription?.plan ?? 'FREE'] ?? 'Free')
const isFree = computed(() => (user.value?.subscription?.plan ?? 'FREE') === 'FREE')
// Staff = admins + tutors. Subscription/learner items are hidden for them.
const { isAdmin, isStaff } = useRole()
const roleLabel = computed(() => (isAdmin.value ? 'Admin' : 'Tutor'))

// Local state for email digest toggle
const emailDigestEnabled = ref(true)
const togglingDigest = ref(false)

async function toggleEmailDigest(val: boolean) {
  togglingDigest.value = true
  try {
    const res = await useHttp({
      method: 'PATCH',
      url: '/users/me/learner-profile',
      body: { emailDigestEnabled: val },
      requireAuth: true,
      showToast: false,
    })
    if (res.success) {
      emailDigestEnabled.value = val
      // Show custom toast
      const { toast } = await import('vue-sonner')
      toast.success(
        val
          ? '📧 Email digests enabled — you\'ll receive weekly summaries'
          : '💤 Email digests disabled — you won\'t receive weekly emails'
      )
    }
  } finally {
    togglingDigest.value = false
  }
}

// Fetch profile on mount to sync the toggle + theme (cross-device)
const { syncFromProfile } = useTheme()
onMounted(async () => {
  const res = await useHttp({
    method: 'GET',
    url: '/users/me',
    requireAuth: true,
    showToast: false,
  })
  if (res.success && res.data?.data?.learnerProfile) {
    emailDigestEnabled.value = res.data.data.learnerProfile.emailDigestEnabled ?? true
    syncFromProfile(res.data.data.learnerProfile.theme)
  }
})

async function handleSignOut() {
  await authStore.signOut()
  router.push('/signin')
}
</script>

<template>
  <UiDropdownMenu>
    <UiDropdownMenuTrigger as-child>
      <button
        class="flex items-center gap-2 pl-2 border-l border-black/6 dark:border-white/6 outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 rounded-lg ml-1.5"
        aria-label="User menu">
        <!-- Avatar circle -->
        <div
          class="w-8 h-8 rounded-full bg-linear-to-br from-brand-primary to-[#b45309] text-white flex items-center justify-center text-[12px] font-semibold font-poppins shrink-0">
          <AppImage v-if="user?.avatarUrl" :src="user.avatarUrl" :alt="user.displayName"
            class="w-full h-full rounded-full object-cover" />
          <span v-else>{{ initials }}</span>
        </div>

        <!-- Name + plan (lg+) -->
        <div class="hidden lg:block leading-tight text-left">
          <AppText size="12" weight="medium" color="brand-ink">
            {{ user?.username ?? 'User' }}
          </AppText>
          <AppText size="10" color="neutral-400" class="font-mono">{{ isStaff ? roleLabel : plan }}</AppText>
        </div>
      </button>
    </UiDropdownMenuTrigger>

    <UiDropdownMenuContent align="end" class="w-60 mt-1">
      <!-- User info header -->
      <div class="px-3 py-3 flex items-center gap-3">
        <div
          class="w-10 h-10 rounded-full bg-linear-to-br from-brand-primary to-[#b45309] text-white flex items-center justify-center text-[14px] font-semibold font-poppins shrink-0">
          <AppImage v-if="user?.avatarUrl" :src="user.avatarUrl" :alt="user.displayName"
            class="w-full h-full rounded-full object-cover" />
          <span v-else>{{ initials }}</span>
        </div>
        <div class="min-w-0">
          <p class="text-[13px] font-semibold font-poppins text-brand-ink dark:text-white truncate">
            {{ user?.displayName ?? user?.username ?? 'User' }}
          </p>
          <p class="text-[11px] text-zinc-400 font-mono truncate">{{ user?.email }}</p>
          <span
            class="inline-block mt-0.5 text-[10px] font-semibold font-poppins px-1.5 py-0.5 rounded-sm bg-brand-primary text-white">
            {{ isStaff ? roleLabel : plan }}
          </span>
        </div>
      </div>

      <template v-if="!isStaff">
        <UiDropdownMenuSeparator />

        <!-- Email digest toggle (learner feature) -->
        <div class="px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-sm transition-colors" @click.stop>
          <div>
            <p class="text-[13px] font-medium text-zinc-900 dark:text-white">Email digests</p>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">Weekly summary</p>
          </div>
          <UiSwitch :model-value="emailDigestEnabled" :disabled="togglingDigest" @update:model-value="toggleEmailDigest($event)" />
        </div>
      </template>

      <UiDropdownMenuSeparator />

      <!-- Profile -->
      <UiDropdownMenuItem as-child class="focus:text-white group">
        <NuxtLink to="/dashboard/profile" class="flex items-center gap-2.5 cursor-pointer">
          <AppIconsax name="Profile" color="currentColor" :size="14" class="text-zinc-500 group-focus:text-white" />
          <span class="text-[13px]">Profile</span>
        </NuxtLink>
      </UiDropdownMenuItem>

      <!-- Billing — personal subscription, hidden for staff -->
      <UiDropdownMenuItem v-if="!isStaff" as-child class="focus:text-white group">
        <NuxtLink to="/dashboard/billing" class="flex items-center gap-2.5 cursor-pointer">
          <AppIconsax name="Wallet2" color="currentColor" :size="14" class="text-zinc-500 group-focus:text-white" />
          <span class="text-[13px]">Billing</span>
        </NuxtLink>
      </UiDropdownMenuItem>

      <UiDropdownMenuSeparator />

      <!-- Sign out (destructive) -->
      <UiDropdownMenuItem
        class="flex items-center gap-2.5 cursor-pointer bg-destructive text-white focus:bg-destructive/80 focus:text-white"
        @click="handleSignOut">
        <AppIconsax name="Logout" color="currentColor" :size="14" />
        <span class="text-[13px]">Sign out</span>
      </UiDropdownMenuItem>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>
