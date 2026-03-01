// ============================================================
// useShelters.test.ts
// Tests the useShelters composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT the right tool.
//   - useRuntimeConfig is NOT mocked here. NUXT_PUBLIC_API_BASE is
//     provided via vitest.config.ts env options.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs and we can spy on it.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { AdoptionListing, AdoptionRequest } from '../types'

// ── useApi mock ──────────────────────────────────────────────

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet, post: mockPost }),
}))

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

const listingA = makeAdoptionListing({ id: 1, status: 'available' })
const listingB = makeAdoptionListing({ id: 2, name: 'Luna', status: 'pending' })

const mockAdoptionRequest: AdoptionRequest = {
  id: 1,
  adoption_listing_id: 1,
  user_id: 1,
  message: 'Me gustaría adoptar a Max',
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// ── Suite ─────────────────────────────────────────────────────

describe('useShelters', () => {
  let sheltersStore: ReturnType<typeof import('../stores/shelters.store').useSheltersStore>

  beforeEach(async () => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    const { useSheltersStore } = await import('../stores/shelters.store')
    sheltersStore = useSheltersStore()

    mockGet.mockReset()
    mockPost.mockReset()
  })

  // ── fetchAdoptionListings ──────────────────────────────────

  describe('fetchAdoptionListings()', () => {
    it('calls GET /api/adoption-listings', async () => {
      mockGet.mockResolvedValueOnce([listingA])
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings } = useShelters()

      await fetchAdoptionListings()

      expect(mockGet).toHaveBeenCalledWith('/api/adoption-listings')
    })

    it('hydrates the store when the response is a bare AdoptionListing array', async () => {
      mockGet.mockResolvedValueOnce([listingA, listingB])
      const setListingsSpy = vi.spyOn(sheltersStore, 'setAdoptionListings')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings } = useShelters()

      await fetchAdoptionListings()

      expect(setListingsSpy).toHaveBeenCalledWith([listingA, listingB])
    })

    it('hydrates the store when the response is shaped as { adoption_listings: [...] }', async () => {
      mockGet.mockResolvedValueOnce({ adoption_listings: [listingA, listingB] })
      const setListingsSpy = vi.spyOn(sheltersStore, 'setAdoptionListings')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings } = useShelters()

      await fetchAdoptionListings()

      expect(setListingsSpy).toHaveBeenCalledWith([listingA, listingB])
    })

    it('calls setAdoptionListings with an empty array when { adoption_listings } key is missing', async () => {
      mockGet.mockResolvedValueOnce({})
      const setListingsSpy = vi.spyOn(sheltersStore, 'setAdoptionListings')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings } = useShelters()

      await fetchAdoptionListings()

      expect(setListingsSpy).toHaveBeenCalledWith([])
    })

    it('calls setAdoptionListings with an empty array when adoption_listings key is undefined', async () => {
      mockGet.mockResolvedValueOnce({ adoption_listings: undefined })
      const setListingsSpy = vi.spyOn(sheltersStore, 'setAdoptionListings')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings } = useShelters()

      await fetchAdoptionListings()

      expect(setListingsSpy).toHaveBeenCalledWith([])
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = sheltersStore.isLoading
        return [listingA]
      })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings } = useShelters()

      await fetchAdoptionListings()

      expect(loadingDuringCall).toBe(true)
      expect(sheltersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings } = useShelters()

      await fetchAdoptionListings()

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Sin autorización' } })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings, error } = useShelters()

      await fetchAdoptionListings()

      expect(error.value).toBe('Sin autorización')
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce([listingA])
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings, error } = useShelters()

      error.value = 'error previo'
      await fetchAdoptionListings()

      expect(error.value).toBeNull()
    })

    it('falls back to generic error message for unexpected error shapes', async () => {
      mockGet.mockRejectedValueOnce('unexpected string error')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings, error } = useShelters()

      await fetchAdoptionListings()

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })
  })

  // ── fetchAdoptionListingById ────────────────────────────────

  describe('fetchAdoptionListingById()', () => {
    it('calls GET /api/adoption-listings/{id} with the correct id', async () => {
      mockGet.mockResolvedValueOnce(listingA)
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListingById } = useShelters()

      await fetchAdoptionListingById(1)

      expect(mockGet).toHaveBeenCalledWith('/api/adoption-listings/1')
    })

    it('calls setSelectedListing on the store with the returned listing', async () => {
      mockGet.mockResolvedValueOnce(listingA)
      const setSelectedSpy = vi.spyOn(sheltersStore, 'setSelectedListing')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListingById } = useShelters()

      await fetchAdoptionListingById(1)

      expect(setSelectedSpy).toHaveBeenCalledWith(listingA)
    })

    it('returns the listing on success', async () => {
      mockGet.mockResolvedValueOnce(listingA)
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListingById } = useShelters()

      const result = await fetchAdoptionListingById(1)

      expect(result).toEqual(listingA)
    })

    it('returns null when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404, data: { error: 'Not found' } })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListingById } = useShelters()

      const result = await fetchAdoptionListingById(999)

      expect(result).toBeNull()
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'No encontrado' } })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListingById, error } = useShelters()

      await fetchAdoptionListingById(999)

      expect(error.value).toBe('No encontrado')
    })

    it('does NOT call setSelectedListing when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404 })
      const setSelectedSpy = vi.spyOn(sheltersStore, 'setSelectedListing')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListingById } = useShelters()

      await fetchAdoptionListingById(999)

      expect(setSelectedSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to false after success', async () => {
      mockGet.mockResolvedValueOnce(listingA)
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListingById } = useShelters()

      await fetchAdoptionListingById(1)

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListingById } = useShelters()

      await fetchAdoptionListingById(1)

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('passes a different id correctly to the URL', async () => {
      mockGet.mockResolvedValueOnce(listingB)
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListingById } = useShelters()

      await fetchAdoptionListingById(42)

      expect(mockGet).toHaveBeenCalledWith('/api/adoption-listings/42')
    })
  })

  // ── submitAdoptionRequest ──────────────────────────────────

  describe('submitAdoptionRequest()', () => {
    it('calls POST /api/adoption-listings/{id}/requests with the message payload', async () => {
      mockPost.mockResolvedValueOnce(mockAdoptionRequest)
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      await submitAdoptionRequest(1, 'Me gustaría adoptar a Max')

      expect(mockPost).toHaveBeenCalledWith(
        '/api/adoption-listings/1/requests',
        { message: 'Me gustaría adoptar a Max' },
      )
    })

    it('returns the created AdoptionRequest on success', async () => {
      mockPost.mockResolvedValueOnce(mockAdoptionRequest)
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      const result = await submitAdoptionRequest(1, 'Me gustaría adoptar a Max')

      expect(result).toEqual(mockAdoptionRequest)
    })

    it('returns null when the API call fails', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Unauthorized' } })
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      const result = await submitAdoptionRequest(1, 'Mi mensaje')

      expect(result).toBeNull()
    })

    it('sets error when the API call fails (401 unauthorized)', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Debes iniciar sesión para solicitar adopción' } })
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest, error } = useShelters()

      await submitAdoptionRequest(1, 'Mi mensaje')

      expect(error.value).toBe('Debes iniciar sesión para solicitar adopción')
    })

    it('sets error when the API call fails (409 conflict)', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Ya tienes una solicitud pendiente' } })
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest, error } = useShelters()

      await submitAdoptionRequest(1, 'Mi mensaje')

      expect(error.value).toBe('Ya tienes una solicitud pendiente')
    })

    it('clears any previous error before the request', async () => {
      mockPost.mockResolvedValueOnce(mockAdoptionRequest)
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest, error } = useShelters()

      error.value = 'error previo'
      await submitAdoptionRequest(1, 'Mi mensaje')

      expect(error.value).toBeNull()
    })

    it('sets isLoading to true during the request', async () => {
      let loadingDuringCall = false
      mockPost.mockImplementationOnce(async () => {
        loadingDuringCall = sheltersStore.isLoading
        return mockAdoptionRequest
      })
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      await submitAdoptionRequest(1, 'Mi mensaje')

      expect(loadingDuringCall).toBe(true)
    })

    it('sets isLoading to false after success', async () => {
      mockPost.mockResolvedValueOnce(mockAdoptionRequest)
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      await submitAdoptionRequest(1, 'Mi mensaje')

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockPost.mockRejectedValueOnce({ message: 'Network error' })
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      await submitAdoptionRequest(1, 'Mi mensaje')

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('falls back to generic error message for unexpected error shapes', async () => {
      mockPost.mockRejectedValueOnce('unexpected string error')
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest, error } = useShelters()

      await submitAdoptionRequest(1, 'Mi mensaje')

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('passes different listingId to the URL correctly', async () => {
      mockPost.mockResolvedValueOnce(mockAdoptionRequest)
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      await submitAdoptionRequest(99, 'Mi mensaje de adopción')

      expect(mockPost).toHaveBeenCalledWith(
        '/api/adoption-listings/99/requests',
        { message: 'Mi mensaje de adopción' },
      )
    })
  })

  // ── error ref contract ─────────────────────────────────────

  describe('error ref', () => {
    it('starts as null', async () => {
      const { useShelters } = await import('./useShelters')
      const { error } = useShelters()
      expect(error.value).toBeNull()
    })

    it('is set on failure and then cleared on the next successful call', async () => {
      mockGet
        .mockRejectedValueOnce({ data: { error: 'Fallo temporal' } })
        .mockResolvedValueOnce([listingA])

      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings, error } = useShelters()

      await fetchAdoptionListings()
      expect(error.value).toBe('Fallo temporal')

      await fetchAdoptionListings()
      expect(error.value).toBeNull()
    })

    it('extracts error from { data: { error: string } } shape', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Mensaje del servidor' } })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings, error } = useShelters()

      await fetchAdoptionListings()

      expect(error.value).toBe('Mensaje del servidor')
    })

    it('extracts error from { data: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ data: 'Error como string' })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings, error } = useShelters()

      await fetchAdoptionListings()

      expect(error.value).toBe('Error como string')
    })

    it('extracts error from { message: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Error de red' })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionListings, error } = useShelters()

      await fetchAdoptionListings()

      expect(error.value).toBe('Error de red')
    })
  })
})
