<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { ClassItem } from '~/common/types/class-types'

const { listMyClasses, refreshCode } = useClasses()
const router = useRouter()

// ─── State ────────────────────────────────────────────────────────────────────
const classes = ref<ClassItem[]>([])
const loading = ref(true)
const copyingId = ref<string | null>(null)
const refreshingId = ref<string | null>(null)
const search = ref('')
// 'active' = normal classes, 'archived' = read-only archived classes.
const view = ref<'active' | 'archived'>('active')

// ─── Derived — tutors only see classes they own ────────────────────────────────
const owned = computed(() => classes.value.filter(c => c.myRole === 'TUTOR'))
const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return owned.value
  return owned.value.filter(
    c => c.className.toLowerCase().includes(q) || (c.classCategory ?? '').toLowerCase().includes(q),
  )
})

// ─── Load ──────────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  const res = await listMyClasses({ archived: view.value === 'archived' })
  loading.value = false
  if (!res.success) { toast.error(res.message || 'Could not load classes'); return }
  classes.value = (res.data?.data ?? []) as ClassItem[]
}
onMounted(load)
watch(view, load)

// ─── Actions ───────────────────────────────────────────────────────────────────
function openClass(id: string) {
  router.push(`/dashboard/classes/${id}`)
}

async function handleCopy(code: string, id: string) {
  copyingId.value = id
  useCopyToClipboard(code)
  toast.success('Class code copied!')
  setTimeout(() => { copyingId.value = null }, 1500)
}

async function handleRefresh(id: string) {
  if (refreshingId.value) return
  refreshingId.value = id
  const res = await refreshCode(id)
  refreshingId.value = null
  if (!res.success) { toast.error(res.message || 'Could not rotate code'); return }
  toast.success('Class code rotated!')
  await load()
}
</script>

<template>
  <div class="h-full overflow-y-auto page-padding space-y-6">

    <!-- Page header -->
    <!-- Wraps on phones so the buttons sit under the title instead of running off-screen -->
    <div class="flex flex-wrap items-center justify-between gap-4 animate-card-enter" style="--delay:0ms">
      <div class="min-w-0">
        <AppText size="22" weight="semibold" color="black" class-list="tracking-[-0.02em] block">My Classes</AppText>
        <AppText size="13" color="neutral-400" class-list="mt-0.5 block">Classes you teach and manage</AppText>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <div class="flex items-center gap-1.5">
          <AppButton :variant="view === 'active' ? 'primary' : 'secondary'" size="38" radius="8" text="Active" :icon-config="{ color: view === 'active' ? 'white' : 'currentColor' }" @click="view = 'active'" />
          <AppButton :variant="view === 'archived' ? 'primary' : 'secondary'" size="38" radius="8" icon="Archive" text="Archived" :icon-config="{ color: view === 'archived' ? 'white' : 'currentColor', size: 15 }" @click="view = 'archived'" />
        </div>
        <AppButton
          v-if="view === 'active'"
          variant="primary"
          size="38"
          radius="8"
          icon="Add"
          :icon-config="{ color: 'white' }"
          text="New class"
          :to="'/dashboard/classes/create'"
        />
      </div>
    </div>

    <!-- Search -->
    <div class="animate-card-enter max-w-sm" style="--delay:60ms">
      <FormInput
        id="classes-search"
        v-model="search"
        placeholder="Search your classes…"
        icon="SearchNormal"
        :icon-config="{ color: '#a1a1aa', size: 14 }"
      />
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <UiSkeleton v-for="i in 3" :key="i" class="h-44 rounded-2xl" :style="`opacity:${1 - i * 0.2}`" />
    </div>

    <!-- Empty — archived view -->
    <template v-else-if="owned.length === 0 && view === 'archived'">
      <UiEmpty class="rounded-2xl py-16 animate-card-enter" style="--delay:80ms;border:1px dashed var(--border-card)">
        <UiEmptyMedia>
          <div class="size-14 rounded-2xl flex items-center justify-center" style="background:var(--surface-well)">
            <AppIconsax name="Archive" color="var(--color-text-subtle)" :size="24" />
          </div>
        </UiEmptyMedia>
        <UiEmptyContent>
          <UiEmptyTitle>No archived classes</UiEmptyTitle>
          <UiEmptyDescription>Classes you archive will appear here. You can unarchive them anytime to restore full access.</UiEmptyDescription>
        </UiEmptyContent>
      </UiEmpty>
    </template>

    <!-- Empty — no owned classes -->
    <template v-else-if="owned.length === 0">
      <UiEmpty class="rounded-2xl py-16 animate-card-enter" style="--delay:80ms;border:1px dashed var(--border-card)">
        <UiEmptyMedia>
          <div class="size-14 rounded-2xl flex items-center justify-center bg-brand-primary/10 border border-brand-primary/20">
            <AppIconsax name="BookSaved" color="var(--color-brand-primary)" :size="24" />
          </div>
        </UiEmptyMedia>
        <UiEmptyContent>
          <UiEmptyTitle>No classes yet</UiEmptyTitle>
          <UiEmptyDescription>Create your first class to start enrolling students and sharing a class code.</UiEmptyDescription>
          <AppButton
            variant="primary"
            size="40"
            radius="8"
            icon="Add"
            :icon-config="{ color: 'white' }"
            text="New class"
            class="mt-2"
            :to="'/dashboard/classes/create'"
          />
        </UiEmptyContent>
      </UiEmpty>
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
          @refresh="handleRefresh"
        />
      </div>

      <!-- No results after search -->
      <PagesDashboardClassesEmptyState
        v-if="filtered.length === 0 && search"
        :message="`No classes match &quot;${search}&quot;`"
      />
    </template>
  </div>
</template>
