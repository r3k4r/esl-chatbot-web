<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'

const props = defineProps<{
  modelValue: string
  sending: boolean
  composerDisabled: boolean
  isSessionEnded: boolean
  hardCapReached: boolean
  subActive: boolean
  activeSessionId: string | null
  cefrLabel: string
  plan: string
  userMessageCount: number
  messagesPerSessionHard: number
  accuracyLabel: string
  // voice
  isRecording: boolean
  isTranscribing: boolean
  micDisabled: boolean
  canSend: boolean
  recordingClock: string
  partialTranscript: string
  audioStream: MediaStream | null
}>()

const emit = defineEmits<{
  'update:modelValue': [val: string]
  'send': []
  'record': []
  'discard': []
  'attach': []
}>()

const placeholder = computed(() => {
  if (!props.subActive) return 'Subscribe to chat with Tutelage AI…'
  if (props.isSessionEnded) return 'Session ended — start a new one.'
  if (props.hardCapReached) return 'Session message limit reached.'
  if (!props.activeSessionId) return 'Type a message to start chatting with Tutelage AI…'
  return 'Ask anything in English, or just say hi.'
})

const inputDisabled = computed(
  () => props.composerDisabled || props.isRecording || props.isTranscribing,
)

// Messages remaining, so the counter reads as a budget rather than a raw tally.
const messagesLeft = computed(() =>
  Math.max(0, props.messagesPerSessionHard - props.userMessageCount),
)

// AppButton declares a `disabled` prop but never binds it to the element (it
// only binds `loading`), so the disabled *look* has to come from the call site.
// Logged in frontend/TASKS.md next to the related `:to` bug — fixing the shared
// component would silently change every `:disabled` button in the app.
// `gap-2` spaces the icon from the slotted label — AppButton only adds a margin
// when the label comes through its `text` prop, and ours is a slot so it can
// collapse to icon-only on narrow screens.
const sendClass = computed(
  () => `shrink-0 gap-2 px-3 sm:px-4${props.canSend ? '' : ' opacity-50 pointer-events-none'}`,
)
// The mic stays clickable while unavailable on purpose — startVoice() answers
// with a toast explaining why, which beats a dead button.
const micClass = computed(() => `shrink-0${props.micDisabled ? ' opacity-50' : ''}`)

const taRef = ref<ComponentPublicInstance | null>(null)
function focus() {
  (taRef.value?.$el as HTMLTextAreaElement | undefined)?.focus()
}
defineExpose({ focus })

function onKeydown(e: KeyboardEvent) {
  // Enter sends; Shift+Enter is a newline. On touch keyboards Enter is usually
  // a newline key, so the Send button stays the primary path there.
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    emit('send')
  }
}
</script>

<template>
  <div class="border-t p-3 sm:p-4 shrink-0" style="border-color:var(--border-inner)">
    <div class="max-w-3xl mx-auto">
      <PagesDashboardChatVoiceRecordingBar
        v-if="isRecording"
        :stream="audioStream"
        :clock="recordingClock"
        :partial-transcript="partialTranscript"
        @discard="emit('discard')"
      />

      <div
        v-else-if="isTranscribing"
        class="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl border bg-surface-raised border-border-inner"
      >
        <AppIconsax name="Microphone2" color="var(--color-text-muted)" :size="15" />
        <AppText size="13" color="neutral-400">Transcribing your recording…</AppText>
      </div>

      <div class="dash-card p-2 sm:p-2.5 flex items-end gap-1.5 sm:gap-2">
        <AppButton
          variant="ghost"
          size="36"
          radius="8"
          aspect="square"
          icon="Paperclip"
          :icon-config="{ color: 'var(--color-text-subtle)', size: 16 }"
          class-list="hidden sm:flex shrink-0"
          aria-label="Attach a file"
          @click="emit('attach')"
        />

        <UiTextarea
          ref="taRef"
          :model-value="modelValue"
          rows="1"
          :placeholder="placeholder"
          :disabled="inputDisabled"
          class="flex-1 min-h-9 max-h-32 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 px-1 py-2 text-[14px]! font-poppins disabled:cursor-not-allowed disabled:opacity-60"
          style="color:var(--text-heading)"
          @update:model-value="emit('update:modelValue', String($event))"
          @keydown="onKeydown"
        />

        <AppButton
          v-if="!isRecording"
          variant="ghost"
          size="36"
          radius="8"
          aspect="square"
          icon="Microphone"
          :icon-config="{ color: 'var(--color-text-body)', size: 18 }"
          :class-list="micClass"
          aria-label="Record a voice message"
          @click="emit('record')"
        />

        <AppButton
          variant="primary"
          size="36"
          radius="8"
          icon="Send"
          :icon-config="{ color: 'white', size: 16 }"
          :loading="sending"
          :class-list="sendClass"
          :aria-label="isRecording ? 'Send voice message' : 'Send message'"
          @click="emit('send')"
        >
          <span class="hidden sm:inline text-[14px]">{{ sending ? 'Sending…' : 'Send' }}</span>
        </AppButton>
      </div>

      <div class="flex items-center justify-between gap-3 mt-2 px-1">
        <AppText size="12" color="neutral-400" class-list="truncate">
          Level: {{ cefrLabel }} · {{ plan }}
        </AppText>
        <AppText size="12" color="neutral-400" font-family="mono" class-list="shrink-0">
          <span class="hidden sm:inline">{{ accuracyLabel }} accuracy · </span>{{ messagesLeft }} left
        </AppText>
      </div>
    </div>
  </div>
</template>
