// ============================================================
// useAdmin — Admin panel feature composable
// Central API surface for all admin management operations.
// State is owned by useAdminStore; this composable is the
// API layer that keeps the store in sync.
// All ID parameters are validated before use in API paths
// to prevent path traversal attacks.
// ============================================================

import type {
  AdminStats,
  AdminUser,
  AdminShelter,
  AdminPetshop,
  AdminClinic,
  AdminTransaction,
  AdminUsersResponse,
  AdminSheltersResponse,
  AdminPetshopsResponse,
  AdminClinicsResponse,
  AdminTransactionsResponse,
  AdminUserFilters,
  AdminFilters,
} from '../types'

/** Validate string IDs before interpolation into API paths. */
const ID_PATTERN = /^[\w-]{1,64}$/

export function useAdmin() {
  const { get, put, del } = useApi()
  const adminStore = useAdminStore()

  const error = ref<string | null>(null)

  // ── Stats ───────────────────────────────────────────────────

  /**
   * Fetch platform KPI statistics.
   * Handles both `{ stats: AdminStats }` envelope and a direct AdminStats object.
   */
  async function fetchStats(): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const response = await get<{ stats: AdminStats } | AdminStats>('/api/admin/stats')
      if ('stats' in response && typeof (response as { stats: AdminStats }).stats === 'object') {
        adminStore.setStats((response as { stats: AdminStats }).stats)
      }
      else {
        adminStore.setStats(response as AdminStats)
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      adminStore.setLoading(false)
    }
  }

  // ── Users ───────────────────────────────────────────────────

  /**
   * Fetch paginated user list, optionally filtered.
   * Handles both `{ users: AdminUser[] }` envelope and plain `AdminUser[]` shapes.
   */
  async function fetchUsers(filters?: AdminUserFilters): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.is_pro !== undefined) params.set('is_pro', String(filters.is_pro))
      if (filters?.is_admin !== undefined) params.set('is_admin', String(filters.is_admin))
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.per_page) params.set('per_page', String(filters.per_page))
      const qs = params.toString()
      const path = qs ? `/api/admin/users?${qs}` : '/api/admin/users'

      const response = await get<AdminUsersResponse | AdminUser[]>(path)
      if (Array.isArray(response)) {
        adminStore.setUsers(response, response.length)
      }
      else {
        adminStore.setUsers(response.users ?? [], response.total ?? 0)
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      adminStore.setLoading(false)
    }
  }

  /**
   * Update a user's fields (e.g. is_pro, is_admin toggles).
   * Validates numeric ID before API call.
   * Returns true on success, false on failure.
   */
  async function updateUser(userId: number, data: Partial<AdminUser>): Promise<boolean> {
    if (typeof userId !== 'number' || userId <= 0) {
      error.value = 'ID de usuario inválido.'
      return false
    }
    error.value = null
    try {
      await put<AdminUser>(`/api/admin/users/${userId}`, data)
      adminStore.updateUser(userId, data)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
  }

  /**
   * Delete a user account permanently.
   * Validates numeric ID before API call.
   * Returns true on success, false on failure.
   */
  async function deleteUser(userId: number): Promise<boolean> {
    if (typeof userId !== 'number' || userId <= 0) {
      error.value = 'ID de usuario inválido.'
      return false
    }
    error.value = null
    try {
      await del(`/api/admin/users/${userId}`)
      adminStore.removeUser(userId)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
  }

  // ── Shelters ────────────────────────────────────────────────

  /**
   * Fetch paginated shelter list.
   * Handles both `{ shelters: AdminShelter[] }` envelope and plain array.
   */
  async function fetchShelters(filters?: AdminFilters): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.per_page) params.set('per_page', String(filters.per_page))
      const qs = params.toString()
      const path = qs ? `/api/admin/shelters?${qs}` : '/api/admin/shelters'

      const response = await get<AdminSheltersResponse | AdminShelter[]>(path)
      if (Array.isArray(response)) {
        adminStore.setShelters(response, response.length)
      }
      else {
        adminStore.setShelters(response.shelters ?? [], response.total ?? 0)
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      adminStore.setLoading(false)
    }
  }

  /**
   * Update a shelter's fields (e.g. is_verified, is_featured toggles).
   * Validates string ID with ID_PATTERN before API call.
   */
  async function updateShelter(shelterId: string, data: Partial<AdminShelter>): Promise<boolean> {
    if (!ID_PATTERN.test(shelterId)) {
      error.value = 'ID de refugio inválido.'
      return false
    }
    error.value = null
    try {
      await put<AdminShelter>(`/api/admin/shelters/${shelterId}`, data)
      adminStore.updateShelter(shelterId, data)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
  }

  /**
   * Delete a shelter permanently.
   * Validates string ID with ID_PATTERN before API call.
   */
  async function deleteShelter(shelterId: string): Promise<boolean> {
    if (!ID_PATTERN.test(shelterId)) {
      error.value = 'ID de refugio inválido.'
      return false
    }
    error.value = null
    try {
      await del(`/api/admin/shelters/${shelterId}`)
      adminStore.removeShelter(shelterId)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
  }

  // ── Petshops ────────────────────────────────────────────────

  /**
   * Fetch paginated petshop list.
   * Handles both `{ stores: AdminPetshop[] }` envelope and plain array.
   */
  async function fetchPetshops(filters?: AdminFilters): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.per_page) params.set('per_page', String(filters.per_page))
      const qs = params.toString()
      const path = qs ? `/api/admin/stores?${qs}` : '/api/admin/stores'

      const response = await get<AdminPetshopsResponse | AdminPetshop[]>(path)
      if (Array.isArray(response)) {
        adminStore.setPetshops(response, response.length)
      }
      else {
        adminStore.setPetshops(
          (response as AdminPetshopsResponse).stores ?? [],
          (response as AdminPetshopsResponse).total ?? 0,
        )
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      adminStore.setLoading(false)
    }
  }

  /**
   * Update a petshop's fields (e.g. is_verified, is_featured toggles).
   * Validates string ID with ID_PATTERN before API call.
   */
  async function updatePetshop(petshopId: string, data: Partial<AdminPetshop>): Promise<boolean> {
    if (!ID_PATTERN.test(petshopId)) {
      error.value = 'ID de tienda inválido.'
      return false
    }
    error.value = null
    try {
      await put<AdminPetshop>(`/api/admin/stores/${petshopId}`, data)
      adminStore.updatePetshop(petshopId, data)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
  }

  /**
   * Delete a petshop permanently.
   * Validates string ID with ID_PATTERN before API call.
   */
  async function deletePetshop(petshopId: string): Promise<boolean> {
    if (!ID_PATTERN.test(petshopId)) {
      error.value = 'ID de tienda inválido.'
      return false
    }
    error.value = null
    try {
      await del(`/api/admin/stores/${petshopId}`)
      adminStore.removePetshop(petshopId)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
  }

  // ── Admin Clinics ───────────────────────────────────────────

  /**
   * Fetch paginated clinic list for admin management.
   * Handles both `{ clinics: AdminClinic[] }` envelope and plain array.
   */
  async function fetchAdminClinics(filters?: AdminFilters): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.per_page) params.set('per_page', String(filters.per_page))
      const qs = params.toString()
      const path = qs ? `/api/admin/clinics?${qs}` : '/api/admin/clinics'

      const response = await get<AdminClinicsResponse | AdminClinic[]>(path)
      if (Array.isArray(response)) {
        adminStore.setAdminClinics(response, response.length)
      }
      else {
        adminStore.setAdminClinics(response.clinics ?? [], response.total ?? 0)
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      adminStore.setLoading(false)
    }
  }

  /**
   * Update a clinic's fields (e.g. is_verified, is_featured toggles).
   * Validates string ID with ID_PATTERN before API call.
   */
  async function updateAdminClinic(clinicId: string, data: Partial<AdminClinic>): Promise<boolean> {
    if (!ID_PATTERN.test(clinicId)) {
      error.value = 'ID de clínica inválido.'
      return false
    }
    error.value = null
    try {
      await put<AdminClinic>(`/api/admin/clinics/${clinicId}`, data)
      adminStore.updateAdminClinic(clinicId, data)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
  }

  /**
   * Delete a clinic permanently.
   * Validates string ID with ID_PATTERN before API call.
   */
  async function deleteAdminClinic(clinicId: string): Promise<boolean> {
    if (!ID_PATTERN.test(clinicId)) {
      error.value = 'ID de clínica inválido.'
      return false
    }
    error.value = null
    try {
      await del(`/api/admin/clinics/${clinicId}`)
      adminStore.removeAdminClinic(clinicId)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
  }

  // ── Transactions ────────────────────────────────────────────

  /**
   * Fetch paginated transaction log.
   * Handles both `{ transactions: AdminTransaction[] }` envelope and plain array.
   */
  async function fetchTransactions(filters?: AdminFilters): Promise<void> {
    adminStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.page) params.set('page', String(filters.page))
      if (filters?.per_page) params.set('per_page', String(filters.per_page))
      const qs = params.toString()
      const path = qs ? `/api/admin/transactions?${qs}` : '/api/admin/transactions'

      const response = await get<AdminTransactionsResponse | AdminTransaction[]>(path)
      if (Array.isArray(response)) {
        adminStore.setTransactions(response, response.length)
      }
      else {
        adminStore.setTransactions(response.transactions ?? [], response.total ?? 0)
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      adminStore.setLoading(false)
    }
  }

  return {
    error,
    adminStore,
    fetchStats,
    fetchUsers,
    updateUser,
    deleteUser,
    fetchShelters,
    updateShelter,
    deleteShelter,
    fetchPetshops,
    updatePetshop,
    deletePetshop,
    fetchAdminClinics,
    updateAdminClinic,
    deleteAdminClinic,
    fetchTransactions,
  }
}

// ── Helpers ─────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    if ('data' in err) {
      const data = (err as { data: unknown }).data
      if (typeof data === 'object' && data !== null && 'error' in data) {
        return String((data as { error: unknown }).error)
      }
      if (typeof data === 'string' && data.length > 0) return data
    }
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message
    }
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
