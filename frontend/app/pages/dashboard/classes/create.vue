<script setup lang="ts">
import { toast } from 'vue-sonner'

definePageMeta({ layout: 'dashboard', requiresAuth: true })

const router = useRouter()
const { isStaff } = useRole()

onMounted(() => {
  if (!isStaff.value) router.replace('/dashboard/classes')
})

const { createClass } = useClasses()
const submitting = ref(false)

async function handleSubmit(payload: {
  className: string
  classCategory: string | null
  classCodeRefreshIntervalSeconds: number | null
}) {
  submitting.value = true
  const res = await createClass({
    className: payload.className,
    classCategory: payload.classCategory,
    classCodeRefreshIntervalSeconds: payload.classCodeRefreshIntervalSeconds,
  })
  submitting.value = false

  if (!res.success) {
    toast.error(res.message || 'Could not create class')
    return
  }

  toast.success(`"${payload.className}" created!`)
  router.push('/dashboard/classes')
}
</script>

<template>
  <div class="h-full overflow-y-auto page-padding">
    <div class="space-y-6">

      <!-- Header -->
      <div class="flex items-center gap-3 animate-card-enter" style="--delay:0ms">
        <AppButton aria-label="Go back" variant="secondary" size="36" radius="8" icon="ArrowLeft" :to="'/dashboard/classes'" />
        <div>
          <p class="text-[22px] font-semibold font-poppins tracking-tight" :style="`color:var(--text-heading)`">Create a class</p>
          <p class="text-[13px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">Set up a new class for your students</p>
        </div>
      </div>

      <!-- Shared form -->
      <div class="animate-card-enter" style="--delay:60ms">
        <PagesDashboardClassesClassForm
          :submitting="submitting"
          @submit="handleSubmit"
          @cancel="router.push('/dashboard/classes')"
        />
      </div>

    </div>
  </div>
</template>
