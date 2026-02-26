// ============================================================
// usePets.test.ts
// Tests the usePets composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT the right tool.
//   - useRuntimeConfig is NOT mocked here. NUXT_PUBLIC_API_BASE is provided
//     via vitest.config.ts env options so the real useRuntimeConfig returns
//     the correct base URL. Mocking useRuntimeConfig via mockNuxtImport at
//     module level interferes with @nuxt/test-utils router initialisation.
//   - $fetch (global) is stubbed via vi.stubGlobal for multipart paths
//     that bypass useApi and call $fetch directly with FormData.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs and we can spy on it.
//
// What this suite does NOT cover intentionally:
//   - buildPetFormData field assembly — exercised implicitly via FormData
//     branch assertions (we assert the right type is sent, not each field).
//   - multipartRequest retry logic — no retry exists; nothing to test.
//   - extractErrorMessage internals — covered by behavioural error-value
//     assertions in each action's error branch.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { Pet } from '../types'

// ── useApi mock ──────────────────────────────────────────────
// useApi is a project composable — vi.mock intercepts the module.

const apiGetMock = vi.fn()
const apiPostMock = vi.fn()
const apiPatchMock = vi.fn()
const apiDelMock = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({
    get: apiGetMock,
    post: apiPostMock,
    patch: apiPatchMock,
    del: apiDelMock,
  }),
}))

// ── $fetch global stub ───────────────────────────────────────
// Multipart (photo) paths bypass useApi and call $fetch directly.
const fetchMock = vi.fn()

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

const petA = makePet({ id: 'pet-1', name: 'Max' })
const petB = makePet({ id: 'pet-2', name: 'Luna', gender: 'female' })

function makeFile(name = 'photo.jpg'): File {
  return new File(['(binary)'], name, { type: 'image/jpeg' })
}

const minimalCreateDTO = {
  name: 'Max',
  species: 'dog',
  breed: 'Labrador',
  birth_date: '2021-06-15',
  gender: 'male' as const,
}

// ── Suite ────────────────────────────────────────────────────

describe('usePets', () => {
  let petsStore: ReturnType<typeof import('../stores/pets.store').usePetsStore>

  beforeEach(async () => {
    // Isolate Pinia per test.
    // stubActions: false so real store action logic (setPets, addPet, etc.) runs.
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    const { usePetsStore } = await import('../stores/pets.store')
    petsStore = usePetsStore()

    apiGetMock.mockReset()
    apiPostMock.mockReset()
    apiPatchMock.mockReset()
    apiDelMock.mockReset()
    fetchMock.mockReset()

    // Inject the $fetch stub globally for multipart paths.
    vi.stubGlobal('$fetch', fetchMock)

    // Stub authStore token for multipart Authorization header.
    // createTestingPinia creates a real store — we set state directly.
    const { useAuthStore } = await import('../../auth/stores/auth.store')
    const authStore = useAuthStore()
    authStore.token = 'jwt.test.token'
  })

  // ── fetchPets ──────────────────────────────────────────────

  describe('fetchPets()', () => {
    it('calls GET /api/pets', async () => {
      apiGetMock.mockResolvedValueOnce([petA])
      const { usePets } = await import('./usePets')
      const { fetchPets } = usePets()

      await fetchPets()

      expect(apiGetMock).toHaveBeenCalledWith('/api/pets')
    })

    it('hydrates the store when the response is a bare Pet array', async () => {
      apiGetMock.mockResolvedValueOnce([petA, petB])
      const setPetsSpy = vi.spyOn(petsStore, 'setPets')
      const { usePets } = await import('./usePets')
      const { fetchPets } = usePets()

      await fetchPets()

      expect(setPetsSpy).toHaveBeenCalledWith([petA, petB])
    })

    it('hydrates the store when the response is shaped as { pets: Pet[] }', async () => {
      apiGetMock.mockResolvedValueOnce({ pets: [petA, petB] })
      const setPetsSpy = vi.spyOn(petsStore, 'setPets')
      const { usePets } = await import('./usePets')
      const { fetchPets } = usePets()

      await fetchPets()

      expect(setPetsSpy).toHaveBeenCalledWith([petA, petB])
    })

    it('calls setPets with an empty array when { pets } key is missing from the object response', async () => {
      apiGetMock.mockResolvedValueOnce({})
      const setPetsSpy = vi.spyOn(petsStore, 'setPets')
      const { usePets } = await import('./usePets')
      const { fetchPets } = usePets()

      await fetchPets()

      expect(setPetsSpy).toHaveBeenCalledWith([])
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      apiGetMock.mockImplementationOnce(async () => {
        loadingDuringCall = petsStore.isLoading
        return [petA]
      })
      const { usePets } = await import('./usePets')
      const { fetchPets } = usePets()

      await fetchPets()

      expect(loadingDuringCall).toBe(true)
      expect(petsStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      apiGetMock.mockRejectedValueOnce({ data: { error: 'Sin autorización' } })
      const { usePets } = await import('./usePets')
      const { fetchPets, error } = usePets()

      await fetchPets()

      expect(error.value).toBe('Sin autorización')
    })

    it('sets isLoading to false even when the API call fails', async () => {
      apiGetMock.mockRejectedValueOnce({ message: 'Network error' })
      const { usePets } = await import('./usePets')
      const { fetchPets } = usePets()

      await fetchPets()

      expect(petsStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      apiGetMock.mockResolvedValueOnce([petA])
      const { usePets } = await import('./usePets')
      const { fetchPets, error } = usePets()

      error.value = 'previous error'
      await fetchPets()

      expect(error.value).toBeNull()
    })
  })

  // ── fetchPetById ───────────────────────────────────────────

  describe('fetchPetById()', () => {
    it('calls GET /api/pets/:id with the correct id', async () => {
      apiGetMock.mockResolvedValueOnce(petA)
      const { usePets } = await import('./usePets')
      const { fetchPetById } = usePets()

      await fetchPetById('pet-1')

      expect(apiGetMock).toHaveBeenCalledWith('/api/pets/pet-1')
    })

    it('sets selectedPet on success', async () => {
      apiGetMock.mockResolvedValueOnce(petA)
      const setSelectedPetSpy = vi.spyOn(petsStore, 'setSelectedPet')
      const { usePets } = await import('./usePets')
      const { fetchPetById } = usePets()

      await fetchPetById('pet-1')

      expect(setSelectedPetSpy).toHaveBeenCalledWith(petA)
    })

    it('returns the pet on success', async () => {
      apiGetMock.mockResolvedValueOnce(petA)
      const { usePets } = await import('./usePets')
      const { fetchPetById } = usePets()

      const result = await fetchPetById('pet-1')

      expect(result).toEqual(petA)
    })

    it('returns null when the API call fails', async () => {
      apiGetMock.mockRejectedValueOnce({ statusCode: 404, data: { error: 'Not found' } })
      const { usePets } = await import('./usePets')
      const { fetchPetById } = usePets()

      const result = await fetchPetById('does-not-exist')

      expect(result).toBeNull()
    })

    it('sets error when the API call fails', async () => {
      apiGetMock.mockRejectedValueOnce({ data: { error: 'Not found' } })
      const { usePets } = await import('./usePets')
      const { fetchPetById, error } = usePets()

      await fetchPetById('missing')

      expect(error.value).toBe('Not found')
    })

    it('does NOT call setSelectedPet when the API call fails', async () => {
      apiGetMock.mockRejectedValueOnce({ statusCode: 404 })
      const setSelectedPetSpy = vi.spyOn(petsStore, 'setSelectedPet')
      const { usePets } = await import('./usePets')
      const { fetchPetById } = usePets()

      await fetchPetById('missing')

      expect(setSelectedPetSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to false after success', async () => {
      apiGetMock.mockResolvedValueOnce(petA)
      const { usePets } = await import('./usePets')
      const { fetchPetById } = usePets()

      await fetchPetById('pet-1')

      expect(petsStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      apiGetMock.mockRejectedValueOnce({ message: 'Network error' })
      const { usePets } = await import('./usePets')
      const { fetchPetById } = usePets()

      await fetchPetById('pet-1')

      expect(petsStore.isLoading).toBe(false)
    })
  })

  // ── createPet ──────────────────────────────────────────────

  describe('createPet()', () => {
    describe('without a photo (JSON body)', () => {
      it('calls POST /api/pets with the DTO as JSON', async () => {
        apiPostMock.mockResolvedValueOnce(petA)
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO)

        expect(apiPostMock).toHaveBeenCalledWith('/api/pets', minimalCreateDTO)
      })

      it('does NOT call $fetch when no photo is provided', async () => {
        apiPostMock.mockResolvedValueOnce(petA)
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO)

        expect(fetchMock).not.toHaveBeenCalled()
      })

      it('calls addPet on the store with the returned pet', async () => {
        apiPostMock.mockResolvedValueOnce(petA)
        const addPetSpy = vi.spyOn(petsStore, 'addPet')
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO)

        expect(addPetSpy).toHaveBeenCalledWith(petA)
      })

      it('returns the created pet on success', async () => {
        apiPostMock.mockResolvedValueOnce(petA)
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        const result = await createPet(minimalCreateDTO)

        expect(result).toEqual(petA)
      })
    })

    describe('with a photo (multipart/form-data)', () => {
      it('calls $fetch with FormData and POST method', async () => {
        fetchMock.mockResolvedValueOnce(petA)
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO, makeFile())

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:4000/api/pets',
          expect.objectContaining({
            method: 'POST',
            body: expect.any(FormData),
          }),
        )
      })

      it('sends the Authorization header with the store token', async () => {
        fetchMock.mockResolvedValueOnce(petA)
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO, makeFile())

        expect(fetchMock).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { Authorization: 'Bearer jwt.test.token' },
          }),
        )
      })

      it('does NOT call useApi.post when a photo is provided', async () => {
        fetchMock.mockResolvedValueOnce(petA)
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO, makeFile())

        expect(apiPostMock).not.toHaveBeenCalled()
      })

      it('calls addPet on the store with the returned pet', async () => {
        fetchMock.mockResolvedValueOnce(petA)
        const addPetSpy = vi.spyOn(petsStore, 'addPet')
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO, makeFile())

        expect(addPetSpy).toHaveBeenCalledWith(petA)
      })

      it('returns the created pet on multipart success', async () => {
        fetchMock.mockResolvedValueOnce(petA)
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        const result = await createPet(minimalCreateDTO, makeFile())

        expect(result).toEqual(petA)
      })
    })

    describe('on API error', () => {
      it('returns null on failure', async () => {
        apiPostMock.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        const result = await createPet(minimalCreateDTO)

        expect(result).toBeNull()
      })

      it('sets error with the API message', async () => {
        apiPostMock.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
        const { usePets } = await import('./usePets')
        const { createPet, error } = usePets()

        await createPet(minimalCreateDTO)

        expect(error.value).toBe('Validation failed')
      })

      it('does NOT call addPet on failure', async () => {
        apiPostMock.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
        const addPetSpy = vi.spyOn(petsStore, 'addPet')
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO)

        expect(addPetSpy).not.toHaveBeenCalled()
      })

      it('sets isLoading to false after failure', async () => {
        apiPostMock.mockRejectedValueOnce({ message: 'Network error' })
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO)

        expect(petsStore.isLoading).toBe(false)
      })
    })
  })

  // ── updatePet ──────────────────────────────────────────────

  describe('updatePet()', () => {
    describe('without a photo (JSON PATCH)', () => {
      it('calls PATCH /api/pets/:id with the partial DTO', async () => {
        const updated = { ...petA, name: 'Maximiliano' }
        apiPatchMock.mockResolvedValueOnce(updated)
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', { name: 'Maximiliano' })

        expect(apiPatchMock).toHaveBeenCalledWith('/api/pets/pet-1', { name: 'Maximiliano' })
      })

      it('does NOT call $fetch when no photo is provided', async () => {
        const updated = { ...petA, name: 'Maximiliano' }
        apiPatchMock.mockResolvedValueOnce(updated)
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', { name: 'Maximiliano' })

        expect(fetchMock).not.toHaveBeenCalled()
      })

      it('calls petsStore.updatePet with the returned pet', async () => {
        const updated = { ...petA, name: 'Maximiliano' }
        apiPatchMock.mockResolvedValueOnce(updated)
        const updatePetStoreSpy = vi.spyOn(petsStore, 'updatePet')
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', { name: 'Maximiliano' })

        expect(updatePetStoreSpy).toHaveBeenCalledWith(updated)
      })

      it('returns the updated pet on success', async () => {
        const updated = { ...petA, name: 'Maximiliano' }
        apiPatchMock.mockResolvedValueOnce(updated)
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        const result = await updatePet('pet-1', { name: 'Maximiliano' })

        expect(result).toEqual(updated)
      })
    })

    describe('with a photo (multipart/form-data)', () => {
      it('calls $fetch with FormData and PATCH method', async () => {
        const updated = { ...petA, photo_url: 'https://cdn.example.com/pet.jpg' }
        fetchMock.mockResolvedValueOnce(updated)
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', { name: 'Max' }, makeFile())

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:4000/api/pets/pet-1',
          expect.objectContaining({
            method: 'PATCH',
            body: expect.any(FormData),
          }),
        )
      })

      it('sends the Authorization header from the auth store token', async () => {
        fetchMock.mockResolvedValueOnce(petA)
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', {}, makeFile())

        expect(fetchMock).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { Authorization: 'Bearer jwt.test.token' },
          }),
        )
      })

      it('does NOT call useApi.patch when a photo is provided', async () => {
        fetchMock.mockResolvedValueOnce(petA)
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', {}, makeFile())

        expect(apiPatchMock).not.toHaveBeenCalled()
      })

      it('calls petsStore.updatePet with the returned pet on multipart success', async () => {
        const updated = { ...petA, photo_url: 'https://cdn.example.com/pet.jpg' }
        fetchMock.mockResolvedValueOnce(updated)
        const updatePetStoreSpy = vi.spyOn(petsStore, 'updatePet')
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', { name: 'Max' }, makeFile())

        expect(updatePetStoreSpy).toHaveBeenCalledWith(updated)
      })
    })

    describe('on API error', () => {
      it('returns null on failure', async () => {
        apiPatchMock.mockRejectedValueOnce({ data: { error: 'Not found' } })
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        const result = await updatePet('missing', { name: 'X' })

        expect(result).toBeNull()
      })

      it('sets error with the API message', async () => {
        apiPatchMock.mockRejectedValueOnce({ data: { error: 'Not found' } })
        const { usePets } = await import('./usePets')
        const { updatePet, error } = usePets()

        await updatePet('missing', { name: 'X' })

        expect(error.value).toBe('Not found')
      })

      it('does NOT call petsStore.updatePet on failure', async () => {
        apiPatchMock.mockRejectedValueOnce({ message: 'Network error' })
        const updatePetStoreSpy = vi.spyOn(petsStore, 'updatePet')
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', { name: 'X' })

        expect(updatePetStoreSpy).not.toHaveBeenCalled()
      })

      it('sets isLoading to false after failure', async () => {
        apiPatchMock.mockRejectedValueOnce({ message: 'Network error' })
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', {})

        expect(petsStore.isLoading).toBe(false)
      })
    })
  })

  // ── deletePet ──────────────────────────────────────────────

  describe('deletePet()', () => {
    it('calls DELETE /api/pets/:id with the correct id', async () => {
      apiDelMock.mockResolvedValueOnce(undefined)
      const { usePets } = await import('./usePets')
      const { deletePet } = usePets()

      await deletePet('pet-1')

      expect(apiDelMock).toHaveBeenCalledWith('/api/pets/pet-1')
    })

    it('calls removePet on the store with the correct id on success', async () => {
      apiDelMock.mockResolvedValueOnce(undefined)
      const removePetSpy = vi.spyOn(petsStore, 'removePet')
      const { usePets } = await import('./usePets')
      const { deletePet } = usePets()

      await deletePet('pet-1')

      expect(removePetSpy).toHaveBeenCalledWith('pet-1')
    })

    it('returns true on success', async () => {
      apiDelMock.mockResolvedValueOnce(undefined)
      const { usePets } = await import('./usePets')
      const { deletePet } = usePets()

      const result = await deletePet('pet-1')

      expect(result).toBe(true)
    })

    it('returns false on API failure', async () => {
      apiDelMock.mockRejectedValueOnce({ data: { error: 'Forbidden' } })
      const { usePets } = await import('./usePets')
      const { deletePet } = usePets()

      const result = await deletePet('pet-1')

      expect(result).toBe(false)
    })

    it('does NOT call removePet on the store when the API call fails', async () => {
      apiDelMock.mockRejectedValueOnce({ data: { error: 'Forbidden' } })
      const removePetSpy = vi.spyOn(petsStore, 'removePet')
      const { usePets } = await import('./usePets')
      const { deletePet } = usePets()

      await deletePet('pet-1')

      expect(removePetSpy).not.toHaveBeenCalled()
    })

    it('sets error with the API message on failure', async () => {
      apiDelMock.mockRejectedValueOnce({ data: { error: 'Forbidden' } })
      const { usePets } = await import('./usePets')
      const { deletePet, error } = usePets()

      await deletePet('pet-1')

      expect(error.value).toBe('Forbidden')
    })

    it('sets isLoading to false after success', async () => {
      apiDelMock.mockResolvedValueOnce(undefined)
      const { usePets } = await import('./usePets')
      const { deletePet } = usePets()

      await deletePet('pet-1')

      expect(petsStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      apiDelMock.mockRejectedValueOnce({ message: 'Network error' })
      const { usePets } = await import('./usePets')
      const { deletePet } = usePets()

      await deletePet('pet-1')

      expect(petsStore.isLoading).toBe(false)
    })

    it('sets isLoading to true during the request', async () => {
      let loadingDuringCall = false
      apiDelMock.mockImplementationOnce(async () => {
        loadingDuringCall = petsStore.isLoading
      })
      const { usePets } = await import('./usePets')
      const { deletePet } = usePets()

      await deletePet('pet-1')

      expect(loadingDuringCall).toBe(true)
    })

    it('falls back to the generic error message for unexpected error shapes', async () => {
      apiDelMock.mockRejectedValueOnce('unexpected string error')
      const { usePets } = await import('./usePets')
      const { deletePet, error } = usePets()

      await deletePet('pet-1')

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })
  })
})
