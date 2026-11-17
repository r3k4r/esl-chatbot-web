<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker'
import { twMerge } from 'tailwind-merge'

// Ported from visa-advisers-uae (Form/DateInput.vue), restyled with the dashboard tokens.
// The v-model stays a string so forms keep their existing shape:
//   date only  → 'yyyy-MM-dd'      (default)
//   with time  → ISO string        (pass `with-time`)
const props = withDefaults(defineProps<{
  id: string
  label?: string
  placeholder?: string
  withTime?: boolean
  minDate?: Date | string
  maxDate?: Date | string
  error?: string
  required?: boolean
  clearable?: boolean
  disabled?: boolean
  classList?: string
}>(), {
  clearable: true,
})

const modelValue = defineModel<string | null | undefined>()
const picker = useTemplateRef<{ closeMenu: () => void }>('picker')

const hasValue = computed(() => !!modelValue.value)

// The menu is teleported to <body>, so inside a UiDialog a click on it counts as a click
// outside the dialog and closes it. Keep those pointerdowns from reaching the dialog.
const stopOutside = (e: Event) => e.stopPropagation()
function onOpen() {
  nextTick(() => document.querySelectorAll('.dp--menu-wrapper').forEach(el => {
    el.removeEventListener('pointerdown', stopOutside)
    el.addEventListener('pointerdown', stopOutside)
  }))
}

const display = computed(() => {
  if (!modelValue.value) return props.placeholder || (props.withTime ? 'Pick a date and time' : 'Pick a date')
  const d = new Date(props.withTime ? modelValue.value : `${modelValue.value}T00:00:00`)
  return d.toLocaleString([], props.withTime
    ? { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', year: 'numeric' })
})

const triggerClasses = computed(() => twMerge(
  'flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-transparent px-3 text-start text-[14px] font-medium outline-none',
  'border-border-card transition-colors duration-150 hover:border-text-subtle focus-visible:border-brand-primary',
  props.error ? 'border-destructive hover:border-destructive' : '',
  props.disabled ? 'pointer-events-none opacity-60' : 'cursor-pointer',
  props.classList,
))
</script>

<template>
  <div class="main-input">
    <FormLabel v-if="label" :for-id="id" :label="label" :required="required" />
    <VueDatePicker
      ref="picker"
      v-model="modelValue"
      :model-type="withTime ? 'iso' : 'yyyy-MM-dd'"
      :time-config="{ enableTimePicker: withTime, is24: false }"
      :min-date="minDate"
      :max-date="maxDate"
      :disabled="disabled"
      :auto-apply="!withTime"
      teleport="body"
      :floating="{ offset: 8, flip: true, shift: true, arrow: false }"
      @open="onOpen"
    >
      <template #trigger>
        <div :id="id" role="button" :tabindex="disabled ? -1 : 0" :aria-label="label || placeholder"
          :aria-invalid="!!error" :class="triggerClasses" @keydown.esc="picker?.closeMenu()">
          <span class="flex min-w-0 items-center gap-2.5">
            <AppIconsax name="Calendar" color="var(--color-text-subtle)" :size="18" class="shrink-0" />
            <span class="truncate" :class="hasValue ? 'text-text-heading' : 'font-normal text-text-subtle'">{{ display }}</span>
          </span>
          <AppButton v-if="hasValue && clearable && !disabled" variant="ghost" size="28" radius="8" aspect="square"
            icon="CloseCircle" :icon-config="{ color: 'var(--color-text-subtle)', size: 16 }"
            :aria-label="`Clear ${label || 'date'}`" class-list="-me-1.5 shrink-0" @click.stop="modelValue = ''" />
        </div>
      </template>
    </VueDatePicker>
    <FormError :error="error" />
  </div>
</template>
