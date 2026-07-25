import type {
  AdminUserItem,
  AdminUserListMeta,
  AdminDashboardData,
  PatchUserInput,
  AssignSubscriptionInput,
  UserRole,
  SubStatus,
  PlanId,
} from '~/common/types/admin-types'

interface ApiResponse<T> { success: boolean; message?: string; data: T }
interface ListResponse<T> { success: boolean; data: T[]; meta: AdminUserListMeta }

export interface UserListFilters {
  page: number
  limit: number
  search: string
  role: UserRole | 'ALL'
  subscriptionStatus: SubStatus | 'ALL'
  plan?: PlanId | 'ALL'
  createdAfter?: string
  createdBefore?: string
}

export function useAdmin() {

  // ── Dashboard stats ────────────────────────────────────────────────────────

  async function getDashboardStats() {
    return await useHttp<ApiResponse<AdminDashboardData>>({
      method: 'GET',
      url: '/admin/dashboard',
      requireAuth: true,
      showToast: false,
    })
  }

  // ── Users list ─────────────────────────────────────────────────────────────

  async function listUsers(filters: UserListFilters) {
    const params = new URLSearchParams()
    params.set('page', String(filters.page))
    params.set('limit', String(filters.limit))
    if (filters.search) params.set('search', filters.search)
    if (filters.role !== 'ALL') params.set('role', filters.role)
    if (filters.subscriptionStatus !== 'ALL') params.set('subscriptionStatus', filters.subscriptionStatus)
    if (filters.plan && filters.plan !== 'ALL') params.set('plan', filters.plan)
    if (filters.createdAfter) params.set('createdAfter', filters.createdAfter)
    if (filters.createdBefore) params.set('createdBefore', filters.createdBefore)

    return await useHttp<ListResponse<AdminUserItem>>({
      method: 'GET',
      url: `/users?${params.toString()}`,
      requireAuth: true,
      showToast: false,
    })
  }

  // ── Single user (full detail via GET /users/:id) ───────────────────────────

  async function getUser(id: string) {
    return await useHttp<ApiResponse<AdminUserItem>>({
      method: 'GET',
      url: `/users/${id}`,
      requireAuth: true,
      showToast: false,
    })
  }

  // ── Patch user (role / isActive) ───────────────────────────────────────────

  async function patchUser(id: string, input: PatchUserInput) {
    return await useHttp<ApiResponse<AdminUserItem>>({
      method: 'PATCH',
      url: `/admin/users/${id}`,
      body: input,
      requireAuth: true,
      showToast: true,
    })
  }

  // ── Assign subscription ────────────────────────────────────────────────────

  async function assignSubscription(id: string, input: AssignSubscriptionInput) {
    return await useHttp<ApiResponse<unknown>>({
      method: 'PUT',
      url: `/admin/users/${id}/subscription`,
      body: input,
      requireAuth: true,
      showToast: true,
    })
  }

  // ── Cancel subscription ────────────────────────────────────────────────────

  async function cancelSubscription(id: string) {
    return await useHttp<ApiResponse<null>>({
      method: 'DELETE',
      url: `/admin/users/${id}/subscription`,
      requireAuth: true,
      showToast: true,
    })
  }

  async function adminUpdateProfile(id: string, input: { displayName?: string; phoneNumber?: string | null }) {
    return await useHttp<ApiResponse<unknown>>({
      method: 'PATCH',
      url: `/admin/users/${id}/profile`,
      body: input,
      requireAuth: true,
      showToast: true,
    })
  }

  async function adminUploadAvatar(id: string, file: File) {
    const form = new FormData()
    form.append('avatar', file)
    return await useHttp<ApiResponse<{ avatarUrl: string }>>({
      method: 'POST',
      url: `/admin/users/${id}/avatar`,
      body: form,
      requireAuth: true,
      showToast: true,
    })
  }

  async function adminUpdateLearnerProfile(id: string, input: Record<string, unknown>) {
    return await useHttp<ApiResponse<unknown>>({
      method: 'PATCH',
      url: `/admin/users/${id}/learner-profile`,
      body: input,
      requireAuth: true,
      showToast: true,
    })
  }

  return {
    getDashboardStats,
    listUsers,
    getUser,
    patchUser,
    assignSubscription,
    cancelSubscription,
    adminUpdateProfile,
    adminUploadAvatar,
    adminUpdateLearnerProfile,
  }
}
