// ============================================================
// admin.store.test.ts
// Tests the useAdminStore Pinia store in isolation.
//
// Strategy: uses the real store (no stubActions) so that action
// implementations are exercised, not mocked away. Each test gets
// a fresh pinia via setActivePinia(createPinia()) in beforeEach.
//
// What this suite does NOT cover intentionally:
//   - HTTP / API calls — those are composable concerns (useAdmin.test.ts)
//   - Component rendering — covered in component test files
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAdminStore } from './admin.store'
import type {
  AdminUser,
  AdminShelter,
  AdminPetshop,
  AdminClinic,
  AdminTransaction,
  AdminDonation,
} from '../types'

// ── Fixtures ─────────────────────────────────────────────────

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
    is_active: true,
    pets_count: 2,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeShelter(overrides: Partial<AdminShelter> = {}): AdminShelter {
  return {
    id: 1,
    name: 'Refugio Los Amigos',
    city: 'Bogotá',
    email: 'info@refugio.com',
    is_verified: true,
    is_active: true,
    pets_count: 10,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makePetshop(overrides: Partial<AdminPetshop> = {}): AdminPetshop {
  return {
    id: 1,
    name: 'Tienda Mascota Feliz',
    city: 'Medellín',
    email: 'info@tienda.com',
    is_active: true,
    plan: 'free',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeClinic(overrides: Partial<AdminClinic> = {}): AdminClinic {
  return {
    id: 1,
    name: 'Clínica Vet Norte',
    city: 'Cali',
    email: 'info@clinica.com',
    is_verified: true,
    is_active: true,
    plan: 'free',
    specialties: ['Cirugía', 'Dermatología'],
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeTransaction(overrides: Partial<AdminTransaction> = {}): AdminTransaction {
  return {
    id: 1,
    user_id: 1,
    plan: 'pro_monthly',
    amount_cop: 49000,
    status: 'approved',
    reference: 'REF-001',
    created_at: '2024-01-15T10:00:00Z',
    ...overrides,
  }
}

function makeDonation(overrides: Partial<AdminDonation> = {}): AdminDonation {
  return {
    id: 1,
    user_id: 1,
    shelter_id: 1,
    amount_cop: 25000,
    status: 'approved',
    reference: 'DON-001',
    created_at: '2024-02-01T10:00:00Z',
    ...overrides,
  }
}

const userA = makeUser({ id: 1, name: 'Ana', is_pro: false })
const userB = makeUser({ id: 2, name: 'Carlos', is_pro: true })
const shelterA = makeShelter({ id: 1, name: 'Refugio Norte', is_verified: false })
const shelterB = makeShelter({ id: 2, name: 'Refugio Sur', is_active: false })
const petshopA = makePetshop({ id: 1, name: 'TiendaPets A' })
const petshopB = makePetshop({ id: 2, name: 'TiendaPets B', plan: 'featured' })
const clinicA = makeClinic({ id: 1, name: 'Clínica Norte' })
const clinicB = makeClinic({ id: 2, name: 'Clínica Sur', plan: 'pro' })
const txA = makeTransaction({ id: 1, plan: 'pro_monthly' })
const txB = makeTransaction({ id: 2, plan: 'pro_annual' })
const donA = makeDonation({ id: 1 })
const donB = makeDonation({ id: 2, shelter_id: 5 })

// ── Suite ─────────────────────────────────────────────────────

describe('useAdminStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── Initial state ───────────────────────────────────────────

  describe('initial state', () => {
    it('has an empty users array', () => {
      const store = useAdminStore()
      expect(store.users).toEqual([])
    })

    it('has null selectedUser', () => {
      const store = useAdminStore()
      expect(store.selectedUser).toBeNull()
    })

    it('has an empty shelters array', () => {
      const store = useAdminStore()
      expect(store.shelters).toEqual([])
    })

    it('has an empty petshops array', () => {
      const store = useAdminStore()
      expect(store.petshops).toEqual([])
    })

    it('has an empty clinics array', () => {
      const store = useAdminStore()
      expect(store.clinics).toEqual([])
    })

    it('has an empty transactions array', () => {
      const store = useAdminStore()
      expect(store.transactions).toEqual([])
    })

    it('has an empty donations array', () => {
      const store = useAdminStore()
      expect(store.donations).toEqual([])
    })

    it('has isLoading false', () => {
      const store = useAdminStore()
      expect(store.isLoading).toBe(false)
    })

    it('has all totals at zero', () => {
      const store = useAdminStore()
      expect(store.totalUsers).toBe(0)
      expect(store.totalShelters).toBe(0)
      expect(store.totalPetshops).toBe(0)
      expect(store.totalClinics).toBe(0)
      expect(store.totalTransactions).toBe(0)
      expect(store.totalDonations).toBe(0)
    })

    it('hasUsers is false initially', () => {
      const store = useAdminStore()
      expect(store.hasUsers).toBe(false)
    })
  })

  // ── hasUsers getter ─────────────────────────────────────────

  describe('hasUsers getter', () => {
    it('returns false when users array is empty', () => {
      const store = useAdminStore()
      expect(store.hasUsers).toBe(false)
    })

    it('returns true after setUsers with non-empty list', () => {
      const store = useAdminStore()
      store.setUsers([userA], 1)
      expect(store.hasUsers).toBe(true)
    })

    it('returns false after clearAdmin', () => {
      const store = useAdminStore()
      store.setUsers([userA], 1)
      store.clearAdmin()
      expect(store.hasUsers).toBe(false)
    })
  })

  // ── setUsers ────────────────────────────────────────────────

  describe('setUsers()', () => {
    it('stores the provided users and total', () => {
      const store = useAdminStore()
      store.setUsers([userA, userB], 2)
      expect(store.users).toEqual([userA, userB])
      expect(store.totalUsers).toBe(2)
    })

    it('replaces previously stored users', () => {
      const store = useAdminStore()
      store.setUsers([userA], 1)
      store.setUsers([userB], 1)
      expect(store.users).toEqual([userB])
    })

    it('makes hasUsers return true', () => {
      const store = useAdminStore()
      store.setUsers([userA], 1)
      expect(store.hasUsers).toBe(true)
    })

    it('sets totalUsers to the provided total', () => {
      const store = useAdminStore()
      store.setUsers([userA], 42)
      expect(store.totalUsers).toBe(42)
    })

    it('accepts an empty array and sets total to 0', () => {
      const store = useAdminStore()
      store.setUsers([userA], 1)
      store.setUsers([], 0)
      expect(store.users).toEqual([])
      expect(store.totalUsers).toBe(0)
    })
  })

  // ── updateUser ──────────────────────────────────────────────

  describe('updateUser()', () => {
    it('merges partial data into an existing user by id', () => {
      const store = useAdminStore()
      store.setUsers([userA, userB], 2)
      store.updateUser(1, { is_pro: true })
      expect(store.users[0].is_pro).toBe(true)
    })

    it('does not affect other users in the list', () => {
      const store = useAdminStore()
      store.setUsers([userA, userB], 2)
      store.updateUser(1, { is_pro: true })
      expect(store.users[1]).toEqual(userB)
    })

    it('preserves all non-updated fields', () => {
      const store = useAdminStore()
      store.setUsers([userA], 1)
      store.updateUser(1, { is_admin: true })
      expect(store.users[0].name).toBe('Ana')
      expect(store.users[0].email).toBe('juan@example.com')
    })

    it('does nothing when the user id is not found', () => {
      const store = useAdminStore()
      store.setUsers([userA], 1)
      store.updateUser(999, { is_pro: true })
      expect(store.users[0]).toEqual(userA)
    })

    it('can toggle is_active', () => {
      const store = useAdminStore()
      store.setUsers([userA], 1)
      store.updateUser(1, { is_active: false })
      expect(store.users[0].is_active).toBe(false)
    })
  })

  // ── setSelectedUser / clearSelectedUser ─────────────────────

  describe('setSelectedUser() and clearSelectedUser()', () => {
    it('setSelectedUser stores the provided user', () => {
      const store = useAdminStore()
      store.setSelectedUser(userA)
      expect(store.selectedUser).toEqual(userA)
    })

    it('clearSelectedUser sets selectedUser to null', () => {
      const store = useAdminStore()
      store.setSelectedUser(userA)
      store.clearSelectedUser()
      expect(store.selectedUser).toBeNull()
    })

    it('clearSelectedUser is safe when selectedUser is already null', () => {
      const store = useAdminStore()
      expect(() => store.clearSelectedUser()).not.toThrow()
    })
  })

  // ── setShelters ─────────────────────────────────────────────

  describe('setShelters()', () => {
    it('stores the provided shelters and total', () => {
      const store = useAdminStore()
      store.setShelters([shelterA, shelterB], 2)
      expect(store.shelters).toEqual([shelterA, shelterB])
      expect(store.totalShelters).toBe(2)
    })

    it('replaces previously stored shelters', () => {
      const store = useAdminStore()
      store.setShelters([shelterA], 1)
      store.setShelters([shelterB], 1)
      expect(store.shelters).toEqual([shelterB])
    })
  })

  // ── updateShelter ───────────────────────────────────────────

  describe('updateShelter()', () => {
    it('merges partial data into an existing shelter by id', () => {
      const store = useAdminStore()
      store.setShelters([shelterA], 1)
      store.updateShelter(1, { is_verified: true })
      expect(store.shelters[0].is_verified).toBe(true)
    })

    it('does nothing when shelter id is not found', () => {
      const store = useAdminStore()
      store.setShelters([shelterA], 1)
      store.updateShelter(999, { is_verified: true })
      expect(store.shelters[0]).toEqual(shelterA)
    })

    it('can toggle is_active', () => {
      const store = useAdminStore()
      store.setShelters([shelterA], 1)
      store.updateShelter(1, { is_active: false })
      expect(store.shelters[0].is_active).toBe(false)
    })
  })

  // ── setPetshops ─────────────────────────────────────────────

  describe('setPetshops()', () => {
    it('stores the provided petshops and total', () => {
      const store = useAdminStore()
      store.setPetshops([petshopA, petshopB], 2)
      expect(store.petshops).toEqual([petshopA, petshopB])
      expect(store.totalPetshops).toBe(2)
    })
  })

  // ── updatePetshop ───────────────────────────────────────────

  describe('updatePetshop()', () => {
    it('merges partial data into an existing petshop by id', () => {
      const store = useAdminStore()
      store.setPetshops([petshopA], 1)
      store.updatePetshop(1, { is_active: false })
      expect(store.petshops[0].is_active).toBe(false)
    })

    it('can update plan', () => {
      const store = useAdminStore()
      store.setPetshops([petshopA], 1)
      store.updatePetshop(1, { plan: 'featured' })
      expect(store.petshops[0].plan).toBe('featured')
    })

    it('does nothing when petshop id is not found', () => {
      const store = useAdminStore()
      store.setPetshops([petshopA], 1)
      store.updatePetshop(999, { is_active: false })
      expect(store.petshops[0]).toEqual(petshopA)
    })
  })

  // ── setAdminClinics ─────────────────────────────────────────

  describe('setAdminClinics()', () => {
    it('stores the provided clinics and total', () => {
      const store = useAdminStore()
      store.setAdminClinics([clinicA, clinicB], 2)
      expect(store.clinics).toEqual([clinicA, clinicB])
      expect(store.totalClinics).toBe(2)
    })

    it('replaces previously stored clinics', () => {
      const store = useAdminStore()
      store.setAdminClinics([clinicA], 1)
      store.setAdminClinics([clinicB], 1)
      expect(store.clinics).toEqual([clinicB])
    })
  })

  // ── updateAdminClinic ───────────────────────────────────────

  describe('updateAdminClinic()', () => {
    it('merges partial data into an existing clinic by id', () => {
      const store = useAdminStore()
      store.setAdminClinics([clinicA], 1)
      store.updateAdminClinic(1, { is_active: false })
      expect(store.clinics[0].is_active).toBe(false)
    })

    it('can update plan', () => {
      const store = useAdminStore()
      store.setAdminClinics([clinicA], 1)
      store.updateAdminClinic(1, { plan: 'pro' })
      expect(store.clinics[0].plan).toBe('pro')
    })

    it('preserves non-updated fields', () => {
      const store = useAdminStore()
      store.setAdminClinics([clinicA], 1)
      store.updateAdminClinic(1, { is_verified: false })
      expect(store.clinics[0].name).toBe('Clínica Norte')
    })

    it('does nothing when clinic id is not found', () => {
      const store = useAdminStore()
      store.setAdminClinics([clinicA], 1)
      store.updateAdminClinic(999, { is_verified: false })
      expect(store.clinics[0]).toEqual(clinicA)
    })
  })

  // ── setTransactions ─────────────────────────────────────────

  describe('setTransactions()', () => {
    it('stores the provided transactions and total', () => {
      const store = useAdminStore()
      store.setTransactions([txA, txB], 2)
      expect(store.transactions).toEqual([txA, txB])
      expect(store.totalTransactions).toBe(2)
    })

    it('replaces previously stored transactions', () => {
      const store = useAdminStore()
      store.setTransactions([txA], 1)
      store.setTransactions([txB], 1)
      expect(store.transactions).toEqual([txB])
    })
  })

  // ── setDonations ──────────────────────────────────────────

  describe('setDonations()', () => {
    it('stores the provided donations and total', () => {
      const store = useAdminStore()
      store.setDonations([donA, donB], 2)
      expect(store.donations).toEqual([donA, donB])
      expect(store.totalDonations).toBe(2)
    })

    it('replaces previously stored donations', () => {
      const store = useAdminStore()
      store.setDonations([donA], 1)
      store.setDonations([donB], 1)
      expect(store.donations).toEqual([donB])
    })
  })

  // ── setLoading ──────────────────────────────────────────────

  describe('setLoading()', () => {
    it('sets isLoading to true', () => {
      const store = useAdminStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading back to false', () => {
      const store = useAdminStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('is idempotent when called with the same value', () => {
      const store = useAdminStore()
      store.setLoading(false)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('does not affect other state fields', () => {
      const store = useAdminStore()
      store.setUsers([userA], 1)
      store.setLoading(true)
      expect(store.users).toHaveLength(1)
      expect(store.totalUsers).toBe(1)
    })
  })

  // ── clearAdmin ──────────────────────────────────────────────

  describe('clearAdmin()', () => {
    it('resets users to an empty array', () => {
      const store = useAdminStore()
      store.setUsers([userA, userB], 2)
      store.clearAdmin()
      expect(store.users).toEqual([])
    })

    it('resets selectedUser to null', () => {
      const store = useAdminStore()
      store.setSelectedUser(userA)
      store.clearAdmin()
      expect(store.selectedUser).toBeNull()
    })

    it('resets shelters to an empty array', () => {
      const store = useAdminStore()
      store.setShelters([shelterA], 1)
      store.clearAdmin()
      expect(store.shelters).toEqual([])
    })

    it('resets petshops to an empty array', () => {
      const store = useAdminStore()
      store.setPetshops([petshopA], 1)
      store.clearAdmin()
      expect(store.petshops).toEqual([])
    })

    it('resets clinics to an empty array', () => {
      const store = useAdminStore()
      store.setAdminClinics([clinicA], 1)
      store.clearAdmin()
      expect(store.clinics).toEqual([])
    })

    it('resets transactions to an empty array', () => {
      const store = useAdminStore()
      store.setTransactions([txA], 1)
      store.clearAdmin()
      expect(store.transactions).toEqual([])
    })

    it('resets donations to an empty array', () => {
      const store = useAdminStore()
      store.setDonations([donA], 1)
      store.clearAdmin()
      expect(store.donations).toEqual([])
    })

    it('resets all totals to 0', () => {
      const store = useAdminStore()
      store.setUsers([userA], 10)
      store.setShelters([shelterA], 5)
      store.setPetshops([petshopA], 3)
      store.setAdminClinics([clinicA], 7)
      store.setTransactions([txA], 4)
      store.setDonations([donA], 2)
      store.clearAdmin()
      expect(store.totalUsers).toBe(0)
      expect(store.totalShelters).toBe(0)
      expect(store.totalPetshops).toBe(0)
      expect(store.totalClinics).toBe(0)
      expect(store.totalTransactions).toBe(0)
      expect(store.totalDonations).toBe(0)
    })

    it('resets isLoading to false', () => {
      const store = useAdminStore()
      store.setLoading(true)
      store.clearAdmin()
      expect(store.isLoading).toBe(false)
    })

    it('makes hasUsers return false', () => {
      const store = useAdminStore()
      store.setUsers([userA], 1)
      store.clearAdmin()
      expect(store.hasUsers).toBe(false)
    })

    it('is safe to call on an already-empty store', () => {
      const store = useAdminStore()
      expect(() => store.clearAdmin()).not.toThrow()
    })
  })
})
