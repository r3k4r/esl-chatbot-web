<script setup lang="ts">
// The "Vocabulary" breadcrumb on the Assign words page points here; lists live in the class page's tab.
definePageMeta({
  layout: 'dashboard',
  requiresAuth: true,
  redirect: to => `/dashboard/classes/${to.params.id}?tab=vocabulary`,
})
</script>

<template>
  <div />
</template>
