<script setup lang="ts">
// Extracted from users/index.vue, which was well over the file-length rule.
//
// Every navigation goes through goTo(), which clamps to [1, totalPages]. That is
// deliberate rather than relying on `:disabled`: AppButton declares a `disabled`
// prop but never binds it to the element (see frontend/TASKS.md), so the old
// prev/next arrows stayed clickable and walked past the last page into empty
// results — the reported bug.
const props = defineProps<{
  page: number
  totalPages: number
  total: number
  limit: number
  pageSizes: number[]
}>()

const emit = defineEmits<{
  'update:page': [val: number]
  'update:limit': [val: number]
}>()

const canPrev = computed(() => props.page > 1)
const canNext = computed(() => props.page < props.totalPages)

function goTo(p: number) {
  const target = Math.min(Math.max(1, p), Math.max(1, props.totalPages))
  if (target !== props.page) emit('update:page', target)
}

// Window of page numbers: first, last, and a run around the current page.
const pageNumbers = computed<(number | '…')[]>(() => {
  const last = props.totalPages
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const cur = props.page
  const out: (number | '…')[] = [1]
  if (cur > 3) out.push('…')
  for (let i = Math.max(2, cur - 1); i <= Math.min(last - 1, cur + 1); i++) out.push(i)
  if (cur < last - 2) out.push('…')
  out.push(last)
  return out
})

const rangeLabel = computed(() => {
  if (!props.total) return 'No users'
  const from = (props.page - 1) * props.limit + 1
  const to = Math.min(props.page * props.limit, props.total)
  return `${from}–${to} of ${props.total} users`
})

const arrowClass = (enabled: boolean) => (enabled ? '' : 'opacity-40 pointer-events-none')
</script>

<template>
  <div
    class="flex items-center justify-between gap-3 px-4 py-3 flex-wrap"
    style="border-top:1px solid var(--border-inner)"
  >
    <div class="flex items-center gap-3 flex-wrap">
      <AppText size="14" color="neutral-400">{{ rangeLabel }}</AppText>

      <div class="flex items-center gap-2">
        <AppText size="14" color="neutral-400">Rows</AppText>
        <UiSelect
          :model-value="String(limit)"
          @update:model-value="emit('update:limit', Number($event))"
        >
          <UiSelectTrigger class="h-9 w-20 text-[14px]">
            <UiSelectValue />
          </UiSelectTrigger>
          <UiSelectContent>
            <UiSelectItem v-for="n in pageSizes" :key="n" :value="String(n)" class="text-[14px]">
              {{ n }}
            </UiSelectItem>
          </UiSelectContent>
        </UiSelect>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex items-center gap-1">
      <AppButton
        variant="secondary"
        size="32"
        radius="8"
        aspect="square"
        icon="ArrowLeft"
        :class-list="arrowClass(canPrev)"
        aria-label="Previous page"
        @click="goTo(page - 1)"
      />

      <template v-for="(p, i) in pageNumbers" :key="`${p}-${i}`">
        <AppText
          v-if="p === '…'"
          size="14"
          color="neutral-400"
          class-list="w-8 text-center select-none"
        >…</AppText>
        <AppButton
          v-else
          :variant="p === page ? 'primary' : 'ghost'"
          size="32"
          radius="8"
          aspect="square"
          :text="String(p)"
          class-list="text-[14px]"
          :aria-label="`Page ${p}`"
          @click="goTo(p as number)"
        />
      </template>

      <AppButton
        variant="secondary"
        size="32"
        radius="8"
        aspect="square"
        icon="ArrowRight"
        :class-list="arrowClass(canNext)"
        aria-label="Next page"
        @click="goTo(page + 1)"
      />
    </div>
  </div>
</template>
