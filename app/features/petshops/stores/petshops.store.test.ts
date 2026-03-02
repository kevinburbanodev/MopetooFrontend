// ============================================================
// petshops.store.test.ts
// Tests the usePetshopsStore Pinia store in isolation.
//
// Strategy: uses the real store (no stubActions) so that action
// implementations are exercised, not mocked away. Each test gets
// a fresh pinia via setActivePinia(createPinia()) in beforeEach.
//
// What this suite does NOT cover intentionally:
//   - HTTP / API calls — those are composable concerns (usePetshops.test.ts)
//   - Component rendering — covered in component test files
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePetshopsStore } from './petshops.store'
import type { Petshop, StoreProduct } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makePetshop(overrides: Partial<Petshop> = {}): Petshop {
  return {
    id: 1,
    name: 'Tienda Mascotas Felices',
    email: 'info@mascotasfelices.com',
    description: 'Una tienda completa para todas las mascotas',
    logo_url: 'https://example.com/tienda.jpg',
    country: 'Colombia',
    city: 'Bogotá',
    phone_country_code: '+57',
    phone: '300 123 4567',
    whatsapp_link: 'https://wa.me/573001234567',
    website: 'https://mascotasfelices.com',
    verified: true,
    is_active: true,
    plan: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeProduct(overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    id: 1,
    store_id: 1,
    name: 'Alimento Premium',
    description: 'Alimento para perros adultos',
    category: 'alimento',
    price: 45.99,
    photo_url: 'https://example.com/food.jpg',
    is_available: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const shopA = makePetshop({ id: 1, name: 'Mascotas Felices', city: 'Bogotá', plan: '' })
const shopB = makePetshop({ id: 2, name: 'PetWorld', city: 'Medellín', plan: 'featured' })
const shopC = makePetshop({ id: 3, name: 'Mundo Animal', city: 'Cali', plan: 'free', verified: false })

const productA = makeProduct({ id: 1, name: 'Alimento Premium' })
const productB = makeProduct({ id: 2, name: 'Collar LED', category: 'accesorios' })

// ── Suite ─────────────────────────────────────────────────────

describe('usePetshopsStore', () => {
  beforeEach(() => {
    // Fresh pinia per test — no state leaks between tests
    setActivePinia(createPinia())
  })

  // ── Initial state ──────────────────────────────────────────

  describe('initial state', () => {
    it('has an empty petshops array', () => {
      const store = usePetshopsStore()
      expect(store.petshops).toEqual([])
    })

    it('has null selectedPetshop', () => {
      const store = usePetshopsStore()
      expect(store.selectedPetshop).toBeNull()
    })

    it('has an empty storeProducts array', () => {
      const store = usePetshopsStore()
      expect(store.storeProducts).toEqual([])
    })

    it('has isLoading false', () => {
      const store = usePetshopsStore()
      expect(store.isLoading).toBe(false)
    })

    it('hasPetshops is false with an empty petshops array', () => {
      const store = usePetshopsStore()
      expect(store.hasPetshops).toBe(false)
    })

    it('getPremiumPetshops returns an empty array', () => {
      const store = usePetshopsStore()
      expect(store.getPremiumPetshops).toEqual([])
    })
  })

  // ── hasPetshops getter ─────────────────────────────────────

  describe('hasPetshops getter', () => {
    it('is false when petshops array is empty', () => {
      const store = usePetshopsStore()
      expect(store.hasPetshops).toBe(false)
    })

    it('is true when at least one petshop exists', () => {
      const store = usePetshopsStore()
      store.addPetshop(shopA)
      expect(store.hasPetshops).toBe(true)
    })

    it('becomes false again after clearPetshops', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA])
      store.clearPetshops()
      expect(store.hasPetshops).toBe(false)
    })

    it('stays true when at least one petshop remains after setting multiple', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, shopB])
      expect(store.hasPetshops).toBe(true)
    })
  })

  // ── getPremiumPetshops getter ──────────────────────────────

  describe('getPremiumPetshops getter', () => {
    it('returns an empty array when no petshops are loaded', () => {
      const store = usePetshopsStore()
      expect(store.getPremiumPetshops).toEqual([])
    })

    it('returns only petshops with plan === "featured"', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, shopB, shopC])
      const premium = store.getPremiumPetshops
      expect(premium).toHaveLength(1)
      expect(premium[0].id).toBe(2)
    })

    it('excludes petshops with plan === "" and plan === "free"', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, shopB, shopC])
      const premium = store.getPremiumPetshops
      expect(premium.find(p => p.id === 1)).toBeUndefined()
      expect(premium.find(p => p.id === 3)).toBeUndefined()
    })

    it('returns all petshops when all have plan === "featured"', () => {
      const store = usePetshopsStore()
      const allPremium = [
        makePetshop({ id: 10, plan: 'featured' }),
        makePetshop({ id: 11, plan: 'featured' }),
      ]
      store.setPetshops(allPremium)
      expect(store.getPremiumPetshops).toHaveLength(2)
    })

    it('returns an empty array when no petshops have plan === "featured"', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, makePetshop({ id: 5, plan: 'free' })])
      expect(store.getPremiumPetshops).toEqual([])
    })

    it('updates reactively when a featured petshop is added', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA]) // plan === ''
      expect(store.getPremiumPetshops).toHaveLength(0)
      store.addPetshop(shopB) // plan === 'featured'
      expect(store.getPremiumPetshops).toHaveLength(1)
    })

    it('returns an empty array after clearPetshops resets the list', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopB]) // plan === 'featured'
      store.clearPetshops()
      expect(store.getPremiumPetshops).toEqual([])
    })
  })

  // ── setPetshops ────────────────────────────────────────────

  describe('setPetshops()', () => {
    it('replaces the petshops array with the provided list', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, shopB])
      expect(store.petshops).toEqual([shopA, shopB])
    })

    it('overwrites any previously stored petshops', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, shopB])
      store.setPetshops([shopC])
      expect(store.petshops).toEqual([shopC])
    })

    it('accepts an empty array, clearing all petshops', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA])
      store.setPetshops([])
      expect(store.petshops).toEqual([])
    })

    it('makes hasPetshops true after setting a non-empty array', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA])
      expect(store.hasPetshops).toBe(true)
    })

    it('preserves the order of the provided list', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopC, shopA, shopB])
      expect(store.petshops[0].id).toBe(3)
      expect(store.petshops[1].id).toBe(1)
      expect(store.petshops[2].id).toBe(2)
    })
  })

  // ── addPetshop ─────────────────────────────────────────────

  describe('addPetshop()', () => {
    it('prepends the petshop to an empty list (unshift — newest-first)', () => {
      const store = usePetshopsStore()
      store.addPetshop(shopA)
      expect(store.petshops).toHaveLength(1)
      expect(store.petshops[0]).toEqual(shopA)
    })

    it('prepends the new petshop before existing ones', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, shopB])
      store.addPetshop(shopC)
      expect(store.petshops[0]).toEqual(shopC)
      expect(store.petshops).toHaveLength(3)
    })

    it('makes hasPetshops true after the first add', () => {
      const store = usePetshopsStore()
      store.addPetshop(shopA)
      expect(store.hasPetshops).toBe(true)
    })

    it('does not mutate the existing petshops when prepending', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, shopB])
      store.addPetshop(shopC)
      expect(store.petshops[1]).toEqual(shopA)
      expect(store.petshops[2]).toEqual(shopB)
    })
  })

  // ── setSelectedPetshop ─────────────────────────────────────

  describe('setSelectedPetshop()', () => {
    it('sets selectedPetshop to the provided petshop', () => {
      const store = usePetshopsStore()
      store.setSelectedPetshop(shopA)
      expect(store.selectedPetshop).toEqual(shopA)
    })

    it('replaces a previously selected petshop', () => {
      const store = usePetshopsStore()
      store.setSelectedPetshop(shopA)
      store.setSelectedPetshop(shopB)
      expect(store.selectedPetshop).toEqual(shopB)
    })

    it('stores all petshop fields intact', () => {
      const store = usePetshopsStore()
      store.setSelectedPetshop(shopA)
      expect(store.selectedPetshop?.name).toBe('Mascotas Felices')
      expect(store.selectedPetshop?.verified).toBe(true)
      expect(store.selectedPetshop?.plan).toBe('')
    })

    it('does not affect the petshops array', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, shopB])
      store.setSelectedPetshop(shopA)
      expect(store.petshops).toHaveLength(2)
    })
  })

  // ── clearSelectedPetshop ───────────────────────────────────

  describe('clearSelectedPetshop()', () => {
    it('sets selectedPetshop to null', () => {
      const store = usePetshopsStore()
      store.setSelectedPetshop(shopA)
      store.clearSelectedPetshop()
      expect(store.selectedPetshop).toBeNull()
    })

    it('is safe to call when selectedPetshop is already null', () => {
      const store = usePetshopsStore()
      expect(() => store.clearSelectedPetshop()).not.toThrow()
      expect(store.selectedPetshop).toBeNull()
    })

    it('does not affect the petshops array', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, shopB])
      store.setSelectedPetshop(shopA)
      store.clearSelectedPetshop()
      expect(store.petshops).toHaveLength(2)
    })
  })

  // ── setStoreProducts / clearStoreProducts ──────────────────

  describe('setStoreProducts()', () => {
    it('sets storeProducts to the provided list', () => {
      const store = usePetshopsStore()
      store.setStoreProducts([productA, productB])
      expect(store.storeProducts).toEqual([productA, productB])
    })

    it('overwrites previously stored products', () => {
      const store = usePetshopsStore()
      store.setStoreProducts([productA])
      store.setStoreProducts([productB])
      expect(store.storeProducts).toEqual([productB])
    })

    it('accepts an empty array', () => {
      const store = usePetshopsStore()
      store.setStoreProducts([productA])
      store.setStoreProducts([])
      expect(store.storeProducts).toEqual([])
    })
  })

  describe('clearStoreProducts()', () => {
    it('resets storeProducts to an empty array', () => {
      const store = usePetshopsStore()
      store.setStoreProducts([productA, productB])
      store.clearStoreProducts()
      expect(store.storeProducts).toEqual([])
    })

    it('is safe to call when storeProducts is already empty', () => {
      const store = usePetshopsStore()
      expect(() => store.clearStoreProducts()).not.toThrow()
      expect(store.storeProducts).toEqual([])
    })
  })

  // ── setLoading ─────────────────────────────────────────────

  describe('setLoading()', () => {
    it('sets isLoading to true', () => {
      const store = usePetshopsStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading back to false', () => {
      const store = usePetshopsStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('is idempotent when called with the same value', () => {
      const store = usePetshopsStore()
      store.setLoading(false)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('does not affect petshops or selectedPetshop', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA])
      store.setSelectedPetshop(shopA)
      store.setLoading(true)
      expect(store.petshops).toHaveLength(1)
      expect(store.selectedPetshop).toEqual(shopA)
    })
  })

  // ── clearPetshops ──────────────────────────────────────────

  describe('clearPetshops()', () => {
    it('resets petshops to an empty array', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, shopB])
      store.clearPetshops()
      expect(store.petshops).toEqual([])
    })

    it('resets selectedPetshop to null', () => {
      const store = usePetshopsStore()
      store.setSelectedPetshop(shopA)
      store.clearPetshops()
      expect(store.selectedPetshop).toBeNull()
    })

    it('resets storeProducts to an empty array', () => {
      const store = usePetshopsStore()
      store.setStoreProducts([productA, productB])
      store.clearPetshops()
      expect(store.storeProducts).toEqual([])
    })

    it('makes hasPetshops false after clearing', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopA, shopB, shopC])
      store.clearPetshops()
      expect(store.hasPetshops).toBe(false)
    })

    it('makes getPremiumPetshops return an empty array after clearing', () => {
      const store = usePetshopsStore()
      store.setPetshops([shopB, shopC]) // both have plan
      store.clearPetshops()
      expect(store.getPremiumPetshops).toEqual([])
    })

    it('is safe to call when the store is already in initial state', () => {
      const store = usePetshopsStore()
      expect(() => store.clearPetshops()).not.toThrow()
      expect(store.petshops).toEqual([])
      expect(store.selectedPetshop).toBeNull()
      expect(store.storeProducts).toEqual([])
    })

    it('does NOT reset isLoading (loading state is not part of clearPetshops)', () => {
      const store = usePetshopsStore()
      store.setLoading(true)
      store.clearPetshops()
      expect(store.petshops).toEqual([])
    })
  })
})
