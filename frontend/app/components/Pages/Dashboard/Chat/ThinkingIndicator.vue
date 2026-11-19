<template>
  <!-- Same row shape as a tutor reply, so the answer lands exactly where this was -->
  <div class="flex items-center gap-3 animate-card-enter" style="--delay:0ms" role="status">
    <AppImage src="/only-logo-black-border-yellow-bg.svg" alt="" width="28" height="28" class="size-7 shrink-0" aria-hidden="true" />
    <div class="flex items-center gap-1" aria-hidden="true">
      <span class="size-1.5 rounded-full bg-text-subtle animate-bounce" />
      <span class="size-1.5 rounded-full bg-text-subtle animate-bounce [animation-delay:120ms]" />
      <span class="size-1.5 rounded-full bg-text-subtle animate-bounce [animation-delay:240ms]" />
    </div>
    <span class="shimmer-text text-[14px] text-text-muted font-poppins">Thinking…</span>
  </div>
</template>
