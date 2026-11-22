<script setup lang="ts">

definePageMeta({ layout: 'dashboard', requiresAuth: true, learnerOnly: true, collapseSidebar: true })

const {
  threadRef,
  composerRef,
  input,
  search,
  thinking,
  sending,
  ending,
  creating,
  refreshing,
  sessions,
  activeSessionId,
  activeSession,
  messages,
  userInitial,
  plan,
  limits,
  subActive,
  userMessageCount,
  cefrLabel,
  accuracyLabel,
  isSessionEnded,
  hardCapReached,
  composerDisabled,
  dailyLimitReached,
  sessionEvaluation,
  activeTitle,
  pinnedList,
  todayList,
  earlierList,
  sessionTimer,
  renameSession,
  togglePin,
  removeSession,
  needsVerification,
  newSession,
  openSession,
  send,
  startVoice,
  reviewVoice,
  reRecordVoice,
  cancelVoice,
  endCurrent,
  refreshCurrent,
  fillSuggestion,
  isRecording,
  isReviewing,
  isTranscribing,
  micDisabled,
  canSend,
  recordingClock,
  reviewUrl,
  reviewSeconds,
  partialTranscript,
  audioStream,
} = useChatPage()

// Mobile-only: below `md` the sessions list lives in a drawer.
const sessionsOpen = ref(false)
// Desktop: the sessions panel can slide away to give the thread the room.
const sessionsPanelOpen = useCookie<boolean>('chat-sessions-open', { default: () => true })
</script>

<template>
  <div class="flex h-full overflow-hidden animate-card-enter" style="--delay:0ms">

    <!-- Sessions rail — desktop only (fixed width, self-scrolling) -->
    <PagesDashboardChatSessionsSidebar
      v-model:open="sessionsPanelOpen"
      :sessions="sessions"
      :pinned-list="pinnedList"
      :today-list="todayList"
      :earlier-list="earlierList"
      :creating="creating"
      :search="search"
      :daily-limit-reached="dailyLimitReached"
      @new-session="newSession"
      @open-session="openSession"
      @rename-session="renameSession"
      @pin-session="togglePin"
      @delete-session="removeSession"
      @update:search="search = $event"
    />

    <!-- Same list as a drawer on phones -->
    <PagesDashboardChatSessionsDrawer
      v-model:open="sessionsOpen"
      :sessions="sessions"
      :pinned-list="pinnedList"
      :today-list="todayList"
      :earlier-list="earlierList"
      :creating="creating"
      :search="search"
      :daily-limit-reached="dailyLimitReached"
      @new-session="newSession"
      @open-session="openSession"
      @rename-session="renameSession"
      @pin-session="togglePin"
      @delete-session="removeSession"
      @update:search="search = $event"
    />

    <!-- Main thread (fills remaining space, column flex) -->
    <div class="flex-1 flex flex-col min-w-0 overflow-hidden bg-surface-card">

      <!-- Thread header (fixed height, never scrolls) -->
      <PagesDashboardChatThreadHeader
        :title="activeTitle"
        :cefr-label="cefrLabel"
        :is-session-ended="isSessionEnded"
        :active-session-id="activeSessionId"
        :ending="ending"
        :refreshing="refreshing"
        :session-timer="sessionTimer"
        :sessions-hidden="!sessionsPanelOpen"
        @show-sessions="sessionsPanelOpen = true"
        @refresh="refreshCurrent"
        @end="endCurrent"
        @open-sessions="sessionsOpen = true"
      />

      <!-- Message thread (scrollable, grows to fill) -->
      <PagesDashboardChatMessageThread
        ref="threadRef"
        :messages="messages"
        :thinking="thinking"
        :sub-active="subActive"
        :needs-verification="needsVerification"
        :active-session="activeSession"
        :user-initial="userInitial"
        @fill-suggestion="fillSuggestion"
      />

      <!-- An ended session gets a summary + restart, not a dead input box -->
      <PagesDashboardChatSessionEndedPanel
        v-if="isSessionEnded"
        :evaluation="sessionEvaluation"
        :creating="creating"
        :daily-limit-reached="dailyLimitReached"
        @new-session="newSession"
      />

      <!-- Composer (fixed at bottom, never scrolls) -->
      <PagesDashboardChatComposer
        v-else
        ref="composerRef"
        v-model="input"
        :sending="sending"
        :composer-disabled="composerDisabled"
        :is-session-ended="isSessionEnded"
        :hard-cap-reached="hardCapReached"
        :sub-active="subActive"
        :active-session-id="activeSessionId"
        :cefr-label="cefrLabel"
        :plan="plan"
        :user-message-count="userMessageCount"
        :messages-per-session-hard="limits.messagesPerSessionHard"
        :accuracy-label="accuracyLabel"
        :needs-verification="needsVerification"
        :is-recording="isRecording"
        :is-reviewing="isReviewing"
        :is-transcribing="isTranscribing"
        :mic-disabled="micDisabled"
        :can-send="canSend"
        :recording-clock="recordingClock"
        :review-url="reviewUrl"
        :review-seconds="reviewSeconds"
        :partial-transcript="partialTranscript"
        :audio-stream="audioStream"
        @send="send"
        @record="startVoice"
        @stop="reviewVoice"
        @re-record="reRecordVoice"
        @discard="cancelVoice"
      />
    </div>
  </div>
</template>
