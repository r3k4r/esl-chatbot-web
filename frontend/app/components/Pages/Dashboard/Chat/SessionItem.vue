<script setup lang="ts">
import type { ChatSession } from '~/common/types/dashboard-types'
defineProps<{ session: ChatSession }>()
</script>

<template>
  <AppButton
    variant="ghost"
    size="auto"
    radius="8"
    :active="session.active"
    active-class-list="bg-brand-primary/10"
    class-list="w-full items-start gap-2.5 px-2.5 py-2 justify-start h-auto text-left"
  >
    <div
      class="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 mt-0.5"
      style="background:var(--surface-raised);border-color:var(--border-inner)"
    >
      <AppIconsax
        name="Messages"
        :color="session.active ? 'var(--color-brand-primary)' : 'var(--color-text-muted)'"
        :size="14"
      />
    </div>

    <div class="flex-1 min-w-0">
      <div class="flex items-center justify-between gap-2">
        <AppText
          size="14"
          weight="medium"
          :color="session.active ? 'brand-primary' : 'black'"
          class-list="truncate"
        >
          {{ session.title }}
        </AppText>
        <AppText size="12" color="neutral-400" font-family="mono" class-list="shrink-0">
          {{ session.when }}
        </AppText>
      </div>
      <AppText size="13" color="neutral-400" class-list="truncate mt-0.5">
        {{ session.preview }}
      </AppText>
    </div>
  </AppButton>
</template>
