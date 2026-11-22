<script setup lang="ts">
// Confirm before turning off a user's sign-in: it signs them out on their next page load.
// Turning an account back on needs no confirmation.
defineProps<{ open: boolean; name: string; saving?: boolean }>()
const emit = defineEmits<{ 'update:open': [open: boolean]; confirm: [] }>()
</script>

<template>
  <UiAlertDialog :open="open" @update:open="emit('update:open', $event)">
    <UiAlertDialogContent>
      <UiAlertDialogHeader>
        <UiAlertDialogTitle>Deactivate {{ name }}?</UiAlertDialogTitle>
        <UiAlertDialogDescription>
          They'll be signed out and can't sign in until you turn their account back on.
          Their data, classes and plan are kept.
        </UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel :disabled="saving">Keep active</UiAlertDialogCancel>
        <UiAlertDialogAction
          class="bg-red-500 hover:bg-red-600 text-white"
          :disabled="saving"
          @click.prevent="emit('confirm')"
        >
          {{ saving ? 'Deactivating…' : 'Deactivate' }}
        </UiAlertDialogAction>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>
