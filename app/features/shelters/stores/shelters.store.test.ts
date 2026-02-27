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
import type { Shelter, AdoptionPet } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeShelter(overrides: Partial<Shelter> = {}): Shelter {
  return {
    id: '1',
    name: 'Refugio Esperanza',
    description: 'Un refugio para animales necesitados',
    location: 'Bogotá, Colombia',
    city: 'Bogotá',
    address: 'Calle 100 #20-30',
    phone: '+57 300 000 0000',
    email: 'info@refugio.com',
    website: 'https://refugio.com',
    photo_url: 'https://example.com/shelter.jpg',
    species: ['dogs', 'cats'],
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeAdoptionPet(overrides: Partial<AdoptionPet> = {}): AdoptionPet {
  return {
    id: 'pet1',
    shelter_id: '1',
    name: 'Max',
    species: 'dog',
    breed: 'Labrador',
    age_months: 18,
    gender: 'male',
    size: 'large',
    description: 'Un perro muy cariñoso',
    photo_url: 'https://example.com/max.jpg',
    status: 'available',
    vaccinated: true,
    neutered: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const shelterA = makeShelter({ id: '1', name: 'Refugio Esperanza', city: 'Bogotá' })
const shelterB = makeShelter({ id: '2', name: 'Patitas Felices', city: 'Medellín', species: ['cats'] })
const shelterC = makeShelter({ id: '3', name: 'Amigos Peludos', city: 'Cali', is_verified: false })

const petA = makeAdoptionPet({ id: 'pet1', shelter_id: '1', name: 'Max', status: 'available' })
const petB = makeAdoptionPet({ id: 'pet2', shelter_id: '1', name: 'Luna', status: 'pending', species: 'cat', gender: 'female' })
const petC = makeAdoptionPet({ id: 'pet3', shelter_id: '2', name: 'Toby', status: 'adopted', species: 'dog' })

// ── Suite ─────────────────────────────────────────────────────

describe('useSheltersStore', () => {
  beforeEach(() => {
    // Fresh pinia per test — no state leaks between tests
    setActivePinia(createPinia())
  })

  // ── Initial state ──────────────────────────────────────────

  describe('initial state', () => {
    it('has an empty shelters array', () => {
      const store = useSheltersStore()
      expect(store.shelters).toEqual([])
    })

    it('has null selectedShelter', () => {
      const store = useSheltersStore()
      expect(store.selectedShelter).toBeNull()
    })

    it('has an empty adoptionPets array', () => {
      const store = useSheltersStore()
      expect(store.adoptionPets).toEqual([])
    })

    it('has null selectedAdoptionPet', () => {
      const store = useSheltersStore()
      expect(store.selectedAdoptionPet).toBeNull()
    })

    it('has isLoading false', () => {
      const store = useSheltersStore()
      expect(store.isLoading).toBe(false)
    })

    it('hasShelters is false with an empty shelters array', () => {
      const store = useSheltersStore()
      expect(store.hasShelters).toBe(false)
    })

    it('hasAdoptionPets is false with an empty adoptionPets array', () => {
      const store = useSheltersStore()
      expect(store.hasAdoptionPets).toBe(false)
    })

    it('getAvailablePets returns an empty array', () => {
      const store = useSheltersStore()
      expect(store.getAvailablePets).toEqual([])
    })
  })

  // ── hasShelters getter ─────────────────────────────────────

  describe('hasShelters getter', () => {
    it('is false when shelters array is empty', () => {
      const store = useSheltersStore()
      expect(store.hasShelters).toBe(false)
    })

    it('is true when at least one shelter exists', () => {
      const store = useSheltersStore()
      store.addShelter(shelterA)
      expect(store.hasShelters).toBe(true)
    })

    it('becomes false again after clearing all shelters', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA])
      store.clearShelters()
      expect(store.hasShelters).toBe(false)
    })

    it('stays true when at least one shelter remains', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA, shelterB])
      expect(store.hasShelters).toBe(true)
    })
  })

  // ── hasAdoptionPets getter ─────────────────────────────────

  describe('hasAdoptionPets getter', () => {
    it('is false when adoptionPets array is empty', () => {
      const store = useSheltersStore()
      expect(store.hasAdoptionPets).toBe(false)
    })

    it('is true when at least one adoption pet exists', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA])
      expect(store.hasAdoptionPets).toBe(true)
    })

    it('becomes false after clearShelters resets adoptionPets', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA, petB])
      store.clearShelters()
      expect(store.hasAdoptionPets).toBe(false)
    })
  })

  // ── getAvailablePets getter ────────────────────────────────

  describe('getAvailablePets getter', () => {
    it('returns only pets with status === "available"', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA, petB, petC])
      const available = store.getAvailablePets
      expect(available).toHaveLength(1)
      expect(available[0].id).toBe('pet1')
    })

    it('returns an empty array when no pets are available', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petB, petC]) // pending and adopted only
      expect(store.getAvailablePets).toEqual([])
    })

    it('returns all pets when all have status "available"', () => {
      const store = useSheltersStore()
      const availableA = makeAdoptionPet({ id: 'p1', status: 'available' })
      const availableB = makeAdoptionPet({ id: 'p2', status: 'available' })
      store.setAdoptionPets([availableA, availableB])
      expect(store.getAvailablePets).toHaveLength(2)
    })

    it('excludes pets with status "pending"', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petB]) // status: 'pending'
      expect(store.getAvailablePets).toHaveLength(0)
    })

    it('excludes pets with status "adopted"', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petC]) // status: 'adopted'
      expect(store.getAvailablePets).toHaveLength(0)
    })

    it('updates reactively when a new available pet is added', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petB, petC]) // none available
      expect(store.getAvailablePets).toHaveLength(0)
      store.addAdoptionPet(petA) // add an available one
      expect(store.getAvailablePets).toHaveLength(1)
    })
  })

  // ── setShelters ────────────────────────────────────────────

  describe('setShelters()', () => {
    it('replaces the shelters array with the provided list', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA, shelterB])
      expect(store.shelters).toEqual([shelterA, shelterB])
    })

    it('overwrites any previously stored shelters', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA, shelterB])
      store.setShelters([shelterC])
      expect(store.shelters).toEqual([shelterC])
    })

    it('accepts an empty array, clearing all shelters', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA])
      store.setShelters([])
      expect(store.shelters).toEqual([])
    })

    it('makes hasShelters true after setting a non-empty array', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA])
      expect(store.hasShelters).toBe(true)
    })

    it('preserves the order of the provided list', () => {
      const store = useSheltersStore()
      store.setShelters([shelterC, shelterA, shelterB])
      expect(store.shelters[0].id).toBe('3')
      expect(store.shelters[1].id).toBe('1')
      expect(store.shelters[2].id).toBe('2')
    })
  })

  // ── addShelter ─────────────────────────────────────────────

  describe('addShelter()', () => {
    it('prepends the shelter to an empty list (unshift — newest-first)', () => {
      const store = useSheltersStore()
      store.addShelter(shelterA)
      expect(store.shelters).toHaveLength(1)
      expect(store.shelters[0]).toEqual(shelterA)
    })

    it('prepends the new shelter before existing shelters', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA, shelterB])
      store.addShelter(shelterC)
      expect(store.shelters[0]).toEqual(shelterC)
      expect(store.shelters).toHaveLength(3)
    })

    it('makes hasShelters true', () => {
      const store = useSheltersStore()
      store.addShelter(shelterA)
      expect(store.hasShelters).toBe(true)
    })

    it('does not mutate existing shelters when prepending', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA, shelterB])
      store.addShelter(shelterC)
      expect(store.shelters[1]).toEqual(shelterA)
      expect(store.shelters[2]).toEqual(shelterB)
    })
  })

  // ── setSelectedShelter ─────────────────────────────────────

  describe('setSelectedShelter()', () => {
    it('sets selectedShelter to the provided shelter', () => {
      const store = useSheltersStore()
      store.setSelectedShelter(shelterA)
      expect(store.selectedShelter).toEqual(shelterA)
    })

    it('replaces a previously selected shelter', () => {
      const store = useSheltersStore()
      store.setSelectedShelter(shelterA)
      store.setSelectedShelter(shelterB)
      expect(store.selectedShelter).toEqual(shelterB)
    })

    it('accepts null to clear the selection', () => {
      const store = useSheltersStore()
      store.setSelectedShelter(shelterA)
      store.setSelectedShelter(null)
      expect(store.selectedShelter).toBeNull()
    })

    it('stores all shelter fields intact', () => {
      const store = useSheltersStore()
      store.setSelectedShelter(shelterA)
      expect(store.selectedShelter?.name).toBe('Refugio Esperanza')
      expect(store.selectedShelter?.is_verified).toBe(true)
      expect(store.selectedShelter?.species).toEqual(['dogs', 'cats'])
    })
  })

  // ── clearSelectedShelter ───────────────────────────────────

  describe('clearSelectedShelter()', () => {
    it('sets selectedShelter to null', () => {
      const store = useSheltersStore()
      store.setSelectedShelter(shelterA)
      store.clearSelectedShelter()
      expect(store.selectedShelter).toBeNull()
    })

    it('is safe to call when selectedShelter is already null', () => {
      const store = useSheltersStore()
      expect(() => store.clearSelectedShelter()).not.toThrow()
      expect(store.selectedShelter).toBeNull()
    })

    it('does not affect the shelters array', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA, shelterB])
      store.setSelectedShelter(shelterA)
      store.clearSelectedShelter()
      expect(store.shelters).toHaveLength(2)
    })
  })

  // ── setAdoptionPets ────────────────────────────────────────

  describe('setAdoptionPets()', () => {
    it('replaces the adoptionPets array with the provided list', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA, petB])
      expect(store.adoptionPets).toEqual([petA, petB])
    })

    it('overwrites any previously stored adoption pets', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA, petB])
      store.setAdoptionPets([petC])
      expect(store.adoptionPets).toEqual([petC])
    })

    it('accepts an empty array, clearing all adoption pets', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA])
      store.setAdoptionPets([])
      expect(store.adoptionPets).toEqual([])
    })

    it('makes hasAdoptionPets true after setting a non-empty array', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA])
      expect(store.hasAdoptionPets).toBe(true)
    })

    it('preserves the order of the provided list', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petC, petA, petB])
      expect(store.adoptionPets[0].id).toBe('pet3')
      expect(store.adoptionPets[1].id).toBe('pet1')
      expect(store.adoptionPets[2].id).toBe('pet2')
    })
  })

  // ── addAdoptionPet ─────────────────────────────────────────

  describe('addAdoptionPet()', () => {
    it('prepends the pet to an empty list (unshift)', () => {
      const store = useSheltersStore()
      store.addAdoptionPet(petA)
      expect(store.adoptionPets).toHaveLength(1)
      expect(store.adoptionPets[0]).toEqual(petA)
    })

    it('prepends the new pet before existing pets', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA, petB])
      store.addAdoptionPet(petC)
      expect(store.adoptionPets[0]).toEqual(petC)
      expect(store.adoptionPets).toHaveLength(3)
    })

    it('makes hasAdoptionPets true', () => {
      const store = useSheltersStore()
      store.addAdoptionPet(petA)
      expect(store.hasAdoptionPets).toBe(true)
    })

    it('does not mutate existing pets when prepending', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA, petB])
      store.addAdoptionPet(petC)
      expect(store.adoptionPets[1]).toEqual(petA)
      expect(store.adoptionPets[2]).toEqual(petB)
    })
  })

  // ── setSelectedAdoptionPet ─────────────────────────────────

  describe('setSelectedAdoptionPet()', () => {
    it('sets selectedAdoptionPet to the provided pet', () => {
      const store = useSheltersStore()
      store.setSelectedAdoptionPet(petA)
      expect(store.selectedAdoptionPet).toEqual(petA)
    })

    it('replaces a previously selected adoption pet', () => {
      const store = useSheltersStore()
      store.setSelectedAdoptionPet(petA)
      store.setSelectedAdoptionPet(petB)
      expect(store.selectedAdoptionPet).toEqual(petB)
    })

    it('accepts null to clear the selection', () => {
      const store = useSheltersStore()
      store.setSelectedAdoptionPet(petA)
      store.setSelectedAdoptionPet(null)
      expect(store.selectedAdoptionPet).toBeNull()
    })

    it('stores all pet fields intact', () => {
      const store = useSheltersStore()
      store.setSelectedAdoptionPet(petA)
      expect(store.selectedAdoptionPet?.name).toBe('Max')
      expect(store.selectedAdoptionPet?.status).toBe('available')
      expect(store.selectedAdoptionPet?.vaccinated).toBe(true)
    })
  })

  // ── clearSelectedAdoptionPet ───────────────────────────────

  describe('clearSelectedAdoptionPet()', () => {
    it('sets selectedAdoptionPet to null', () => {
      const store = useSheltersStore()
      store.setSelectedAdoptionPet(petA)
      store.clearSelectedAdoptionPet()
      expect(store.selectedAdoptionPet).toBeNull()
    })

    it('is safe to call when selectedAdoptionPet is already null', () => {
      const store = useSheltersStore()
      expect(() => store.clearSelectedAdoptionPet()).not.toThrow()
      expect(store.selectedAdoptionPet).toBeNull()
    })

    it('does not affect the adoptionPets array', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA, petB])
      store.setSelectedAdoptionPet(petA)
      store.clearSelectedAdoptionPet()
      expect(store.adoptionPets).toHaveLength(2)
    })
  })

  // ── setLoading ─────────────────────────────────────────────

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

    it('does not affect shelters, selectedShelter, or adoptionPets', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA])
      store.setSelectedShelter(shelterA)
      store.setAdoptionPets([petA])
      store.setLoading(true)
      expect(store.shelters).toHaveLength(1)
      expect(store.selectedShelter).toEqual(shelterA)
      expect(store.adoptionPets).toHaveLength(1)
    })
  })

  // ── clearShelters ──────────────────────────────────────────

  describe('clearShelters()', () => {
    it('resets shelters to an empty array', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA, shelterB])
      store.clearShelters()
      expect(store.shelters).toEqual([])
    })

    it('resets selectedShelter to null', () => {
      const store = useSheltersStore()
      store.setSelectedShelter(shelterA)
      store.clearShelters()
      expect(store.selectedShelter).toBeNull()
    })

    it('resets adoptionPets to an empty array', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA, petB])
      store.clearShelters()
      expect(store.adoptionPets).toEqual([])
    })

    it('resets selectedAdoptionPet to null', () => {
      const store = useSheltersStore()
      store.setSelectedAdoptionPet(petA)
      store.clearShelters()
      expect(store.selectedAdoptionPet).toBeNull()
    })

    it('makes hasShelters false after clearing', () => {
      const store = useSheltersStore()
      store.setShelters([shelterA, shelterB, shelterC])
      store.clearShelters()
      expect(store.hasShelters).toBe(false)
    })

    it('makes hasAdoptionPets false after clearing', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA, petB])
      store.clearShelters()
      expect(store.hasAdoptionPets).toBe(false)
    })

    it('makes getAvailablePets return an empty array after clearing', () => {
      const store = useSheltersStore()
      store.setAdoptionPets([petA]) // available
      store.clearShelters()
      expect(store.getAvailablePets).toEqual([])
    })

    it('is safe to call when the store is already in initial state', () => {
      const store = useSheltersStore()
      expect(() => store.clearShelters()).not.toThrow()
      expect(store.shelters).toEqual([])
      expect(store.selectedShelter).toBeNull()
      expect(store.adoptionPets).toEqual([])
      expect(store.selectedAdoptionPet).toBeNull()
    })
  })
})
