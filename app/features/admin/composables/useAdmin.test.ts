// ============================================================
// useAdmin.test.ts
// Tests the useAdmin composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT the right tool.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs and we can spy on it.
//   - ID validation guards are tested to ensure positive-number validation.
//
// Backend uses specific PATCH endpoints for each action
// (no generic PUT or DELETE). All IDs are positive numbers.
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
  AdminDonation,
} from '../types'

// ── useApi mock ───────────────────────────────────────────────

const mockGet = vi.fn()
const mockPatch = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet, patch: mockPatch }),
}))

// ── Fixtures ─────────────────────────────────────────────────

function makeUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: 1, name: 'Juan', last_name: 'Pérez', email: 'juan@example.com',
    country: 'Colombia', city: 'Bogotá', is_pro: false, is_admin: false,
    is_active: true, pets_count: 2,
    created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeShelter(overrides: Partial<AdminShelter> = {}): AdminShelter {
  return {
    id: 1, name: 'Refugio Los Amigos', city: 'Bogotá',
    is_verified: false, is_active: true, pets_count: 5,
    created_at: '2024-01-01T00:00:00Z', ...overrides,
  }
}

function makePetshop(overrides: Partial<AdminPetshop> = {}): AdminPetshop {
  return {
    id: 1, name: 'Tienda Mascota Feliz', city: 'Medellín',
    is_active: true, plan: 'free', created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeClinic(overrides: Partial<AdminClinic> = {}): AdminClinic {
  return {
    id: 1, name: 'Clínica Vet Norte', city: 'Cali',
    is_verified: false, is_active: true, plan: 'free',
    specialties: ['Cirugía'], created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeTransaction(overrides: Partial<AdminTransaction> = {}): AdminTransaction {
  return {
    id: 1, user_id: 1, plan: 'pro_monthly', amount_cop: 49000,
    status: 'approved', reference: 'REF-001',
    created_at: '2024-01-15T10:00:00Z', ...overrides,
  }
}

function makeDonation(overrides: Partial<AdminDonation> = {}): AdminDonation {
  return {
    id: 1, user_id: 1, shelter_id: 1, amount_cop: 25000,
    status: 'approved', reference: 'DON-001',
    created_at: '2024-02-01T10:00:00Z', ...overrides,
  }
}

const userA = makeUser({ id: 1 })
const userB = makeUser({ id: 2, name: 'María' })
const shelterA = makeShelter({ id: 1 })
const petshopA = makePetshop({ id: 1 })
const clinicA = makeClinic({ id: 1 })
const txA = makeTransaction({ id: 1 })
const donA = makeDonation({ id: 1 })

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
    mockPatch.mockReset()
  })

  // ── fetchUsers ──────────────────────────────────────────────

  describe('fetchUsers()', () => {
    it('calls GET /api/admin/users when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce({ users: [userA], total: 1 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/users')
    })

    it('appends search filter to query string', async () => {
      mockGet.mockResolvedValueOnce({ users: [], total: 0 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers({ search: 'juan' })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/users?search=juan')
    })

    it('appends plan filter to query string', async () => {
      mockGet.mockResolvedValueOnce({ users: [], total: 0 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers({ plan: 'pro_monthly' })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/users?plan=pro_monthly')
    })

    it('appends active filter to query string', async () => {
      mockGet.mockResolvedValueOnce({ users: [], total: 0 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers({ active: true })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/users?active=true')
    })

    it('appends country filter to query string', async () => {
      mockGet.mockResolvedValueOnce({ users: [], total: 0 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers({ country: 'Colombia' })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/users?country=Colombia')
    })

    it('appends page and limit to query string', async () => {
      mockGet.mockResolvedValueOnce({ users: [], total: 0 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers({ page: 2, limit: 20 })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/users?page=2&limit=20')
    })

    it('hydrates the store from { users, total } response', async () => {
      mockGet.mockResolvedValueOnce({ users: [userA], total: 42 })
      const setUsersSpy = vi.spyOn(adminStore, 'setUsers')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers()
      expect(setUsersSpy).toHaveBeenCalledWith([userA], 42)
    })

    it('uses empty array and 0 when users field is missing', async () => {
      mockGet.mockResolvedValueOnce({ total: 0 })
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

    it('sets isLoading true during fetch and false after', async () => {
      let loadingDuring = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuring = adminStore.isLoading
        return { users: [userA], total: 1 }
      })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers()
      expect(loadingDuring).toBe(true)
      expect(adminStore.isLoading).toBe(false)
    })

    it('sets isLoading false after failure', async () => {
      mockGet.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchUsers()
      expect(adminStore.isLoading).toBe(false)
    })
  })

  // ── User PATCH actions ─────────────────────────────────────

  describe('grantPro()', () => {
    it('calls PATCH /api/admin/users/:id/grant-pro with plan', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().grantPro(1, 'pro_monthly')
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/users/1/grant-pro', { plan: 'pro_monthly' })
    })

    it('updates store on success', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setUsers([userA], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateUser')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().grantPro(1, 'pro_monthly')
      expect(updateSpy).toHaveBeenCalledWith(1, { is_pro: true })
    })

    it('returns true on success', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().grantPro(1, 'pro_monthly')).toBe(true)
    })

    it('returns false and sets error for invalid id (0)', async () => {
      const { useAdmin } = await import('./useAdmin')
      const { grantPro, error } = useAdmin()
      expect(await grantPro(0, 'pro_monthly')).toBe(false)
      expect(error.value).toBe('ID de usuario inválido.')
      expect(mockPatch).not.toHaveBeenCalled()
    })

    it('returns false and sets error for negative id', async () => {
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().grantPro(-5, 'pro_monthly')).toBe(false)
      expect(mockPatch).not.toHaveBeenCalled()
    })

    it('returns false on API failure', async () => {
      mockPatch.mockRejectedValueOnce({ message: 'Server error' })
      const { useAdmin } = await import('./useAdmin')
      const { grantPro, error } = useAdmin()
      expect(await grantPro(1, 'pro_monthly')).toBe(false)
      expect(error.value).toBe('Server error')
    })
  })

  describe('revokePro()', () => {
    it('calls PATCH /api/admin/users/:id/revoke-pro', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().revokePro(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/users/1/revoke-pro', {})
    })

    it('updates store with is_pro: false', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setUsers([makeUser({ id: 1, is_pro: true })], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateUser')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().revokePro(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_pro: false })
    })

    it('returns false for invalid id', async () => {
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().revokePro(0)).toBe(false)
    })
  })

  describe('grantAdmin()', () => {
    it('calls PATCH /api/admin/users/:id/grant-admin', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().grantAdmin(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/users/1/grant-admin', {})
    })

    it('updates store with is_admin: true', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setUsers([userA], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateUser')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().grantAdmin(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_admin: true })
    })

    it('returns false for invalid id', async () => {
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().grantAdmin(0)).toBe(false)
    })
  })

  describe('revokeAdmin()', () => {
    it('calls PATCH /api/admin/users/:id/revoke-admin', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().revokeAdmin(2)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/users/2/revoke-admin', {})
    })

    it('updates store with is_admin: false', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setUsers([userB], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateUser')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().revokeAdmin(2)
      expect(updateSpy).toHaveBeenCalledWith(2, { is_admin: false })
    })
  })

  describe('activateUser()', () => {
    it('calls PATCH /api/admin/users/:id/activate', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().activateUser(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/users/1/activate', {})
    })

    it('updates store with is_active: true', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setUsers([makeUser({ id: 1, is_active: false })], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateUser')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().activateUser(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_active: true })
    })

    it('returns false for invalid id', async () => {
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().activateUser(-1)).toBe(false)
    })
  })

  describe('deactivateUser()', () => {
    it('calls PATCH /api/admin/users/:id/deactivate', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deactivateUser(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/users/1/deactivate', {})
    })

    it('updates store with is_active: false', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setUsers([userA], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateUser')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deactivateUser(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_active: false })
    })
  })

  // ── fetchShelters ───────────────────────────────────────────

  describe('fetchShelters()', () => {
    it('calls GET /api/admin/shelters when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce({ shelters: [shelterA], total: 1 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchShelters()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/shelters')
    })

    it('appends search filter to query string', async () => {
      mockGet.mockResolvedValueOnce({ shelters: [], total: 0 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchShelters({ search: 'norte' })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/shelters?search=norte')
    })

    it('hydrates the store from response', async () => {
      mockGet.mockResolvedValueOnce({ shelters: [shelterA], total: 5 })
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

  // ── Shelter PATCH actions ──────────────────────────────────

  describe('verifyShelter()', () => {
    it('calls PATCH /api/admin/shelters/:id/verify', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().verifyShelter(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/shelters/1/verify', {})
    })

    it('updates store with is_verified: true', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setShelters([shelterA], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateShelter')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().verifyShelter(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_verified: true })
    })

    it('returns false for invalid id', async () => {
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().verifyShelter(0)).toBe(false)
    })

    it('returns false on API failure', async () => {
      mockPatch.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().verifyShelter(1)).toBe(false)
    })
  })

  describe('activateShelter()', () => {
    it('calls PATCH /api/admin/shelters/:id/activate', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().activateShelter(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/shelters/1/activate', {})
    })

    it('updates store with is_active: true', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setShelters([makeShelter({ id: 1, is_active: false })], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateShelter')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().activateShelter(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_active: true })
    })
  })

  describe('deactivateShelter()', () => {
    it('calls PATCH /api/admin/shelters/:id/deactivate', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deactivateShelter(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/shelters/1/deactivate', {})
    })

    it('updates store with is_active: false', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setShelters([shelterA], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateShelter')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deactivateShelter(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_active: false })
    })
  })

  // ── fetchPetshops ───────────────────────────────────────────

  describe('fetchPetshops()', () => {
    it('calls GET /api/admin/stores when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce({ stores: [petshopA], total: 1 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchPetshops()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/stores')
    })

    it('hydrates the store from response', async () => {
      mockGet.mockResolvedValueOnce({ stores: [petshopA], total: 10 })
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

  // ── Store PATCH actions ────────────────────────────────────

  describe('activateStore()', () => {
    it('calls PATCH /api/admin/stores/:id/activate', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().activateStore(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/stores/1/activate', {})
    })

    it('updates store with is_active: true', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setPetshops([makePetshop({ id: 1, is_active: false })], 1)
      const updateSpy = vi.spyOn(adminStore, 'updatePetshop')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().activateStore(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_active: true })
    })

    it('returns false for invalid id', async () => {
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().activateStore(0)).toBe(false)
    })
  })

  describe('deactivateStore()', () => {
    it('calls PATCH /api/admin/stores/:id/deactivate', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deactivateStore(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/stores/1/deactivate', {})
    })

    it('updates store with is_active: false', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setPetshops([petshopA], 1)
      const updateSpy = vi.spyOn(adminStore, 'updatePetshop')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deactivateStore(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_active: false })
    })
  })

  describe('setStorePlan()', () => {
    it('calls PATCH /api/admin/stores/:id/plan with plan body', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().setStorePlan(1, 'featured')
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/stores/1/plan', { plan: 'featured' })
    })

    it('updates store with new plan', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setPetshops([petshopA], 1)
      const updateSpy = vi.spyOn(adminStore, 'updatePetshop')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().setStorePlan(1, 'featured')
      expect(updateSpy).toHaveBeenCalledWith(1, { plan: 'featured' })
    })

    it('returns false for invalid id', async () => {
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().setStorePlan(0, 'featured')).toBe(false)
    })

    it('returns false on API failure', async () => {
      mockPatch.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().setStorePlan(1, 'featured')).toBe(false)
    })
  })

  // ── fetchAdminClinics ─────────────────────────────────────

  describe('fetchAdminClinics()', () => {
    it('calls GET /api/admin/clinics when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce({ clinics: [clinicA], total: 1 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchAdminClinics()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/clinics')
    })

    it('hydrates the store from response', async () => {
      mockGet.mockResolvedValueOnce({ clinics: [clinicA], total: 7 })
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

  // ── Clinic PATCH actions ───────────────────────────────────

  describe('verifyClinic()', () => {
    it('calls PATCH /api/admin/clinics/:id/verify', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().verifyClinic(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/clinics/1/verify', {})
    })

    it('updates store with is_verified: true', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setAdminClinics([clinicA], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateAdminClinic')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().verifyClinic(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_verified: true })
    })

    it('returns false for invalid id', async () => {
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().verifyClinic(0)).toBe(false)
    })
  })

  describe('activateClinic()', () => {
    it('calls PATCH /api/admin/clinics/:id/activate', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().activateClinic(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/clinics/1/activate', {})
    })

    it('updates store with is_active: true', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setAdminClinics([makeClinic({ id: 1, is_active: false })], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateAdminClinic')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().activateClinic(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_active: true })
    })
  })

  describe('deactivateClinic()', () => {
    it('calls PATCH /api/admin/clinics/:id/deactivate', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deactivateClinic(1)
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/clinics/1/deactivate', {})
    })

    it('updates store with is_active: false', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setAdminClinics([clinicA], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateAdminClinic')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().deactivateClinic(1)
      expect(updateSpy).toHaveBeenCalledWith(1, { is_active: false })
    })
  })

  describe('setClinicPlan()', () => {
    it('calls PATCH /api/admin/clinics/:id/plan with plan body', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().setClinicPlan(1, 'pro')
      expect(mockPatch).toHaveBeenCalledWith('/api/admin/clinics/1/plan', { plan: 'pro' })
    })

    it('updates store with new plan', async () => {
      mockPatch.mockResolvedValueOnce({ message: 'ok' })
      adminStore.setAdminClinics([clinicA], 1)
      const updateSpy = vi.spyOn(adminStore, 'updateAdminClinic')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().setClinicPlan(1, 'pro')
      expect(updateSpy).toHaveBeenCalledWith(1, { plan: 'pro' })
    })

    it('returns false for invalid id', async () => {
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().setClinicPlan(0, 'pro')).toBe(false)
    })

    it('returns false on API failure', async () => {
      mockPatch.mockRejectedValueOnce(new Error('fail'))
      const { useAdmin } = await import('./useAdmin')
      expect(await useAdmin().setClinicPlan(1, 'pro')).toBe(false)
    })
  })

  // ── fetchTransactions ─────────────────────────────────────

  describe('fetchTransactions()', () => {
    it('calls GET /api/admin/transactions when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce({ transactions: [txA], total: 1 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchTransactions()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/transactions')
    })

    it('appends page and limit to query string', async () => {
      mockGet.mockResolvedValueOnce({ transactions: [], total: 0 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchTransactions({ page: 3, limit: 10 })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/transactions?page=3&limit=10')
    })

    it('appends status filter', async () => {
      mockGet.mockResolvedValueOnce({ transactions: [], total: 0 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchTransactions({ status: 'approved' })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/transactions?status=approved')
    })

    it('hydrates the store from response', async () => {
      mockGet.mockResolvedValueOnce({ transactions: [txA], total: 99 })
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

  // ── fetchDonations ────────────────────────────────────────

  describe('fetchDonations()', () => {
    it('calls GET /api/admin/donations when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce({ donations: [donA], total: 1 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchDonations()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/donations')
    })

    it('appends shelter_id filter', async () => {
      mockGet.mockResolvedValueOnce({ donations: [], total: 0 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchDonations({ shelter_id: 5 })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/donations?shelter_id=5')
    })

    it('appends date range filters', async () => {
      mockGet.mockResolvedValueOnce({ donations: [], total: 0 })
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchDonations({ from: '2024-01-01', to: '2024-12-31' })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/donations?from=2024-01-01&to=2024-12-31')
    })

    it('hydrates the store from response', async () => {
      mockGet.mockResolvedValueOnce({ donations: [donA], total: 10 })
      const setSpy = vi.spyOn(adminStore, 'setDonations')
      const { useAdmin } = await import('./useAdmin')
      await useAdmin().fetchDonations()
      expect(setSpy).toHaveBeenCalledWith([donA], 10)
    })

    it('sets error on API failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'fail' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchDonations, error } = useAdmin()
      await fetchDonations()
      expect(error.value).toBe('fail')
    })
  })

  // ── error extraction ──────────────────────────────────────

  describe('error extraction from API errors', () => {
    it('extracts err.data.error string', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Forbidden resource' } })
      const { useAdmin } = await import('./useAdmin')
      const { fetchUsers, error } = useAdmin()
      await fetchUsers()
      expect(error.value).toBe('Forbidden resource')
    })

    it('extracts err.data string when it is a plain string', async () => {
      mockGet.mockRejectedValueOnce({ data: 'Access denied' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchUsers, error } = useAdmin()
      await fetchUsers()
      expect(error.value).toBe('Access denied')
    })

    it('extracts err.message when no err.data is present', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network timeout' })
      const { useAdmin } = await import('./useAdmin')
      const { fetchUsers, error } = useAdmin()
      await fetchUsers()
      expect(error.value).toBe('Network timeout')
    })

    it('falls back to generic message for unknown error shape', async () => {
      mockGet.mockRejectedValueOnce('plain string error')
      const { useAdmin } = await import('./useAdmin')
      const { fetchUsers, error } = useAdmin()
      await fetchUsers()
      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })
  })
})
