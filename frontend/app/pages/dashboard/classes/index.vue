<script setup lang="ts">
definePageMeta({ layout: 'dashboard', requiresAuth: true })
useSeo({ title: 'Classes', noindex: true })

const { isAdmin, isTutor } = useRole()
</script>

<template>
  <PagesDashboardClassesAdminClassesView v-if="isAdmin" />
  <PagesDashboardClassesTutorClassesView v-else-if="isTutor" />
  <PagesDashboardClassesStudentClassesView v-else />
</template>
