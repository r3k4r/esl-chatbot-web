<script setup lang="ts">
import { toast } from 'vue-sonner'

// Student-only "Leave class" in the class header: confirm, leave, go back to the class list.
const props = defineProps<{ classId: string; className: string; userId: string }>()

const { removeMember } = useClasses()
const open = ref(false)
const leaving = ref(false)

async function leave() {
  leaving.value = true
  const res = await removeMember(props.classId, props.userId)
  leaving.value = false
  if (!res.success) { toast.error(res.message || 'Could not leave the class'); return }
  toast.success(`You left ${props.className}.`)
  await navigateTo('/dashboard/classes', { replace: true })
}
</script>

<template>
  <AppButton variant="secondary" size="36" radius="8" icon="Logout" text="Leave class"
    :icon-config="{ color: 'currentColor', size: 16 }" class-list="shrink-0 text-[14px]" :loading="leaving"
    @click="open = true" />

  <UiAlertDialog v-model:open="open">
    <UiAlertDialogContent>
      <UiAlertDialogHeader>
        <UiAlertDialogTitle>Leave {{ className }}?</UiAlertDialogTitle>
        <UiAlertDialogDescription>
          You lose access to its tasks, comments and announcements right away. Your own work is kept,
          and you can rejoin later with the class code.
        </UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel>Stay</UiAlertDialogCancel>
        <UiAlertDialogAction class="bg-destructive text-white hover:bg-destructive/90" @click="leave">
          Leave class
        </UiAlertDialogAction>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>
