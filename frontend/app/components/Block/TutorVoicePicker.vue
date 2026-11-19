<script setup lang="ts">
import { TUTOR_ACCENTS, TUTOR_VOICES, tutorVoiceLabel } from '~/common/data/tutor-voice'
import type { TutorAccent, TutorVoiceGender } from '~/common/types/profile-types'

// "American · Female" button → choose the accent and the voice. Saves on pick; the next
// spoken reply (chat) or the next call (Voice Lab) uses it. Same setting as Learning settings.
// `inline` = an icon-only button for inside the chat composer, the same size as the mic.
defineProps<{ disabled?: boolean; disabledHint?: string; inline?: boolean }>()
const { voice, saving, load, save } = useTutorVoice()
onMounted(load)
</script>

<template>
  <UiDropdownMenu>
    <UiDropdownMenuTrigger as-child :disabled="disabled">
      <AppButton
        :variant="inline ? 'ghost' : 'secondary'"
        size="36"
        radius="8"
        icon="VoiceSquare"
        :icon-config="{ color: inline ? 'currentColor' : 'var(--color-brand-primary)', size: 18 }"
        :loading="saving"
        :disabled="disabled"
        :aspect="inline ? 'square' : undefined"
        :title="disabled ? disabledHint : `Tutor voice: ${tutorVoiceLabel(voice)}`"
        :aria-label="`Tutor voice: ${tutorVoiceLabel(voice)}`"
        :class-list="inline ? 'shrink-0 text-text-body' : 'shrink-0 gap-2 px-2.5 sm:px-3 text-text-heading'"
      >
        <span v-if="!inline" class="hidden sm:inline text-[14px] font-medium">{{ tutorVoiceLabel(voice) }}</span>
      </AppButton>
    </UiDropdownMenuTrigger>
    <UiDropdownMenuContent :side="inline ? 'top' : 'bottom'" align="end" class="w-60">
      <!-- Icon-only in the composer, so the menu says what is chosen -->
      <UiDropdownMenuLabel v-if="inline" class="text-[14px] font-semibold text-text-heading">
        Tutor voice · {{ tutorVoiceLabel(voice) }}
      </UiDropdownMenuLabel>
      <UiDropdownMenuSeparator v-if="inline" />
      <UiDropdownMenuLabel class="text-[13px] text-text-muted">Accent</UiDropdownMenuLabel>
      <UiDropdownMenuRadioGroup
        :model-value="voice.accent"
        @update:model-value="save({ accent: $event as TutorAccent })"
      >
        <UiDropdownMenuRadioItem v-for="a in TUTOR_ACCENTS" :key="a.value" :value="a.value" class="cursor-pointer py-2">
          <span class="flex flex-col">
            <span class="text-[14px] text-text-heading">{{ a.label }}</span>
            <span class="text-[13px] text-text-muted">{{ a.hint }}</span>
          </span>
        </UiDropdownMenuRadioItem>
      </UiDropdownMenuRadioGroup>
      <UiDropdownMenuSeparator />
      <UiDropdownMenuLabel class="text-[13px] text-text-muted">Voice</UiDropdownMenuLabel>
      <UiDropdownMenuRadioGroup
        :model-value="voice.gender"
        @update:model-value="save({ gender: $event as TutorVoiceGender })"
      >
        <UiDropdownMenuRadioItem v-for="g in TUTOR_VOICES" :key="g.value" :value="g.value" class="cursor-pointer text-[14px]">
          {{ g.label }}
        </UiDropdownMenuRadioItem>
      </UiDropdownMenuRadioGroup>
    </UiDropdownMenuContent>
  </UiDropdownMenu>
</template>
