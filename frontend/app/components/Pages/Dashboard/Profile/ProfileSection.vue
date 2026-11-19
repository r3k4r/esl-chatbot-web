<script setup lang="ts">
// One part of the profile as a card: its title and one line of what it is for, then its rows.
// Cards sit two to a row on wide screens (see pages/dashboard/profile.vue).
defineProps<{ title: string; description: string }>()
</script>

<template>
  <section class="dash-card flex flex-col">
    <div class="px-5 pt-4">
      <h2 class="font-poppins text-[16px] font-semibold text-text-heading">{{ title }}</h2>
      <AppText size="14" color="neutral-400" class-list="mt-0.5">{{ description }}</AppText>
    </div>
    <div class="flex-1 divide-y divide-border-inner px-5 pb-1">
      <slot />
    </div>
  </section>
</template>
