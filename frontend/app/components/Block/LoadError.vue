<script setup lang="ts">
/**
 * Full-width "this didn't load" state for dashboard screens: an illustration of the
 * learner's chat bubble cut off from the server, a reassuring message, the server's
 * reason (small) and one way forward — Try again.
 *
 *   <BlockLoadError v-if="error" :detail="error" :retrying="loading" @retry="fetchOverview" />
 */
withDefaults(defineProps<{
  title?: string
  description?: string
  /** The server's reason, shown small under the description. */
  detail?: string | null
  retrying?: boolean
}>(), {
  title: "We couldn't load this page",
  description: 'Your progress is safe. This is usually a brief connection problem, so give it another try in a moment.',
  detail: null,
  retrying: false,
})

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <UiEmpty
    role="alert"
    class="dash-card w-full min-h-[min(68vh,560px)] gap-7 px-6 py-14 sm:py-16"
  >
    <svg
      class="load-error-art w-56 sm:w-64 h-auto"
      viewBox="0 0 240 150"
      fill="none"
      aria-hidden="true"
    >
      <!-- ground -->
      <ellipse cx="120" cy="134" rx="96" ry="7" style="fill:var(--surface-well)" />

      <!-- learner's chat bubble -->
      <path
        d="M22 38c0-8.8 7.2-16 16-16h46c8.8 0 16 7.2 16 16v28c0 8.8-7.2 16-16 16H52l-14 13v-13h0c-8.8 0-16-7.2-16-16z"
        style="fill:var(--surface-raised);stroke:var(--border-card)"
        stroke-width="2"
      />
      <circle cx="47" cy="52" r="4" style="fill:var(--text-subtle)" />
      <circle cx="61" cy="52" r="4" style="fill:var(--text-subtle)" />
      <circle cx="75" cy="52" r="4" style="fill:var(--text-subtle)" />

      <!-- the connection, broken in the middle -->
      <path d="M102 60h20" style="stroke:var(--text-subtle)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 7" />
      <path d="M150 60h18" style="stroke:var(--text-subtle)" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="1 7" />
      <g class="load-error-spark">
        <circle cx="136" cy="60" r="13" style="fill:var(--color-brand-primary)" opacity=".14" />
        <path
          d="M139 49l-9 13h7l-3 11 10-15h-7l2-9z"
          style="fill:var(--color-brand-primary)"
        />
      </g>

      <!-- server -->
      <g style="stroke:var(--border-card)" stroke-width="2">
        <rect x="170" y="26" width="50" height="26" rx="7" style="fill:var(--surface-raised)" />
        <rect x="170" y="56" width="50" height="26" rx="7" style="fill:var(--surface-raised)" />
        <rect x="170" y="86" width="50" height="26" rx="7" style="fill:var(--surface-raised)" />
      </g>
      <g style="fill:var(--text-subtle)">
        <circle cx="182" cy="39" r="3" />
        <circle cx="182" cy="69" r="3" />
        <circle cx="182" cy="99" r="3" />
      </g>
      <g style="stroke:var(--border-inner)" stroke-width="3" stroke-linecap="round">
        <path d="M192 39h18" />
        <path d="M192 69h18" />
        <path d="M192 99h18" />
      </g>
      <path d="M195 112v14" style="stroke:var(--border-card)" stroke-width="2" />
    </svg>

    <UiEmptyContent class="max-w-md gap-3">
      <AppText size="22" weight="semibold" font-family="poppins" class-list="tracking-tight" :style="'color:var(--text-heading)'">
        {{ title }}
      </AppText>
      <AppText size="15" class-list="leading-relaxed" :style="'color:var(--text-body)'">
        {{ description }}
      </AppText>
      <AppText v-if="detail" size="14" :style="'color:var(--text-muted)'">
        Reason: {{ detail }}
      </AppText>

      <AppButton
        variant="primary"
        size="44"
        radius="8"
        icon="Refresh"
        :icon-config="{ color: 'white', size: 18 }"
        text="Try again"
        :loading="retrying"
        class-list="mt-3 px-6 text-[15px]"
        @click="emit('retry')"
      />
    </UiEmptyContent>
  </UiEmpty>
</template>

<style scoped>
/* One quiet signal: the break in the line pulses, like a connection trying again. */
.load-error-spark {
  transform-origin: 136px 60px;
  animation: load-error-pulse 2.4s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

@keyframes load-error-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.55; transform: scale(0.88); }
}

@media (prefers-reduced-motion: reduce) {
  .load-error-spark { animation: none; }
}
</style>
