<script setup lang="ts">
import { useAdmin } from '~/composables/useAdmin'
import type { AdminUserItem, AssignSubscriptionInput, UserRole, SubStatus, PlanId } from '~/common/types/admin-types'

definePageMeta({ layout: 'dashboard', requiresAuth: true, requiresAdmin: true })

const { listUsers, patchUser, assignSubscription, cancelSubscription } = useAdmin()
const route = useRoute()

// ── State ──────────────────────────────────────────────────────────────────
const users = ref<AdminUserItem[]>([])
const total = ref(0)
const totalPages = ref(1)
const loading = ref(false)

// Seed filters from URL query (?role=TUTOR&subscriptionStatus=ACTIVE) so
// deep-links from the admin dashboard land on a pre-filtered list.
const ROLES: UserRole[] = ['STUDENT', 'TUTOR', 'ADMIN']
const STATUSES: SubStatus[] = ['ACTIVE', 'INACTIVE', 'CANCELLED', 'PAST_DUE']
const initialRole = ROLES.includes(route.query.role as UserRole) ? (route.query.role as UserRole) : 'ALL'
const initialStatus = STATUSES.includes(route.query.subscriptionStatus as SubStatus)
  ? (route.query.subscriptionStatus as SubStatus)
  : 'ALL'

const page = ref(1)
const search = ref('')
const roleFilter = ref<UserRole | 'ALL'>(initialRole)
const statusFilter = ref<SubStatus | 'ALL'>(initialStatus)
const planFilter = ref<PlanId | 'ALL'>('ALL')
const createdAfter = ref('')
const createdBefore = ref('')

const assignTargetId = ref<string | null>(null)
const assignOpen = ref(false)
const assignSaving = ref(false)

const cancelTarget = ref<AdminUserItem | null>(null)
const cancelOpen = ref(false)
const cancelSaving = ref(false)

const roleTarget = ref<AdminUserItem | null>(null)
const roleOpen = ref(false)
const roleSaving = ref(false)

// Pagination page numbers to display (max 5 around current)
const pageNumbers = computed(() => {
  const total = totalPages.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const cur = page.value
  const pages: (number | '…')[] = [1]
  if (cur > 3) pages.push('…')
  for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
  if (cur < total - 2) pages.push('…')
  pages.push(total)
  return pages
})

// ── Fetch ──────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  const res = await listUsers({
    page: page.value,
    limit: 8,
    search: search.value,
    role: roleFilter.value,
    subscriptionStatus: statusFilter.value,
    plan: planFilter.value,
    createdAfter: createdAfter.value,
    createdBefore: createdBefore.value,
  })
  if (res.success && res.data) {
    users.value = res.data.data ?? []
    total.value = res.data.meta?.total ?? 0
    totalPages.value = res.data.meta?.totalPages ?? 1
  }
  loading.value = false
}

onMounted(load)

// Debounced search
let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, 300)
})

watch([roleFilter, statusFilter, planFilter, createdAfter, createdBefore, page], load)

// ── Actions ────────────────────────────────────────────────────────────────
const togglingId = ref<string | null>(null)

async function onToggleStatus(userId: string, isActive: boolean) {
  togglingId.value = userId
  const res = await patchUser(userId, { isActive })
  if (res.success && res.data?.data) {
    const idx = users.value.findIndex(u => u.id === userId)
    if (idx !== -1) users.value[idx] = res.data.data
  }
  togglingId.value = null
}

function onChangeRole(user: AdminUserItem) {
  roleTarget.value = user
  roleOpen.value = true
}

async function onSaveRole(role: UserRole) {
  if (!roleTarget.value) return
  const targetId = roleTarget.value.id
  roleSaving.value = true
  const res = await patchUser(targetId, { role })
  roleSaving.value = false
  // Keep the dialog open on failure (e.g. last-admin 409) so the toast reads
  // against the row the admin was acting on.
  if (!res.success) return
  roleOpen.value = false
  // A role filter is active: the row may no longer belong in this result set,
  // so refetch instead of patching it in place.
  if (roleFilter.value !== 'ALL') { load(); return }
  if (res.data?.data) {
    const idx = users.value.findIndex(u => u.id === targetId)
    if (idx !== -1) users.value[idx] = res.data.data
  }
}

function onAssignSubscription(user: AdminUserItem) {
  assignTargetId.value = user.id
  assignOpen.value = true
}

async function onSaveSubscription(input: AssignSubscriptionInput) {
  if (!assignTargetId.value) return
  assignSaving.value = true
  await assignSubscription(assignTargetId.value, input)
  assignSaving.value = false
  assignOpen.value = false
  load()
}

function onCancelSubscription(user: AdminUserItem) {
  cancelTarget.value = user
  cancelOpen.value = true
}

async function confirmCancel() {
  if (!cancelTarget.value) return
  cancelSaving.value = true
  await cancelSubscription(cancelTarget.value.id)
  cancelSaving.value = false
  cancelOpen.value = false
  load()
}
</script>

<template>
  <div class="h-full overflow-y-auto p-5 sm:p-7 space-y-5">

    <!-- Header -->
    <div class="animate-card-enter" style="--delay:0ms">
      <h1 class="text-[28px] font-semibold tracking-[-0.02em] font-poppins" :style="`color:var(--text-heading)`">Users</h1>
      <p class="text-[14px] mt-1 font-poppins" :style="`color:var(--text-muted)`">Manage accounts, roles and subscriptions.</p>
    </div>

    <!-- Filters -->
    <div class="animate-card-enter" style="--delay:60ms">
      <PagesDashboardUsersUserFilters
        :search="search"
        :role="roleFilter"
        :subscription-status="statusFilter"
        :plan="planFilter"
        :created-after="createdAfter"
        :created-before="createdBefore"
        @update:search="search = $event"
        @update:role="roleFilter = $event; page = 1"
        @update:subscription-status="statusFilter = $event; page = 1"
        @update:plan="planFilter = $event; page = 1"
        @update:created-after="createdAfter = $event; page = 1"
        @update:created-before="createdBefore = $event; page = 1"
      />
    </div>

    <!-- Table card -->
    <div class="dash-card overflow-hidden animate-card-enter" style="--delay:120ms">
      <!-- Table header -->
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr style="border-bottom:1px solid var(--border-inner); background:var(--surface-raised)">
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins" :style="`color:var(--text-muted)`">User</th>
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden sm:table-cell" :style="`color:var(--text-muted)`">Role</th>
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden md:table-cell" :style="`color:var(--text-muted)`">Plan</th>
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden lg:table-cell" :style="`color:var(--text-muted)`">Subscription Status</th>
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden xl:table-cell" :style="`color:var(--text-muted)`">Status</th>
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden xl:table-cell" :style="`color:var(--text-muted)`">Joined</th>
              <th class="px-2 py-3 w-10" />
              <th class="px-4 py-3 w-12" />
            </tr>
          </thead>

          <!-- Skeleton -->
          <tbody v-if="loading">
            <tr v-for="n in 8" :key="n" style="border-bottom:1px solid var(--border-inner)">
              <td class="px-4 py-3" colspan="8">
                <UiSkeleton class="h-10 rounded-xl" />
              </td>
            </tr>
          </tbody>

          <!-- Empty -->
          <tbody v-else-if="!users.length">
            <tr>
              <td colspan="8" class="py-16">
                <UiEmpty>
                  <UiEmptyMedia>
                    <AppIconsax name="People" color="var(--color-text-subtle)" :size="32" />
                  </UiEmptyMedia>
                  <UiEmptyContent>
                    <UiEmptyTitle>No users found</UiEmptyTitle>
                    <UiEmptyDescription>Try adjusting your filters or search query.</UiEmptyDescription>
                  </UiEmptyContent>
                </UiEmpty>
              </td>
            </tr>
          </tbody>

          <!-- Rows -->
          <tbody v-else>
            <PagesDashboardUsersUserTableRow
              v-for="u in users"
              :key="u.id"
              :user="u"
              :toggling="togglingId === u.id"
              @toggle-status="onToggleStatus"
              @change-role="onChangeRole"
              @assign-subscription="onAssignSubscription"
              @cancel-subscription="onCancelSubscription"
            />
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 flex-wrap gap-2" style="border-top:1px solid var(--border-inner)">
        <p class="text-[14px] font-poppins" :style="`color:var(--text-muted)`">
          {{ total }} users · page {{ page }} of {{ totalPages }}
        </p>
        <div class="flex items-center gap-1">
          <AppButton variant="secondary" size="32" radius="8" icon="ArrowLeft" :disabled="page <= 1" @click="page--" />
          <template v-for="p in pageNumbers" :key="String(p)">
            <span
              v-if="p === '…'"
              class="w-8 text-center text-[14px] font-poppins select-none"
              :style="`color:var(--text-subtle)`"
            >…</span>
            <button
              v-else
              class="w-8 h-8 rounded-lg text-[14px] font-semibold font-poppins transition-colors cursor-pointer"
              :style="p === page
                ? 'background:var(--color-brand-primary);color:white'
                : 'color:var(--text-muted)'"
              :class="p !== page ? 'hover:bg-surface-raised' : ''"
              @click="page = p as number"
            >{{ p }}</button>
          </template>
          <AppButton variant="secondary" size="32" radius="8" icon="ArrowRight" :disabled="page >= totalPages" @click="page++" />
        </div>
      </div>
    </div>

    <!-- Change role modal -->
    <PagesDashboardUsersChangeRoleDialog
      :open="roleOpen"
      :user="roleTarget"
      :saving="roleSaving"
      @update:open="roleOpen = $event"
      @save="onSaveRole"
    />

    <!-- Assign subscription modal -->
    <PagesDashboardUsersAssignSubscriptionModal
      :open="assignOpen"
      :user-id="assignTargetId"
      :saving="assignSaving"
      @update:open="assignOpen = $event"
      @save="onSaveSubscription"
    />

    <!-- Cancel subscription confirm -->
    <UiAlertDialog :open="cancelOpen" @update:open="cancelOpen = $event">
      <UiAlertDialogContent>
        <UiAlertDialogHeader>
          <UiAlertDialogTitle>Cancel subscription?</UiAlertDialogTitle>
          <UiAlertDialogDescription>
            {{ cancelTarget?.displayName || cancelTarget?.username }} will be downgraded to Free ACTIVE. They keep AI access at Free tier limits.
          </UiAlertDialogDescription>
        </UiAlertDialogHeader>
        <UiAlertDialogFooter>
          <UiAlertDialogCancel>Keep it</UiAlertDialogCancel>
          <UiAlertDialogAction
            class="bg-red-500 hover:bg-red-600 text-white"
            :disabled="cancelSaving"
            @click="confirmCancel"
          >
            {{ cancelSaving ? 'Cancelling…' : 'Cancel subscription' }}
          </UiAlertDialogAction>
        </UiAlertDialogFooter>
      </UiAlertDialogContent>
    </UiAlertDialog>

  </div>
</template>
