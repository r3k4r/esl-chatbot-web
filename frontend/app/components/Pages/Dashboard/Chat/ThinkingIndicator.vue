<template>
  <!-- Same row shape as a tutor reply, so the answer lands exactly where this was -->
  <div class="flex items-center gap-3 animate-card-enter" style="--delay:0ms" role="status">
    <div class="grid size-7 shrink-0 place-content-center rounded-lg bg-brand-primary/12" aria-hidden="true">
      <AppIconsax name="Candle" color="var(--color-brand-primary)" type="bold" :size="16" />
    </div>
    <div class="flex items-center gap-1" aria-hidden="true">
      <span class="size-1.5 rounded-full bg-text-subtle animate-bounce" />
      <span class="size-1.5 rounded-full bg-text-subtle animate-bounce [animation-delay:120ms]" />
      <span class="size-1.5 rounded-full bg-text-subtle animate-bounce [animation-delay:240ms]" />
    </div>
    <span class="shimmer-text text-[14px] text-text-muted font-poppins">Thinking…</span>
  </div>
</template>
