<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
// Iconsax has no pin glyph, so this one comes from lucide (already a dependency).
import { Pin, PinOff } from 'lucide-vue-next'
import type { ChatSession } from '~/common/types/dashboard-types'

const props = defineProps<{ session: ChatSession }>()
const emit = defineEmits<{
  open: []
  rename: [title: string]
  pin: []
  delete: []
}>()

// ── Rename, in place: Enter or leaving the box saves, Escape cancels ──────────
const renaming = ref(false)
const draft = ref('')
const inputRef = ref<ComponentPublicInstance | null>(null)

function startRename() {
  draft.value = props.session.title
  renaming.value = true
  // After the menu has closed and handed focus back, or it steals it again.
  setTimeout(() => {
    const el = inputRef.value?.$el as HTMLInputElement | undefined
    el?.focus()
    el?.select()
  }, 50)
}

function finishRename(save: boolean) {
  if (!renaming.value) return
  renaming.value = false
  if (save) emit('rename', draft.value)
}
</script>

<template>
  <div
    :class="[
      'group relative flex items-center rounded-lg transition-colors duration-150',
      session.active ? 'bg-surface-well' : 'hover:bg-surface-raised',
    ]"
  >
    <UiInput
      v-if="renaming"
      ref="inputRef"
      v-model="draft"
      maxlength="60"
      aria-label="Chat name"
      class="m-1 h-9 text-[14px]"
      @keydown.enter.prevent="finishRename(true)"
      @keydown.esc.prevent="finishRename(false)"
      @blur="finishRename(true)"
    />

    <template v-else>
      <AppButton
        variant="ghost"
        size="auto"
        radius="8"
        :aria-current="session.active ? 'true' : undefined"
        class-list="min-w-0 flex-1 flex-col items-stretch gap-0.5 py-2 ps-2.5 pe-1 h-auto text-left hover:bg-transparent active:bg-transparent"
        @click="emit('open')"
        @dblclick="startRename"
      >
        <span class="flex items-center gap-1.5">
          <Pin v-if="session.pinned" class="size-4 shrink-0 text-brand-primary" aria-label="Pinned" />
          <AppText size="14" weight="medium" class-list="min-w-0 truncate">{{ session.title }}</AppText>
        </span>
        <AppText size="13" color="neutral-400" class-list="truncate font-normal">
          {{ session.when }} · {{ session.preview }}
        </AppText>
      </AppButton>

      <UiDropdownMenu>
        <UiDropdownMenuTrigger as-child>
          <AppButton variant="ghost" size="32" radius="8" aspect="square" icon="More"
            :icon-config="{ color: 'var(--color-text-muted)', size: 18 }"
            class-list="me-1 shrink-0 hover:bg-surface-well" :aria-label="`Options for ${session.title}`" />
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent align="start" class="w-44">
          <UiDropdownMenuItem class="gap-2.5 cursor-pointer text-[14px]" @select="emit('pin')">
            <component :is="session.pinned ? PinOff : Pin" class="size-4" />
            {{ session.pinned ? 'Unpin' : 'Pin to top' }}
          </UiDropdownMenuItem>
          <UiDropdownMenuItem class="gap-2.5 cursor-pointer text-[14px]" @select="startRename">
            <AppIconsax name="Edit2" color="currentColor" :size="16" />
            Rename
          </UiDropdownMenuItem>
          <UiDropdownMenuSeparator />
          <UiDropdownMenuItem variant="destructive" class="gap-2.5 cursor-pointer text-[14px]" @select="emit('delete')">
            <AppIconsax name="Trash" color="currentColor" :size="16" />
            Delete
          </UiDropdownMenuItem>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
    </template>
  </div>
</template>
