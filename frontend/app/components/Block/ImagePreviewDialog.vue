<script setup lang="ts">
import { formatFileSize } from '~/lib/files'
import type { PreviewFile } from '~/common/types/file-types'

// Images open here (after visa-advisers-uae-dashboard's ImagePreviewDialog);
// every other file type opens in a new tab instead.
defineProps<{ file: PreviewFile | null; downloading?: boolean }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ download: [] }>()
</script>

<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="flex max-h-[92dvh] w-fit max-w-[92vw] flex-col gap-3 p-4 sm:max-w-[min(92vw,1100px)] sm:p-5">
      <template v-if="file">
        <UiDialogHeader class="min-w-0 pe-8 text-start">
          <UiDialogTitle class="truncate text-[16px]">{{ file.name }}</UiDialogTitle>
          <UiDialogDescription class="text-[14px]">{{ formatFileSize(file.size) }}</UiDialogDescription>
        </UiDialogHeader>
        <!-- Plain <img> on purpose: AppImage goes through Nuxt Image/IPX, which has no
             provider for user-uploaded R2 files and throws while rendering. -->
        <img :src="file.url" :alt="file.name"
          class="block max-h-[72dvh] min-w-60 max-w-full rounded-lg bg-surface-raised object-contain">
        <div class="flex justify-end">
          <AppButton variant="secondary" size="36" radius="8" icon="DocumentDownload" text="Download"
            :icon-config="{ color: 'currentColor', size: 16 }" class-list="text-[14px] px-3.5" :loading="downloading"
            @click="emit('download')" />
        </div>
      </template>
    </UiDialogContent>
  </UiDialog>
</template>
