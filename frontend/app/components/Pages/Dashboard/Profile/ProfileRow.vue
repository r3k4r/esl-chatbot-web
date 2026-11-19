<script setup lang="ts">
// A label and its value (or, while editing, its field) on one line; stacked on phones.
defineProps<{ label: string; fieldId?: string; hint?: string }>()
</script>

<template>
  <div class="grid gap-1.5 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:items-center sm:gap-4">
    <label :for="fieldId" class="font-poppins text-[14px] text-text-muted">{{ label }}</label>
    <div class="min-w-0 font-poppins text-[15px] text-text-heading">
      <slot />
      <AppText v-if="hint" size="14" color="neutral-400" class-list="mt-1">{{ hint }}</AppText>
    </div>
  </div>
</template>
