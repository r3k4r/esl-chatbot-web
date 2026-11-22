<template>
  <div v-if="error">
    <p class="text-xs  mt-1 text-red-600">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  error?: string;
}>()

// Schemas may give an i18n key (e.g. auth.validation.emailInvalid) instead of text;
// translate those, show anything else as written.
const { t, te } = useI18n()
const message = computed(() => (props.error && te(props.error) ? t(props.error) : props.error))
</script>

<style scoped>
li::marker {
  color: #bf242a;
}
</style>
