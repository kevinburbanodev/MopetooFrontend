// ============================================================
// shelters.store.test.ts
// Tests the useSheltersStore Pinia store in isolation.
//
// Strategy: uses the real store (no stubActions) so that action
// implementations are exercised, not mocked away. Each test gets
// a fresh pinia via setActivePinia(createPinia()) in beforeEach.
//
// What this suite does NOT cover intentionally:
//   - HTTP / API calls — those are composable concerns (useShelters.test.ts)
//   - Component rendering — covered in component test files
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useSheltersStore } from './shelters.store'
import type { AdoptionListing } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeAdoptionListing(overrides: Partial<AdoptionListing> = {}): AdoptionListing {
  return {
    id: 1,
    shelter_id: 1,
    name: 'Max',
    species: 'dog',
    breed: 'Labrador',
    age: 2,
    weight: 25.5,
    gender: 'male',
    photo_url: 'https://example.com/max.jpg',
    story: 'Un perro muy cariñoso',
    city: 'Bogotá',
    country: 'Colombia',
    status: 'available',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const listingA = makeAdoptionListing({ id: 1, name: 'Max', status: 'available' })
const listingB = makeAdoptionListing({ id: 2, name: 'Luna', status: 'pending', species: 'cat', gender: 'female' })
const listingC = makeAdoptionListing({ id: 3, name: 'Toby', status: 'adopted', species: 'dog' })

// ── Suite ─────────────────────────────────────────────────────

describe('useSheltersStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── Initial state ──────────────────────────────────────────

  describe('initial state', () => {
    it('has an empty adoptionListings array', () => {
      const store = useSheltersStore()
      expect(store.adoptionListings).toEqual([])
    })

    it('has null selectedListing', () => {
      const store = useSheltersStore()
      expect(store.selectedListing).toBeNull()
    })

    it('has isLoading false', () => {
      const store = useSheltersStore()
      expect(store.isLoading).toBe(false)
    })

    it('hasAdoptionListings is false with an empty array', () => {
      const store = useSheltersStore()
      expect(store.hasAdoptionListings).toBe(false)
    })

    it('getAvailableListings returns an empty array', () => {
      const store = useSheltersStore()
      expect(store.getAvailableListings).toEqual([])
    })
  })

  // ── hasAdoptionListings getter ──────────────────────────────

  describe('hasAdoptionListings getter', () => {
    it('is false when adoptionListings array is empty', () => {
      const store = useSheltersStore()
      expect(store.hasAdoptionListings).toBe(false)
    })

    it('is true when at least one listing exists', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA])
      expect(store.hasAdoptionListings).toBe(true)
    })

    it('becomes false after clearShelters resets adoptionListings', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA, listingB])
      store.clearShelters()
      expect(store.hasAdoptionListings).toBe(false)
    })
  })

  // ── getAvailableListings getter ─────────────────────────────

  describe('getAvailableListings getter', () => {
    it('returns only listings with status === "available"', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA, listingB, listingC])
      const available = store.getAvailableListings
      expect(available).toHaveLength(1)
      expect(available[0].id).toBe(1)
    })

    it('returns an empty array when no listings are available', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingB, listingC])
      expect(store.getAvailableListings).toEqual([])
    })

    it('returns all listings when all have status "available"', () => {
      const store = useSheltersStore()
      const availA = makeAdoptionListing({ id: 10, status: 'available' })
      const availB = makeAdoptionListing({ id: 11, status: 'available' })
      store.setAdoptionListings([availA, availB])
      expect(store.getAvailableListings).toHaveLength(2)
    })

    it('excludes listings with status "pending"', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingB])
      expect(store.getAvailableListings).toHaveLength(0)
    })

    it('excludes listings with status "adopted"', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingC])
      expect(store.getAvailableListings).toHaveLength(0)
    })

    it('updates reactively when a new available listing is added', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingB, listingC])
      expect(store.getAvailableListings).toHaveLength(0)
      store.addAdoptionListing(listingA)
      expect(store.getAvailableListings).toHaveLength(1)
    })
  })

  // ── setAdoptionListings ─────────────────────────────────────

  describe('setAdoptionListings()', () => {
    it('replaces the adoptionListings array with the provided list', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA, listingB])
      expect(store.adoptionListings).toEqual([listingA, listingB])
    })

    it('overwrites any previously stored listings', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA, listingB])
      store.setAdoptionListings([listingC])
      expect(store.adoptionListings).toEqual([listingC])
    })

    it('accepts an empty array, clearing all listings', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA])
      store.setAdoptionListings([])
      expect(store.adoptionListings).toEqual([])
    })

    it('makes hasAdoptionListings true after setting a non-empty array', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA])
      expect(store.hasAdoptionListings).toBe(true)
    })

    it('preserves the order of the provided list', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingC, listingA, listingB])
      expect(store.adoptionListings[0].id).toBe(3)
      expect(store.adoptionListings[1].id).toBe(1)
      expect(store.adoptionListings[2].id).toBe(2)
    })
  })

  // ── addAdoptionListing ──────────────────────────────────────

  describe('addAdoptionListing()', () => {
    it('prepends the listing to an empty list (unshift)', () => {
      const store = useSheltersStore()
      store.addAdoptionListing(listingA)
      expect(store.adoptionListings).toHaveLength(1)
      expect(store.adoptionListings[0]).toEqual(listingA)
    })

    it('prepends the new listing before existing listings', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA, listingB])
      store.addAdoptionListing(listingC)
      expect(store.adoptionListings[0]).toEqual(listingC)
      expect(store.adoptionListings).toHaveLength(3)
    })

    it('makes hasAdoptionListings true', () => {
      const store = useSheltersStore()
      store.addAdoptionListing(listingA)
      expect(store.hasAdoptionListings).toBe(true)
    })

    it('does not mutate existing listings when prepending', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA, listingB])
      store.addAdoptionListing(listingC)
      expect(store.adoptionListings[1]).toEqual(listingA)
      expect(store.adoptionListings[2]).toEqual(listingB)
    })
  })

  // ── setSelectedListing ──────────────────────────────────────

  describe('setSelectedListing()', () => {
    it('sets selectedListing to the provided listing', () => {
      const store = useSheltersStore()
      store.setSelectedListing(listingA)
      expect(store.selectedListing).toEqual(listingA)
    })

    it('replaces a previously selected listing', () => {
      const store = useSheltersStore()
      store.setSelectedListing(listingA)
      store.setSelectedListing(listingB)
      expect(store.selectedListing).toEqual(listingB)
    })

    it('accepts null to clear the selection', () => {
      const store = useSheltersStore()
      store.setSelectedListing(listingA)
      store.setSelectedListing(null)
      expect(store.selectedListing).toBeNull()
    })

    it('stores all listing fields intact', () => {
      const store = useSheltersStore()
      store.setSelectedListing(listingA)
      expect(store.selectedListing?.name).toBe('Max')
      expect(store.selectedListing?.status).toBe('available')
      expect(store.selectedListing?.city).toBe('Bogotá')
    })
  })

  // ── clearSelectedListing ────────────────────────────────────

  describe('clearSelectedListing()', () => {
    it('sets selectedListing to null', () => {
      const store = useSheltersStore()
      store.setSelectedListing(listingA)
      store.clearSelectedListing()
      expect(store.selectedListing).toBeNull()
    })

    it('is safe to call when selectedListing is already null', () => {
      const store = useSheltersStore()
      expect(() => store.clearSelectedListing()).not.toThrow()
      expect(store.selectedListing).toBeNull()
    })

    it('does not affect the adoptionListings array', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA, listingB])
      store.setSelectedListing(listingA)
      store.clearSelectedListing()
      expect(store.adoptionListings).toHaveLength(2)
    })
  })

  // ── setLoading ──────────────────────────────────────────────

  describe('setLoading()', () => {
    it('sets isLoading to true', () => {
      const store = useSheltersStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading back to false', () => {
      const store = useSheltersStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('is idempotent when called with the same value', () => {
      const store = useSheltersStore()
      store.setLoading(false)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('does not affect adoptionListings or selectedListing', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA])
      store.setSelectedListing(listingA)
      store.setLoading(true)
      expect(store.adoptionListings).toHaveLength(1)
      expect(store.selectedListing).toEqual(listingA)
    })
  })

  // ── clearShelters ───────────────────────────────────────────

  describe('clearShelters()', () => {
    it('resets adoptionListings to an empty array', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA, listingB])
      store.clearShelters()
      expect(store.adoptionListings).toEqual([])
    })

    it('resets selectedListing to null', () => {
      const store = useSheltersStore()
      store.setSelectedListing(listingA)
      store.clearShelters()
      expect(store.selectedListing).toBeNull()
    })

    it('makes hasAdoptionListings false after clearing', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA, listingB])
      store.clearShelters()
      expect(store.hasAdoptionListings).toBe(false)
    })

    it('makes getAvailableListings return an empty array after clearing', () => {
      const store = useSheltersStore()
      store.setAdoptionListings([listingA])
      store.clearShelters()
      expect(store.getAvailableListings).toEqual([])
    })

    it('is safe to call when the store is already in initial state', () => {
      const store = useSheltersStore()
      expect(() => store.clearShelters()).not.toThrow()
      expect(store.adoptionListings).toEqual([])
      expect(store.selectedListing).toBeNull()
    })
  })
})
