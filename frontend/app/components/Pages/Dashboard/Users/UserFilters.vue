<script setup lang="ts">
import type { UserRole, SubStatus, PlanId } from '~/common/types/admin-types'

const props = defineProps<{
  search: string
  role: UserRole | 'ALL'
  subscriptionStatus: SubStatus | 'ALL'
  plan: PlanId | 'ALL'
  createdAfter: string
  createdBefore: string
}>()

const emit = defineEmits<{
  'update:search': [val: string]
  'update:role': [val: UserRole | 'ALL']
  'update:subscriptionStatus': [val: SubStatus | 'ALL']
  'update:plan': [val: PlanId | 'ALL']
  'update:createdAfter': [val: string]
  'update:createdBefore': [val: string]
}>()

// Local draft state for the drawer (applied only when "Apply filters" is clicked)
const drawerOpen = ref(false)
const draftRole = ref<UserRole | 'ALL'>('ALL')
const draftStatus = ref<SubStatus | 'ALL'>('ALL')
const draftPlan = ref<PlanId | 'ALL'>('ALL')
const draftAfter = ref('')
const draftBefore = ref('')

// Sync drawer drafts when drawer opens
watch(drawerOpen, (open) => {
  if (open) {
    draftRole.value = props.role
    draftStatus.value = props.subscriptionStatus
    draftPlan.value = props.plan
    draftAfter.value = props.createdAfter
    draftBefore.value = props.createdBefore
  }
})

function applyFilters() {
  emit('update:role', draftRole.value)
  emit('update:subscriptionStatus', draftStatus.value)
  emit('update:plan', draftPlan.value)
  emit('update:createdAfter', draftAfter.value)
  emit('update:createdBefore', draftBefore.value)
  drawerOpen.value = false
}

function clearAll() {
  draftRole.value = 'ALL'
  draftStatus.value = 'ALL'
  draftPlan.value = 'ALL'
  draftAfter.value = ''
  draftBefore.value = ''
}

// Badge: are any filters active?
const hasActiveFilters = computed(() =>
  props.role !== 'ALL' ||
  props.subscriptionStatus !== 'ALL' ||
  props.plan !== 'ALL' ||
  !!props.createdAfter ||
  !!props.createdBefore
)
</script>

<template>
  <div class="flex items-center gap-3 flex-wrap">
    <!-- Search -->
    <FormInput
      id="user-search"
      :model-value="search"
      placeholder="Search name, email, username…"
      icon="SearchNormal1"
      class-list="w-64"
      @update:model-value="emit('update:search', String($event))"
    />

    <!-- Filters button -->
    <div class="relative">
      <AppButton
        variant="secondary"
        size="36"
        radius="8"
        icon="Filter"
        text="Filters"
        @click="drawerOpen = true"
      />
      <!-- Active filter dot -->
      <span
        v-if="hasActiveFilters"
        class="absolute -top-1 -right-1 size-3 rounded-md"
        style="background:var(--color-brand-primary)"
      />
    </div>

    <!-- Filter drawer -->
    <UiSheet v-model:open="drawerOpen">
      <UiSheetContent side="right" class="w-80 flex flex-col gap-0 p-0">
        <UiSheetHeader class="px-6 py-5" style="border-bottom:1px solid var(--border-inner)">
          <UiSheetTitle class="text-[18px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
            Filters
          </UiSheetTitle>
        </UiSheetHeader>

        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          <!-- Role -->
          <div>
            <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Role</p>
            <UiSelect v-model="draftRole">
              <UiSelectTrigger class="w-full text-[14px]"><UiSelectValue placeholder="All roles" /></UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem value="ALL">All roles</UiSelectItem>
                <UiSelectItem value="STUDENT">Student</UiSelectItem>
                <UiSelectItem value="TUTOR">Tutor</UiSelectItem>
                <UiSelectItem value="ADMIN">Admin</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>

          <!-- Subscription plan -->
          <div>
            <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Subscription plan</p>
            <UiSelect v-model="draftPlan">
              <UiSelectTrigger class="w-full text-[14px]"><UiSelectValue placeholder="All plans" /></UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem value="ALL">All plans</UiSelectItem>
                <UiSelectItem value="FREE">FREE</UiSelectItem>
                <UiSelectItem value="GOLD">GOLD</UiSelectItem>
                <UiSelectItem value="PREMIUM">PREMIUM</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>

          <!-- Subscription status -->
          <div>
            <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Subscription status</p>
            <UiSelect v-model="draftStatus">
              <UiSelectTrigger class="w-full text-[14px]"><UiSelectValue placeholder="All statuses" /></UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem value="ALL">All statuses</UiSelectItem>
                <UiSelectItem value="ACTIVE">Active</UiSelectItem>
                <UiSelectItem value="INACTIVE">Inactive</UiSelectItem>
                <UiSelectItem value="CANCELLED">Cancelled</UiSelectItem>
                <UiSelectItem value="PAST_DUE">Past due</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>

          <!-- Joined from -->
          <div>
            <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Joined from</p>
            <FormInput
              id="filter-joined-from"
              v-model="draftAfter"
              type="date"
              placeholder="YYYY-MM-DD"
              icon="Calendar"
            />
          </div>

          <!-- Joined to -->
          <div>
            <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Joined to</p>
            <FormInput
              id="filter-joined-to"
              v-model="draftBefore"
              type="date"
              placeholder="YYYY-MM-DD"
              icon="Calendar"
            />
          </div>

        </div>

        <!-- Footer -->
        <div class="flex items-center gap-3 px-6 py-5" style="border-top:1px solid var(--border-inner)">
          <AppButton
            variant="primary"
            size="38"
            radius="8"
            text="Apply filters"
            class="flex-1"
            :icon-config="{ color: 'white', size: 16 }"
            @click="applyFilters"
          />
          <AppButton
            variant="secondary"
            size="38"
            radius="8"
            text="Clear all"
            @click="clearAll"
          />
        </div>
      </UiSheetContent>
    </UiSheet>
  </div>
</template>
