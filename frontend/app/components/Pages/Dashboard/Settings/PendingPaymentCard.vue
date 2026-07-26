<script setup lang="ts">
import type { InitiateFibResult } from '~/common/types/subscription-types'
import { PLAN_META, INTERVAL_LABELS } from '~/common/types/subscription-types'

// Shown when the user has an unpaid FIB payment waiting. Without this, closing
// the payment dialog lost the QR permanently while the pending payment kept
// blocking new attempts.
const props = defineProps<{
  payment: InitiateFibResult
  cancelling?: boolean
}>()

defineEmits<{ show: []; cancel: [] }>()

function fmtIQD(n: number) {
  return n.toLocaleString('en-IQ') + ' IQD'
}

const expiry = computed(() => {
  const d = new Date(props.payment.validUntil)
  return `${d.toLocaleDateString('en-IQ', { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-IQ', { hour: '2-digit', minute: '2-digit' })}`
})
</script>

<template>
  <div class="dash-card p-5">
    <div class="flex items-center gap-3 mb-4">
      <div
        class="size-10 rounded-xl flex items-center justify-center shrink-0"
        style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2)"
      >
        <AppIconsax name="Clock" color="var(--color-brand-primary)" :size="18" />
      </div>
      <div>
        <AppText size="14" weight="semibold" class-list="block" :style="`color:var(--text-heading)`">
          Payment waiting
        </AppText>
        <AppText size="12" :style="`color:var(--text-muted)`">
          {{ PLAN_META[payment.plan].name }} · {{ INTERVAL_LABELS[payment.intervalMonths] }} ·
          {{ fmtIQD(payment.amountIQD) }}
        </AppText>
      </div>
    </div>

    <AppText size="13" class-list="block mb-4" :style="`color:var(--text-body)`">
      You started this payment but haven't completed it yet. Reopen it to scan the QR code, or
      cancel it if you'd rather choose a different plan. It expires on {{ expiry }}.
    </AppText>

    <div class="flex items-center gap-2">
      <AppButton
        variant="primary" size="36" radius="8"
        icon="ScanBarcode" :icon-config="{ color: 'white', size: 16 }"
        text="Show QR code"
        class="flex-1 justify-center"
        @click="$emit('show')"
      />
      <AppButton
        variant="secondary" size="36" radius="8"
        icon="CloseCircle" :icon-config="{ color: '#ef4444', size: 16 }"
        text="Cancel payment"
        class="flex-1 justify-center"
        style="color:#ef4444;border-color:rgba(239,68,68,0.4)"
        :loading="cancelling"
        @click="$emit('cancel')"
      />
    </div>
  </div>
</template>
