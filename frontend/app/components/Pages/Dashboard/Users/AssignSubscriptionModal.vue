<script setup lang="ts">
import { useAdmin } from '~/composables/useAdmin'
import type { AdminUserItem, AssignSubscriptionInput, PlanId, IntervalMonths, PaymentProvider } from '~/common/types/admin-types'

const props = defineProps<{
  open: boolean
  userId: string | null
  saving?: boolean
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  save: [input: AssignSubscriptionInput]
}>()

const { getUser } = useAdmin()

const user = ref<AdminUserItem | null>(null)
const loadingUser = ref(false)

// Form state
const plan = ref<PlanId>('FREE')
const durationMode = ref<'months' | 'date'>('months')
const durationMonths = ref<string>('3')
const endDate = ref<string>('')
const paymentProvider = ref<PaymentProvider>('CASH')

watch(() => props.open, async (v) => {
  if (!v || !props.userId) return
  user.value = null
  loadingUser.value = true
  const res = await getUser(props.userId)
  if (res.success && res.data?.data) {
    user.value = res.data.data
    plan.value = (user.value.subscription?.plan ?? 'FREE') as PlanId

    // Sync duration from currentPeriodEnd if exists
    const end = user.value.subscription?.currentPeriodEnd
    if (end) {
      const months = Math.max(1, Math.round((new Date(end).getTime() - Date.now()) / (30 * 24 * 3600 * 1000)))
      durationMonths.value = months >= 12 ? '12' : months >= 6 ? '6' : months >= 3 ? '3' : '1'
      endDate.value = new Date(end).toISOString().slice(0, 10)
    } else {
      durationMonths.value = '3'
      endDate.value = ''
    }
  }
  loadingUser.value = false
})

const isPaid = computed(() => plan.value !== 'FREE')

const PLAN_COLOR: Record<string, string> = {
  FREE:    'bg-surface-raised text-text-muted',
  GOLD:    'bg-amber-500/15 text-amber-500',
  PREMIUM: 'bg-violet-500/15 text-violet-500',
}

function submit() {
  const input: AssignSubscriptionInput = {
    plan: plan.value,
    paymentProvider: paymentProvider.value,
  }
  if (isPaid.value) {
    if (durationMode.value === 'date' && endDate.value) {
      input.endDate = new Date(endDate.value).toISOString()
    } else {
      input.durationMonths = Number(durationMonths.value) as IntervalMonths
    }
  }
  emit('save', input)
}
</script>

<template>
  <UiDialog :open="open" @update:open="emit('update:open', $event)">
    <UiDialogContent class="p-0 gap-0 overflow-hidden max-w-lg" :style="`background:var(--surface-card)`">

      <!-- Header -->
      <UiDialogHeader class="p-5 pb-4">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl flex items-center justify-center shrink-0" style="background:var(--surface-raised)">
            <AppIconsax name="Crown1" color="var(--color-brand-primary)" :size="18" />
          </div>
          <div class="min-w-0">
            <UiDialogTitle class="text-[16px] font-semibold font-poppins" :style="`color:var(--text-heading)`">
              Assign subscription
            </UiDialogTitle>
            <UiDialogDescription class="text-[14px] font-poppins mt-0.5 truncate" :style="`color:var(--text-muted)`">
              <span v-if="loadingUser">Loading…</span>
              <span v-else>{{ user?.displayName || user?.username || '—' }} · {{ user?.email }}</span>
            </UiDialogDescription>
          </div>
        </div>
      </UiDialogHeader>

      <!-- Current subscription (read-only) -->
      <div v-if="user" class="mx-5 mb-4 p-3.5 rounded-xl flex items-center gap-3 flex-wrap" style="background:var(--surface-raised)">
        <span :class="['text-[14px] font-semibold px-2.5 py-0.5 rounded-md font-poppins', PLAN_COLOR[user.subscription?.plan ?? 'FREE']]">
          {{ user.subscription?.plan ?? 'FREE' }}
        </span>
        <span class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">current plan</span>
        <span v-if="user.subscription?.currentPeriodEnd" class="text-[14px] font-poppins ml-auto" :style="`color:var(--text-subtle)`">
          Expires {{ new Date(user.subscription.currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) }}
        </span>
      </div>
      <div v-else-if="loadingUser" class="mx-5 mb-4">
        <UiSkeleton class="h-12 rounded-xl" />
      </div>

      <!-- Form -->
      <div class="px-5 pb-5 space-y-4">

        <!-- Row 1: Plan + Payment provider -->
        <div class="grid grid-cols-2 gap-3">
          <div>
            <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Plan</p>
            <UiSelect v-model="plan">
              <UiSelectTrigger class="text-[14px] w-full"><UiSelectValue /></UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem value="FREE">Free</UiSelectItem>
                <UiSelectItem value="GOLD">Gold</UiSelectItem>
                <UiSelectItem value="PREMIUM">Premium</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>

          <div>
            <p class="text-[14px] font-medium font-poppins mb-1.5" :style="`color:var(--text-heading)`">Payment method</p>
            <UiSelect v-model="paymentProvider">
              <UiSelectTrigger class="text-[14px] w-full"><UiSelectValue /></UiSelectTrigger>
              <UiSelectContent>
                <UiSelectItem value="CASH">Cash</UiSelectItem>
                <UiSelectItem value="FIB">FIB</UiSelectItem>
                <UiSelectItem value="STRIPE">Stripe</UiSelectItem>
              </UiSelectContent>
            </UiSelect>
          </div>
        </div>

        <!-- Row 2: Duration (only for paid plans) -->
        <div v-if="isPaid">
          <!-- Mode toggle -->
          <div class="flex items-center justify-between mb-1.5">
            <p class="text-[14px] font-medium font-poppins" :style="`color:var(--text-heading)`">Duration</p>
            <div class="flex items-center gap-1 p-0.5 rounded-lg" style="background:var(--surface-raised)">
              <button
                class="text-[14px] font-medium font-poppins px-3 py-1 rounded-md transition-colors cursor-pointer"
                :style="durationMode === 'months'
                  ? 'background:var(--surface-card);color:var(--text-heading)'
                  : 'color:var(--text-muted)'"
                @click="durationMode = 'months'"
              >
                Months
              </button>
              <button
                class="text-[14px] font-medium font-poppins px-3 py-1 rounded-md transition-colors cursor-pointer"
                :style="durationMode === 'date'
                  ? 'background:var(--surface-card);color:var(--text-heading)'
                  : 'color:var(--text-muted)'"
                @click="durationMode = 'date'"
              >
                End date
              </button>
            </div>
          </div>

          <!-- Months select -->
          <UiSelect v-if="durationMode === 'months'" v-model="durationMonths">
            <UiSelectTrigger class="text-[14px] w-full"><UiSelectValue /></UiSelectTrigger>
            <UiSelectContent>
              <UiSelectItem value="1">1 month</UiSelectItem>
              <UiSelectItem value="3">3 months</UiSelectItem>
              <UiSelectItem value="6">6 months</UiSelectItem>
              <UiSelectItem value="12">1 year</UiSelectItem>
            </UiSelectContent>
          </UiSelect>

          <!-- Date picker -->
          <FormDateInput
            v-else
            id="sub-end-date"
            v-model="endDate"
            placeholder="End date"
            :min-date="new Date()"
          />
        </div>

      </div>

      <UiDialogFooter class="px-5 pb-5 flex gap-2">
        <UiDialogClose as-child>
          <AppButton variant="secondary" size="38" radius="8" text="Cancel" class="flex-1" />
        </UiDialogClose>
        <AppButton
          variant="primary"
          size="38"
          radius="8"
          icon="Crown1"
          :icon-config="{ color: 'white', size: 15 }"
          text="Assign plan"
          class="flex-1"
          :loading="saving"
          :disabled="loadingUser"
          @click="submit"
        />
      </UiDialogFooter>

    </UiDialogContent>
  </UiDialog>
</template>
