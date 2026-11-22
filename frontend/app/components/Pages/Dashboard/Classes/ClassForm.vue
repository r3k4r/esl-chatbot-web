<script setup lang="ts">
import type { SvgBasedIconName } from '~/common/types/iconsax-types'

/**
 * Shared create/edit class form.
 * Parent handles submit — this component only owns field state and validation.
 */

interface ClassFormInitial {
  className: string
  classCategory: string
  intervalSeconds: number | null
  classStatus?: 'ACTIVE' | 'INACTIVE'
}

interface ClassFormPayload {
  className: string
  classCategory: string | null
  classCodeRefreshIntervalSeconds: number | null
  classStatus?: 'ACTIVE' | 'INACTIVE'
}

const props = defineProps<{
  /** Pre-fill values when editing */
  initial?: ClassFormInitial
  submitting: boolean
  isEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', payload: ClassFormPayload): void
  (e: 'cancel'): void
}>()

const className = ref(props.initial?.className ?? '')
const classCategory = ref(props.initial?.classCategory ?? '')
const intervalSeconds = ref<number | null>(props.initial?.intervalSeconds ?? null)
const classStatus = ref<'ACTIVE' | 'INACTIVE'>(props.initial?.classStatus ?? 'ACTIVE')
const classNameError = ref('')
const classCategoryError = ref('')
// Same limits as the API (POST/PATCH /classes) — caught here so the user sees a plain message.
const NAME_MAX = 100

// Keep fields in sync if `initial` arrives after mount (edit page loads async)
watch(() => props.initial, (val) => {
  if (!val) return
  className.value = val.className
  classCategory.value = val.classCategory
  intervalSeconds.value = val.intervalSeconds
  classStatus.value = val.classStatus ?? 'ACTIVE'
})

const STATUS_OPTIONS: { value: 'ACTIVE' | 'INACTIVE'; label: string; desc: string }[] = [
  { value: 'ACTIVE', label: 'Active', desc: 'Students can join' },
  { value: 'INACTIVE', label: 'Inactive', desc: 'Joining disabled' },
]

const INTERVAL_OPTIONS: { label: string; description: string; value: number | null; icon: SvgBasedIconName }[] = [
  { label: 'Permanent', description: 'Code never expires', value: null, icon: 'Unlimited' },
  { label: 'Daily', description: 'Rotates every 24 hours', value: 86400, icon: 'Sun1' },
  { label: 'Weekly', description: 'Rotates every 7 days', value: 604800, icon: 'Calendar' },
  { label: 'Monthly', description: 'Rotates every 30 days', value: 2592000, icon: 'CalendarTick' },
  { label: 'Yearly', description: 'Rotates every 365 days', value: 31536000, icon: 'CalendarEdit' },
]

function handleSubmit() {
  classNameError.value = ''
  classCategoryError.value = ''
  if (!className.value.trim()) classNameError.value = 'Class name is required.'
  else if (className.value.trim().length > NAME_MAX) classNameError.value = `Class name can be at most ${NAME_MAX} characters.`
  if (classCategory.value.trim().length > NAME_MAX) classCategoryError.value = `Category can be at most ${NAME_MAX} characters.`
  if (classNameError.value || classCategoryError.value) return
  const payload: ClassFormPayload = {
    className: className.value.trim(),
    classCategory: classCategory.value.trim() || null,
    classCodeRefreshIntervalSeconds: intervalSeconds.value,
  }
  if (props.isEdit) payload.classStatus = classStatus.value
  emit('submit', payload)
}
</script>

<template>
  <div class="dash-card p-6 space-y-6">

    <!-- Name + category side by side on wider screens -->
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormInput id="class-name" v-model="className" label="Class name"
        placeholder="e.g. Intermediate B2 — Morning Group" :error="classNameError"
        @update:model-value="classNameError = ''" />
      <FormInput id="class-category" v-model="classCategory" label="Category"
        placeholder="e.g. Grammar, Speaking, IELTS Prep… (optional)" :error="classCategoryError"
        @update:model-value="classCategoryError = ''" />
    </div>

    <!-- Status — edit only -->
    <div v-if="isEdit" class="space-y-2">
      <p class="text-[14px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Status</p>
      <div class="grid grid-cols-2 gap-3">
        <button v-for="opt in STATUS_OPTIONS" :key="opt.value" type="button"
          class="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer" :class="classStatus === opt.value
            ? 'border-brand-primary bg-brand-primary/5'
            : 'hover:bg-surface-raised'" :style="classStatus !== opt.value ? 'border-color:var(--border-inner)' : ''"
          @click="classStatus = opt.value">
          <div class="size-2.5 rounded-full shrink-0"
            :style="opt.value === 'ACTIVE' ? 'background:var(--status-active-text)' : 'background:var(--status-expired-text)'" />
          <div>
            <p class="text-[14px] font-medium font-poppins" :style="`color:var(--text-heading)`">{{ opt.label }}</p>
            <p class="text-[13px] font-poppins" :style="`color:var(--text-muted)`">{{ opt.desc }}</p>
          </div>
        </button>
      </div>
    </div>

    <div class="h-px" :style="`background:var(--border-inner)`" />

    <!-- Code refresh interval -->
    <div class="space-y-3">
      <div>
        <p class="text-[14px] font-semibold font-poppins" :style="`color:var(--text-heading)`">Code refresh interval</p>
        <p class="text-[13px] font-poppins mt-0.5" :style="`color:var(--text-muted)`">
          How often the join code rotates. Students need the latest code to join.
        </p>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button v-for="opt in INTERVAL_OPTIONS" :key="String(opt.value)" type="button"
          class="flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer" :class="intervalSeconds === opt.value
            ? 'border-brand-primary bg-brand-primary/5 shadow-sm'
            : 'hover:bg-surface-raised'"
          :style="intervalSeconds !== opt.value ? 'border-color:var(--border-inner)' : ''"
          @click="intervalSeconds = opt.value">
          <div class="size-9 rounded-xl flex items-center justify-center shrink-0"
            :style="intervalSeconds === opt.value ? 'background:rgba(245,158,11,0.15)' : 'background:var(--surface-raised)'">
            <AppIconsax :name="opt.icon"
              :color="intervalSeconds === opt.value ? 'var(--color-brand-primary)' : 'var(--color-text-muted)'"
              :size="16" />
          </div>
          <div class="flex-1">
            <p class="text-[14px] font-poppins" :class="intervalSeconds === opt.value ? 'font-semibold' : 'font-medium'"
              :style="intervalSeconds === opt.value ? 'color:var(--color-brand-primary)' : 'color:var(--text-heading)'">
              {{ opt.label }}
            </p>
            <p class="text-[13px] font-poppins" :style="`color:var(--text-muted)`">{{ opt.description }}</p>
          </div>
          <div class="size-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors" :style="intervalSeconds === opt.value
            ? 'border-color:var(--color-brand-primary)'
            : 'border-color:var(--border-inner)'">
            <div v-if="intervalSeconds === opt.value" class="size-2 rounded-full"
              style="background:var(--color-brand-primary)" />
          </div>
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-3 pt-2">
      <AppButton variant="secondary" size="40" radius="8" text="Cancel" class="flex-1" @click="$router.back()" />
      <AppButton variant="primary" size="40" radius="8" :icon="isEdit ? 'TickCircle' : 'Add'"
        :icon-config="{ color: 'white' }" :text="isEdit ? 'Save changes' : 'Create class'" class="flex-1"
        :loading="submitting" :disabled="!className.trim() || submitting" @click="handleSubmit" />
    </div>

  </div>
</template>
