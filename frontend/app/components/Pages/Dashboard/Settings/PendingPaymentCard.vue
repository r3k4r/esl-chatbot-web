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

    <AppText size="13" class-list="block mb-3" :style="`color:var(--text-body)`">
      You started this payment but haven't completed it yet. Reopen it to scan the QR code, or
      cancel it if you'd rather choose a different plan. It expires on {{ expiry }}.
    </AppText>

    <!-- FIB can take a few minutes to report a payment. Cancelling in that window used
         to be how people lost money, so warn before they do it. -->
    <div
      class="flex items-start gap-2 px-4 py-3 rounded-xl mb-4"
      style="background:var(--status-blocked-bg);border:1px solid var(--border-inner)"
    >
      <AppIconsax name="InfoCircle" color="var(--status-blocked-text)" :size="16" class="mt-0.5 shrink-0" />
      <AppText size="13" :style="`color:var(--text-body)`">
        <strong>Already paid?</strong> Don't cancel — FIB can take a few minutes to confirm.
        Wait and refresh; your plan activates on its own. Cancelling is only for a payment you
        decided <em>not</em> to make.
      </AppText>
    </div>

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
