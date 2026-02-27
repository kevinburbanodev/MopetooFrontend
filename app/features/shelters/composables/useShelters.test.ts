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
//
// What this suite does NOT cover intentionally:
//   - Network retry logic — no retry exists; nothing to test.
//   - Browser navigation or redirect behaviour — that belongs in
//     page-level or middleware tests.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { Shelter, AdoptionPet, AdoptionRequest } from '../types'

// ── useApi mock ──────────────────────────────────────────────
// useApi is a project composable — vi.mock intercepts the module.

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet, post: mockPost }),
}))

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

const shelterA = makeShelter({ id: '1', name: 'Refugio Esperanza' })
const shelterB = makeShelter({ id: '2', name: 'Patitas Felices', city: 'Medellín' })
const petA = makeAdoptionPet({ id: 'pet1', status: 'available' })
const petB = makeAdoptionPet({ id: 'pet2', name: 'Luna', status: 'pending' })

const mockAdoptionRequest: AdoptionRequest = {
  id: 'req1',
  pet_id: 'pet1',
  user_id: 'user1',
  shelter_id: '1',
  message: 'Me gustaría adoptar a Max',
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

// ── Suite ─────────────────────────────────────────────────────

describe('useShelters', () => {
  let sheltersStore: ReturnType<typeof import('../stores/shelters.store').useSheltersStore>

  beforeEach(async () => {
    // Isolate Pinia per test.
    // stubActions: false so real store action logic runs.
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    const { useSheltersStore } = await import('../stores/shelters.store')
    sheltersStore = useSheltersStore()

    mockGet.mockReset()
    mockPost.mockReset()
  })

  // ── fetchShelters ──────────────────────────────────────────

  describe('fetchShelters()', () => {
    it('calls GET /api/shelters when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce([shelterA])
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters()

      expect(mockGet).toHaveBeenCalledWith('/api/shelters')
    })

    it('hydrates the store when the response is a bare Shelter array', async () => {
      mockGet.mockResolvedValueOnce([shelterA, shelterB])
      const setSheltersSpy = vi.spyOn(sheltersStore, 'setShelters')
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters()

      expect(setSheltersSpy).toHaveBeenCalledWith([shelterA, shelterB])
    })

    it('hydrates the store when the response is shaped as { shelters: Shelter[] }', async () => {
      mockGet.mockResolvedValueOnce({ shelters: [shelterA, shelterB] })
      const setSheltersSpy = vi.spyOn(sheltersStore, 'setShelters')
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters()

      expect(setSheltersSpy).toHaveBeenCalledWith([shelterA, shelterB])
    })

    it('calls setShelters with an empty array when { shelters } key is missing', async () => {
      mockGet.mockResolvedValueOnce({})
      const setSheltersSpy = vi.spyOn(sheltersStore, 'setShelters')
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters()

      expect(setSheltersSpy).toHaveBeenCalledWith([])
    })

    it('calls setShelters with an empty array when shelters key is undefined', async () => {
      mockGet.mockResolvedValueOnce({ shelters: undefined })
      const setSheltersSpy = vi.spyOn(sheltersStore, 'setShelters')
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters()

      expect(setSheltersSpy).toHaveBeenCalledWith([])
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = sheltersStore.isLoading
        return [shelterA]
      })
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters()

      expect(loadingDuringCall).toBe(true)
      expect(sheltersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters()

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Sin autorización' } })
      const { useShelters } = await import('./useShelters')
      const { fetchShelters, error } = useShelters()

      await fetchShelters()

      expect(error.value).toBe('Sin autorización')
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce([shelterA])
      const { useShelters } = await import('./useShelters')
      const { fetchShelters, error } = useShelters()

      error.value = 'error previo'
      await fetchShelters()

      expect(error.value).toBeNull()
    })

    it('sets error to null on successful fetch', async () => {
      mockGet.mockResolvedValueOnce([shelterA])
      const { useShelters } = await import('./useShelters')
      const { fetchShelters, error } = useShelters()

      await fetchShelters()

      expect(error.value).toBeNull()
    })

    it('falls back to generic error message for unexpected error shapes', async () => {
      mockGet.mockRejectedValueOnce('unexpected string error')
      const { useShelters } = await import('./useShelters')
      const { fetchShelters, error } = useShelters()

      await fetchShelters()

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })
  })

  // ── fetchShelters with filters ─────────────────────────────

  describe('fetchShelters(filters)', () => {
    it('appends city filter as a query string parameter', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters({ city: 'Bogotá' })

      expect(mockGet).toHaveBeenCalledWith('/api/shelters?city=Bogot%C3%A1')
    })

    it('appends species filter as a query string parameter', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters({ species: 'dogs' })

      expect(mockGet).toHaveBeenCalledWith('/api/shelters?species=dogs')
    })

    it('appends search filter as a query string parameter', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters({ search: 'esperanza' })

      expect(mockGet).toHaveBeenCalledWith('/api/shelters?search=esperanza')
    })

    it('omits empty filter values from the query string', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      // Empty strings are falsy and should not be appended
      await fetchShelters({ city: '', species: '', search: '' })

      expect(mockGet).toHaveBeenCalledWith('/api/shelters')
    })

    it('combines multiple filter parameters correctly', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters({ city: 'Bogotá', species: 'cats' })

      const calledPath: string = mockGet.mock.calls[0][0]
      expect(calledPath).toContain('/api/shelters?')
      expect(calledPath).toContain('species=cats')
    })

    it('calls GET /api/shelters (no query string) when filters object is empty', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchShelters } = useShelters()

      await fetchShelters({})

      expect(mockGet).toHaveBeenCalledWith('/api/shelters')
    })
  })

  // ── fetchShelterById ───────────────────────────────────────

  describe('fetchShelterById()', () => {
    it('calls GET /api/shelters/{id} with the correct id', async () => {
      mockGet.mockResolvedValueOnce(shelterA)
      const { useShelters } = await import('./useShelters')
      const { fetchShelterById } = useShelters()

      await fetchShelterById('1')

      expect(mockGet).toHaveBeenCalledWith('/api/shelters/1')
    })

    it('calls setSelectedShelter on the store with the returned shelter', async () => {
      mockGet.mockResolvedValueOnce(shelterA)
      const setSelectedShelterSpy = vi.spyOn(sheltersStore, 'setSelectedShelter')
      const { useShelters } = await import('./useShelters')
      const { fetchShelterById } = useShelters()

      await fetchShelterById('1')

      expect(setSelectedShelterSpy).toHaveBeenCalledWith(shelterA)
    })

    it('returns the shelter on success', async () => {
      mockGet.mockResolvedValueOnce(shelterA)
      const { useShelters } = await import('./useShelters')
      const { fetchShelterById } = useShelters()

      const result = await fetchShelterById('1')

      expect(result).toEqual(shelterA)
    })

    it('returns null when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404, data: { error: 'Not found' } })
      const { useShelters } = await import('./useShelters')
      const { fetchShelterById } = useShelters()

      const result = await fetchShelterById('999')

      expect(result).toBeNull()
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'No encontrado' } })
      const { useShelters } = await import('./useShelters')
      const { fetchShelterById, error } = useShelters()

      await fetchShelterById('999')

      expect(error.value).toBe('No encontrado')
    })

    it('does NOT call setSelectedShelter when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404 })
      const setSelectedShelterSpy = vi.spyOn(sheltersStore, 'setSelectedShelter')
      const { useShelters } = await import('./useShelters')
      const { fetchShelterById } = useShelters()

      await fetchShelterById('999')

      expect(setSelectedShelterSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to false after success', async () => {
      mockGet.mockResolvedValueOnce(shelterA)
      const { useShelters } = await import('./useShelters')
      const { fetchShelterById } = useShelters()

      await fetchShelterById('1')

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useShelters } = await import('./useShelters')
      const { fetchShelterById } = useShelters()

      await fetchShelterById('1')

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('passes a different shelterId correctly to the URL', async () => {
      mockGet.mockResolvedValueOnce(shelterB)
      const { useShelters } = await import('./useShelters')
      const { fetchShelterById } = useShelters()

      await fetchShelterById('42')

      expect(mockGet).toHaveBeenCalledWith('/api/shelters/42')
    })
  })

  // ── fetchAdoptionPets ──────────────────────────────────────

  describe('fetchAdoptionPets()', () => {
    it('calls GET /api/shelters/{shelterId}/pets with no filters', async () => {
      mockGet.mockResolvedValueOnce([petA])
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1')

      expect(mockGet).toHaveBeenCalledWith('/api/shelters/1/pets')
    })

    it('hydrates the store when the response is a bare AdoptionPet array', async () => {
      mockGet.mockResolvedValueOnce([petA, petB])
      const setAdoptionPetsSpy = vi.spyOn(sheltersStore, 'setAdoptionPets')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1')

      expect(setAdoptionPetsSpy).toHaveBeenCalledWith([petA, petB])
    })

    it('hydrates the store when the response is shaped as { pets: AdoptionPet[] }', async () => {
      mockGet.mockResolvedValueOnce({ pets: [petA, petB] })
      const setAdoptionPetsSpy = vi.spyOn(sheltersStore, 'setAdoptionPets')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1')

      expect(setAdoptionPetsSpy).toHaveBeenCalledWith([petA, petB])
    })

    it('calls setAdoptionPets with an empty array when { pets } key is missing', async () => {
      mockGet.mockResolvedValueOnce({})
      const setAdoptionPetsSpy = vi.spyOn(sheltersStore, 'setAdoptionPets')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1')

      expect(setAdoptionPetsSpy).toHaveBeenCalledWith([])
    })

    it('calls setAdoptionPets with an empty array when pets key is undefined', async () => {
      mockGet.mockResolvedValueOnce({ pets: undefined })
      const setAdoptionPetsSpy = vi.spyOn(sheltersStore, 'setAdoptionPets')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1')

      expect(setAdoptionPetsSpy).toHaveBeenCalledWith([])
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = sheltersStore.isLoading
        return [petA]
      })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1')

      expect(loadingDuringCall).toBe(true)
      expect(sheltersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1')

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Fallo de red' } })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets, error } = useShelters()

      await fetchAdoptionPets('1')

      expect(error.value).toBe('Fallo de red')
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce([petA])
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets, error } = useShelters()

      error.value = 'error previo'
      await fetchAdoptionPets('1')

      expect(error.value).toBeNull()
    })
  })

  // ── fetchAdoptionPets with filters ─────────────────────────

  describe('fetchAdoptionPets(shelterId, filters)', () => {
    it('appends species filter as a query string parameter', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1', { species: 'dog' })

      expect(mockGet).toHaveBeenCalledWith('/api/shelters/1/pets?species=dog')
    })

    it('appends gender filter as a query string parameter', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1', { gender: 'female' })

      expect(mockGet).toHaveBeenCalledWith('/api/shelters/1/pets?gender=female')
    })

    it('appends size filter as a query string parameter', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1', { size: 'small' })

      expect(mockGet).toHaveBeenCalledWith('/api/shelters/1/pets?size=small')
    })

    it('appends status filter as a query string parameter', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1', { status: 'available' })

      expect(mockGet).toHaveBeenCalledWith('/api/shelters/1/pets?status=available')
    })

    it('combines multiple filter parameters correctly', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1', { species: 'dog', gender: 'male' })

      const calledPath: string = mockGet.mock.calls[0][0]
      expect(calledPath).toContain('/api/shelters/1/pets?')
      expect(calledPath).toContain('species=dog')
      expect(calledPath).toContain('gender=male')
    })

    it('calls GET /api/shelters/{shelterId}/pets (no query string) when filters object is empty', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('1', {})

      expect(mockGet).toHaveBeenCalledWith('/api/shelters/1/pets')
    })

    it('passes the correct shelterId in the URL with filters', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPets } = useShelters()

      await fetchAdoptionPets('shelf-42', { status: 'available' })

      expect(mockGet).toHaveBeenCalledWith('/api/shelters/shelf-42/pets?status=available')
    })
  })

  // ── fetchAdoptionPetById ───────────────────────────────────

  describe('fetchAdoptionPetById()', () => {
    it('calls GET /api/shelters/{shelterId}/pets/{petId} with the correct ids', async () => {
      mockGet.mockResolvedValueOnce(petA)
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPetById } = useShelters()

      await fetchAdoptionPetById('1', 'pet1')

      expect(mockGet).toHaveBeenCalledWith('/api/shelters/1/pets/pet1')
    })

    it('calls setSelectedAdoptionPet on the store with the returned pet', async () => {
      mockGet.mockResolvedValueOnce(petA)
      const setSelectedAdoptionPetSpy = vi.spyOn(sheltersStore, 'setSelectedAdoptionPet')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPetById } = useShelters()

      await fetchAdoptionPetById('1', 'pet1')

      expect(setSelectedAdoptionPetSpy).toHaveBeenCalledWith(petA)
    })

    it('returns the pet on success', async () => {
      mockGet.mockResolvedValueOnce(petA)
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPetById } = useShelters()

      const result = await fetchAdoptionPetById('1', 'pet1')

      expect(result).toEqual(petA)
    })

    it('returns null when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404, data: { error: 'Not found' } })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPetById } = useShelters()

      const result = await fetchAdoptionPetById('1', 'pet-999')

      expect(result).toBeNull()
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'No encontrado' } })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPetById, error } = useShelters()

      await fetchAdoptionPetById('1', 'pet-999')

      expect(error.value).toBe('No encontrado')
    })

    it('does NOT call setSelectedAdoptionPet when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404 })
      const setSelectedAdoptionPetSpy = vi.spyOn(sheltersStore, 'setSelectedAdoptionPet')
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPetById } = useShelters()

      await fetchAdoptionPetById('1', 'pet-999')

      expect(setSelectedAdoptionPetSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to false after success', async () => {
      mockGet.mockResolvedValueOnce(petA)
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPetById } = useShelters()

      await fetchAdoptionPetById('1', 'pet1')

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPetById } = useShelters()

      await fetchAdoptionPetById('1', 'pet1')

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('passes different shelterId and petId to URL correctly', async () => {
      mockGet.mockResolvedValueOnce(petB)
      const { useShelters } = await import('./useShelters')
      const { fetchAdoptionPetById } = useShelters()

      await fetchAdoptionPetById('shelter-42', 'petXYZ')

      expect(mockGet).toHaveBeenCalledWith('/api/shelters/shelter-42/pets/petXYZ')
    })
  })

  // ── submitAdoptionRequest ──────────────────────────────────

  describe('submitAdoptionRequest()', () => {
    it('calls POST /api/shelters/{shelterId}/pets/{petId}/adopt with the message payload', async () => {
      mockPost.mockResolvedValueOnce(mockAdoptionRequest)
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      await submitAdoptionRequest('1', 'pet1', 'Me gustaría adoptar a Max')

      expect(mockPost).toHaveBeenCalledWith(
        '/api/shelters/1/pets/pet1/adopt',
        { message: 'Me gustaría adoptar a Max' },
      )
    })

    it('returns the created AdoptionRequest on success', async () => {
      mockPost.mockResolvedValueOnce(mockAdoptionRequest)
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      const result = await submitAdoptionRequest('1', 'pet1', 'Me gustaría adoptar a Max')

      expect(result).toEqual(mockAdoptionRequest)
    })

    it('returns null when the API call fails', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Unauthorized' } })
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      const result = await submitAdoptionRequest('1', 'pet1', 'Mi mensaje')

      expect(result).toBeNull()
    })

    it('sets error when the API call fails (401 unauthorized)', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Debes iniciar sesión para solicitar adopción' } })
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest, error } = useShelters()

      await submitAdoptionRequest('1', 'pet1', 'Mi mensaje')

      expect(error.value).toBe('Debes iniciar sesión para solicitar adopción')
    })

    it('sets error when the API call fails (server error)', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Error interno del servidor' } })
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest, error } = useShelters()

      await submitAdoptionRequest('1', 'pet1', 'Mi mensaje')

      expect(error.value).toBe('Error interno del servidor')
    })

    it('clears any previous error before the request', async () => {
      mockPost.mockResolvedValueOnce(mockAdoptionRequest)
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest, error } = useShelters()

      error.value = 'error previo'
      await submitAdoptionRequest('1', 'pet1', 'Mi mensaje')

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

      await submitAdoptionRequest('1', 'pet1', 'Mi mensaje')

      expect(loadingDuringCall).toBe(true)
    })

    it('sets isLoading to false after success', async () => {
      mockPost.mockResolvedValueOnce(mockAdoptionRequest)
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      await submitAdoptionRequest('1', 'pet1', 'Mi mensaje')

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockPost.mockRejectedValueOnce({ message: 'Network error' })
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      await submitAdoptionRequest('1', 'pet1', 'Mi mensaje')

      expect(sheltersStore.isLoading).toBe(false)
    })

    it('falls back to generic error message for unexpected error shapes', async () => {
      mockPost.mockRejectedValueOnce('unexpected string error')
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest, error } = useShelters()

      await submitAdoptionRequest('1', 'pet1', 'Mi mensaje')

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('passes different shelterId and petId to the URL correctly', async () => {
      mockPost.mockResolvedValueOnce(mockAdoptionRequest)
      const { useShelters } = await import('./useShelters')
      const { submitAdoptionRequest } = useShelters()

      await submitAdoptionRequest('shelter-99', 'pet-XYZ', 'Mi mensaje de adopción')

      expect(mockPost).toHaveBeenCalledWith(
        '/api/shelters/shelter-99/pets/pet-XYZ/adopt',
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
        .mockResolvedValueOnce([shelterA])

      const { useShelters } = await import('./useShelters')
      const { fetchShelters, error } = useShelters()

      await fetchShelters()
      expect(error.value).toBe('Fallo temporal')

      await fetchShelters()
      expect(error.value).toBeNull()
    })

    it('extracts error from { data: { error: string } } shape', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Mensaje del servidor' } })
      const { useShelters } = await import('./useShelters')
      const { fetchShelters, error } = useShelters()

      await fetchShelters()

      expect(error.value).toBe('Mensaje del servidor')
    })

    it('extracts error from { data: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ data: 'Error como string' })
      const { useShelters } = await import('./useShelters')
      const { fetchShelters, error } = useShelters()

      await fetchShelters()

      expect(error.value).toBe('Error como string')
    })

    it('extracts error from { message: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Error de red' })
      const { useShelters } = await import('./useShelters')
      const { fetchShelters, error } = useShelters()

      await fetchShelters()

      expect(error.value).toBe('Error de red')
    })
  })
})
