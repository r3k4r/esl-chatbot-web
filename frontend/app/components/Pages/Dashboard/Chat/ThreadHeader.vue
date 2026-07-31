<script setup lang="ts">
const props = defineProps<{
  topic: string | null | undefined
  cefrLabel: string
  isSessionEnded: boolean
  activeSessionId: string | null
  ending: boolean
  refreshing?: boolean
  sessionTimer?: string
}>()

const emit = defineEmits<{
  'refresh': []
  'end': []
  'open-sessions': []
}>()

const confirmEnd = ref(false)

// AppButton never binds its `disabled` prop to the element (see Composer.vue),
// so the dimmed look is applied here.
const actionsDisabled = computed(() => !props.activeSessionId)
const refreshClass = computed(
  () => `shrink-0${actionsDisabled.value || props.refreshing ? ' opacity-50 pointer-events-none' : ''}`,
)
// `gap-2` spaces the icon from the slotted label (AppButton only adds a margin
// for labels passed via its `text` prop, and ours collapses on narrow screens).
const endClass = computed(
  () => `gap-2 px-2.5 sm:px-4${actionsDisabled.value || props.ending ? ' opacity-50 pointer-events-none' : ''}`,
)

function doEnd() {
  confirmEnd.value = false
  emit('end')
}
</script>

<template>
  <div
    class="h-14 border-b flex items-center justify-between gap-2 px-3 sm:px-5 shrink-0"
    style="border-color:var(--border-inner)"
  >
    <div class="flex items-center gap-2 sm:gap-2.5 min-w-0">
      <!-- Mobile: opens the sessions drawer (no rail below md) -->
      <AppButton
        variant="ghost"
        size="36"
        radius="8"
        aspect="square"
        icon="Messages"
        :icon-config="{ color: 'var(--color-text-body)', size: 18 }"
        class-list="md:hidden shrink-0"
        aria-label="Show sessions"
        @click="emit('open-sessions')"
      />

      <div class="relative shrink-0">
        <div
          class="w-9 h-9 rounded-full bg-linear-to-br from-brand-primary to-brand-accent flex items-center justify-center"
        >
          <AppIconsax name="Candle" color="#000" :size="16" />
        </div>
        <span
          :class="[
            'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-surface-page',
            isSessionEnded ? 'bg-zinc-400' : 'bg-emerald-400',
          ]"
        />
      </div>

      <div class="leading-tight min-w-0">
        <AppText size="14" weight="semibold" class-list="truncate">Tutelage · AI Tutor</AppText>
        <AppText size="12" color="neutral-400" class-list="truncate">
          {{ topic || 'Open conversation' }}
          <span class="hidden sm:inline"> · {{ cefrLabel }}</span>
          <template v-if="activeSessionId">
            · {{ isSessionEnded ? 'Ended' : sessionTimer }}
          </template>
        </AppText>
      </div>
    </div>

    <div class="flex items-center gap-1.5 shrink-0">
      <AppButton
        variant="outline"
        size="36"
        radius="8"
        aspect="square"
        :class-list="refreshClass"
        aria-label="Refresh session"
        @click="emit('refresh')"
      >
        <AppIconsax
          name="Refresh"
          color="currentColor"
          :size="16"
          :class="refreshing ? 'animate-spin' : ''"
        />
      </AppButton>

      <AppButton
        v-if="!isSessionEnded"
        variant="outline"
        size="36"
        radius="8"
        :loading="ending"
        icon="CloseCircle"
        :icon-config="{ color: 'currentColor', size: 16 }"
        :class-list="endClass"
        @click="confirmEnd = true"
      >
        <span class="hidden sm:inline text-[14px]">End session</span>
      </AppButton>
    </div>

    <UiAlertDialog v-model:open="confirmEnd">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>End this session?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            Ending scores the conversation and writes your progress report. You can read it
            afterwards, but you can't send any more messages in this session.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Keep chatting</UiAlertDialogCancel>
          <UiAlertDialogAction @click="doEnd">End session</UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>
  </div>
</template>
