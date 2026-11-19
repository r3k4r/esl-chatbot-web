<template>
  <div ref="countryDropdown" class="text-sm">
    <!-- Sits inside FormInput's left padding (ps-28 for type="tel"), so the number starts after it -->
    <button type="button" class="absolute inset-y-0 start-3 flex items-center gap-1.5 text-text-body"
      aria-label="Select country code" :aria-expanded="show" :disabled="props.disabled" @click="show = !show">
      <AppImage width="24" height="18" :src="`https://flagcdn.com/144x108/${selected?.code.toLowerCase()}.png`" :alt="selected?.name"
        class="h-4.5 w-6 rounded-sm object-cover" />
      <span class="tabular-nums">{{ selected?.dial_code }}</span>
      <AppIconsax name="ArrowDown2" color="currentColor" :size="14" class="opacity-60" />
    </button>
    <div v-if="show"
      class="absolute start-0 top-[calc(100%+6px)] z-20 w-64 overflow-hidden rounded-lg border border-border-card bg-surface-card shadow-lg">
      <input v-model="search" name="search" placeholder="Search country or code" :disabled="props.disabled"
        class="w-full border-b border-border-inner bg-transparent px-3 py-2.5 text-[14px] text-text-heading placeholder:text-text-muted focus:outline-none" />
      <div class="max-h-60 overflow-y-auto">
        <button v-for="country in filteredCodes" :key="country.code" type="button"
          class="flex h-10 w-full items-center gap-2.5 px-3 text-start text-[14px] text-text-body hover:bg-surface-raised"
          :class="{ 'bg-surface-raised': country.dial_code === code }"
          :aria-label="`Select country code ${country.name}`" :disabled="props.disabled"
          @click="selectCode(country.dial_code)">
          <AppImage width="20" height="15" :src="`https://flagcdn.com/144x108/${country.code.toLowerCase()}.png`" :alt="country.name"
            class="h-3.5 w-5 shrink-0 rounded-sm object-cover" />
          <span class="min-w-0 flex-1 truncate">{{ country.name }}</span>
          <span class="tabular-nums text-text-muted">{{ country.dial_code }}</span>
        </button>
        <p v-if="!filteredCodes.length" class="px-3 py-3 text-[14px] text-text-muted">No country found</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onClickOutside } from '@vueuse/core'
import countryCode from '~/common/data/country-code'

const code = defineModel<string>({ default: '+964' })
const show = ref(false)
const countryDropdown = ref<HTMLElement | null>(null)
const search = ref<string>()
const selected = computed(() => countryCode.find(item => item.dial_code == code.value))

const filteredCodes = computed(() => {
  if (!search.value) return countryCode;
  let query = search.value!.toLocaleLowerCase()
  return countryCode.filter((item) => item.name.toLocaleLowerCase().includes(query) || item.local_name?.toLocaleLowerCase().includes(query) || item.code?.toLocaleLowerCase().includes(query) || item.dial_code.toLocaleLowerCase().includes(query))
})

const props = withDefaults(defineProps<{
  disabled?: boolean;
}>(), {
})

const selectCode = (value: string) => {
  code.value = value;
  search.value = undefined;
  show.value = false;
}

onClickOutside(countryDropdown, () => {
  show.value = false
})
</script>
