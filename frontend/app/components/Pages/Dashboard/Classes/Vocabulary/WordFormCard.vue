<script setup lang="ts">
// A titled section of the word list form (as in the other dashboard forms): title, one line
// of help, an optional action on the right, then the fields.
defineProps<{ title: string; description?: string }>()
</script>

<template>
  <section class="dash-card">
    <div class="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
      <div class="min-w-0">
        <AppText size="16" weight="semibold">{{ title }}</AppText>
        <AppText v-if="description" size="14" color="neutral-400" class-list="mt-0.5">{{ description }}</AppText>
      </div>
      <slot name="action" />
    </div>
    <div class="p-5">
      <slot />
    </div>
  </section>
</template>
