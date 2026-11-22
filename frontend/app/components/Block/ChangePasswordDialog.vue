<script setup lang="ts">
import { toast } from 'vue-sonner'
import { changePasswordSchema, type ChangePasswordValues } from '~/common/schemas/ProfileSchema'

// Change password from the avatar menu (any role). Current password + new one twice.
const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ 'update:open': [open: boolean] }>()

const { changePassword } = useProfile()

const empty = (): ChangePasswordValues => ({ currentPassword: '', newPassword: '', confirmPassword: '' })
const form = reactive<ChangePasswordValues>(empty())
const saving = ref(false)
const serverError = ref('')
// Remount the form on every open so its errors start clean.
const formKey = ref(0)

watch(() => props.open, (open) => {
  if (!open) return
  Object.assign(form, empty())
  serverError.value = ''
  formKey.value++
})

async function submit() {
  serverError.value = ''
  saving.value = true
  const res = await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
  saving.value = false
  if (!res.success) {
    serverError.value = res.message || 'Could not change your password. Please try again.'
    return
  }
  toast.success('Password changed')
  emit('update:open', false)
}
</script>

<template>
  <UiDialog :open="open" @update:open="emit('update:open', $event)">
    <UiDialogContent class="sm:max-w-md">
      <UiDialogHeader>
        <UiDialogTitle>Change password</UiDialogTitle>
        <UiDialogDescription>Enter your current password, then choose a new one.</UiDialogDescription>
      </UiDialogHeader>

      <Form :key="formKey" :schema="changePasswordSchema" :form-data="form" class="flex flex-col gap-4" novalidate @submit="submit">
        <template #default="{ errors }">
          <FormInput id="cp-current" v-model="form.currentPassword" type="password" label="Current password"
            placeholder="Your current password" autocomplete="current-password" :error="errors.currentPassword" required />
          <FormInput id="cp-new" v-model="form.newPassword" type="password" label="New password"
            placeholder="At least 8 characters" autocomplete="new-password" :error="errors.newPassword" required />
          <FormInput id="cp-confirm" v-model="form.confirmPassword" type="password" label="Confirm new password"
            placeholder="Repeat the new password" autocomplete="new-password" :error="errors.confirmPassword" required />

          <FormServerError :error="serverError" />

          <UiDialogFooter class="mt-2 flex gap-2">
            <AppButton type="button" variant="secondary" size="38" radius="8" text="Cancel" class="flex-1"
              :disabled="saving" @click="emit('update:open', false)" />
            <AppButton type="submit" variant="primary" size="38" radius="8" text="Change password" class="flex-1"
              :loading="saving" />
          </UiDialogFooter>
        </template>
      </Form>
    </UiDialogContent>
  </UiDialog>
</template>
