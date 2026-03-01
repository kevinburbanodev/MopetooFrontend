// ============================================================
// usePetshops.test.ts
// Tests the usePetshops composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT the right tool.
//   - useRuntimeConfig is NOT mocked here. NUXT_PUBLIC_API_BASE is
//     provided via vitest.config.ts env options.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs and we can spy on it.
//
// What this suite does NOT cover intentionally:
//   - Network retry logic — no retry exists; nothing to test.
//   - Browser navigation or redirect behaviour — that belongs in
//     page-level or middleware tests.
//   - ID format validation in fetchPetshopById — this is enforced in
//     PetshopDetail (component lifecycle), not the composable itself.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { Petshop, StoreProduct } from '../types'

// ── useApi mock ──────────────────────────────────────────────
// useApi is a project composable — vi.mock intercepts the module.

const mockGet = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet }),
}))

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

const shopA = makePetshop({ id: 1, name: 'Mascotas Felices' })
const shopB = makePetshop({ id: 2, name: 'PetWorld', city: 'Medellín', plan: 'premium' })
const productA = makeProduct({ id: 1, name: 'Alimento Premium' })
const productB = makeProduct({ id: 2, name: 'Collar LED', category: 'accesorios' })

// ── Suite ─────────────────────────────────────────────────────

describe('usePetshops', () => {
  let petshopsStore: ReturnType<typeof import('../stores/petshops.store').usePetshopsStore>

  beforeEach(async () => {
    // Isolate Pinia per test.
    // stubActions: false so real store action logic runs.
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    const { usePetshopsStore } = await import('../stores/petshops.store')
    petshopsStore = usePetshopsStore()

    mockGet.mockReset()
  })

  // ── fetchPetshops ──────────────────────────────────────────

  describe('fetchPetshops()', () => {
    it('calls GET /api/stores when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce([shopA])
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops()

      expect(mockGet).toHaveBeenCalledWith('/api/stores')
    })

    it('hydrates the store when the response is a bare Petshop array', async () => {
      mockGet.mockResolvedValueOnce([shopA, shopB])
      const setPetshopsSpy = vi.spyOn(petshopsStore, 'setPetshops')
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops()

      expect(setPetshopsSpy).toHaveBeenCalledWith([shopA, shopB])
    })

    it('hydrates the store when the response is shaped as { stores: Petshop[] }', async () => {
      mockGet.mockResolvedValueOnce({ stores: [shopA, shopB] })
      const setPetshopsSpy = vi.spyOn(petshopsStore, 'setPetshops')
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops()

      expect(setPetshopsSpy).toHaveBeenCalledWith([shopA, shopB])
    })

    it('calls setPetshops with an empty array when { stores } key is missing', async () => {
      mockGet.mockResolvedValueOnce({})
      const setPetshopsSpy = vi.spyOn(petshopsStore, 'setPetshops')
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops()

      expect(setPetshopsSpy).toHaveBeenCalledWith([])
    })

    it('calls setPetshops with an empty array when stores key is undefined', async () => {
      mockGet.mockResolvedValueOnce({ stores: undefined })
      const setPetshopsSpy = vi.spyOn(petshopsStore, 'setPetshops')
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops()

      expect(setPetshopsSpy).toHaveBeenCalledWith([])
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = petshopsStore.isLoading
        return [shopA]
      })
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops()

      expect(loadingDuringCall).toBe(true)
      expect(petshopsStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops()

      expect(petshopsStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Error del servidor' } })
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops, error } = usePetshops()

      await fetchPetshops()

      expect(error.value).toBe('Error del servidor')
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce([shopA])
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops, error } = usePetshops()

      error.value = 'error previo'
      await fetchPetshops()

      expect(error.value).toBeNull()
    })

    it('sets error to null on successful fetch', async () => {
      mockGet.mockResolvedValueOnce([shopA])
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops, error } = usePetshops()

      await fetchPetshops()

      expect(error.value).toBeNull()
    })

    it('falls back to generic error message for unexpected error shapes', async () => {
      mockGet.mockRejectedValueOnce('unexpected string error')
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops, error } = usePetshops()

      await fetchPetshops()

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })
  })

  // ── fetchPetshops with filters ─────────────────────────────

  describe('fetchPetshops(filters)', () => {
    it('appends city filter as a query string parameter', async () => {
      mockGet.mockResolvedValueOnce([])
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops({ city: 'Bogotá' })

      expect(mockGet).toHaveBeenCalledWith('/api/stores?city=Bogot%C3%A1')
    })

    it('appends category filter as a query string parameter', async () => {
      mockGet.mockResolvedValueOnce([])
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops({ category: 'alimento' })

      expect(mockGet).toHaveBeenCalledWith('/api/stores?category=alimento')
    })

    it('omits empty filter values from the query string', async () => {
      mockGet.mockResolvedValueOnce([])
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      // Empty strings are falsy and should not be appended
      await fetchPetshops({ city: '', category: '' })

      expect(mockGet).toHaveBeenCalledWith('/api/stores')
    })

    it('combines multiple filter parameters correctly', async () => {
      mockGet.mockResolvedValueOnce([])
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops({ city: 'Bogotá', category: 'alimento' })

      const calledPath: string = mockGet.mock.calls[0][0]
      expect(calledPath).toContain('/api/stores?')
      expect(calledPath).toContain('city=Bogot%C3%A1')
      expect(calledPath).toContain('category=alimento')
    })

    it('calls GET /api/stores (no query string) when filters object is empty', async () => {
      mockGet.mockResolvedValueOnce([])
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops({})

      expect(mockGet).toHaveBeenCalledWith('/api/stores')
    })

    it('calls GET /api/stores (no query string) when filters is undefined', async () => {
      mockGet.mockResolvedValueOnce([])
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops } = usePetshops()

      await fetchPetshops(undefined)

      expect(mockGet).toHaveBeenCalledWith('/api/stores')
    })
  })

  // ── fetchPetshopById ───────────────────────────────────────

  describe('fetchPetshopById()', () => {
    it('calls GET /api/stores/{id} when id is not in the store cache', async () => {
      mockGet.mockResolvedValueOnce(shopA)
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      await fetchPetshopById(1)

      expect(mockGet).toHaveBeenCalledWith('/api/stores/1')
    })

    it('returns the petshop from the store cache without calling the API (store-first lookup)', async () => {
      // Pre-populate the store with shopA
      petshopsStore.setPetshops([shopA])
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      const result = await fetchPetshopById(1)

      // Should NOT have called the network at all
      expect(mockGet).not.toHaveBeenCalled()
      expect(result).toEqual(shopA)
    })

    it('calls setSelectedPetshop via store-first lookup when cache hit', async () => {
      petshopsStore.setPetshops([shopA])
      const setSelectedSpy = vi.spyOn(petshopsStore, 'setSelectedPetshop')
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      await fetchPetshopById(1)

      expect(setSelectedSpy).toHaveBeenCalledWith(shopA)
    })

    it('falls back to API call when id is not in the store cache', async () => {
      // Store has shopA (id=1); requesting shopB (id=2) forces network call
      petshopsStore.setPetshops([shopA])
      mockGet.mockResolvedValueOnce(shopB)
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      await fetchPetshopById(2)

      expect(mockGet).toHaveBeenCalledWith('/api/stores/2')
    })

    it('calls setSelectedPetshop on the store with the returned petshop', async () => {
      mockGet.mockResolvedValueOnce(shopA)
      const setSelectedSpy = vi.spyOn(petshopsStore, 'setSelectedPetshop')
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      await fetchPetshopById(1)

      expect(setSelectedSpy).toHaveBeenCalledWith(shopA)
    })

    it('returns the petshop on success', async () => {
      mockGet.mockResolvedValueOnce(shopA)
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      const result = await fetchPetshopById(1)

      expect(result).toEqual(shopA)
    })

    it('returns null when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404, data: { error: 'Not found' } })
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      const result = await fetchPetshopById(999)

      expect(result).toBeNull()
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'No encontrado' } })
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById, error } = usePetshops()

      await fetchPetshopById(999)

      expect(error.value).toBe('No encontrado')
    })

    it('does NOT call setSelectedPetshop when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404 })
      const setSelectedSpy = vi.spyOn(petshopsStore, 'setSelectedPetshop')
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      await fetchPetshopById(999)

      expect(setSelectedSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = petshopsStore.isLoading
        return shopA
      })
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      await fetchPetshopById(1)

      expect(loadingDuringCall).toBe(true)
      expect(petshopsStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      await fetchPetshopById(1)

      expect(petshopsStore.isLoading).toBe(false)
    })

    it('does NOT set isLoading when returning from store cache (no network round-trip)', async () => {
      // Cache hit path skips setLoading(true)/setLoading(false)
      petshopsStore.setPetshops([shopA])
      const setLoadingSpy = vi.spyOn(petshopsStore, 'setLoading')
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      await fetchPetshopById(1)

      expect(setLoadingSpy).not.toHaveBeenCalled()
    })

    it('passes a different petshopId correctly to the URL', async () => {
      mockGet.mockResolvedValueOnce(shopB)
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById } = usePetshops()

      await fetchPetshopById(42)

      expect(mockGet).toHaveBeenCalledWith('/api/stores/42')
    })

    it('clears any previous error before the network request', async () => {
      mockGet.mockResolvedValueOnce(shopA)
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshopById, error } = usePetshops()

      error.value = 'error previo'
      await fetchPetshopById(1)

      expect(error.value).toBeNull()
    })
  })

  // ── fetchStoreProducts ─────────────────────────────────────

  describe('fetchStoreProducts()', () => {
    it('calls GET /api/stores/{storeId}/products', async () => {
      mockGet.mockResolvedValueOnce({ products: [productA] })
      const { usePetshops } = await import('./usePetshops')
      const { fetchStoreProducts } = usePetshops()

      await fetchStoreProducts(1)

      expect(mockGet).toHaveBeenCalledWith('/api/stores/1/products')
    })

    it('hydrates the store when the response is a bare StoreProduct array', async () => {
      mockGet.mockResolvedValueOnce([productA, productB])
      const setProductsSpy = vi.spyOn(petshopsStore, 'setStoreProducts')
      const { usePetshops } = await import('./usePetshops')
      const { fetchStoreProducts } = usePetshops()

      await fetchStoreProducts(1)

      expect(setProductsSpy).toHaveBeenCalledWith([productA, productB])
    })

    it('hydrates the store when the response is shaped as { products: StoreProduct[] }', async () => {
      mockGet.mockResolvedValueOnce({ products: [productA, productB] })
      const setProductsSpy = vi.spyOn(petshopsStore, 'setStoreProducts')
      const { usePetshops } = await import('./usePetshops')
      const { fetchStoreProducts } = usePetshops()

      await fetchStoreProducts(1)

      expect(setProductsSpy).toHaveBeenCalledWith([productA, productB])
    })

    it('calls setStoreProducts with an empty array when { products } key is missing', async () => {
      mockGet.mockResolvedValueOnce({})
      const setProductsSpy = vi.spyOn(petshopsStore, 'setStoreProducts')
      const { usePetshops } = await import('./usePetshops')
      const { fetchStoreProducts } = usePetshops()

      await fetchStoreProducts(1)

      expect(setProductsSpy).toHaveBeenCalledWith([])
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = petshopsStore.isLoading
        return { products: [productA] }
      })
      const { usePetshops } = await import('./usePetshops')
      const { fetchStoreProducts } = usePetshops()

      await fetchStoreProducts(1)

      expect(loadingDuringCall).toBe(true)
      expect(petshopsStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { usePetshops } = await import('./usePetshops')
      const { fetchStoreProducts } = usePetshops()

      await fetchStoreProducts(1)

      expect(petshopsStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Error del servidor' } })
      const { usePetshops } = await import('./usePetshops')
      const { fetchStoreProducts, error } = usePetshops()

      await fetchStoreProducts(1)

      expect(error.value).toBe('Error del servidor')
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce({ products: [productA] })
      const { usePetshops } = await import('./usePetshops')
      const { fetchStoreProducts, error } = usePetshops()

      error.value = 'error previo'
      await fetchStoreProducts(1)

      expect(error.value).toBeNull()
    })

    it('passes a different storeId correctly to the URL', async () => {
      mockGet.mockResolvedValueOnce({ products: [] })
      const { usePetshops } = await import('./usePetshops')
      const { fetchStoreProducts } = usePetshops()

      await fetchStoreProducts(42)

      expect(mockGet).toHaveBeenCalledWith('/api/stores/42/products')
    })
  })

  // ── error ref contract ─────────────────────────────────────

  describe('error ref', () => {
    it('starts as null', async () => {
      const { usePetshops } = await import('./usePetshops')
      const { error } = usePetshops()
      expect(error.value).toBeNull()
    })

    it('is set on failure and then cleared on the next successful call', async () => {
      mockGet
        .mockRejectedValueOnce({ data: { error: 'Fallo temporal' } })
        .mockResolvedValueOnce([shopA])

      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops, error } = usePetshops()

      await fetchPetshops()
      expect(error.value).toBe('Fallo temporal')

      await fetchPetshops()
      expect(error.value).toBeNull()
    })

    it('extracts error from { data: { error: string } } shape', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Mensaje del servidor' } })
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops, error } = usePetshops()

      await fetchPetshops()

      expect(error.value).toBe('Mensaje del servidor')
    })

    it('extracts error from { data: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ data: 'Error como string' })
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops, error } = usePetshops()

      await fetchPetshops()

      expect(error.value).toBe('Error como string')
    })

    it('extracts error from { message: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Error de red' })
      const { usePetshops } = await import('./usePetshops')
      const { fetchPetshops, error } = usePetshops()

      await fetchPetshops()

      expect(error.value).toBe('Error de red')
    })
  })
})
