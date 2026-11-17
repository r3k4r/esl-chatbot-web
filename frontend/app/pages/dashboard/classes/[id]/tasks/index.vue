<script setup lang="ts">
// The "Tasks" breadcrumb on a task page points here; tasks live in the class page's tab.
definePageMeta({
  layout: 'dashboard',
  requiresAuth: true,
  redirect: to => `/dashboard/classes/${to.params.id}?tab=tasks`,
})
</script>

<template>
  <div />
</template>
