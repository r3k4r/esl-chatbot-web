<script setup lang="ts">
import { toast } from 'vue-sonner'
import { useAuthStore } from '~~/stores/auth'
import type { ClassDetail } from '~/common/types/class-types'

definePageMeta({ layout: 'dashboard', requiresAuth: true })
useSeo({ title: 'Edit class', noindex: true })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { isStaff, isTutor } = useRole()
const { getClass, updateClass, updateCodeSettings } = useClasses()

const classId = computed(() => route.params.id as string)
const cls = ref<ClassDetail | null>(null)
// Names the id crumb in the header breadcrumb.
const { setTitle } = useBreadcrumbs()
watch(() => cls.value?.className, setTitle, { immediate: true })
const loading = ref(true)
const submitting = ref(false)

// Guard: only tutors of this class or admins can edit
onMounted(async () => {
  if (!isStaff.value) {
    router.replace('/dashboard/classes')
    return
  }

  loading.value = true
  const res = await getClass(classId.value)
  loading.value = false

  if (!res.success || !res.data?.data) {
    toast.error('Class not found')
    router.replace('/dashboard/classes')
    return
  }

  const data = res.data.data as ClassDetail
  // `myRole` isn't returned by GET /classes/:id — derive it from the members list.
  const myId = authStore.getUser?.id
  const isTutorOfClass = data.members?.some(m => m.user.id === myId && m.role === 'TUTOR')

  // Tutors can only edit classes they are a tutor of (admins can edit any).
  if (isTutor.value && !isTutorOfClass) {
    toast.error('You can only edit classes you manage.')
    router.replace('/dashboard/classes')
    return
  }

  cls.value = data
})

const initial = computed(() => {
  if (!cls.value) return undefined
  return {
    className: cls.value.className,
    classCategory: cls.value.classCategory ?? '',
    intervalSeconds: cls.value.classCodeRefreshIntervalSeconds ?? null,
    classStatus: cls.value.classStatus as 'ACTIVE' | 'INACTIVE',
  }
})

async function handleSubmit(payload: {
  className: string
  classCategory: string | null
  classCodeRefreshIntervalSeconds: number | null
  classStatus?: 'ACTIVE' | 'INACTIVE'
}) {
  submitting.value = true

  const calls: Promise<any>[] = []

  // Class info (name, category, status)
  calls.push(updateClass(classId.value, {
    className: payload.className,
    classCategory: payload.classCategory ?? undefined,
    classStatus: payload.classStatus,
  }))

  // Code interval only if changed
  if (cls.value && payload.classCodeRefreshIntervalSeconds !== (cls.value.classCodeRefreshIntervalSeconds ?? null)) {
    calls.push(updateCodeSettings(classId.value, payload.classCodeRefreshIntervalSeconds))
  }

  const results = await Promise.all(calls)
  submitting.value = false

  if (results.some(r => !r.success)) {
    toast.error('Some changes could not be saved.')
    return
  }

  toast.success('Class updated!')
  router.push(`/dashboard/classes/${classId.value}`)
}
</script>

<template>
  <div class="h-full overflow-y-auto page-padding">
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3 animate-card-enter" style="--delay:0ms">
        <AppButton aria-label="Go back" variant="secondary" size="36" radius="8" icon="ArrowLeft" :to="`/dashboard/classes/${classId}`" />
        <div>
          <template v-if="loading">
            <UiSkeleton class="h-6 w-40 rounded-lg" />
            <UiSkeleton class="h-4 w-28 rounded-lg mt-1.5" />
          </template>
          <template v-else>
            <p class="text-[22px] font-semibold font-poppins tracking-tight" :style="`color:var(--text-heading)`">
              Edit class
            </p>
            <p class="text-[13px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">
              {{ cls?.className }}
            </p>
          </template>
        </div>
      </div>

      <!-- Loading skeleton -->
      <template v-if="loading">
        <div class="dash-card p-6 space-y-5 animate-card-enter" style="--delay:60ms">
          <UiSkeleton class="h-10 rounded-xl" />
          <UiSkeleton class="h-10 rounded-xl" />
          <UiSkeleton class="h-10 rounded-xl" />
          <div class="space-y-2">
            <UiSkeleton v-for="n in 5" :key="n" class="h-14 rounded-xl" />
          </div>
        </div>
      </template>

      <!-- Shared form — pre-filled with existing class data -->
      <template v-else-if="cls">
        <div class="animate-card-enter" style="--delay:60ms">
          <PagesDashboardClassesClassForm
            :initial="initial"
            :submitting="submitting"
            :is-edit="true"
            @submit="handleSubmit"
            @cancel="router.push(`/dashboard/classes/${classId}`)"
          />
        </div>
      </template>

    </div>
  </div>
</template>
