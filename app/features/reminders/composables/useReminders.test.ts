// ============================================================
// useReminders.test.ts
// Tests the useReminders composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT the right tool.
//   - useRuntimeConfig is NOT mocked here. NUXT_PUBLIC_API_BASE is provided
//     via vitest.config.ts env options so the real useRuntimeConfig returns
//     the correct base URL.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs and we can spy on it.
//
// What this suite does NOT cover intentionally:
//   - extractErrorMessage internals — covered by behavioural error-value
//     assertions in each action's error branch.
//   - Network retry logic — no retry exists; nothing to test.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { Reminder } from '../types'

// ── useApi mock ──────────────────────────────────────────────
// useApi is a project composable — vi.mock intercepts the module.

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDel = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet, post: mockPost, put: mockPut, del: mockDel }),
}))

// ── usePetsStore mock ─────────────────────────────────────────
// fetchReminders without petId now reads usePetsStore().pets to
// iterate over all pets. We provide a controlled mock.
const mockPets = vi.hoisted(() => ({ value: [] as Array<{ id: string; name: string }> }))

vi.mock('../../pets/stores/pets.store', () => ({
  usePetsStore: () => ({
    pets: mockPets.value,
  }),
}))

// ── Fixtures ─────────────────────────────────────────────────

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 1,
    pet_id: 42,
    type: 'vacuna',
    title: 'Vacuna antirrábica',
    scheduled_date: '2027-06-15T10:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const reminderA = makeReminder({ id: 1, title: 'Vacuna antirrábica', pet_id: 42 })
const reminderB = makeReminder({ id: 2, title: 'Desparasitación', type: 'medicina', pet_id: 42 })

// ── Suite ─────────────────────────────────────────────────────

describe('useReminders', () => {
  let remindersStore: ReturnType<typeof import('../stores/reminders.store').useRemindersStore>

  beforeEach(async () => {
    // Isolate Pinia per test.
    // stubActions: false so real store action logic (setReminders, addReminder, etc.) runs.
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    const { useRemindersStore } = await import('../stores/reminders.store')
    remindersStore = useRemindersStore()

    mockGet.mockReset()
    mockPost.mockReset()
    mockPut.mockReset()
    mockDel.mockReset()
    mockPets.value = []
  })

  // ── fetchReminders (no petId) ──────────────────────────────
  // Without a petId, fetchReminders iterates over petsStore.pets
  // and calls GET /api/pets/:id/reminders for each pet.

  describe('fetchReminders() without a petId', () => {
    it('calls GET /api/pets/:id/reminders for each pet in petsStore', async () => {
      mockPets.value = [{ id: '42', name: 'Luna' }, { id: '99', name: 'Max' }]
      mockGet
        .mockResolvedValueOnce([reminderA])
        .mockResolvedValueOnce([])
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders()

      expect(mockGet).toHaveBeenCalledWith('/api/pets/42/reminders')
      expect(mockGet).toHaveBeenCalledWith('/api/pets/99/reminders')
      expect(mockGet).toHaveBeenCalledTimes(2)
    })

    it('merges reminders from all pets into the store', async () => {
      const reminderC = makeReminder({ id: 3, title: 'Baño Max', pet_id: 99 })
      mockPets.value = [{ id: '42', name: 'Luna' }, { id: '99', name: 'Max' }]
      mockGet
        .mockResolvedValueOnce([reminderA, reminderB])
        .mockResolvedValueOnce([reminderC])
      const setRemindersSpy = vi.spyOn(remindersStore, 'setReminders')
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders()

      expect(setRemindersSpy).toHaveBeenCalledWith([reminderA, reminderB, reminderC])
    })

    it('handles { reminders: Reminder[] } response shape from per-pet endpoint', async () => {
      mockPets.value = [{ id: '42', name: 'Luna' }]
      mockGet.mockResolvedValueOnce({ reminders: [reminderA] })
      const setRemindersSpy = vi.spyOn(remindersStore, 'setReminders')
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders()

      expect(setRemindersSpy).toHaveBeenCalledWith([reminderA])
    })

    it('calls setReminders with an empty array when petsStore.pets is empty', async () => {
      mockPets.value = []
      const setRemindersSpy = vi.spyOn(remindersStore, 'setReminders')
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders()

      expect(setRemindersSpy).toHaveBeenCalledWith([])
      expect(mockGet).not.toHaveBeenCalled()
    })

    it('sets isLoading to true during the request and false after success', async () => {
      mockPets.value = [{ id: '42', name: 'Luna' }]
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = remindersStore.isLoading
        return [reminderA]
      })
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders()

      expect(loadingDuringCall).toBe(true)
      expect(remindersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even when the API call fails', async () => {
      mockPets.value = [{ id: '42', name: 'Luna' }]
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders()

      expect(remindersStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      mockPets.value = [{ id: '42', name: 'Luna' }]
      mockGet.mockRejectedValueOnce({ data: { error: 'Sin autorización' } })
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()

      expect(error.value).toBe('Sin autorización')
    })

    it('clears any previous error before the request', async () => {
      mockPets.value = [{ id: '42', name: 'Luna' }]
      mockGet.mockResolvedValueOnce([reminderA])
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      error.value = 'error previo'
      await fetchReminders()

      expect(error.value).toBeNull()
    })

    it('sets error to null on successful fetch', async () => {
      mockPets.value = []
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()

      expect(error.value).toBeNull()
    })

    it('falls back to the generic error message for unexpected error shapes', async () => {
      mockPets.value = [{ id: '42', name: 'Luna' }]
      mockGet.mockRejectedValueOnce('unexpected string error')
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })
  })

  // ── fetchReminders (with petId) ────────────────────────────

  describe('fetchReminders() with a petId', () => {
    it('calls GET /api/pets/{petId}/reminders when petId is provided', async () => {
      mockGet.mockResolvedValueOnce([reminderA])
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders(42)

      expect(mockGet).toHaveBeenCalledWith('/api/pets/42/reminders')
    })

    it('hydrates the store with the pet-specific reminders', async () => {
      mockGet.mockResolvedValueOnce([reminderA])
      const setRemindersSpy = vi.spyOn(remindersStore, 'setReminders')
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders(42)

      expect(setRemindersSpy).toHaveBeenCalledWith([reminderA])
    })

    it('uses the nested route for petId = 0 (falsy edge case — 0 treated as valid petId)', async () => {
      // petId of 0 is falsy in JS; the condition is `petId != null`
      // so 0 IS a valid petId and should use the nested route
      mockGet.mockResolvedValueOnce([])
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders(0)

      // 0 != null is true, so it should call the pet-specific URL
      expect(mockGet).toHaveBeenCalledWith('/api/pets/0/reminders')
    })
  })

  // ── fetchReminderById ──────────────────────────────────────

  describe('fetchReminderById()', () => {
    it('calls GET /api/reminders/{id} with the correct id', async () => {
      mockGet.mockResolvedValueOnce(reminderA)
      const { useReminders } = await import('./useReminders')
      const { fetchReminderById } = useReminders()

      await fetchReminderById(1)

      expect(mockGet).toHaveBeenCalledWith('/api/reminders/1')
    })

    it('calls setSelectedReminder on the store with the returned reminder', async () => {
      mockGet.mockResolvedValueOnce(reminderA)
      const setSelectedReminderSpy = vi.spyOn(remindersStore, 'setSelectedReminder')
      const { useReminders } = await import('./useReminders')
      const { fetchReminderById } = useReminders()

      await fetchReminderById(1)

      expect(setSelectedReminderSpy).toHaveBeenCalledWith(reminderA)
    })

    it('returns the reminder on success', async () => {
      mockGet.mockResolvedValueOnce(reminderA)
      const { useReminders } = await import('./useReminders')
      const { fetchReminderById } = useReminders()

      const result = await fetchReminderById(1)

      expect(result).toEqual(reminderA)
    })

    it('returns null when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404, data: { error: 'Not found' } })
      const { useReminders } = await import('./useReminders')
      const { fetchReminderById } = useReminders()

      const result = await fetchReminderById(999)

      expect(result).toBeNull()
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'No encontrado' } })
      const { useReminders } = await import('./useReminders')
      const { fetchReminderById, error } = useReminders()

      await fetchReminderById(999)

      expect(error.value).toBe('No encontrado')
    })

    it('does NOT call setSelectedReminder when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404 })
      const setSelectedReminderSpy = vi.spyOn(remindersStore, 'setSelectedReminder')
      const { useReminders } = await import('./useReminders')
      const { fetchReminderById } = useReminders()

      await fetchReminderById(999)

      expect(setSelectedReminderSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to false after success', async () => {
      mockGet.mockResolvedValueOnce(reminderA)
      const { useReminders } = await import('./useReminders')
      const { fetchReminderById } = useReminders()

      await fetchReminderById(1)

      expect(remindersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useReminders } = await import('./useReminders')
      const { fetchReminderById } = useReminders()

      await fetchReminderById(1)

      expect(remindersStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce(reminderA)
      const { useReminders } = await import('./useReminders')
      const { fetchReminderById, error } = useReminders()

      error.value = 'error previo'
      await fetchReminderById(1)

      expect(error.value).toBeNull()
    })
  })

  // ── createReminder ─────────────────────────────────────────

  describe('createReminder()', () => {
    const payload = {
      pet_id: 42,
      type: 'vacuna' as const,
      title: 'Nueva vacuna',
      scheduled_date: '2027-06-15T10:00:00Z',
    }

    it('calls POST /api/reminders with the payload', async () => {
      mockPost.mockResolvedValueOnce(reminderA)
      const { useReminders } = await import('./useReminders')
      const { createReminder } = useReminders()

      await createReminder(payload)

      expect(mockPost).toHaveBeenCalledWith('/api/reminders', payload)
    })

    it('calls addReminder on the store with the returned reminder', async () => {
      mockPost.mockResolvedValueOnce(reminderA)
      const addReminderSpy = vi.spyOn(remindersStore, 'addReminder')
      const { useReminders } = await import('./useReminders')
      const { createReminder } = useReminders()

      await createReminder(payload)

      expect(addReminderSpy).toHaveBeenCalledWith(reminderA)
    })

    it('returns the created reminder on success', async () => {
      mockPost.mockResolvedValueOnce(reminderA)
      const { useReminders } = await import('./useReminders')
      const { createReminder } = useReminders()

      const result = await createReminder(payload)

      expect(result).toEqual(reminderA)
    })

    it('returns null on failure', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
      const { useReminders } = await import('./useReminders')
      const { createReminder } = useReminders()

      const result = await createReminder(payload)

      expect(result).toBeNull()
    })

    it('sets error with the API message on failure', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
      const { useReminders } = await import('./useReminders')
      const { createReminder, error } = useReminders()

      await createReminder(payload)

      expect(error.value).toBe('Validation failed')
    })

    it('does NOT call addReminder on failure', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
      const addReminderSpy = vi.spyOn(remindersStore, 'addReminder')
      const { useReminders } = await import('./useReminders')
      const { createReminder } = useReminders()

      await createReminder(payload)

      expect(addReminderSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to true during the request', async () => {
      let loadingDuringCall = false
      mockPost.mockImplementationOnce(async () => {
        loadingDuringCall = remindersStore.isLoading
        return reminderA
      })
      const { useReminders } = await import('./useReminders')
      const { createReminder } = useReminders()

      await createReminder(payload)

      expect(loadingDuringCall).toBe(true)
    })

    it('sets isLoading to false after success', async () => {
      mockPost.mockResolvedValueOnce(reminderA)
      const { useReminders } = await import('./useReminders')
      const { createReminder } = useReminders()

      await createReminder(payload)

      expect(remindersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockPost.mockRejectedValueOnce({ message: 'Network error' })
      const { useReminders } = await import('./useReminders')
      const { createReminder } = useReminders()

      await createReminder(payload)

      expect(remindersStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      mockPost.mockResolvedValueOnce(reminderA)
      const { useReminders } = await import('./useReminders')
      const { createReminder, error } = useReminders()

      error.value = 'error previo'
      await createReminder(payload)

      expect(error.value).toBeNull()
    })
  })

  // ── updateReminder ─────────────────────────────────────────

  describe('updateReminder()', () => {
    const patchPayload = { type: 'vacuna' as const, title: 'Título actualizado', scheduled_date: '2027-06-15T10:00:00Z' }
    const updatedReminder = { ...reminderA, title: 'Título actualizado' }

    it('calls PUT /api/reminders/{id} with the correct id and payload', async () => {
      mockPut.mockResolvedValueOnce(updatedReminder)
      const { useReminders } = await import('./useReminders')
      const { updateReminder } = useReminders()

      await updateReminder(1, patchPayload)

      expect(mockPut).toHaveBeenCalledWith('/api/reminders/1', patchPayload)
    })

    it('calls updateReminder on the store with the returned reminder', async () => {
      mockPut.mockResolvedValueOnce(updatedReminder)
      const updateStoreSpy = vi.spyOn(remindersStore, 'updateReminder')
      const { useReminders } = await import('./useReminders')
      const { updateReminder } = useReminders()

      await updateReminder(1, patchPayload)

      expect(updateStoreSpy).toHaveBeenCalledWith(updatedReminder)
    })

    it('returns the updated reminder on success', async () => {
      mockPut.mockResolvedValueOnce(updatedReminder)
      const { useReminders } = await import('./useReminders')
      const { updateReminder } = useReminders()

      const result = await updateReminder(1, patchPayload)

      expect(result).toEqual(updatedReminder)
    })

    it('returns null on failure', async () => {
      mockPut.mockRejectedValueOnce({ data: { error: 'Not found' } })
      const { useReminders } = await import('./useReminders')
      const { updateReminder } = useReminders()

      const result = await updateReminder(999, patchPayload)

      expect(result).toBeNull()
    })

    it('sets error with the API message on failure', async () => {
      mockPut.mockRejectedValueOnce({ data: { error: 'Not found' } })
      const { useReminders } = await import('./useReminders')
      const { updateReminder, error } = useReminders()

      await updateReminder(999, patchPayload)

      expect(error.value).toBe('Not found')
    })

    it('does NOT call store.updateReminder on failure', async () => {
      mockPut.mockRejectedValueOnce({ message: 'Network error' })
      const updateStoreSpy = vi.spyOn(remindersStore, 'updateReminder')
      const { useReminders } = await import('./useReminders')
      const { updateReminder } = useReminders()

      await updateReminder(1, patchPayload)

      expect(updateStoreSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to false after success', async () => {
      mockPut.mockResolvedValueOnce(updatedReminder)
      const { useReminders } = await import('./useReminders')
      const { updateReminder } = useReminders()

      await updateReminder(1, patchPayload)

      expect(remindersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockPut.mockRejectedValueOnce({ message: 'Network error' })
      const { useReminders } = await import('./useReminders')
      const { updateReminder } = useReminders()

      await updateReminder(1, patchPayload)

      expect(remindersStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      mockPut.mockResolvedValueOnce(updatedReminder)
      const { useReminders } = await import('./useReminders')
      const { updateReminder, error } = useReminders()

      error.value = 'error previo'
      await updateReminder(1, patchPayload)

      expect(error.value).toBeNull()
    })
  })

  // ── deleteReminder ─────────────────────────────────────────

  describe('deleteReminder()', () => {
    it('calls DELETE /api/reminders/{id} with the correct id', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useReminders } = await import('./useReminders')
      const { deleteReminder } = useReminders()

      await deleteReminder(1)

      expect(mockDel).toHaveBeenCalledWith('/api/reminders/1')
    })

    it('calls removeReminder on the store with the correct id on success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const removeReminderSpy = vi.spyOn(remindersStore, 'removeReminder')
      const { useReminders } = await import('./useReminders')
      const { deleteReminder } = useReminders()

      await deleteReminder(1)

      expect(removeReminderSpy).toHaveBeenCalledWith(1)
    })

    it('returns true on success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useReminders } = await import('./useReminders')
      const { deleteReminder } = useReminders()

      const result = await deleteReminder(1)

      expect(result).toBe(true)
    })

    it('returns false on API failure', async () => {
      mockDel.mockRejectedValueOnce({ data: { error: 'Forbidden' } })
      const { useReminders } = await import('./useReminders')
      const { deleteReminder } = useReminders()

      const result = await deleteReminder(1)

      expect(result).toBe(false)
    })

    it('does NOT call removeReminder on the store when the API call fails', async () => {
      mockDel.mockRejectedValueOnce({ data: { error: 'Forbidden' } })
      const removeReminderSpy = vi.spyOn(remindersStore, 'removeReminder')
      const { useReminders } = await import('./useReminders')
      const { deleteReminder } = useReminders()

      await deleteReminder(1)

      expect(removeReminderSpy).not.toHaveBeenCalled()
    })

    it('sets error with the API message on failure', async () => {
      mockDel.mockRejectedValueOnce({ data: { error: 'Forbidden' } })
      const { useReminders } = await import('./useReminders')
      const { deleteReminder, error } = useReminders()

      await deleteReminder(1)

      expect(error.value).toBe('Forbidden')
    })

    it('sets isLoading to true during the request', async () => {
      let loadingDuringCall = false
      mockDel.mockImplementationOnce(async () => {
        loadingDuringCall = remindersStore.isLoading
      })
      const { useReminders } = await import('./useReminders')
      const { deleteReminder } = useReminders()

      await deleteReminder(1)

      expect(loadingDuringCall).toBe(true)
    })

    it('sets isLoading to false after success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useReminders } = await import('./useReminders')
      const { deleteReminder } = useReminders()

      await deleteReminder(1)

      expect(remindersStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockDel.mockRejectedValueOnce({ message: 'Network error' })
      const { useReminders } = await import('./useReminders')
      const { deleteReminder } = useReminders()

      await deleteReminder(1)

      expect(remindersStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useReminders } = await import('./useReminders')
      const { deleteReminder, error } = useReminders()

      error.value = 'error previo'
      await deleteReminder(1)

      expect(error.value).toBeNull()
    })

    it('falls back to the generic error message for unexpected error shapes', async () => {
      mockDel.mockRejectedValueOnce('unexpected string error')
      const { useReminders } = await import('./useReminders')
      const { deleteReminder, error } = useReminders()

      await deleteReminder(1)

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })
  })

  // ── error ref contract ─────────────────────────────────────

  describe('error ref', () => {
    it('starts as null', async () => {
      const { useReminders } = await import('./useReminders')
      const { error } = useReminders()

      expect(error.value).toBeNull()
    })

    it('is set on failure and then cleared on the next successful call', async () => {
      mockPets.value = [{ id: '42', name: 'Luna' }]
      mockGet
        .mockRejectedValueOnce({ data: { error: 'Fallo temporal' } })
        .mockResolvedValueOnce([reminderA])

      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()
      expect(error.value).toBe('Fallo temporal')

      await fetchReminders()
      expect(error.value).toBeNull()
    })

    it('extracts error from { data: { error: string } } shape', async () => {
      mockPets.value = [{ id: '42', name: 'Luna' }]
      mockGet.mockRejectedValueOnce({ data: { error: 'Mensaje del servidor' } })
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()

      expect(error.value).toBe('Mensaje del servidor')
    })

    it('extracts error from { data: string } shape', async () => {
      mockPets.value = [{ id: '42', name: 'Luna' }]
      mockGet.mockRejectedValueOnce({ data: 'Error como string' })
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()

      expect(error.value).toBe('Error como string')
    })

    it('extracts error from { message: string } shape', async () => {
      mockPets.value = [{ id: '42', name: 'Luna' }]
      mockGet.mockRejectedValueOnce({ message: 'Error de red' })
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()

      expect(error.value).toBe('Error de red')
    })
  })
})
