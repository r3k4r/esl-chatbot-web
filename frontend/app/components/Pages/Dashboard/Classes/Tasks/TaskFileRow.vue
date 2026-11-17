<script setup lang="ts">
import { fileIcon, fileTypeLabel, formatFileSize, isImageFile } from '~/lib/files'
import AppButton from '~/components/App/Button.vue'
import AppLink from '~/components/App/Link.vue'

// One attachment, Classroom style. Images show a thumbnail and open in the in-app viewer;
// other files open in a new tab. Download is always visible; Remove sits in the 3-dot menu.
// A draft (not uploaded yet) only offers a remove button.
const props = defineProps<{
  name: string
  mimeType: string
  size: number
  url?: string
  draft?: boolean
  removable?: boolean
}>()

const emit = defineEmits<{ open: []; download: []; remove: [] }>()

const image = computed(() => isImageFile(props.mimeType))
const meta = computed(() => `${fileTypeLabel(props.name)} · ${formatFileSize(props.size)}`)

// The clickable body: a button for images (viewer), a new-tab link for the rest.
const body = computed(() => {
  if (props.draft || !props.url) return { is: 'div', attrs: {} }
  if (image.value) {
    return {
      is: AppButton,
      attrs: { variant: 'ghost', size: 'auto', radius: '8', 'aria-label': `View ${props.name}`, 'class-list': 'h-auto min-w-0 flex-1 justify-start p-0 hover:bg-transparent active:bg-transparent' },
    }
  }
  return { is: AppLink, attrs: { to: props.url, target: '_blank', rel: 'noopener noreferrer', 'aria-label': `Open ${props.name} in a new tab` } }
})

function onBodyClick() {
  if (!props.draft && image.value) emit('open')
}
</script>

<template>
  <div class="group flex min-w-0 items-center gap-1 rounded-xl border border-border-card bg-surface-card p-1.5 pe-1 transition-colors duration-150 hover:border-text-subtle/40 hover:bg-surface-raised">
    <component :is="body.is" v-bind="body.attrs" class="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none"
      @click="onBodyClick">
      <!-- Plain <img>: user-uploaded R2 files can't go through AppImage/IPX. -->
      <img v-if="image && url" :src="url" alt="" loading="lazy"
        class="size-11 shrink-0 rounded-lg bg-surface-well object-cover">
      <span v-else class="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface-well">
        <AppIconsax :name="fileIcon(mimeType)" color="var(--color-text-muted)" :size="20" />
      </span>
      <span class="min-w-0 text-start">
        <AppText size="14" weight="medium" class-list="truncate">{{ name }}</AppText>
        <AppText size="13" color="neutral-400" class-list="font-normal">{{ meta }}</AppText>
      </span>
    </component>

    <AppButton v-if="draft" variant="ghost" size="32" radius="8" aspect="square" icon="CloseCircle"
      :icon-config="{ color: 'var(--color-text-subtle)', size: 18 }" :aria-label="`Remove ${name}`"
      @click="emit('remove')" />

    <template v-else>
      <AppButton variant="ghost" size="32" radius="8" aspect="square" icon="DocumentDownload"
        :icon-config="{ color: 'var(--color-text-muted)', size: 18 }" :aria-label="`Download ${name}`"
        title="Download" @click="emit('download')" />
      <UiDropdownMenu v-if="removable">
        <UiDropdownMenuTrigger as-child>
          <AppButton variant="ghost" size="32" radius="8" aspect="square" icon="More"
            :icon-config="{ color: 'var(--color-text-muted)', size: 18 }" :aria-label="`Options for ${name}`" />
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent align="end" class="w-40">
          <UiDropdownMenuItem variant="destructive" class="gap-2.5 cursor-pointer text-[14px]" @select="emit('remove')">
            <AppIconsax name="Trash" color="currentColor" :size="16" />
            Remove
          </UiDropdownMenuItem>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
    </template>
  </div>
</template>
