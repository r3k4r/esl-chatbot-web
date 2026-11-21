<script setup lang="ts">
// A short list of people in its own card (newest accounts, gone quiet, most active).
// Every name opens the user's page.
import type { AdminPeopleRow as PeopleRow } from '~/common/types/admin-types'

defineProps<{ title: string; rows: PeopleRow[]; empty: string; total?: number; hint?: string }>()
</script>

<template>
  <section class="dash-card flex flex-col p-5">
    <div class="flex items-baseline justify-between gap-2">
      <AppText size="16" weight="semibold">{{ title }}</AppText>
      <AppLink v-if="total && total > rows.length" to="/dashboard/users" class="text-[14px] tabular-nums text-text-muted hover:text-text-heading">
        {{ rows.length }} of {{ total }}
      </AppLink>
    </div>
    <AppText v-if="hint" size="13" color="neutral-400" class-list="mt-0.5">{{ hint }}</AppText>

    <ul v-if="rows.length" class="mt-2 divide-y divide-border-inner">
      <li v-for="r in rows" :key="r.id">
        <AppLink :to="`/dashboard/users/${r.id}`" class="-mx-2 flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-raised">
          <UiAvatar class="size-8 shrink-0 rounded-full">
            <UiAvatarFallback class="bg-surface-well text-[13px] font-semibold text-text-heading">{{ r.name.charAt(0).toUpperCase() }}</UiAvatarFallback>
          </UiAvatar>
          <div class="min-w-0 flex-1">
            <AppText size="14" weight="medium" class-list="truncate">{{ r.name }}</AppText>
            <AppText size="13" color="neutral-400" class-list="truncate tabular-nums">{{ r.meta }}</AppText>
          </div>
          <span v-if="r.badge" :class="['shrink-0 rounded-md px-1.5 py-0.5 text-[12px] font-semibold', r.badge.class]" :style="r.badge.style">{{ r.badge.text }}</span>
        </AppLink>
      </li>
    </ul>
    <AppText v-else size="14" color="neutral-400" class-list="mt-2">{{ empty }}</AppText>
  </section>
</template>
