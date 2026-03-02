// ============================================================
// useAdmin — Admin panel feature composable
// Central API surface for all admin management operations.
// State is owned by useAdminStore; this composable is the
// API layer that keeps the store in sync.
//
// Backend uses specific PATCH endpoints for each action
// (no generic PUT or DELETE).
// All ID parameters are validated as positive numbers.
// ============================================================

import type {
  AdminUser,
  AdminShelter,
  AdminPetshop,
  AdminClinic,
  AdminTransaction,
  AdminDonation,
  AdminUsersResponse,
  AdminSheltersResponse,
  AdminPetshopsResponse,
  AdminClinicsResponse,
  AdminTransactionsResponse,
  AdminDonationsResponse,
  AdminUserFilters,
  AdminFilters,
  AdminTransactionFilters,
  AdminDonationFilters,
} from '../types'
import { extractErrorMessage } from '../../shared/utils/extractErrorMessage'

export function useAdmin() {
  const { get, patch } = useApi()
  const adminStore = useAdminStore()

  const error = ref<string | null>(null)

  // ── Helpers ────────────────────────────────────────────────

  function isValidId(id: unknown): id is number {
    return typeof id === 'number' && id > 0
  }

  // ── Users — fetch ─────────────────────────────────────────

  /**
   * Fetch paginated user list, optionally filtered.
   */
  async function fetchUsers(filters?: AdminUserFilters): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.plan) params.set('plan', filters.plan)
      if (filters?.active !== undefined) params.set('active', String(filters.active))
      if (filters?.country) params.set('country', filters.country)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))
      const qs = params.toString()
      const path = qs ? `/api/admin/users?${qs}` : '/api/admin/users'

      const response = await get<AdminUsersResponse>(path)
      adminStore.setUsers(response.users ?? [], response.total ?? 0)
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      adminStore.setLoading(false)
    }
  }

  // ── Users — PATCH actions ─────────────────────────────────

  async function grantPro(userId: number, plan: string): Promise<boolean> {
    if (!isValidId(userId)) { error.value = 'ID de usuario inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/users/${userId}/grant-pro`, { plan })
      adminStore.updateUser(userId, { is_pro: true })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function revokePro(userId: number): Promise<boolean> {
    if (!isValidId(userId)) { error.value = 'ID de usuario inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/users/${userId}/revoke-pro`, {})
      adminStore.updateUser(userId, { is_pro: false })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function grantAdmin(userId: number): Promise<boolean> {
    if (!isValidId(userId)) { error.value = 'ID de usuario inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/users/${userId}/grant-admin`, {})
      adminStore.updateUser(userId, { is_admin: true })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function revokeAdmin(userId: number): Promise<boolean> {
    if (!isValidId(userId)) { error.value = 'ID de usuario inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/users/${userId}/revoke-admin`, {})
      adminStore.updateUser(userId, { is_admin: false })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function activateUser(userId: number): Promise<boolean> {
    if (!isValidId(userId)) { error.value = 'ID de usuario inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/users/${userId}/activate`, {})
      adminStore.updateUser(userId, { is_active: true })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function deactivateUser(userId: number): Promise<boolean> {
    if (!isValidId(userId)) { error.value = 'ID de usuario inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/users/${userId}/deactivate`, {})
      adminStore.updateUser(userId, { is_active: false })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  // ── Shelters — fetch + PATCH actions ──────────────────────

  async function fetchShelters(filters?: AdminFilters): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))
      const qs = params.toString()
      const path = qs ? `/api/admin/shelters?${qs}` : '/api/admin/shelters'

      const response = await get<AdminSheltersResponse>(path)
      adminStore.setShelters(response.shelters ?? [], response.total ?? 0)
    }
    catch (err: unknown) { error.value = extractErrorMessage(err) }
    finally { adminStore.setLoading(false) }
  }

  async function verifyShelter(id: number): Promise<boolean> {
    if (!isValidId(id)) { error.value = 'ID de refugio inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/shelters/${id}/verify`, {})
      adminStore.updateShelter(id, { is_verified: true })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function activateShelter(id: number): Promise<boolean> {
    if (!isValidId(id)) { error.value = 'ID de refugio inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/shelters/${id}/activate`, {})
      adminStore.updateShelter(id, { is_active: true })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function deactivateShelter(id: number): Promise<boolean> {
    if (!isValidId(id)) { error.value = 'ID de refugio inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/shelters/${id}/deactivate`, {})
      adminStore.updateShelter(id, { is_active: false })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  // ── Petshops — fetch + PATCH actions ──────────────────────

  async function fetchPetshops(filters?: AdminFilters): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))
      const qs = params.toString()
      const path = qs ? `/api/admin/stores?${qs}` : '/api/admin/stores'

      const response = await get<AdminPetshopsResponse>(path)
      adminStore.setPetshops(response.stores ?? [], response.total ?? 0)
    }
    catch (err: unknown) { error.value = extractErrorMessage(err) }
    finally { adminStore.setLoading(false) }
  }

  async function activateStore(id: number): Promise<boolean> {
    if (!isValidId(id)) { error.value = 'ID de tienda inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/stores/${id}/activate`, {})
      adminStore.updatePetshop(id, { is_active: true })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function deactivateStore(id: number): Promise<boolean> {
    if (!isValidId(id)) { error.value = 'ID de tienda inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/stores/${id}/deactivate`, {})
      adminStore.updatePetshop(id, { is_active: false })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function setStorePlan(id: number, plan: 'free' | 'featured'): Promise<boolean> {
    if (!isValidId(id)) { error.value = 'ID de tienda inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/stores/${id}/plan`, { plan })
      adminStore.updatePetshop(id, { plan })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  // ── Clinics — fetch + PATCH actions ───────────────────────

  async function fetchAdminClinics(filters?: AdminFilters): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))
      const qs = params.toString()
      const path = qs ? `/api/admin/clinics?${qs}` : '/api/admin/clinics'

      const response = await get<AdminClinicsResponse>(path)
      adminStore.setAdminClinics(response.clinics ?? [], response.total ?? 0)
    }
    catch (err: unknown) { error.value = extractErrorMessage(err) }
    finally { adminStore.setLoading(false) }
  }

  async function verifyClinic(id: number): Promise<boolean> {
    if (!isValidId(id)) { error.value = 'ID de clínica inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/clinics/${id}/verify`, {})
      adminStore.updateAdminClinic(id, { is_verified: true })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function activateClinic(id: number): Promise<boolean> {
    if (!isValidId(id)) { error.value = 'ID de clínica inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/clinics/${id}/activate`, {})
      adminStore.updateAdminClinic(id, { is_active: true })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function deactivateClinic(id: number): Promise<boolean> {
    if (!isValidId(id)) { error.value = 'ID de clínica inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/clinics/${id}/deactivate`, {})
      adminStore.updateAdminClinic(id, { is_active: false })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  async function setClinicPlan(id: number, plan: 'free' | 'pro'): Promise<boolean> {
    if (!isValidId(id)) { error.value = 'ID de clínica inválido.'; return false }
    error.value = null
    try {
      await patch<{ message: string }>(`/api/admin/clinics/${id}/plan`, { plan })
      adminStore.updateAdminClinic(id, { plan })
      return true
    } catch (err: unknown) { error.value = extractErrorMessage(err); return false }
  }

  // ── Transactions — fetch ──────────────────────────────────

  async function fetchTransactions(filters?: AdminTransactionFilters): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.user_id) params.set('user_id', String(filters.user_id))
      if (filters?.plan) params.set('plan', filters.plan)
      if (filters?.status) params.set('status', filters.status)
      if (filters?.from) params.set('from', filters.from)
      if (filters?.to) params.set('to', filters.to)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))
      const qs = params.toString()
      const path = qs ? `/api/admin/transactions?${qs}` : '/api/admin/transactions'

      const response = await get<AdminTransactionsResponse>(path)
      adminStore.setTransactions(response.transactions ?? [], response.total ?? 0)
    }
    catch (err: unknown) { error.value = extractErrorMessage(err) }
    finally { adminStore.setLoading(false) }
  }

  // ── Donations — fetch ─────────────────────────────────────

  async function fetchDonations(filters?: AdminDonationFilters): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.user_id) params.set('user_id', String(filters.user_id))
      if (filters?.shelter_id) params.set('shelter_id', String(filters.shelter_id))
      if (filters?.status) params.set('status', filters.status)
      if (filters?.from) params.set('from', filters.from)
      if (filters?.to) params.set('to', filters.to)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.limit) params.set('limit', String(filters.limit))
      const qs = params.toString()
      const path = qs ? `/api/admin/donations?${qs}` : '/api/admin/donations'

      const response = await get<AdminDonationsResponse>(path)
      adminStore.setDonations(response.donations ?? [], response.total ?? 0)
    }
    catch (err: unknown) { error.value = extractErrorMessage(err) }
    finally { adminStore.setLoading(false) }
  }

  return {
    error,
    adminStore,
    // Users
    fetchUsers,
    grantPro,
    revokePro,
    grantAdmin,
    revokeAdmin,
    activateUser,
    deactivateUser,
    // Shelters
    fetchShelters,
    verifyShelter,
    activateShelter,
    deactivateShelter,
    // Petshops
    fetchPetshops,
    activateStore,
    deactivateStore,
    setStorePlan,
    // Clinics
    fetchAdminClinics,
    verifyClinic,
    activateClinic,
    deactivateClinic,
    setClinicPlan,
    // Transactions & Donations
    fetchTransactions,
    fetchDonations,
  }
}

