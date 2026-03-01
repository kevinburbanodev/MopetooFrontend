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
//   - $fetch (global) is stubbed via vi.stubGlobal for ALL create and update
//     paths — the composable always sends multipart/form-data via $fetch.
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
// Only get and del are used by usePets — post and patch were removed.

const apiGetMock = vi.fn()
const apiDelMock = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({
    get: apiGetMock,
    del: apiDelMock,
  }),
}))

// ── useExportPDF mock ─────────────────────────────────────────
// useExportPDF is a shared project composable — mock via vi.mock so
// exportProfilePDF tests assert the delegation contract, not the PDF
// download mechanics (which are covered by useExportPDF.test.ts).
// The mock is declared at module level; the spy handles are reset in
// beforeEach to prevent bleed between tests.
const downloadPDFMock = vi.fn()
const slugifyMock = vi.fn()

vi.mock('../../shared/composables/useExportPDF', () => ({
  useExportPDF: () => ({
    downloadPDF: downloadPDFMock,
    slugify: slugifyMock,
  }),
}))

// ── $fetch global stub ───────────────────────────────────────
// All create and update paths bypass useApi and call $fetch directly
// with multipart/form-data.
const fetchMock = vi.fn()

// ── Fake JWT helper ─────────────────────────────────────────
// The composable decodes the JWT payload to extract user_id via
// getEntityIdFromToken(). This helper produces a decodable JWT
// so fetchPets() can resolve the correct endpoint.

function makeFakeJwt(userId = '1'): string {
  const header = btoa(JSON.stringify({ alg: 'HS256' }))
  const payload = btoa(JSON.stringify({ user_id: userId, email: 'test@test.com', entity_type: 'user', is_admin: false }))
  return `${header}.${payload}.fake-signature`
}

// ── Fixtures ────────────────────────────────────────────────

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'pet-1',
    user_id: 'user-1',
    name: 'Max',
    species: 'dog',
    breed: 'Labrador',
    age: 3,
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
  gender: 'male' as const,
  age: 3,
}

// ── Suite ────────────────────────────────────────────────────

describe('usePets', () => {
  let petsStore: ReturnType<typeof import('../stores/pets.store').usePetsStore>
  let authStore: ReturnType<typeof import('../../auth/stores/auth.store').useAuthStore>

  beforeEach(async () => {
    // Isolate Pinia per test.
    // stubActions: false so real store action logic (setPets, addPet, etc.) runs.
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    const { usePetsStore } = await import('../stores/pets.store')
    petsStore = usePetsStore()

    apiGetMock.mockReset()
    apiDelMock.mockReset()
    fetchMock.mockReset()
    downloadPDFMock.mockReset()
    // slugifyMock is configured per-test — reset to a passthrough default
    // so tests that do not care about slug transformation still get a
    // predictable filename without needing to configure the mock themselves.
    slugifyMock.mockReset()
    slugifyMock.mockImplementation((name: string) => name.toLowerCase().replace(/\s+/g, '-'))

    // Inject the $fetch stub globally for multipart paths.
    vi.stubGlobal('$fetch', fetchMock)

    // Stub authStore token with a decodable JWT so getEntityIdFromToken() works.
    // createTestingPinia creates a real store — we set state directly.
    const { useAuthStore } = await import('../../auth/stores/auth.store')
    authStore = useAuthStore()
    authStore.token = makeFakeJwt()
  })

  // ── fetchPets ──────────────────────────────────────────────

  describe('fetchPets()', () => {
    it('calls GET /api/pets/user/1 (user_id decoded from JWT)', async () => {
      apiGetMock.mockResolvedValueOnce([petA])
      const { usePets } = await import('./usePets')
      const { fetchPets } = usePets()

      await fetchPets()

      expect(apiGetMock).toHaveBeenCalledWith('/api/pets/user/1')
    })

    it('hydrates the store when the response is a bare Pet array', async () => {
      apiGetMock.mockResolvedValueOnce([petA, petB])
      const setPetsSpy = vi.spyOn(petsStore, 'setPets')
      const { usePets } = await import('./usePets')
      const { fetchPets } = usePets()

      await fetchPets()

      expect(setPetsSpy).toHaveBeenCalledWith([petA, petB])
    })

    it('calls setPets with an empty array when backend returns { message: "..." } (no pets)', async () => {
      apiGetMock.mockResolvedValueOnce({ message: 'No existen mascotas para este usuario' })
      const setPetsSpy = vi.spyOn(petsStore, 'setPets')
      const { usePets } = await import('./usePets')
      const { fetchPets } = usePets()

      await fetchPets()

      expect(setPetsSpy).toHaveBeenCalledWith([])
    })

    it('sets error when token is null without calling the API', async () => {
      authStore.token = null
      const { usePets } = await import('./usePets')
      const { fetchPets, error } = usePets()

      await fetchPets()

      expect(error.value).toBe('No se pudo identificar al usuario')
      expect(apiGetMock).not.toHaveBeenCalled()
    })

    it('sets error when token is invalid (not a valid JWT) without calling the API', async () => {
      authStore.token = 'not-a-valid-jwt'
      const { usePets } = await import('./usePets')
      const { fetchPets, error } = usePets()

      await fetchPets()

      expect(error.value).toBe('No se pudo identificar al usuario')
      expect(apiGetMock).not.toHaveBeenCalled()
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
    describe('without a photo (multipart/form-data)', () => {
      it('calls $fetch with FormData and POST method', async () => {
        fetchMock.mockResolvedValueOnce(petA)
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO)

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

        await createPet(minimalCreateDTO)

        const fakeToken = makeFakeJwt()
        expect(fetchMock).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { Authorization: `Bearer ${fakeToken}` },
          }),
        )
      })

      it('calls addPet on the store with the returned pet', async () => {
        fetchMock.mockResolvedValueOnce(petA)
        const addPetSpy = vi.spyOn(petsStore, 'addPet')
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO)

        expect(addPetSpy).toHaveBeenCalledWith(petA)
      })

      it('returns the created pet on success', async () => {
        fetchMock.mockResolvedValueOnce(petA)
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

        const fakeToken = makeFakeJwt()
        expect(fetchMock).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { Authorization: `Bearer ${fakeToken}` },
          }),
        )
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
        fetchMock.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        const result = await createPet(minimalCreateDTO)

        expect(result).toBeNull()
      })

      it('sets error with the API message', async () => {
        fetchMock.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
        const { usePets } = await import('./usePets')
        const { createPet, error } = usePets()

        await createPet(minimalCreateDTO)

        expect(error.value).toBe('Validation failed')
      })

      it('does NOT call addPet on failure', async () => {
        fetchMock.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
        const addPetSpy = vi.spyOn(petsStore, 'addPet')
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO)

        expect(addPetSpy).not.toHaveBeenCalled()
      })

      it('sets isLoading to false after failure', async () => {
        fetchMock.mockRejectedValueOnce({ message: 'Network error' })
        const { usePets } = await import('./usePets')
        const { createPet } = usePets()

        await createPet(minimalCreateDTO)

        expect(petsStore.isLoading).toBe(false)
      })
    })
  })

  // ── updatePet ──────────────────────────────────────────────

  describe('updatePet()', () => {
    describe('without a photo (multipart/form-data PUT)', () => {
      it('calls $fetch with FormData and PUT method', async () => {
        const updated = { ...petA, name: 'Maximiliano' }
        fetchMock.mockResolvedValueOnce(updated)
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', { name: 'Maximiliano' })

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:4000/api/pets/pet-1',
          expect.objectContaining({
            method: 'PUT',
            body: expect.any(FormData),
          }),
        )
      })

      it('sends the Authorization header from the auth store token', async () => {
        const updated = { ...petA, name: 'Maximiliano' }
        fetchMock.mockResolvedValueOnce(updated)
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', { name: 'Maximiliano' })

        const fakeToken = makeFakeJwt()
        expect(fetchMock).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { Authorization: `Bearer ${fakeToken}` },
          }),
        )
      })

      it('calls petsStore.updatePet with the returned pet', async () => {
        const updated = { ...petA, name: 'Maximiliano' }
        fetchMock.mockResolvedValueOnce(updated)
        const updatePetStoreSpy = vi.spyOn(petsStore, 'updatePet')
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', { name: 'Maximiliano' })

        expect(updatePetStoreSpy).toHaveBeenCalledWith(updated)
      })

      it('returns the updated pet on success', async () => {
        const updated = { ...petA, name: 'Maximiliano' }
        fetchMock.mockResolvedValueOnce(updated)
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        const result = await updatePet('pet-1', { name: 'Maximiliano' })

        expect(result).toEqual(updated)
      })
    })

    describe('with a photo (multipart/form-data PUT)', () => {
      it('calls $fetch with FormData and PUT method', async () => {
        const updated = { ...petA, photo_url: 'https://cdn.example.com/pet.jpg' }
        fetchMock.mockResolvedValueOnce(updated)
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', { name: 'Max' }, makeFile())

        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:4000/api/pets/pet-1',
          expect.objectContaining({
            method: 'PUT',
            body: expect.any(FormData),
          }),
        )
      })

      it('sends the Authorization header from the auth store token', async () => {
        fetchMock.mockResolvedValueOnce(petA)
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', {}, makeFile())

        const fakeToken = makeFakeJwt()
        expect(fetchMock).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: { Authorization: `Bearer ${fakeToken}` },
          }),
        )
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
        fetchMock.mockRejectedValueOnce({ data: { error: 'Not found' } })
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        const result = await updatePet('missing', { name: 'X' })

        expect(result).toBeNull()
      })

      it('sets error with the API message', async () => {
        fetchMock.mockRejectedValueOnce({ data: { error: 'Not found' } })
        const { usePets } = await import('./usePets')
        const { updatePet, error } = usePets()

        await updatePet('missing', { name: 'X' })

        expect(error.value).toBe('Not found')
      })

      it('does NOT call petsStore.updatePet on failure', async () => {
        fetchMock.mockRejectedValueOnce({ message: 'Network error' })
        const updatePetStoreSpy = vi.spyOn(petsStore, 'updatePet')
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', { name: 'X' })

        expect(updatePetStoreSpy).not.toHaveBeenCalled()
      })

      it('sets isLoading to false after failure', async () => {
        fetchMock.mockRejectedValueOnce({ message: 'Network error' })
        const { usePets } = await import('./usePets')
        const { updatePet } = usePets()

        await updatePet('pet-1', {})

        expect(petsStore.isLoading).toBe(false)
      })
    })
  })

  // ── normalization ──────────────────────────────────────────

  describe('normalization (id/user_id coercion)', () => {
    it('coerces numeric id and user_id to strings when fetching pets', async () => {
      const backendPet = { ...petA, id: 1 as unknown as string, user_id: 2 as unknown as string }
      apiGetMock.mockResolvedValueOnce([backendPet])
      const setPetsSpy = vi.spyOn(petsStore, 'setPets')
      const { usePets } = await import('./usePets')
      const { fetchPets } = usePets()

      await fetchPets()

      const normalizedPets = setPetsSpy.mock.calls[0][0] as Pet[]
      expect(normalizedPets[0].id).toBe('1')
      expect(normalizedPets[0].user_id).toBe('2')
    })

    it('coerces numeric id and user_id to strings when fetching a single pet', async () => {
      const backendPet = { ...petA, id: 42 as unknown as string, user_id: 7 as unknown as string }
      apiGetMock.mockResolvedValueOnce(backendPet)
      const setSelectedPetSpy = vi.spyOn(petsStore, 'setSelectedPet')
      const { usePets } = await import('./usePets')
      const { fetchPetById } = usePets()

      await fetchPetById('42')

      const normalizedPet = setSelectedPetSpy.mock.calls[0][0] as Pet
      expect(normalizedPet.id).toBe('42')
      expect(normalizedPet.user_id).toBe('7')
    })

    it('coerces numeric id and user_id to strings when creating a pet', async () => {
      const backendPet = { ...petA, id: 99 as unknown as string, user_id: 5 as unknown as string }
      fetchMock.mockResolvedValueOnce(backendPet)
      const addPetSpy = vi.spyOn(petsStore, 'addPet')
      const { usePets } = await import('./usePets')
      const { createPet } = usePets()

      await createPet(minimalCreateDTO)

      const normalizedPet = addPetSpy.mock.calls[0][0] as Pet
      expect(normalizedPet.id).toBe('99')
      expect(normalizedPet.user_id).toBe('5')
    })

    it('coerces numeric id and user_id to strings when updating a pet', async () => {
      const backendPet = { ...petA, id: 10 as unknown as string, user_id: 3 as unknown as string }
      fetchMock.mockResolvedValueOnce(backendPet)
      const updatePetStoreSpy = vi.spyOn(petsStore, 'updatePet')
      const { usePets } = await import('./usePets')
      const { updatePet } = usePets()

      await updatePet('10', { name: 'Max' })

      const normalizedPet = updatePetStoreSpy.mock.calls[0][0] as Pet
      expect(normalizedPet.id).toBe('10')
      expect(normalizedPet.user_id).toBe('3')
    })

    it('leaves string id and user_id unchanged', async () => {
      apiGetMock.mockResolvedValueOnce([petA])
      const setPetsSpy = vi.spyOn(petsStore, 'setPets')
      const { usePets } = await import('./usePets')
      const { fetchPets } = usePets()

      await fetchPets()

      const normalizedPets = setPetsSpy.mock.calls[0][0] as Pet[]
      expect(normalizedPets[0].id).toBe('pet-1')
      expect(normalizedPets[0].user_id).toBe('user-1')
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

  // ── exportProfilePDF ───────────────────────────────────────
  //
  // useExportPDF is mocked at the top of this file so these tests assert
  // the delegation contract of exportProfilePDF, not the PDF download
  // mechanics. The real downloadPDF and slugify implementations are
  // covered by useExportPDF.test.ts.

  describe('exportProfilePDF()', () => {
    it('calls downloadPDF with the correct endpoint for the given petId', async () => {
      downloadPDFMock.mockResolvedValueOnce(undefined)
      const { usePets } = await import('./usePets')
      const { exportProfilePDF } = usePets()

      await exportProfilePDF('pet-42')

      expect(downloadPDFMock).toHaveBeenCalledWith(
        '/api/pets/pet-42/export',
        expect.any(String),
      )
    })

    it('slugifies petName and uses it in the filename when petName is provided', async () => {
      // slugifyMock is configured in beforeEach as a passthrough that
      // lowercases and hyphenates — so "Max Perro" → "max-perro".
      downloadPDFMock.mockResolvedValueOnce(undefined)
      const { usePets } = await import('./usePets')
      const { exportProfilePDF } = usePets()

      await exportProfilePDF('pet-1', 'Max Perro')

      // slugify('Max Perro') → 'max-perro' via the mock passthrough.
      expect(downloadPDFMock).toHaveBeenCalledWith(
        '/api/pets/pet-1/export',
        'perfil-max-perro.pdf',
      )
    })

    it('falls back to petId in the filename when petName is undefined', async () => {
      downloadPDFMock.mockResolvedValueOnce(undefined)
      const { usePets } = await import('./usePets')
      const { exportProfilePDF } = usePets()

      await exportProfilePDF('pet-99')

      // No petName → slug = petId; filename = 'perfil-pet-99.pdf'.
      expect(downloadPDFMock).toHaveBeenCalledWith(
        '/api/pets/pet-99/export',
        'perfil-pet-99.pdf',
      )
    })

    it('calls slugify with the petName when petName is provided', async () => {
      downloadPDFMock.mockResolvedValueOnce(undefined)
      const { usePets } = await import('./usePets')
      const { exportProfilePDF } = usePets()

      await exportProfilePDF('pet-1', 'Luna García')

      expect(slugifyMock).toHaveBeenCalledWith('Luna García')
    })

    it('does NOT call slugify when petName is undefined', async () => {
      downloadPDFMock.mockResolvedValueOnce(undefined)
      const { usePets } = await import('./usePets')
      const { exportProfilePDF } = usePets()

      await exportProfilePDF('pet-1')

      expect(slugifyMock).not.toHaveBeenCalled()
    })

    it('sets petsStore.isLoading to true during the export', async () => {
      let loadingDuringCall = false
      downloadPDFMock.mockImplementationOnce(async () => {
        loadingDuringCall = petsStore.isLoading
      })
      const { usePets } = await import('./usePets')
      const { exportProfilePDF } = usePets()

      await exportProfilePDF('pet-1', 'Max')

      expect(loadingDuringCall).toBe(true)
    })

    it('sets petsStore.isLoading to false after a successful export', async () => {
      downloadPDFMock.mockResolvedValueOnce(undefined)
      const { usePets } = await import('./usePets')
      const { exportProfilePDF } = usePets()

      await exportProfilePDF('pet-1', 'Max')

      expect(petsStore.isLoading).toBe(false)
    })

    it('sets petsStore.isLoading to false even when downloadPDF throws', async () => {
      downloadPDFMock.mockRejectedValueOnce(new Error('Network failure'))
      const { usePets } = await import('./usePets')
      const { exportProfilePDF } = usePets()

      await exportProfilePDF('pet-1', 'Max')

      expect(petsStore.isLoading).toBe(false)
    })

    it('clears error before starting the export', async () => {
      downloadPDFMock.mockResolvedValueOnce(undefined)
      const { usePets } = await import('./usePets')
      const { exportProfilePDF, error } = usePets()

      error.value = 'error previo'
      await exportProfilePDF('pet-1', 'Max')

      expect(error.value).toBeNull()
    })

    it('stores the error message when downloadPDF throws with { message }', async () => {
      downloadPDFMock.mockRejectedValueOnce({ message: 'PDF generation failed' })
      const { usePets } = await import('./usePets')
      const { exportProfilePDF, error } = usePets()

      await exportProfilePDF('pet-1', 'Max')

      expect(error.value).toBe('PDF generation failed')
    })

    it('stores the error message when downloadPDF throws with { data: { error } }', async () => {
      downloadPDFMock.mockRejectedValueOnce({ data: { error: 'Forbidden' } })
      const { usePets } = await import('./usePets')
      const { exportProfilePDF, error } = usePets()

      await exportProfilePDF('pet-1', 'Max')

      expect(error.value).toBe('Forbidden')
    })

    it('uses the generic fallback message for unexpected error shapes', async () => {
      downloadPDFMock.mockRejectedValueOnce('unexpected string error')
      const { usePets } = await import('./usePets')
      const { exportProfilePDF, error } = usePets()

      await exportProfilePDF('pet-1', 'Max')

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('leaves error as null after a successful export', async () => {
      downloadPDFMock.mockResolvedValueOnce(undefined)
      const { usePets } = await import('./usePets')
      const { exportProfilePDF, error } = usePets()

      await exportProfilePDF('pet-1', 'Max')

      expect(error.value).toBeNull()
    })
  })
})
