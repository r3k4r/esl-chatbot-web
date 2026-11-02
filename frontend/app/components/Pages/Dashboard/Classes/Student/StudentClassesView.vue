<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ClassItem } from '~/common/types/class-types'

const { listMyClasses, joinClass } = useClasses()
const router = useRouter()

// ─── State ────────────────────────────────────────────────────────────────────
const classes = ref<ClassItem[]>([])
const loading = ref(true)
const joinModalOpen = ref(false)
const joining = ref(false)
const copyingId = ref<string | null>(null)
const search = ref('')

// ─── Derived ──────────────────────────────────────────────────────────────────
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return classes.value
  return classes.value.filter(
    c => c.className.toLowerCase().includes(q) || (c.classCategory ?? '').toLowerCase().includes(q),
  )
})

// ─── Load ──────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  const res = await listMyClasses()
  loading.value = false
  if (!res.success) { toast.error(res.message || 'Could not load classes'); return }
  classes.value = (res.data?.data ?? []) as ClassItem[]
}
onMounted(load)

// ─── Actions ───────────────────────────────────────────────────────────────────
async function handleJoin(code: string) {
  joining.value = true
  const res = await joinClass(code)
  joining.value = false
  if (!res.success) {
    if (res.status === 403) toast.error('This class code is blocked by the tutor.')
    else if (res.status === 404) toast.error('No class found with that code.')
    else if (res.status === 409) toast.error('You are already a member of this class.')
    else if (res.status === 410) toast.error('This code has expired — ask your tutor for the new one.')
    else toast.error(res.message || 'Could not join class')
    return
  }
  joinModalOpen.value = false
  toast.success(`Joined ${res.data?.data?.className ?? 'class'} successfully!`)
  await load()
}

function openClass(id: string) {
  router.push(`/dashboard/classes/${id}`)
}

async function handleCopy(code: string, id: string) {
  copyingId.value = id
  useCopyToClipboard(code)
  toast.success('Class code copied!')
  setTimeout(() => { copyingId.value = null }, 1500)
}
</script>

<template>
  <div class="h-full overflow-y-auto p-5 sm:p-7 space-y-6">

    <!-- Page header -->
    <div class="flex items-center justify-between gap-4 animate-card-enter" style="--delay:0ms">
      <div>
        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#B91C1C]/10 border border-[#B91C1C]/20 mb-2">
          <img src="/leo-logo.jpg" alt="Leo" class="size-3.5 rounded-full object-cover" />
          <span class="text-[10px] font-semibold text-[#B91C1C] dark:text-red-400 uppercase tracking-widest font-poppins">
            Leo Institute Cohorts · پەیمانگای لیۆ
          </span>
        </div>
        <AppText size="22" weight="semibold" color="black" class-list="tracking-[-0.02em] block">Leo Classes &amp; Cohorts</AppText>
        <AppText size="13" color="neutral-400" class-list="mt-0.5 block">Classes you're enrolled in</AppText>
      </div>
      <AppButton
        variant="primary"
        size="38"
        radius="8"
        icon="Login"
        :icon-config="{ color: 'white' }"
        text="Join a class"
        @click="joinModalOpen = true"
      />
    </div>

    <!-- Search -->
    <div class="animate-card-enter max-w-sm" style="--delay:60ms">
      <FormInput
        id="classes-search"
        v-model="search"
        placeholder="Search classes…"
        icon="SearchNormal"
        :icon-config="{ color: '#a1a1aa', size: 14 }"
      />
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <UiSkeleton v-for="i in 3" :key="i" class="h-44 rounded-2xl" :style="`opacity:${1 - i * 0.2}`" />
    </div>

    <!-- Empty — not enrolled in anything -->
    <template v-else-if="classes.length === 0">
      <PagesDashboardClassesEmptyState
        class="animate-card-enter"
        style="--delay:80ms"
        @join="joinModalOpen = true"
      />
    </template>

    <template v-else>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <PagesDashboardClassesClassCard
          v-for="(cls, i) in filtered"
          :key="cls.id"
          :cls="cls"
          :copying="copyingId === cls.id"
          class="animate-card-enter"
          :style="`--delay:${100 + i * 50}ms`"
          @open="openClass"
          @copy="code => handleCopy(code, cls.id)"
        />
      </div>

      <!-- No results after search -->
      <PagesDashboardClassesEmptyState
        v-if="filtered.length === 0 && search"
        :message="`No classes match &quot;${search}&quot;`"
      />
    </template>

    <!-- Join modal -->
    <PagesDashboardClassesJoinClassModal
      v-model:open="joinModalOpen"
      :loading="joining"
      @join="handleJoin"
    />
  </div>
</template>
