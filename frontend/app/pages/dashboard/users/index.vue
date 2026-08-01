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
// Admins asked to control density. Backend caps `limit` at 100 (see API conventions
// in backend/CLAUDE.md), so 100 is the highest option we can offer.
const PAGE_SIZES = [10, 25, 50, 100]
const LIMIT_KEY = 'admin-users-page-size'
const limit = ref(25)
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

// ── Fetch ──────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  const res = await listUsers({
    page: page.value,
    limit: limit.value,
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

    // Landing past the end (deleted rows, a narrower filter, a bigger page size)
    // used to leave an empty table with no way to tell why. Snap back and refetch.
    // max(1, …) also covers a zero-result response, where totalPages is 0.
    const maxPage = Math.max(1, totalPages.value)
    if (page.value > maxPage) {
      page.value = maxPage   // triggers the page watcher → load() runs again
      return
    }
  }
  loading.value = false
}

onMounted(() => {
  const stored = Number(localStorage.getItem(LIMIT_KEY))
  if (PAGE_SIZES.includes(stored)) limit.value = stored
  load()
})

function onLimitChange(next: number) {
  limit.value = next
  page.value = 1
  try { localStorage.setItem(LIMIT_KEY, String(next)) } catch { /* private mode */ }
}

// Debounced search
let searchTimer: ReturnType<typeof setTimeout>
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; load() }, 300)
})

watch([roleFilter, statusFilter, planFilter, createdAfter, createdBefore, page, limit], load)

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
              <!-- Breakpoints here are the project's custom ones (main.css): md-lg=1024,
                   lg=1200, xl=1440. These were xl:, so the ban toggle and Joined date
                   were invisible on any laptop under 1440px. -->
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden md-lg:table-cell" :style="`color:var(--text-muted)`">Subscription</th>
              <!-- "Account" not "Status": this is the isActive ban switch, and two
                   columns both called Status is how an admin bans the wrong person. -->
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden md-lg:table-cell" :style="`color:var(--text-muted)`">Account</th>
              <th class="px-4 py-3 text-left text-[14px] font-semibold font-poppins hidden lg:table-cell" :style="`color:var(--text-muted)`">Joined</th>
              <th class="px-2 py-3 w-10" />
              <th class="px-4 py-3 w-12" />
            </tr>
          </thead>

          <!-- Skeleton -->
          <tbody v-if="loading">
            <tr v-for="n in Math.min(limit, 10)" :key="n" style="border-bottom:1px solid var(--border-inner)">
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

      <!-- Pagination — always shown, so the count and page size stay reachable
           even when everything fits on one page -->
      <PagesDashboardUsersUsersPagination
        :page="page"
        :total-pages="totalPages"
        :total="total"
        :limit="limit"
        :page-sizes="PAGE_SIZES"
        @update:page="page = $event"
        @update:limit="onLimitChange"
      />
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
