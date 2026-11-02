<template>
  <div class="flex items-start gap-2.5 animate-card-enter" style="--delay:0ms">
    <div class="w-7 h-7 rounded-lg overflow-hidden border border-black/10 dark:border-white/10 shrink-0">
      <img src="/leo-logo.jpg" alt="LEO" class="w-full h-full object-cover" />
    </div>
    <div class="flex items-center gap-2">
      <!-- Bouncing dots -->
      <div class="flex gap-1 px-3 py-2.5 rounded-[14px] rounded-bl-sm bg-zinc-100 dark:bg-white/5">
        <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" />
        <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:120ms]" />
        <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce [animation-delay:240ms]" />
      </div>
      <span class="shimmer-text text-[11px] font-medium text-zinc-500 dark:text-zinc-400 font-poppins">LEO AI is coaching…</span>
    </div>
  </div>
</template>
