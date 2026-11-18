<script setup lang="ts">
// The three plans side by side, so the difference is clear before choosing.
const rows = [
  { label: 'Chats a day', free: '3', gold: '15', premium: '50' },
  { label: 'Messages a chat', free: '20', gold: '100', premium: '150' },
  { label: 'AI model', free: 'Lite', gold: 'Flash', premium: 'GPT-5' },
  { label: 'Voice replies', free: '–', gold: 'Azure', premium: 'HD' },
  { label: 'Vocabulary review', free: 'Basic', gold: 'Full', premium: 'Full' },
  { label: 'Progress analytics', free: 'Basic', gold: 'Full', premium: 'Full' },
]
</script>

<template>
  <section aria-labelledby="plan-compare" class="dash-card overflow-hidden">
    <AppText id="plan-compare" size="16" weight="semibold" class-list="px-5 pt-5">Compare plans</AppText>
    <table class="mt-3 w-full text-[14px]">
      <thead>
        <tr class="border-b border-border-inner">
          <th class="px-5 py-2 text-start font-medium text-text-muted"><span class="sr-only">Feature</span></th>
          <th class="px-2 py-2 text-center font-semibold text-text-muted">Free</th>
          <th class="px-2 py-2 text-center font-semibold" style="color:#f59e0b">Gold</th>
          <th class="px-5 py-2 text-center font-semibold text-brand-primary">Premium</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-border-inner">
        <tr v-for="r in rows" :key="r.label">
          <td class="px-5 py-2.5 text-text-body">{{ r.label }}</td>
          <td class="px-2 py-2.5 text-center tabular-nums text-text-muted">{{ r.free }}</td>
          <td class="px-2 py-2.5 text-center font-medium tabular-nums text-text-heading">{{ r.gold }}</td>
          <td class="px-5 py-2.5 text-center font-medium tabular-nums text-text-heading">{{ r.premium }}</td>
        </tr>
      </tbody>
    </table>
  </section>
</template>
