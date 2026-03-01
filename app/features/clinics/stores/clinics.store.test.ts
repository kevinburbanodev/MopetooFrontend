// ============================================================
// clinics.store.test.ts
// Tests the useClinicsStore Pinia store in isolation.
//
// Strategy: uses the real store (no stubActions) so that action
// implementations are exercised, not mocked away. Each test gets
// a fresh pinia via setActivePinia(createPinia()) in beforeEach.
//
// What this suite does NOT cover intentionally:
//   - HTTP / API calls — those are composable concerns (useClinics.test.ts)
//   - Component rendering — covered in component test files
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useClinicsStore } from './clinics.store'
import type { Clinic } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeClinic(overrides: Partial<Clinic> = {}): Clinic {
  return {
    id: 1,
    name: 'Clínica Veterinaria Los Andes',
    email: 'info@clinicaandes.com',
    phone: '+57 300 987 6543',
    address: 'Calle 72 #15-30',
    city: 'Bogotá',
    country: 'Colombia',
    description: 'Atención veterinaria integral para toda tu familia',
    specialties: ['Cirugía', 'Dermatología'],
    services: ['Consulta general', 'Vacunación'],
    schedules: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
    cover_image_url: 'https://example.com/clinica.jpg',
    plan: 'free',
    verified: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const clinicA = makeClinic({ id: 1, name: 'Los Andes Vet', city: 'Bogotá', plan: 'free' })
const clinicB = makeClinic({ id: 2, name: 'Clínica Animal Sur', city: 'Medellín', plan: 'pro' })
const clinicC = makeClinic({ id: 3, name: 'VetSalud', city: 'Cali', plan: 'premium', verified: false })

// ── Suite ─────────────────────────────────────────────────────

describe('useClinicsStore', () => {
  beforeEach(() => {
    // Fresh pinia per test — no state leaks between tests
    setActivePinia(createPinia())
  })

  // ── Initial state ──────────────────────────────────────────

  describe('initial state', () => {
    it('has an empty clinics array', () => {
      const store = useClinicsStore()
      expect(store.clinics).toEqual([])
    })

    it('has null selectedClinic', () => {
      const store = useClinicsStore()
      expect(store.selectedClinic).toBeNull()
    })

    it('has isLoading false', () => {
      const store = useClinicsStore()
      expect(store.isLoading).toBe(false)
    })

    it('hasClinics is false with an empty clinics array', () => {
      const store = useClinicsStore()
      expect(store.hasClinics).toBe(false)
    })

    it('getPremiumClinics returns an empty array', () => {
      const store = useClinicsStore()
      expect(store.getPremiumClinics).toEqual([])
    })
  })

  // ── hasClinics getter ──────────────────────────────────────

  describe('hasClinics getter', () => {
    it('is false when clinics array is empty', () => {
      const store = useClinicsStore()
      expect(store.hasClinics).toBe(false)
    })

    it('is true when at least one clinic exists', () => {
      const store = useClinicsStore()
      store.addClinic(clinicA)
      expect(store.hasClinics).toBe(true)
    })

    it('becomes false again after clearClinics', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA])
      store.clearClinics()
      expect(store.hasClinics).toBe(false)
    })

    it('stays true when at least one clinic remains after setting multiple', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB])
      expect(store.hasClinics).toBe(true)
    })
  })

  // ── getPremiumClinics getter ─────────────────────────────────

  describe('getPremiumClinics getter', () => {
    it('returns an empty array when no clinics are loaded', () => {
      const store = useClinicsStore()
      expect(store.getPremiumClinics).toEqual([])
    })

    it('returns only clinics with a paid plan (not empty, not free)', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB, clinicC])
      const premium = store.getPremiumClinics
      expect(premium).toHaveLength(2)
      expect(premium.map(c => c.id)).toEqual(expect.arrayContaining([2, 3]))
    })

    it('excludes clinics with plan === "free"', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB, clinicC])
      const premium = store.getPremiumClinics
      expect(premium.find(c => c.id === 1)).toBeUndefined()
    })

    it('excludes clinics with plan === "" (empty string)', () => {
      const store = useClinicsStore()
      const emptyPlan = makeClinic({ id: 4, plan: '' })
      store.setClinics([emptyPlan, clinicB])
      const premium = store.getPremiumClinics
      expect(premium).toHaveLength(1)
      expect(premium[0].id).toBe(2)
    })

    it('returns all clinics when all have paid plans', () => {
      const store = useClinicsStore()
      const allPaid = [
        makeClinic({ id: 10, plan: 'pro' }),
        makeClinic({ id: 11, plan: 'premium' }),
      ]
      store.setClinics(allPaid)
      expect(store.getPremiumClinics).toHaveLength(2)
    })

    it('returns an empty array when all clinics have free/empty plans', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, makeClinic({ id: 5, plan: '' })])
      expect(store.getPremiumClinics).toEqual([])
    })

    it('updates reactively when a premium clinic is added', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA]) // free only
      expect(store.getPremiumClinics).toHaveLength(0)
      store.addClinic(clinicB) // pro
      expect(store.getPremiumClinics).toHaveLength(1)
    })

    it('returns an empty array after clearClinics resets the list', () => {
      const store = useClinicsStore()
      store.setClinics([clinicB, clinicC]) // both premium
      store.clearClinics()
      expect(store.getPremiumClinics).toEqual([])
    })
  })

  // ── setClinics ─────────────────────────────────────────────

  describe('setClinics()', () => {
    it('replaces the clinics array with the provided list', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB])
      expect(store.clinics).toEqual([clinicA, clinicB])
    })

    it('overwrites any previously stored clinics', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB])
      store.setClinics([clinicC])
      expect(store.clinics).toEqual([clinicC])
    })

    it('accepts an empty array, clearing all clinics', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA])
      store.setClinics([])
      expect(store.clinics).toEqual([])
    })

    it('makes hasClinics true after setting a non-empty array', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA])
      expect(store.hasClinics).toBe(true)
    })

    it('preserves the order of the provided list', () => {
      const store = useClinicsStore()
      store.setClinics([clinicC, clinicA, clinicB])
      expect(store.clinics[0].id).toBe(3)
      expect(store.clinics[1].id).toBe(1)
      expect(store.clinics[2].id).toBe(2)
    })
  })

  // ── addClinic ──────────────────────────────────────────────

  describe('addClinic()', () => {
    it('prepends the clinic to an empty list (unshift — newest-first)', () => {
      const store = useClinicsStore()
      store.addClinic(clinicA)
      expect(store.clinics).toHaveLength(1)
      expect(store.clinics[0]).toEqual(clinicA)
    })

    it('prepends the new clinic before existing ones', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB])
      store.addClinic(clinicC)
      expect(store.clinics[0]).toEqual(clinicC)
      expect(store.clinics).toHaveLength(3)
    })

    it('makes hasClinics true after the first add', () => {
      const store = useClinicsStore()
      store.addClinic(clinicA)
      expect(store.hasClinics).toBe(true)
    })

    it('does not mutate the existing clinics when prepending', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB])
      store.addClinic(clinicC)
      expect(store.clinics[1]).toEqual(clinicA)
      expect(store.clinics[2]).toEqual(clinicB)
    })
  })

  // ── setSelectedClinic ──────────────────────────────────────

  describe('setSelectedClinic()', () => {
    it('sets selectedClinic to the provided clinic', () => {
      const store = useClinicsStore()
      store.setSelectedClinic(clinicA)
      expect(store.selectedClinic).toEqual(clinicA)
    })

    it('replaces a previously selected clinic', () => {
      const store = useClinicsStore()
      store.setSelectedClinic(clinicA)
      store.setSelectedClinic(clinicB)
      expect(store.selectedClinic).toEqual(clinicB)
    })

    it('stores all clinic fields intact', () => {
      const store = useClinicsStore()
      store.setSelectedClinic(clinicA)
      expect(store.selectedClinic?.name).toBe('Los Andes Vet')
      expect(store.selectedClinic?.verified).toBe(true)
      expect(store.selectedClinic?.specialties).toEqual(['Cirugía', 'Dermatología'])
      expect(store.selectedClinic?.services).toEqual(['Consulta general', 'Vacunación'])
      expect(store.selectedClinic?.country).toBe('Colombia')
    })

    it('does not affect the clinics array', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB])
      store.setSelectedClinic(clinicA)
      expect(store.clinics).toHaveLength(2)
    })
  })

  // ── clearSelectedClinic ────────────────────────────────────

  describe('clearSelectedClinic()', () => {
    it('sets selectedClinic to null', () => {
      const store = useClinicsStore()
      store.setSelectedClinic(clinicA)
      store.clearSelectedClinic()
      expect(store.selectedClinic).toBeNull()
    })

    it('is safe to call when selectedClinic is already null', () => {
      const store = useClinicsStore()
      expect(() => store.clearSelectedClinic()).not.toThrow()
      expect(store.selectedClinic).toBeNull()
    })

    it('does not affect the clinics array', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB])
      store.setSelectedClinic(clinicA)
      store.clearSelectedClinic()
      expect(store.clinics).toHaveLength(2)
    })
  })

  // ── setLoading ─────────────────────────────────────────────

  describe('setLoading()', () => {
    it('sets isLoading to true', () => {
      const store = useClinicsStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading back to false', () => {
      const store = useClinicsStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('is idempotent when called with the same value', () => {
      const store = useClinicsStore()
      store.setLoading(false)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('does not affect clinics or selectedClinic', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA])
      store.setSelectedClinic(clinicA)
      store.setLoading(true)
      expect(store.clinics).toHaveLength(1)
      expect(store.selectedClinic).toEqual(clinicA)
    })
  })

  // ── clearClinics ───────────────────────────────────────────

  describe('clearClinics()', () => {
    it('resets clinics to an empty array', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB])
      store.clearClinics()
      expect(store.clinics).toEqual([])
    })

    it('resets selectedClinic to null', () => {
      const store = useClinicsStore()
      store.setSelectedClinic(clinicA)
      store.clearClinics()
      expect(store.selectedClinic).toBeNull()
    })

    it('makes hasClinics false after clearing', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB, clinicC])
      store.clearClinics()
      expect(store.hasClinics).toBe(false)
    })

    it('makes getPremiumClinics return an empty array after clearing', () => {
      const store = useClinicsStore()
      store.setClinics([clinicB, clinicC]) // both premium
      store.clearClinics()
      expect(store.getPremiumClinics).toEqual([])
    })

    it('is safe to call when the store is already in initial state', () => {
      const store = useClinicsStore()
      expect(() => store.clearClinics()).not.toThrow()
      expect(store.clinics).toEqual([])
      expect(store.selectedClinic).toBeNull()
    })

    it('does NOT reset isLoading (loading state is not part of clearClinics)', () => {
      const store = useClinicsStore()
      store.setLoading(true)
      store.clearClinics()
      expect(store.clinics).toEqual([])
    })
  })
})
