// ============================================================
// pets.store.test.ts
// Tests the pets Pinia store in isolation using createPinia.
//
// Strategy: uses the real store (no stubActions) so that action
// implementations are exercised, not mocked away. Each test gets
// a fresh pinia via setActivePinia(createPinia()) in beforeEach.
//
// What this suite does NOT cover intentionally:
//   - HTTP / API calls — those are composable concerns (usePets.test.ts)
//   - Component rendering — covered in component test files
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePetsStore } from './pets.store'
import type { Pet } from '../types'

// ── Fixtures ────────────────────────────────────────────────

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'pet-1',
    user_id: 'user-1',
    name: 'Max',
    species: 'dog',
    breed: 'Labrador',
    birth_date: '2021-06-15',
    gender: 'male',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const petA = makePet({ id: 'pet-1', name: 'Max', species: 'dog' })
const petB = makePet({ id: 'pet-2', name: 'Luna', species: 'cat', gender: 'female' })
const petC = makePet({ id: 'pet-3', name: 'Pico', species: 'bird', gender: 'male' })

// ── Suite ────────────────────────────────────────────────────

describe('usePetsStore', () => {
  beforeEach(() => {
    // Fresh pinia per test — no state leaks between tests
    setActivePinia(createPinia())
  })

  // ── Initial state ──────────────────────────────────────────

  describe('initial state', () => {
    it('has an empty pets array', () => {
      const store = usePetsStore()
      expect(store.pets).toEqual([])
    })

    it('has null selectedPet', () => {
      const store = usePetsStore()
      expect(store.selectedPet).toBeNull()
    })

    it('has isLoading false', () => {
      const store = usePetsStore()
      expect(store.isLoading).toBe(false)
    })

    it('hasPets is false with an empty array', () => {
      const store = usePetsStore()
      expect(store.hasPets).toBe(false)
    })
  })

  // ── setPets ────────────────────────────────────────────────

  describe('setPets()', () => {
    it('replaces the pets array with the provided list', () => {
      const store = usePetsStore()
      store.setPets([petA, petB])
      expect(store.pets).toEqual([petA, petB])
    })

    it('overwrites any previously stored pets', () => {
      const store = usePetsStore()
      store.setPets([petA, petB])
      store.setPets([petC])
      expect(store.pets).toEqual([petC])
    })

    it('accepts an empty array, clearing all pets', () => {
      const store = usePetsStore()
      store.setPets([petA])
      store.setPets([])
      expect(store.pets).toEqual([])
    })

    it('makes hasPets true after setting a non-empty array', () => {
      const store = usePetsStore()
      store.setPets([petA])
      expect(store.hasPets).toBe(true)
    })

    it('makes hasPets false after setting an empty array', () => {
      const store = usePetsStore()
      store.setPets([petA])
      store.setPets([])
      expect(store.hasPets).toBe(false)
    })
  })

  // ── addPet ─────────────────────────────────────────────────

  describe('addPet()', () => {
    it('appends the pet to an empty list', () => {
      const store = usePetsStore()
      store.addPet(petA)
      expect(store.pets).toHaveLength(1)
      expect(store.pets[0]).toEqual(petA)
    })

    it('appends the pet to an existing list without replacing other entries', () => {
      const store = usePetsStore()
      store.setPets([petA, petB])
      store.addPet(petC)
      expect(store.pets).toHaveLength(3)
      expect(store.pets[2]).toEqual(petC)
    })

    it('makes hasPets true', () => {
      const store = usePetsStore()
      store.addPet(petA)
      expect(store.hasPets).toBe(true)
    })

    it('preserves order: new pet is last in the array', () => {
      const store = usePetsStore()
      store.addPet(petA)
      store.addPet(petB)
      expect(store.pets[0].id).toBe('pet-1')
      expect(store.pets[1].id).toBe('pet-2')
    })
  })

  // ── updatePet ──────────────────────────────────────────────

  describe('updatePet()', () => {
    it('replaces the matching pet in the list by id', () => {
      const store = usePetsStore()
      store.setPets([petA, petB])
      const updated = { ...petA, name: 'Maximiliano', weight: 28 }
      store.updatePet(updated)
      expect(store.pets[0]).toEqual(updated)
    })

    it('does not mutate other pets in the list', () => {
      const store = usePetsStore()
      store.setPets([petA, petB])
      store.updatePet({ ...petA, name: 'Maximiliano' })
      expect(store.pets[1]).toEqual(petB)
    })

    it('is a no-op when the id is not found in the list', () => {
      const store = usePetsStore()
      store.setPets([petA])
      const phantom = makePet({ id: 'does-not-exist', name: 'Ghost' })
      store.updatePet(phantom)
      expect(store.pets).toEqual([petA])
    })

    it('keeps the list length the same after an update', () => {
      const store = usePetsStore()
      store.setPets([petA, petB, petC])
      store.updatePet({ ...petB, name: 'Luna Updated' })
      expect(store.pets).toHaveLength(3)
    })

    it('syncs selectedPet when the updated id matches', () => {
      const store = usePetsStore()
      store.setPets([petA])
      store.setSelectedPet(petA)
      const updated = { ...petA, name: 'Maximiliano' }
      store.updatePet(updated)
      expect(store.selectedPet).toEqual(updated)
    })

    it('does NOT change selectedPet when the updated id does not match', () => {
      const store = usePetsStore()
      store.setPets([petA, petB])
      store.setSelectedPet(petB)
      store.updatePet({ ...petA, name: 'Maximiliano' })
      expect(store.selectedPet).toEqual(petB)
    })

    it('leaves selectedPet null when no pet is selected', () => {
      const store = usePetsStore()
      store.setPets([petA])
      store.updatePet({ ...petA, name: 'Maximiliano' })
      expect(store.selectedPet).toBeNull()
    })
  })

  // ── removePet ──────────────────────────────────────────────

  describe('removePet()', () => {
    it('removes the pet with the matching id', () => {
      const store = usePetsStore()
      store.setPets([petA, petB])
      store.removePet('pet-1')
      expect(store.pets).toEqual([petB])
    })

    it('does not affect other pets in the list', () => {
      const store = usePetsStore()
      store.setPets([petA, petB, petC])
      store.removePet('pet-2')
      expect(store.pets).toEqual([petA, petC])
    })

    it('is a no-op when the id is not found', () => {
      const store = usePetsStore()
      store.setPets([petA])
      store.removePet('does-not-exist')
      expect(store.pets).toEqual([petA])
    })

    it('results in an empty list when the only pet is removed', () => {
      const store = usePetsStore()
      store.setPets([petA])
      store.removePet('pet-1')
      expect(store.pets).toEqual([])
    })

    it('clears selectedPet when the removed id matches', () => {
      const store = usePetsStore()
      store.setPets([petA, petB])
      store.setSelectedPet(petA)
      store.removePet('pet-1')
      expect(store.selectedPet).toBeNull()
    })

    it('does NOT clear selectedPet when a different pet is removed', () => {
      const store = usePetsStore()
      store.setPets([petA, petB])
      store.setSelectedPet(petB)
      store.removePet('pet-1')
      expect(store.selectedPet).toEqual(petB)
    })

    it('makes hasPets false when the last pet is removed', () => {
      const store = usePetsStore()
      store.setPets([petA])
      store.removePet('pet-1')
      expect(store.hasPets).toBe(false)
    })
  })

  // ── setSelectedPet ─────────────────────────────────────────

  describe('setSelectedPet()', () => {
    it('sets selectedPet to the provided pet', () => {
      const store = usePetsStore()
      store.setSelectedPet(petA)
      expect(store.selectedPet).toEqual(petA)
    })

    it('replaces a previously selected pet', () => {
      const store = usePetsStore()
      store.setSelectedPet(petA)
      store.setSelectedPet(petB)
      expect(store.selectedPet).toEqual(petB)
    })

    it('accepts null to clear the selection', () => {
      const store = usePetsStore()
      store.setSelectedPet(petA)
      store.setSelectedPet(null)
      expect(store.selectedPet).toBeNull()
    })
  })

  // ── clearSelectedPet ───────────────────────────────────────

  describe('clearSelectedPet()', () => {
    it('sets selectedPet to null', () => {
      const store = usePetsStore()
      store.setSelectedPet(petA)
      store.clearSelectedPet()
      expect(store.selectedPet).toBeNull()
    })

    it('is safe to call when selectedPet is already null', () => {
      const store = usePetsStore()
      expect(() => store.clearSelectedPet()).not.toThrow()
      expect(store.selectedPet).toBeNull()
    })
  })

  // ── setLoading ─────────────────────────────────────────────

  describe('setLoading()', () => {
    it('sets isLoading to true', () => {
      const store = usePetsStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading back to false', () => {
      const store = usePetsStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })
  })

  // ── hasPets getter ─────────────────────────────────────────

  describe('hasPets getter', () => {
    it('is false when pets is empty', () => {
      const store = usePetsStore()
      expect(store.hasPets).toBe(false)
    })

    it('is true when at least one pet exists', () => {
      const store = usePetsStore()
      store.addPet(petA)
      expect(store.hasPets).toBe(true)
    })

    it('becomes false again after removing the last pet', () => {
      const store = usePetsStore()
      store.addPet(petA)
      store.removePet('pet-1')
      expect(store.hasPets).toBe(false)
    })
  })

  // ── getPetById getter ──────────────────────────────────────

  describe('getPetById()', () => {
    it('returns the matching pet when the id is in the list', () => {
      const store = usePetsStore()
      store.setPets([petA, petB])
      expect(store.getPetById('pet-2')).toEqual(petB)
    })

    it('returns undefined when the id is not in the list', () => {
      const store = usePetsStore()
      store.setPets([petA])
      expect(store.getPetById('does-not-exist')).toBeUndefined()
    })

    it('returns undefined when the pets list is empty', () => {
      const store = usePetsStore()
      expect(store.getPetById('pet-1')).toBeUndefined()
    })
  })
})
