// ============================================================
// useAdmin.test.ts
// Tests the useAdmin composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT the right tool.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs and we can spy on it.
//   - ID validation guards are tested to ensure path-traversal protection.
//
// What this suite does NOT cover intentionally:
//   - Component rendering — covered in component test files.
//   - Network retry logic — none exists.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type {
  AdminUser,
  AdminShelter,
  AdminPetshop,
  AdminClinic,
  AdminTransaction,
  AdminStats,
} from '../types'

// ── useApi mock ───────────────────────────────────────────────

const mockGet = vi.fn()
const mockPut = vi.fn()
const mockDel = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet, put: mockPut, del: mockDel }),
}))

// ── Fixtures ─────────────────────────────────────────────────

function makeStats(overrides: Partial<AdminStats> = {}): AdminStats {
  return {
    total_users: 100,
    total_pets: 250,
    total_shelters: 15,
    total_clinics: 20,
    total_stores: 30,
    total_adoptions: 45,
    total_pro_subscriptions: 60,
    total_donations: 80,
    revenue_total: 5000000,
    revenue_month: 300000,
    ...overrides,
  }
}

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 1,
    name: 'Juan',
    last_name: 'Pérez',
    email: 'juan@example.com',
    country: 'Colombia',
    city: 'Bogotá',
    is_pro: false,
    is_admin: false,
    pets_count: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeShelter(overrides: Partial<AdminShelter> = {}): AdminShelter {
  return {
    id: 'shelter-1',
    name: 'Refugio Los Amigos',
    city: 'Bogotá',
    is_verified: false,
    is_featured: false,
    pets_count: 5,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makePetshop(overrides: Partial<AdminPetshop> = {}): AdminPetshop {
  return {
    id: 'shop-1',
    name: 'Tienda Mascota Feliz',
    city: 'Medellín',
    is_verified: false,
    is_featured: false,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeClinic(overrides: Partial<AdminClinic> = {}): AdminClinic {
  return {
    id: 'clinic-1',
    name: 'Clínica Vet Norte',
    city: 'Cali',
    is_verified: false,
    is_featured: false,
    specialties: ['Cirugía'],
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeTransaction(overrides: Partial<AdminTransaction> = {}): AdminTransaction {
  return {
    id: 'txn-1',
    user_id: 1,
    user_name: 'Juan Pérez',
    user_email: 'juan@example.com',
    type: 'subscription',
    amount: 49000,
    currency: 'COP',
    status: 'completed',
    description: 'PRO mensual',
    created_at: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

const userA = makeUser({ id: 1 })
const userB = makeUser({ id: 2, name: 'María' })
const shelterA = makeShelter({ id: 'shelter-1' })
const petshopA = makePetshop({ id: 'shop-1' })
const clinicA = makeClinic({ id: 'clinic-1' })
const txA = makeTransaction({ id: 'txn-1' })

// ── Suite ─────────────────────────────────────────────────────

describe('useAdmin', () => {
  let adminStore: ReturnType<typeof import('../stores/admin.store').useAdminStore>

  beforeEach(async () => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )
    const { useAdminStore } = await import('../stores/admin.store')
    adminStore = useAdminStore()
    mockGet.mockReset()
    mockPut.mockReset()
    mockDel.mockReset()
  })

  // ── fetchStats ──────────────────────────────────────────────

  describe('fetchStats()', () => {
    it('calls GET /api/admin/stats', async () => {
      mockGet.mockResolvedValueOnce(makeStats())
      const { useAdmin } = await import('./useAdmin')
      const { fetchStats } = useAdmin()
      await fetchStats()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/stats')
    })

    it('hydrates the store with a direct AdminStats object', async () => {
      const stats = makeStats({ total_users: 42 })
      mockGet.mockResolvedValueOnce(stats)
      const setStatsSpy = vi.spyOn(adminStore, 'setStats')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchStats()
      expect(setStatsSpy).toHaveBeenCalledWith(stats)
    })

    it('hydrates the store from a { stats: AdminStats } envelope', async () => {
      const stats = makeStats({ total_users: 77 })
      mockGet.mockResolvedValueOnce({ stats })
      const setStatsSpy = vi.spyOn(adminStore, 'setStats')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchStats()
      expect(setStatsSpy).toHaveBeenCalledWith(stats)
    })

    it('sets isLoading true during fetch and false after', async () => {
      let loadingDuring = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuring = adminStore.isLoading
        return makeStats()
      })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchStats()
      expect(loadingDuring).toBe(true)
      expect(adminStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchStats, error } = useAdmin()
      await fetchStats()
      expect(error.value).toBe('Network error')
    })

    it('clears a previous error on successful fetch', async () => {
      mockGet.mockRejectedValueOnce({ message: 'fail' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchStats, error } = useAdmin()
      await fetchStats()
      expect(error.value).toBeTruthy()
      mockGet.mockResolvedValueOnce(makeStats())
      await fetchStats()
      expect(error.value).toBeNull()
    })

    it('sets isLoading false even when the fetch throws', async () => {
      mockGet.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchStats()
      expect(adminStore.isLoading).toBe(false)
    })
  })

  // ── fetchUsers ──────────────────────────────────────────────

  describe('fetchUsers()', () => {
    it('calls GET /api/admin/users when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce([userA])
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/users')
    })

    it('appends search filter to query string', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers({ search: 'juan' })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/users?search=juan')
    })

    it('appends is_pro filter to query string', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers({ is_pro: true })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/users?is_pro=true')
    })

    it('appends is_admin filter to query string', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers({ is_admin: false })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/users?is_admin=false')
    })

    it('appends page and per_page to query string', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers({ page: 2, per_page: 20 })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/users?page=2&per_page=20')
    })

    it('hydrates the store when the response is a plain AdminUser array', async () => {
      mockGet.mockResolvedValueOnce([userA, userB])
      const setUsersSpy = vi.spyOn(adminStore, 'setUsers')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers()
      expect(setUsersSpy).toHaveBeenCalledWith([userA, userB], 2)
    })

    it('hydrates the store from a { users, total } envelope', async () => {
      mockGet.mockResolvedValueOnce({ users: [userA], total: 42, page: 1, per_page: 20 })
      const setUsersSpy = vi.spyOn(adminStore, 'setUsers')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers()
      expect(setUsersSpy).toHaveBeenCalledWith([userA], 42)
    })

    it('uses empty array and 0 when envelope users field is missing', async () => {
      mockGet.mockResolvedValueOnce({ total: 0, page: 1, per_page: 20 })
      const setUsersSpy = vi.spyOn(adminStore, 'setUsers')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers()
      expect(setUsersSpy).toHaveBeenCalledWith([], 0)
    })

    it('sets error on API failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Forbidden' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchUsers, error } = useAdmin()
      await fetchUsers()
      expect(error.value).toBe('Forbidden')
    })

    it('sets isLoading false after failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers()
      expect(adminStore.isLoading).toBe(false)
    })
  })

  // ── updateUser ──────────────────────────────────────────────

  describe('updateUser()', () => {
    it('calls PUT /api/admin/users/:id with the provided data', async () => {
      mockPut.mockResolvedValueOnce(userA)
      adminStore.setUsers([userA], 1)
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().updateUser(1, { is_pro: true })
      expect(mockPut).toHaveBeenCalledWith('/api/admin/users/1', { is_pro: true })
    })

    it('calls adminStore.updateUser on success', async () => {
      mockPut.mockResolvedValueOnce(userA)
      adminStore.setUsers([userA], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateUser')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().updateUser(1, { is_pro: true })
      expect(updateSpy).toHaveBeenCalledWith(1, { is_pro: true })
    })

    it('returns true on success', async () => {
      mockPut.mockResolvedValueOnce(userA)
      adminStore.setUsers([userA], 1)
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().updateUser(1, { is_pro: true })
      expect(result).toBe(true)
    })

    it('returns false and sets error for invalid user id (0)', async () => {
      const { useAdmin } = await import('./useAdmin')
      const { updateUser, error } = useAdmin()
      const result = await updateUser(0, { is_pro: true })
      expect(result).toBe(false)
      expect(error.value).toBe('ID de usuario inválido.')
      expect(mockPut).not.toHaveBeenCalled()
    })

    it('returns false and sets error for negative user id', async () => {
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().updateUser(-5, { is_admin: true })
      expect(result).toBe(false)
      expect(mockPut).not.toHaveBeenCalled()
    })

    it('returns false and sets error when API call fails', async () => {
      mockPut.mockRejectedValueOnce({ message: 'Server error' })
      const { useAdmin } = await import('./useAdmin')
      const { updateUser, error } = useAdmin()
      const result = await updateUser(1, { is_pro: true })
      expect(result).toBe(false)
      expect(error.value).toBe('Server error')
    })
  })

  // ── deleteUser ──────────────────────────────────────────────

  describe('deleteUser()', () => {
    it('calls DELETE /api/admin/users/:id', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      adminStore.setUsers([userA], 1)
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deleteUser(1)
      expect(mockDel).toHaveBeenCalledWith('/api/admin/users/1')
    })

    it('calls adminStore.removeUser on success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      adminStore.setUsers([userA], 1)
      const removeSpy = vi.spyOn(adminStore, 'removeUser')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deleteUser(1)
      expect(removeSpy).toHaveBeenCalledWith(1)
    })

    it('returns true on success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().deleteUser(1)
      expect(result).toBe(true)
    })

    it('returns false and sets error for invalid id (0)', async () => {
      const { useAdmin } = await import('./useAdmin')
      const { deleteUser, error } = useAdmin()
      const result = await deleteUser(0)
      expect(result).toBe(false)
      expect(error.value).toBe('ID de usuario inválido.')
      expect(mockDel).not.toHaveBeenCalled()
    })

    it('returns false when API call fails', async () => {
      mockDel.mockRejectedValueOnce({ message: 'fail' })
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().deleteUser(1)
      expect(result).toBe(false)
    })
  })

  // ── fetchShelters ───────────────────────────────────────────

  describe('fetchShelters()', () => {
    it('calls GET /api/admin/shelters when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce([shelterA])
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchShelters()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/shelters')
    })

    it('appends search filter to query string', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchShelters({ search: 'norte' })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/shelters?search=norte')
    })

    it('hydrates the store from a plain array response', async () => {
      mockGet.mockResolvedValueOnce([shelterA])
      const setSpy = vi.spyOn(adminStore, 'setShelters')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchShelters()
      expect(setSpy).toHaveBeenCalledWith([shelterA], 1)
    })

    it('hydrates the store from a { shelters, total } envelope', async () => {
      mockGet.mockResolvedValueOnce({ shelters: [shelterA], total: 5, page: 1, per_page: 20 })
      const setSpy = vi.spyOn(adminStore, 'setShelters')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchShelters()
      expect(setSpy).toHaveBeenCalledWith([shelterA], 5)
    })

    it('sets error on API failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'fail' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchShelters, error } = useAdmin()
      await fetchShelters()
      expect(error.value).toBeTruthy()
    })

    it('sets isLoading false after failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchShelters()
      expect(adminStore.isLoading).toBe(false)
    })
  })

  // ── updateShelter ───────────────────────────────────────────

  describe('updateShelter()', () => {
    it('calls PUT /api/admin/shelters/:id with data', async () => {
      mockPut.mockResolvedValueOnce(shelterA)
      adminStore.setShelters([shelterA], 1)
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().updateShelter('shelter-1', { is_verified: true })
      expect(mockPut).toHaveBeenCalledWith('/api/admin/shelters/shelter-1', { is_verified: true })
    })

    it('returns true on success', async () => {
      mockPut.mockResolvedValueOnce(shelterA)
      adminStore.setShelters([shelterA], 1)
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().updateShelter('shelter-1', { is_verified: true })
      expect(result).toBe(true)
    })

    it('returns false and sets error for invalid shelter id (path traversal attempt)', async () => {
      const { useAdmin } = await import('./useAdmin')
      const { updateShelter, error } = useAdmin()
      const result = await updateShelter('../admin', { is_verified: true })
      expect(result).toBe(false)
      expect(error.value).toBe('ID de refugio inválido.')
      expect(mockPut).not.toHaveBeenCalled()
    })

    it('returns false and sets error on API failure', async () => {
      mockPut.mockRejectedValueOnce({ message: 'Server error' })
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().updateShelter('shelter-1', { is_featured: true })
      expect(result).toBe(false)
    })
  })

  // ── deleteShelter ───────────────────────────────────────────

  describe('deleteShelter()', () => {
    it('calls DELETE /api/admin/shelters/:id', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      adminStore.setShelters([shelterA], 1)
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deleteShelter('shelter-1')
      expect(mockDel).toHaveBeenCalledWith('/api/admin/shelters/shelter-1')
    })

    it('returns true on success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().deleteShelter('shelter-1')
      expect(result).toBe(true)
    })

    it('returns false for invalid id (empty string)', async () => {
      const { useAdmin } = await import('./useAdmin')
      const { deleteShelter, error } = useAdmin()
      const result = await deleteShelter('')
      expect(result).toBe(false)
      expect(error.value).toBe('ID de refugio inválido.')
      expect(mockDel).not.toHaveBeenCalled()
    })

    it('returns false on API failure', async () => {
      mockDel.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().deleteShelter('shelter-1')
      expect(result).toBe(false)
    })
  })

  // ── fetchPetshops ───────────────────────────────────────────

  describe('fetchPetshops()', () => {
    it('calls GET /api/admin/stores when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce([petshopA])
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchPetshops()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/stores')
    })

    it('hydrates the store from a plain array response', async () => {
      mockGet.mockResolvedValueOnce([petshopA])
      const setSpy = vi.spyOn(adminStore, 'setPetshops')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchPetshops()
      expect(setSpy).toHaveBeenCalledWith([petshopA], 1)
    })

    it('hydrates the store from a { stores, total } envelope', async () => {
      mockGet.mockResolvedValueOnce({ stores: [petshopA], total: 10, page: 1, per_page: 20 })
      const setSpy = vi.spyOn(adminStore, 'setPetshops')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchPetshops()
      expect(setSpy).toHaveBeenCalledWith([petshopA], 10)
    })

    it('sets error on API failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'fail' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchPetshops, error } = useAdmin()
      await fetchPetshops()
      expect(error.value).toBeTruthy()
    })
  })

  // ── updatePetshop ───────────────────────────────────────────

  describe('updatePetshop()', () => {
    it('calls PUT /api/admin/stores/:id with data', async () => {
      mockPut.mockResolvedValueOnce(petshopA)
      adminStore.setPetshops([petshopA], 1)
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().updatePetshop('shop-1', { is_verified: true })
      expect(mockPut).toHaveBeenCalledWith('/api/admin/stores/shop-1', { is_verified: true })
    })

    it('returns true on success', async () => {
      mockPut.mockResolvedValueOnce(petshopA)
      adminStore.setPetshops([petshopA], 1)
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().updatePetshop('shop-1', { is_featured: true })
      expect(result).toBe(true)
    })

    it('returns false and sets error for invalid petshop id', async () => {
      const { useAdmin } = await import('./useAdmin')
      const { updatePetshop, error } = useAdmin()
      const result = await updatePetshop('../../etc/passwd', { is_verified: true })
      expect(result).toBe(false)
      expect(error.value).toBe('ID de tienda inválido.')
    })

    it('returns false on API failure', async () => {
      mockPut.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().updatePetshop('shop-1', { is_verified: true })
      expect(result).toBe(false)
    })
  })

  // ── deletePetshop ───────────────────────────────────────────

  describe('deletePetshop()', () => {
    it('calls DELETE /api/admin/stores/:id', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deletePetshop('shop-1')
      expect(mockDel).toHaveBeenCalledWith('/api/admin/stores/shop-1')
    })

    it('returns true on success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().deletePetshop('shop-1')
      expect(result).toBe(true)
    })

    it('returns false for invalid id', async () => {
      const { useAdmin } = await import('./useAdmin')
      const { deletePetshop, error } = useAdmin()
      const result = await deletePetshop('')
      expect(result).toBe(false)
      expect(error.value).toBe('ID de tienda inválido.')
    })
  })

  // ── fetchAdminClinics ───────────────────────────────────────

  describe('fetchAdminClinics()', () => {
    it('calls GET /api/admin/clinics when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce([clinicA])
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchAdminClinics()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/clinics')
    })

    it('hydrates the store from a plain array response', async () => {
      mockGet.mockResolvedValueOnce([clinicA])
      const setSpy = vi.spyOn(adminStore, 'setAdminClinics')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchAdminClinics()
      expect(setSpy).toHaveBeenCalledWith([clinicA], 1)
    })

    it('hydrates the store from a { clinics, total } envelope', async () => {
      mockGet.mockResolvedValueOnce({ clinics: [clinicA], total: 7, page: 1, per_page: 20 })
      const setSpy = vi.spyOn(adminStore, 'setAdminClinics')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchAdminClinics()
      expect(setSpy).toHaveBeenCalledWith([clinicA], 7)
    })

    it('sets error on API failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'fail' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchAdminClinics, error } = useAdmin()
      await fetchAdminClinics()
      expect(error.value).toBeTruthy()
    })

    it('sets isLoading false after failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchAdminClinics()
      expect(adminStore.isLoading).toBe(false)
    })
  })

  // ── updateAdminClinic ───────────────────────────────────────

  describe('updateAdminClinic()', () => {
    it('calls PUT /api/admin/clinics/:id with data', async () => {
      mockPut.mockResolvedValueOnce(clinicA)
      adminStore.setAdminClinics([clinicA], 1)
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().updateAdminClinic('clinic-1', { is_verified: true })
      expect(mockPut).toHaveBeenCalledWith('/api/admin/clinics/clinic-1', { is_verified: true })
    })

    it('returns true on success', async () => {
      mockPut.mockResolvedValueOnce(clinicA)
      adminStore.setAdminClinics([clinicA], 1)
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().updateAdminClinic('clinic-1', { is_featured: true })
      expect(result).toBe(true)
    })

    it('returns false and sets error for invalid clinic id', async () => {
      const { useAdmin } = await import('./useAdmin')
      const { updateAdminClinic, error } = useAdmin()
      const result = await updateAdminClinic('../evil', { is_verified: true })
      expect(result).toBe(false)
      expect(error.value).toBe('ID de clínica inválido.')
      expect(mockPut).not.toHaveBeenCalled()
    })

    it('returns false on API failure', async () => {
      mockPut.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().updateAdminClinic('clinic-1', { is_verified: true })
      expect(result).toBe(false)
    })
  })

  // ── deleteAdminClinic ───────────────────────────────────────

  describe('deleteAdminClinic()', () => {
    it('calls DELETE /api/admin/clinics/:id', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deleteAdminClinic('clinic-1')
      expect(mockDel).toHaveBeenCalledWith('/api/admin/clinics/clinic-1')
    })

    it('returns true on success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().deleteAdminClinic('clinic-1')
      expect(result).toBe(true)
    })

    it('returns false for invalid id', async () => {
      const { useAdmin } = await import('./useAdmin')
      const { deleteAdminClinic, error } = useAdmin()
      const result = await deleteAdminClinic('')
      expect(result).toBe(false)
      expect(error.value).toBe('ID de clínica inválido.')
    })

    it('returns false on API failure', async () => {
      mockDel.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      const result = await useAdmin().deleteAdminClinic('clinic-1')
      expect(result).toBe(false)
    })
  })

  // ── fetchTransactions ───────────────────────────────────────

  describe('fetchTransactions()', () => {
    it('calls GET /api/admin/transactions when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce([txA])
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchTransactions()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/transactions')
    })

    it('appends page and per_page to query string', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchTransactions({ page: 3, per_page: 10 })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/transactions?page=3&per_page=10')
    })

    it('hydrates the store from a plain array response', async () => {
      mockGet.mockResolvedValueOnce([txA])
      const setSpy = vi.spyOn(adminStore, 'setTransactions')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchTransactions()
      expect(setSpy).toHaveBeenCalledWith([txA], 1)
    })

    it('hydrates the store from a { transactions, total } envelope', async () => {
      mockGet.mockResolvedValueOnce({ transactions: [txA], total: 99, page: 1, per_page: 20 })
      const setSpy = vi.spyOn(adminStore, 'setTransactions')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchTransactions()
      expect(setSpy).toHaveBeenCalledWith([txA], 99)
    })

    it('sets error on API failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Unauthorized' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchTransactions, error } = useAdmin()
      await fetchTransactions()
      expect(error.value).toBe('Unauthorized')
    })

    it('sets isLoading false after failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchTransactions()
      expect(adminStore.isLoading).toBe(false)
    })
  })

  // ── error extraction ────────────────────────────────────────

  describe('error extraction from API errors', () => {
    it('extracts err.data.error string', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Forbidden resource' } })
      const { useAdmin } = await import('./useAdmin')
      const { fetchStats, error } = useAdmin()
      await fetchStats()
      expect(error.value).toBe('Forbidden resource')
    })

    it('extracts err.data string when it is a plain string', async () => {
      mockGet.mockRejectedValueOnce({ data: 'Access denied' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchStats, error } = useAdmin()
      await fetchStats()
      expect(error.value).toBe('Access denied')
    })

    it('extracts err.message when no err.data is present', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network timeout' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchStats, error } = useAdmin()
      await fetchStats()
      expect(error.value).toBe('Network timeout')
    })

    it('falls back to generic message for unknown error shape', async () => {
      mockGet.mockRejectedValueOnce('plain string error')
      const { useAdmin } = await import('./useAdmin')
      const { fetchStats, error } = useAdmin()
      await fetchStats()
      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })
  })
})
