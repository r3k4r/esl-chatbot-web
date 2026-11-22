<script setup lang="ts">
const props = defineProps<{
  open: boolean
  loading: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  join: [code: string]
}>()

const code = ref('')
const error = ref('')

watch(() => props.open, (v) => {
  if (v) { code.value = ''; error.value = '' }
})

function onInput(val: string | number | readonly string[]) {
  code.value = String(val).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
  error.value = ''
}

function submit() {
  if (code.value.length < 6) { error.value = 'Class codes are at least 6 characters.'; return }
  emit('join', code.value)
}
</script>

<template>
  <UiDialog :open="open" @update:open="emit('update:open', $event)">
    <UiDialogContent class="p-0 gap-0 overflow-hidden">
      <UiDialogHeader class="p-6 pb-4">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1">
            <UiDialogTitle>Join a class</UiDialogTitle>
            <UiDialogDescription>Enter the code your teacher shared with you.</UiDialogDescription>
          </div>
        </div>
      </UiDialogHeader>

      <div class="px-6 pb-4">
        <FormInput
          id="class-code"
          v-model="code"
          label="Class code"
          placeholder="e.g. XK7A9PQ2"
          accept-only="alphanumeric"
          :error="error"
          @update:model-value="onInput"
          @keydown.enter="submit"
        />
      </div>

      <UiDialogFooter class="p-6 pt-0 flex gap-2">
        <UiDialogClose as-child>
          <AppButton variant="secondary" size="40" radius="8" text="Cancel" class="flex-1" />
        </UiDialogClose>
        <AppButton
          variant="primary"
          size="40"
          radius="8"
          icon="Login"
          :icon-config="{ color: 'white' }"
          text="Join class"
          class="flex-1"
          :loading="loading"
          :disabled="code.length < 6 || loading"
          @click="submit"
        />
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
