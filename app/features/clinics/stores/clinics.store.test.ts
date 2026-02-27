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
    id: '1',
    name: 'Clínica Veterinaria Los Andes',
    description: 'Atención veterinaria integral para toda tu familia',
    address: 'Calle 72 #15-30',
    city: 'Bogotá',
    phone: '+57 300 987 6543',
    email: 'info@clinicaandes.com',
    website: 'https://clinicaandes.com',
    photo_url: 'https://example.com/clinica.jpg',
    specialties: ['Cirugía', 'Dermatología'],
    is_verified: true,
    is_featured: false,
    latitude: 4.7109886,
    longitude: -74.072092,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const clinicA = makeClinic({ id: '1', name: 'Los Andes Vet', city: 'Bogotá', is_featured: false })
const clinicB = makeClinic({ id: '2', name: 'Clínica Animal Sur', city: 'Medellín', is_featured: true })
const clinicC = makeClinic({ id: '3', name: 'VetSalud', city: 'Cali', is_featured: true, is_verified: false })

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

    it('getFeaturedClinics returns an empty array', () => {
      const store = useClinicsStore()
      expect(store.getFeaturedClinics).toEqual([])
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

  // ── getFeaturedClinics getter ──────────────────────────────

  describe('getFeaturedClinics getter', () => {
    it('returns an empty array when no clinics are loaded', () => {
      const store = useClinicsStore()
      expect(store.getFeaturedClinics).toEqual([])
    })

    it('returns only clinics with is_featured === true', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB, clinicC])
      const featured = store.getFeaturedClinics
      expect(featured).toHaveLength(2)
      expect(featured.map(c => c.id)).toEqual(expect.arrayContaining(['2', '3']))
    })

    it('excludes clinics with is_featured === false', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, clinicB, clinicC])
      const featured = store.getFeaturedClinics
      expect(featured.find(c => c.id === '1')).toBeUndefined()
    })

    it('returns all clinics when all have is_featured === true', () => {
      const store = useClinicsStore()
      const allFeatured = [
        makeClinic({ id: 'f1', is_featured: true }),
        makeClinic({ id: 'f2', is_featured: true }),
      ]
      store.setClinics(allFeatured)
      expect(store.getFeaturedClinics).toHaveLength(2)
    })

    it('returns an empty array when all clinics have is_featured === false', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA, makeClinic({ id: '5', is_featured: false })])
      expect(store.getFeaturedClinics).toEqual([])
    })

    it('updates reactively when a featured clinic is added', () => {
      const store = useClinicsStore()
      store.setClinics([clinicA]) // non-featured only
      expect(store.getFeaturedClinics).toHaveLength(0)
      store.addClinic(clinicB) // featured
      expect(store.getFeaturedClinics).toHaveLength(1)
    })

    it('returns an empty array after clearClinics resets the list', () => {
      const store = useClinicsStore()
      store.setClinics([clinicB, clinicC]) // both featured
      store.clearClinics()
      expect(store.getFeaturedClinics).toEqual([])
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
      expect(store.clinics[0].id).toBe('3')
      expect(store.clinics[1].id).toBe('1')
      expect(store.clinics[2].id).toBe('2')
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
      expect(store.selectedClinic?.is_verified).toBe(true)
      expect(store.selectedClinic?.specialties).toEqual(['Cirugía', 'Dermatología'])
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

    it('makes getFeaturedClinics return an empty array after clearing', () => {
      const store = useClinicsStore()
      store.setClinics([clinicB, clinicC]) // both featured
      store.clearClinics()
      expect(store.getFeaturedClinics).toEqual([])
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
