<script setup lang="ts">
import { toast } from 'vue-sonner'
import type {
  InitiateFibResult,
  PlanId,
  PlanChangeType,
  IntervalMonths,
  UserSubscriptionDetail,
} from '~/common/types/subscription-types'
import { PLAN_META, PLAN_PRICES_IQD, INTERVAL_LABELS } from '~/common/types/subscription-types'
import { useAuthStore } from '~~/stores/auth'

const props = defineProps<{
  subscription: UserSubscriptionDetail | null
}>()

const emit = defineEmits<{ refreshed: [] }>()

const authStore = useAuthStore()
const { initiateFib, getPendingFib, cancelFib } = useSubscription()

// ─── Derived state ────────────────────────────────────────────────────────────

const currentPlan   = computed(() => (props.subscription?.plan ?? 'FREE') as PlanId)
const subStatus     = computed(() => props.subscription?.status ?? 'INACTIVE')
const isActive      = computed(() => subStatus.value === 'ACTIVE')
const isFibProvider = computed(() => props.subscription?.paymentProvider === 'FIB')
const isCashProvider= computed(() => props.subscription?.paymentProvider === 'CASH')
const fibSubId      = computed(() => props.subscription?.externalSubscriptionId ?? null)
const periodEnd     = computed(() => props.subscription?.currentPeriodEnd ?? null)
// Cancelled but still paid up — plan keeps working until periodEnd, no refund.
const isCancelling  = computed(() => props.subscription?.cancelAtPeriodEnd === true)

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IQ', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ─── Upgrade form state ───────────────────────────────────────────────────────

const route = useRoute()
const selectedPlan     = ref<'GOLD' | 'PREMIUM'>(
  route.query.plan === 'PREMIUM' ? 'PREMIUM' : 'GOLD',
)
const selectedInterval = ref<IntervalMonths>(1)
const initiating       = ref(false)
const cancelling       = ref(false)
const showCancelConfirm = ref(false)

const paymentModal = ref(false)
const paymentData  = ref<InitiateFibResult | null>(null)

// An unpaid payment the user left behind (closed the dialog, reloaded, followed
// the FIB app link). Kept visible so the QR is always recoverable and can be
// cleared — a pending payment blocks starting a different plan.
const pendingPayment  = ref<InitiateFibResult | null>(null)
const cancellingPending = ref(false)

async function loadPending() {
  const res = await getPendingFib()
  pendingPayment.value = res.success ? ((res.data as any)?.data ?? null) : null
}

onMounted(loadPending)

function showPending() {
  if (!pendingPayment.value) return
  paymentData.value = pendingPayment.value
  paymentModal.value = true
}

async function cancelPending() {
  const id = pendingPayment.value?.fibSubscriptionId
  if (!id) return
  cancellingPending.value = true
  const res = await cancelFib(id)
  cancellingPending.value = false
  if (!res.success) {
    // 409 = the payment landed at FIB between opening the QR and pressing Cancel, so
    // the backend activated the plan instead of discarding it. That's good news, not
    // an error — clear the card and refresh so the new plan shows immediately.
    if ((res as any).status === 409) {
      pendingPayment.value = null
      paymentData.value = null
      paymentModal.value = false
      toast.success(res.message || 'Your payment went through — your plan is now active.')
      await authStore.fetchUser()
      emit('refreshed')
      return
    }
    toast.error(res.message || 'Could not cancel the pending payment.')
    return
  }
  pendingPayment.value = null
  paymentData.value = null
  paymentModal.value = false
  toast.success('Pending payment cancelled. You can start a new one.')
}

const UPGRADEABLE_PLANS: Array<'GOLD' | 'PREMIUM'> = ['GOLD', 'PREMIUM']
const INTERVALS: IntervalMonths[] = [1, 3, 6, 12]

const selectedPrice = computed(() =>
  PLAN_PRICES_IQD[selectedPlan.value][selectedInterval.value],
)

// Savings badge: compare to 1-month × interval
const savings = computed(() => {
  const monthly = PLAN_PRICES_IQD[selectedPlan.value][1]
  const actual  = PLAN_PRICES_IQD[selectedPlan.value][selectedInterval.value]
  const full    = monthly * selectedInterval.value
  if (full <= actual) return null
  return Math.round(((full - actual) / full) * 100)
})

function fmtIQD(n: number) {
  return n.toLocaleString('en-IQ') + ' IQD'
}

// ─── Plan-change preview ──────────────────────────────────────────────────────
// Mirrors carryOverDays() in backend/src/modules/subscriptions/subscriptions.service.ts
// so the user sees what they'll get BEFORE paying. The backend response is the
// authoritative number (it's what the payment dialog shows); this is the estimate.
// Keep in sync with PLAN_PRICES_IQD, same as plan-limits.ts.
const PLAN_RANK: Record<PlanId, number> = { FREE: 0, GOLD: 1, PREMIUM: 2 }
const dailyRate = (p: PlanId) => (p === 'FREE' ? 0 : PLAN_PRICES_IQD[p][1] / 30)

// Admin-managed (CASH) plans are settled off-platform — those users must contact
// support rather than stack a FIB payment on top.
const canBuy = computed(() => !(isActive.value && isCashProvider.value))

const pendingChange = computed<{ changeType: PlanChangeType; carryOverDays: number }>(() => {
  const end = periodEnd.value ? new Date(periodEnd.value) : null
  const now = new Date()
  const hasLivePaidPlan =
    isActive.value && currentPlan.value !== 'FREE' && !isCashProvider.value && !!end && end > now

  if (!hasLivePaidPlan) return { changeType: 'NEW', carryOverDays: 0 }

  const remainingDays = (end!.getTime() - now.getTime()) / 86_400_000
  const newRate = dailyRate(selectedPlan.value)
  const carryOverDays = newRate > 0
    ? Math.floor((remainingDays * dailyRate(currentPlan.value)) / newRate)
    : 0

  const changeType: PlanChangeType =
    currentPlan.value === selectedPlan.value
      ? 'RENEWAL'
      : PLAN_RANK[selectedPlan.value] > PLAN_RANK[currentPlan.value]
        ? 'UPGRADE'
        : 'DOWNGRADE'

  return { changeType, carryOverDays }
})

const sectionTitle = computed(() => {
  switch (pendingChange.value.changeType) {
    case 'RENEWAL':   return 'Renew your plan'
    case 'DOWNGRADE': return 'Change your plan'
    case 'UPGRADE':   return 'Upgrade your plan'
    default:          return 'Choose your plan'
  }
})

// Buying the plan you already have on a live auto-renewing subscription is refused by
// the backend (409) — disable it here so the user isn't sent into a pointless error.
const alreadyOnThisPlan = computed(
  () => pendingChange.value.changeType === 'RENEWAL' && !isCancelling.value,
)

const ctaText = computed(() => {
  if (initiating.value) return 'Preparing payment…'
  const name = PLAN_META[selectedPlan.value].name
  if (alreadyOnThisPlan.value) return `You're already on ${name}`
  switch (pendingChange.value.changeType) {
    case 'UPGRADE':   return `Upgrade to ${name}`
    case 'DOWNGRADE': return `Switch to ${name}`
    case 'RENEWAL':   return `Renew ${name}`
    default:          return `Subscribe to ${name}`
  }
})

// ─── Actions ─────────────────────────────────────────────────────────────────

async function handleSubscribe() {
  if (initiating.value) return
  initiating.value = true
  const res = await initiateFib(selectedPlan.value, selectedInterval.value)
  initiating.value = false
  if (!res.success) {
    const status = (res as any).status
    if (status === 409) {
      // A payment for a different plan is already waiting — surface it instead of
      // dead-ending, so the user can resume or clear it.
      if ((res.data as any)?.pendingFib) await loadPending()
      toast.error(res.message || 'You already have an active subscription.')
    }
    else if (status === 503) toast.error('FIB payment is not configured yet. Contact support.')
    else toast.error(res.message || 'Could not initiate payment.')
    return
  }
  const payment: InitiateFibResult = (res.data as any)?.data ?? (res.data as any)
  paymentData.value = payment
  // Same plan pressed twice → the backend hands back the existing payment rather
  // than opening a second one at FIB.
  pendingPayment.value = payment
  paymentModal.value = true
}

async function handleCancel() {
  if (!fibSubId.value) {
    toast.error('No active FIB subscription found.')
    return
  }
  cancelling.value = true
  const res = await cancelFib(fibSubId.value)
  cancelling.value = false
  showCancelConfirm.value = false

  if (!res.success) {
    toast.error(res.message || 'Could not cancel subscription.')
    return
  }
  toast.success('Subscription cancelled. You will keep access until the end of your billing period.')
  await authStore.fetchUser()
  emit('refreshed')
}

function handleActivated() {
  paymentModal.value = false
  pendingPayment.value = null // it's paid — no longer something to resume
  authStore.fetchUser()
  emit('refreshed')
}

// The modal must show the payment's OWN plan/price — a resumed payment can be for
// a different plan than the one currently selected in the form below.
const modalPlan     = computed(() => paymentData.value?.plan ?? selectedPlan.value)
const modalInterval = computed(() => paymentData.value?.intervalMonths ?? selectedInterval.value)
const modalAmount   = computed(() => paymentData.value?.amountIQD ?? selectedPrice.value)

// ─── Styling ──────────────────────────────────────────────────────────────────

const planBadgeStyle = computed(() => {
  if (currentPlan.value === 'PREMIUM')
    return 'background:rgba(245,158,11,0.12);color:var(--color-brand-primary);border:1px solid rgba(245,158,11,0.25)'
  if (currentPlan.value === 'GOLD')
    return 'background:rgba(245,158,11,0.08);color:#f59e0b;border:1px solid rgba(245,158,11,0.2)'
  return 'background:var(--surface-well);color:var(--text-muted);border:1px solid var(--border-inner)'
})
</script>

<template>
  <div class="space-y-5">

    <!-- ── Current plan card ──────────────────────────────────────────────── -->
    <div class="dash-card p-5">
      <!-- Header row -->
      <div class="flex items-center justify-between gap-3 mb-4">
        <div class="flex items-center gap-3">
          <div
            class="size-10 rounded-xl flex items-center justify-center shrink-0"
            style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2)"
          >
            <AppIconsax name="Crown1" color="var(--color-brand-primary)" :size="18" />
          </div>
          <div>
            <AppText size="14" weight="semibold" class-list="block" :style="`color:var(--text-heading)`">
              Current plan
            </AppText>
            <AppText size="12" :style="`color:var(--text-muted)`">
              {{ isActive ? 'Active subscription' : 'No active subscription' }}
            </AppText>
          </div>
        </div>
        <span
          class="text-[12px] font-bold uppercase tracking-wide px-3 py-1 rounded-full font-poppins"
          :style="planBadgeStyle"
        >
          {{ PLAN_META[currentPlan].name }}
        </span>
      </div>

      <!-- Features grid -->
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div v-for="feat in PLAN_META[currentPlan].features" :key="feat" class="flex items-center gap-2">
          <AppIconsax name="TickCircle" color="var(--color-brand-primary)" :size="13" />
          <AppText size="12" :style="`color:var(--text-body)`">{{ feat }}</AppText>
        </div>
      </div>

      <!-- Period end + provider info (paid plans) -->
      <template v-if="currentPlan !== 'FREE' && isActive">
        <div style="height:1px;background:var(--border-inner);margin-bottom:1rem" />
        <div class="flex items-center justify-between mb-4">
          <div>
            <AppText size="11" :uppercase="true" class-list="tracking-widest block" :style="`color:var(--text-subtle)`">
              Renews / expires
            </AppText>
            <AppText size="13" weight="semibold" :style="`color:var(--text-heading)`">
              {{ fmtDate(periodEnd) }}
            </AppText>
          </div>
          <div class="text-right">
            <AppText size="11" :uppercase="true" class-list="tracking-widest block" :style="`color:var(--text-subtle)`">
              Provider
            </AppText>
            <AppText size="13" weight="semibold" :style="`color:var(--text-heading)`">
              {{ isCashProvider ? 'Admin (Cash)' : isFibProvider ? 'FIB Bank' : '—' }}
            </AppText>
          </div>
        </div>

        <!-- Already cancelled, still inside the paid period -->
        <div
          v-if="isCancelling"
          class="flex items-start gap-2 px-4 py-3 rounded-xl"
          style="background:var(--status-blocked-bg);border:1px solid var(--border-inner)"
        >
          <AppIconsax name="InfoCircle" color="var(--status-blocked-text)" :size="16" class="mt-0.5 shrink-0" />
          <div>
            <AppText size="13" weight="semibold" class-list="block" :style="`color:var(--status-blocked-text)`">
              Cancelled — active until {{ fmtDate(periodEnd) }}
            </AppText>
            <AppText size="12" class-list="block mt-0.5" :style="`color:var(--text-muted)`">
              You won't be charged again. You keep every {{ PLAN_META[currentPlan].name }} feature until
              then, and move to the Free plan afterwards.
            </AppText>
          </div>
        </div>

        <!-- Cancel — only for FIB (cash is admin-managed) -->
        <template v-else-if="isFibProvider">
          <div v-if="!showCancelConfirm">
            <AppButton
              variant="secondary" size="32" radius="8"
              icon="CloseCircle" :icon-config="{ color: '#ef4444', size: 13 }"
              text="Cancel subscription"
              style="color:#ef4444"
              @click="showCancelConfirm = true"
            />
          </div>
          <div
            v-else
            class="rounded-xl p-4 space-y-3"
            style="background:rgba(239,68,68,0.05);border:1px solid rgba(239,68,68,0.2)"
          >
            <AppText size="13" weight="semibold" :style="`color:var(--text-heading)`">Cancel your subscription?</AppText>
            <AppText size="12" :style="`color:var(--text-muted)`">
              You'll keep access until {{ fmtDate(periodEnd) }}. This cannot be undone.
            </AppText>
            <div class="flex items-center gap-2">
              <AppButton
                variant="secondary" size="32" radius="8"
                text="Keep plan" class="flex-1"
                @click="showCancelConfirm = false"
              />
              <AppButton
                variant="secondary" size="32" radius="8"
                icon="Trash" :icon-config="{ color: '#ef4444', size: 13 }"
                text="Yes, cancel" class="flex-1"
                style="color:#ef4444;border-color:rgba(239,68,68,0.4)"
                :loading="cancelling"
                @click="handleCancel"
              />
            </div>
          </div>
        </template>

        <!-- Cash plan — not self-cancellable -->
        <div
          v-else-if="isCashProvider"
          class="flex items-center gap-2 px-4 py-3 rounded-xl"
          style="background:var(--surface-raised);border:1px solid var(--border-inner)"
        >
          <AppIconsax name="InfoCircle" color="var(--color-text-muted)" :size="14" />
          <AppText size="12" :style="`color:var(--text-muted)`">
            This plan is managed by your admin. Contact support to make changes.
          </AppText>
        </div>
      </template>
    </div>

    <!-- ── Unfinished payment ─────────────────────────────────────────────── -->
    <PagesDashboardSettingsPendingPaymentCard
      v-if="pendingPayment"
      :payment="pendingPayment"
      :cancelling="cancellingPending"
      @show="showPending"
      @cancel="cancelPending"
    />

    <!-- ── Upgrade section ────────────────────────────────────────────────── -->
    <!-- Also shown to paid users now: switching tier mid-period is allowed, and the
         unused time carries over. Only hidden for admin-managed CASH plans, which
         must go through support. -->
    <template v-if="canBuy">
      <div class="dash-card p-5 space-y-5">
        <AppText size="14" weight="semibold" class-list="block" :style="`color:var(--text-heading)`">
          {{ sectionTitle }}
        </AppText>

        <!-- Carry-over notice: switching mid-period never wastes paid time -->
        <div
          v-if="pendingChange.carryOverDays > 0"
          class="flex items-start gap-2 px-4 py-3 rounded-xl"
          style="background:var(--surface-raised);border:1px solid var(--border-inner)"
        >
          <AppIconsax name="TickCircle" color="var(--color-brand-primary)" :size="16" class="mt-0.5 shrink-0" />
          <AppText size="13" :style="`color:var(--text-body)`">
            Your remaining {{ currentPlan === 'FREE' ? '' : PLAN_META[currentPlan].name }} time is not lost —
            it converts to about <strong>{{ pendingChange.carryOverDays }} extra
            {{ pendingChange.carryOverDays === 1 ? 'day' : 'days' }}</strong>
            of {{ PLAN_META[selectedPlan].name }}, added on top when your payment goes through.
          </AppText>
        </div>

        <!-- Plan selector -->
        <div class="grid grid-cols-2 gap-3">
          <button
            v-for="p in UPGRADEABLE_PLANS"
            :key="p"
            type="button"
            class="relative flex flex-col gap-2 p-4 rounded-xl border text-left transition-all duration-200 cursor-pointer"
            :style="selectedPlan === p
              ? 'border-color:var(--color-brand-primary);background:rgba(245,158,11,0.05)'
              : 'border-color:var(--border-card);background:var(--surface-raised)'"
            @click="selectedPlan = p"
          >
            <div class="flex items-center justify-between">
              <AppText
                size="13" weight="semibold"
                :style="selectedPlan === p ? 'color:var(--color-brand-primary)' : 'color:var(--text-heading)'"
              >
                {{ PLAN_META[p].name }}
              </AppText>
              <div
                class="size-4 rounded-full border-2 flex items-center justify-center transition-colors"
                :style="selectedPlan === p ? 'border-color:var(--color-brand-primary)' : 'border-color:var(--text-subtle)'"
              >
                <div v-if="selectedPlan === p" class="size-2 rounded-full" style="background:var(--color-brand-primary)" />
              </div>
            </div>
            <AppText size="11" :style="`color:var(--text-muted)`">{{ PLAN_META[p].model }}</AppText>
            <ul class="space-y-1 mt-1">
              <li v-for="f in PLAN_META[p].features.slice(0, 3)" :key="f" class="flex items-center gap-1.5">
                <AppIconsax
                  name="TickCircle" :size="11"
                  :color="selectedPlan === p ? 'var(--color-brand-primary)' : 'var(--color-text-subtle)'"
                />
                <AppText size="11" :style="`color:var(--text-muted)`">{{ f }}</AppText>
              </li>
            </ul>
          </button>
        </div>

        <!-- Interval selector -->
        <div>
          <AppText size="12" weight="semibold" class-list="block mb-2" :style="`color:var(--text-body)`">
            Billing period
          </AppText>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="m in INTERVALS"
              :key="m"
              type="button"
              class="relative py-2 rounded-xl text-[12px] font-semibold font-poppins border text-center transition-all duration-200 cursor-pointer"
              :style="selectedInterval === m
                ? 'border-color:var(--color-brand-primary);background:rgba(245,158,11,0.07);color:var(--color-brand-primary)'
                : 'border-color:var(--border-card);background:var(--surface-raised);color:var(--text-muted)'"
              @click="selectedInterval = m"
            >
              {{ m }}mo
              <!-- savings badge -->
              <span
                v-if="m > 1 && PLAN_PRICES_IQD[selectedPlan][1] * m > PLAN_PRICES_IQD[selectedPlan][m]"
                class="absolute -top-2 -right-1 text-[9px] font-bold px-1 rounded-full"
                style="background:var(--color-brand-primary);color:white"
              >
                -{{ Math.round(((PLAN_PRICES_IQD[selectedPlan][1] * m - PLAN_PRICES_IQD[selectedPlan][m]) / (PLAN_PRICES_IQD[selectedPlan][1] * m)) * 100) }}%
              </span>
            </button>
          </div>
        </div>

        <!-- Price display -->
        <div
          class="flex items-center justify-between px-4 py-3 rounded-xl"
          style="background:var(--surface-raised);border:1px solid var(--border-inner)"
        >
          <div>
            <AppText size="11" :uppercase="true" class-list="tracking-[0.12em] block" :style="`color:var(--text-subtle)`">
              Total
            </AppText>
            <AppText size="20" weight="bold" :style="`color:var(--text-heading)`">
              {{ fmtIQD(selectedPrice) }}
            </AppText>
          </div>
          <div class="text-right">
            <AppText size="12" weight="medium" :style="`color:var(--text-muted)`">
              {{ INTERVAL_LABELS[selectedInterval] }}
            </AppText>
            <AppText size="11" :style="`color:var(--text-subtle)`">via FIB Bank</AppText>
          </div>
        </div>

        <!-- CTA -->
        <AppButton
          variant="primary" size="40" radius="12"
          icon="Wallet2" :icon-config="{ color: 'white', size: 15 }"
          :text="ctaText"
          class="w-full justify-center"
          :loading="initiating"
          :disabled="alreadyOnThisPlan"
          @click="handleSubscribe"
        />

        <AppText size="11" class-list="text-center block" :style="`color:var(--text-subtle)`">
          <template v-if="alreadyOnThisPlan">
            It renews automatically on {{ fmtDate(periodEnd) }} — nothing to pay right now.
          </template>
          <template v-else>
            Paid securely via FIB Bank · IQD only · Cancel anytime
          </template>
        </AppText>
      </div>
    </template>

    <!-- ── FIB Payment modal ───────────────────────────────────────────────── -->
    <PagesDashboardSettingsFibPaymentModal
      :open="paymentModal"
      :payment="paymentData"
      :plan="modalPlan"
      :interval-months="modalInterval"
      :amount-i-q-d="modalAmount"
      @update:open="paymentModal = $event"
      @activated="handleActivated"
    />

  </div>
</template>
