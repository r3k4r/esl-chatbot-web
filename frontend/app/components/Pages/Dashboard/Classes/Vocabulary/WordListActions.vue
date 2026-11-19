<script setup lang="ts">
// The form's action bar, pinned to the bottom of the page: the content scrolls under it.
defineProps<{ submitLabel: string; submitting: boolean }>()
const emit = defineEmits<{ cancel: [] }>()
</script>

<template>
  <div class="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-border-card bg-surface-page px-4 py-3">
    <slot name="start" />
    <AppButton variant="secondary" size="40" radius="8" text="Cancel" :disabled="submitting" @click="emit('cancel')" />
    <AppButton
      type="submit"
      variant="primary"
      size="40"
      radius="8"
      icon="TickCircle"
      :icon-config="{ color: 'white' }"
      :text="submitLabel"
      :loading="submitting"
      class-list="text-[14px]"
    />
  </div>
</template>
