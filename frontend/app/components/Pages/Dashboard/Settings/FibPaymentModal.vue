<script setup lang="ts">
import { toast } from 'vue-sonner'
import type { InitiateFibResult, FibStatusResult } from '~/common/types/subscription-types'
import type { SvgBasedIconName } from '~~/app/common/types/iconsax-types'

const props = defineProps<{
  open: boolean
  payment: InitiateFibResult | null
  plan: 'GOLD' | 'PREMIUM'
  intervalMonths: number
  amountIQD: number
}>()

const emit = defineEmits<{
  'update:open': [val: boolean]
  activated: []
}>()

const { getFibStatus } = useSubscription()

// ─── Polling ──────────────────────────────────────────────────────────────────

type FibStatus = FibStatusResult['fibStatus']

const status = ref<FibStatus>('DRAFT')
const pollInterval = ref<ReturnType<typeof setInterval> | null>(null)
const pollCount = ref(0)
const MAX_POLLS = 60 // 5 minutes at 5s intervals

function startPolling() {
  if (pollInterval.value) return
  pollInterval.value = setInterval(async () => {
    if (!props.payment) return
    pollCount.value++
    if (pollCount.value > MAX_POLLS) { stopPolling(); return }

    const res = await getFibStatus(props.payment.fibSubscriptionId)
    if (!res.success || !res.data) return

    const s: FibStatus = (res.data as any).data?.fibStatus ?? (res.data as any).fibStatus
    status.value = s

    if (s === 'ACTIVE' || s === 'TRIAL') {
      stopPolling()
      toast.success('Payment confirmed! Your plan is now active.')
      emit('activated')
    }
    if (s === 'CANCELLED' || s === 'REJECTED') {
      stopPolling()
      toast.error('Payment was cancelled or rejected.')
    }
  }, 5000)
}

function stopPolling() {
  if (pollInterval.value) { clearInterval(pollInterval.value); pollInterval.value = null }
}

// Watches the payment id too: the dialog can be opened before the payment lands
// (and reused for a different payment), and both cases must restart the poll from
// a clean status instead of inheriting the previous one.
watch(
  [() => props.open, () => props.payment?.fibSubscriptionId],
  ([open]) => {
    stopPolling()
    if (!open || !props.payment) return
    status.value = 'DRAFT'
    pollCount.value = 0
    startPolling()
  },
  { immediate: true },
)

onUnmounted(stopPolling)

// ─── Helpers ─────────────────────────────────────────────────────────────────

const statusConfig = computed<{ label: string; color: string; bg: string; icon: SvgBasedIconName }>(() => {
  switch (status.value) {
    case 'ACTIVE':
    case 'TRIAL':  return { label: 'Payment confirmed!',  color: 'var(--status-active-text)',   bg: 'var(--status-active-bg)',   icon: 'TickCircle'  }
    case 'REJECTED':
    case 'CANCELLED': return { label: 'Payment cancelled', color: 'var(--status-expired-text)',  bg: 'var(--status-expired-bg)',  icon: 'CloseCircle' }
    default:       return { label: 'Waiting for payment…', color: 'var(--text-muted)',           bg: 'var(--surface-raised)',     icon: 'Clock'       }
  }
})

const isPending = computed(() => status.value === 'DRAFT' || status.value === 'TRIAL')
const isSuccess = computed(() => status.value === 'ACTIVE' || status.value === 'TRIAL')
const isFailed  = computed(() => status.value === 'CANCELLED' || status.value === 'REJECTED')

function fmtExpiry(iso: string) {
  const d = new Date(iso)
  return `Valid until ${d.toLocaleDateString('en-IQ', { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString('en-IQ', { hour: '2-digit', minute: '2-digit' })}`
}

function fmtIQD(n: number) {
  return n.toLocaleString('en-IQ') + ' IQD'
}

function copyCode() {
  if (!props.payment?.readableCode) return
  useCopyToClipboard(props.payment.readableCode)
  toast.success('Code copied!')
}

// The FIB app link is an EXTERNAL url/deep link. Binding it to `:to` handed it to
// vue-router, which resolved it as an in-app path and landed on the 404 page —
// destroying this dialog (and the QR with it). Open it in a separate tab instead:
// if the FIB app isn't installed, the user just closes that tab and the QR is
// still here.
function openAppLink() {
  const link = props.payment?.appLink
  if (!link) return
  window.open(link, '_blank', 'noopener,noreferrer')
}
</script>

<template>
  <UiDialog :open="open" @update:open="emit('update:open', $event)">
    <UiDialogContent class="p-0 gap-0 overflow-hidden max-w-sm" :style="`background:var(--surface-card)`">

      <!-- Header -->
      <UiDialogHeader class="p-6 pb-5" style="border-bottom:1px solid var(--border-inner)">
        <div class="flex items-center gap-3">
          <div class="size-10 rounded-xl flex items-center justify-center shrink-0" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2)">
            <AppIconsax name="Wallet2" color="var(--color-brand-primary)" :size="18" />
          </div>
          <div>
            <UiDialogTitle class="text-[16px] font-semibold" :style="`color:var(--text-heading)`">FIB Payment</UiDialogTitle>
            <UiDialogDescription class="text-[12px] mt-0.5" :style="`color:var(--text-muted)`">
              {{ plan }} · {{ intervalMonths }}mo · {{ fmtIQD(amountIQD) }}
            </UiDialogDescription>
          </div>
        </div>
      </UiDialogHeader>

      <div class="p-6 space-y-5">

        <!-- Status badge -->
        <div
          class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl"
          :style="`background:${statusConfig.bg};border:1px solid ${statusConfig.color}22`"
        >
          <AppIconsax :name="statusConfig.icon" :size="14" :color="statusConfig.color" />
          <AppText size="13" weight="semibold" :style="`color:${statusConfig.color}`">{{ statusConfig.label }}</AppText>
          <!-- Animated dot when pending -->
          <span v-if="isPending" class="ml-auto flex gap-0.5">
            <span v-for="i in 3" :key="i" class="size-1.5 rounded-full bg-current animate-bounce" :style="`color:${statusConfig.color};animation-delay:${(i-1)*150}ms`" />
          </span>
        </div>

        <template v-if="payment && !isSuccess && !isFailed">
          <!-- Carry-over: the user must SEE that their unused time is included, not
               trust that it happened. This is the payment's own number from the
               backend, not a client estimate. -->
          <div
            v-if="payment.carryOverDays > 0"
            class="flex items-start gap-2 px-4 py-2.5 rounded-xl"
            style="background:var(--surface-raised);border:1px solid var(--border-inner)"
          >
            <AppIconsax name="TickCircle" color="var(--color-brand-primary)" :size="15" class="mt-0.5 shrink-0" />
            <AppText size="13" :style="`color:var(--text-body)`">
              Includes <strong>+{{ payment.carryOverDays }} bonus
              {{ payment.carryOverDays === 1 ? 'day' : 'days' }}</strong> — the unused time from
              your current plan, added on top when this payment activates.
            </AppText>
          </div>

          <!-- QR Code — reserved space prevents layout jump -->
          <div class="flex flex-col items-center gap-3">
            <div class="size-48 rounded-2xl overflow-hidden flex items-center justify-center" style="background:white;border:1px solid var(--border-inner)">
              <template v-if="payment.qrCode">
                <AppImage :src="payment.qrCode" :width="192" :height="192" alt="FIB QR code" class="size-48 object-cover" />
              </template>
              <template v-else>
                <UiSkeleton class="size-48 rounded-none" />
              </template>
            </div>
            <AppText size="12" :style="`color:var(--text-muted)`">Scan with your FIB app</AppText>
          </div>

          <!-- Readable code -->
          <div class="rounded-xl overflow-hidden" style="border:1px solid var(--border-inner)">
            <div class="px-4 py-2.5 flex items-center gap-2" style="background:var(--surface-raised);border-bottom:1px solid var(--border-inner)">
              <AppIconsax name="TextBlock" color="var(--color-text-subtle)" :size="12" />
              <AppText size="11" weight="semibold" :uppercase="true" class-list="tracking-[0.12em]" :style="`color:var(--text-subtle)`">Manual code</AppText>
            </div>
            <div class="px-4 py-3 flex items-center gap-3" style="background:var(--surface-card)">
              <AppText size="18" weight="bold" font-family="mono" class-list="tracking-[0.3em] flex-1 select-all" :style="`color:var(--text-heading)`">
                {{ payment.readableCode }}
              </AppText>
              <AppButton
                variant="secondary" size="32" radius="8"
                icon="Copy" :icon-config="{ color: 'currentColor', size: 13 }"
                @click="copyCode"
              />
            </div>
          </div>

          <!-- App deep link — opened in a new tab, never via router navigation
               (see openAppLink), so this dialog and the QR survive the click. -->
          <template v-if="payment.appLink">
            <AppButton
              variant="primary" size="40" radius="12"
              icon="Export" :icon-config="{ color: 'white', size: 14 }"
              text="Open FIB App"
              class="w-full justify-center"
              @click="openAppLink"
            />
            <AppText size="12" class-list="text-center block -mt-3" :style="`color:var(--text-subtle)`">
              Nothing opened? The FIB app has to be installed — otherwise scan the QR code above.
            </AppText>
          </template>

          <!-- Expiry -->
          <AppText size="11" class-list="text-center block" :style="`color:var(--text-subtle)`">
            {{ fmtExpiry(payment.validUntil) }}
          </AppText>
        </template>

        <!-- Success state -->
        <div v-if="isSuccess" class="text-center py-4">
          <div class="size-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style="background:var(--status-active-bg)">
            <AppIconsax name="TickCircle" color="var(--status-active-text)" :size="32" />
          </div>
          <AppText size="15" weight="semibold" class-list="block" :style="`color:var(--text-heading)`">You're all set!</AppText>
          <AppText size="13" class-list="block mt-1" :style="`color:var(--text-muted)`">Your {{ plan }} plan is now active.</AppText>
        </div>

        <!-- Failed state -->
        <div v-if="isFailed" class="text-center py-4">
          <div class="size-16 rounded-2xl flex items-center justify-center mx-auto mb-3" style="background:var(--status-expired-bg)">
            <AppIconsax name="CloseCircle" color="var(--status-expired-text)" :size="32" />
          </div>
          <AppText size="15" weight="semibold" class-list="block" :style="`color:var(--text-heading)`">Payment not completed</AppText>
          <AppText size="13" class-list="block mt-1" :style="`color:var(--text-muted)`">You can try again from the subscription panel.</AppText>
        </div>

      </div>

      <UiDialogFooter class="px-6 pb-6 pt-0">
        <UiDialogClose as-child>
          <AppButton
            variant="secondary" size="40" radius="12"
            :text="isSuccess ? 'Done' : 'Close'"
            class="w-full justify-center"
          />
        </UiDialogClose>
      </UiDialogFooter>

    </UiDialogContent>
  </UiDialog>
</template>
