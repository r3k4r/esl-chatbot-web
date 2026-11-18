<script setup lang="ts">
// The "Students" breadcrumb on a student page points here; students live in the class's People tab.
definePageMeta({
  layout: 'dashboard',
  requiresAuth: true,
  redirect: to => `/dashboard/classes/${to.params.id}?tab=people`,
})
</script>

<template>
  <div />
</template>
