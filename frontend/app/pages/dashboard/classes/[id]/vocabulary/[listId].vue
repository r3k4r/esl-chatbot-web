<script setup lang="ts">
import WordListForm from '~/components/Pages/Dashboard/Classes/Vocabulary/WordListForm.vue'

definePageMeta({ layout: 'dashboard', requiresAuth: true })
const route = useRoute()
</script>

<template>
  <div class="h-full overflow-y-auto page-padding pb-0">
    <WordListForm :class-id="(route.params.id as string)" :list-id="(route.params.listId as string)" />
  </div>
</template>
