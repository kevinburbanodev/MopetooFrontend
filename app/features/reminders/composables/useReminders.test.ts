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

// ── useExportPDF mock ─────────────────────────────────────────
// useExportPDF is a shared project composable — mock via vi.mock so
// exportRemindersPDF tests assert the delegation contract, not the PDF
// download mechanics (which are covered by useExportPDF.test.ts).
// The spy handles are reset in beforeEach to prevent bleed between tests.
const mockDownloadPDF = vi.fn()
const mockSlugify = vi.fn()

vi.mock('../../shared/composables/useExportPDF', () => ({
  useExportPDF: () => ({
    downloadPDF: mockDownloadPDF,
    slugify: mockSlugify,
  }),
}))

// ── Fixtures ─────────────────────────────────────────────────

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 1,
    pet_id: 42,
    type: 'vacuna',
    title: 'Vacuna antirrábica',
    scheduled_date: '2027-06-15T10:00',
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
    mockDownloadPDF.mockReset()
    // mockSlugify defaults to a passthrough that lowercases and hyphenates,
    // matching the real slugify for simple ASCII names. Tests that need
    // specific slug output configure this mock themselves.
    mockSlugify.mockReset()
    mockSlugify.mockImplementation((name: string) => name.toLowerCase().replace(/\s+/g, '-'))
  })

  // ── fetchReminders (no petId) ──────────────────────────────

  describe('fetchReminders() without a petId', () => {
    it('calls GET /api/reminders', async () => {
      mockGet.mockResolvedValueOnce([reminderA])
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders()

      expect(mockGet).toHaveBeenCalledWith('/api/reminders')
    })

    it('hydrates the store when the response is a bare Reminder array', async () => {
      mockGet.mockResolvedValueOnce([reminderA, reminderB])
      const setRemindersSpy = vi.spyOn(remindersStore, 'setReminders')
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders()

      expect(setRemindersSpy).toHaveBeenCalledWith([reminderA, reminderB])
    })

    it('hydrates the store when the response is shaped as { reminders: Reminder[] }', async () => {
      mockGet.mockResolvedValueOnce({ reminders: [reminderA, reminderB] })
      const setRemindersSpy = vi.spyOn(remindersStore, 'setReminders')
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders()

      expect(setRemindersSpy).toHaveBeenCalledWith([reminderA, reminderB])
    })

    it('calls setReminders with an empty array when { reminders } key is missing from the object response', async () => {
      mockGet.mockResolvedValueOnce({})
      const setRemindersSpy = vi.spyOn(remindersStore, 'setReminders')
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders()

      expect(setRemindersSpy).toHaveBeenCalledWith([])
    })

    it('sets isLoading to true during the request and false after success', async () => {
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
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders()

      expect(remindersStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Sin autorización' } })
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()

      expect(error.value).toBe('Sin autorización')
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce([reminderA])
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      error.value = 'error previo'
      await fetchReminders()

      expect(error.value).toBeNull()
    })

    it('sets error to null on successful fetch', async () => {
      mockGet.mockResolvedValueOnce([reminderA])
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()

      expect(error.value).toBeNull()
    })

    it('falls back to the generic error message for unexpected error shapes', async () => {
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

    it('does NOT call /api/reminders when petId is provided', async () => {
      mockGet.mockResolvedValueOnce([reminderA])
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders(42)

      expect(mockGet).not.toHaveBeenCalledWith('/api/reminders')
    })

    it('hydrates the store with the pet-specific reminders', async () => {
      mockGet.mockResolvedValueOnce([reminderA])
      const setRemindersSpy = vi.spyOn(remindersStore, 'setReminders')
      const { useReminders } = await import('./useReminders')
      const { fetchReminders } = useReminders()

      await fetchReminders(42)

      expect(setRemindersSpy).toHaveBeenCalledWith([reminderA])
    })

    it('uses the nested route for petId = 0 (falsy edge case — 0 treated as "no petId")', async () => {
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
      scheduled_date: '2027-06-15T10:00',
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
    const patchPayload = { title: 'Título actualizado' }
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
      mockGet.mockRejectedValueOnce({ data: { error: 'Mensaje del servidor' } })
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()

      expect(error.value).toBe('Mensaje del servidor')
    })

    it('extracts error from { data: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ data: 'Error como string' })
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()

      expect(error.value).toBe('Error como string')
    })

    it('extracts error from { message: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Error de red' })
      const { useReminders } = await import('./useReminders')
      const { fetchReminders, error } = useReminders()

      await fetchReminders()

      expect(error.value).toBe('Error de red')
    })
  })

  // ── exportRemindersPDF ──────────────────────────────────────
  //
  // useExportPDF is mocked at the top of this file so these tests assert
  // the delegation contract of exportRemindersPDF, not the PDF download
  // mechanics. The real downloadPDF and slugify implementations are
  // covered by useExportPDF.test.ts.

  describe('exportRemindersPDF()', () => {
    describe('endpoint selection', () => {
      it('uses /api/reminders/export when no petId is provided', async () => {
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF()

        expect(mockDownloadPDF).toHaveBeenCalledWith(
          '/api/reminders/export',
          expect.any(String),
        )
      })

      it('uses /api/pets/{petId}/reminders/export when petId is provided', async () => {
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF(42)

        expect(mockDownloadPDF).toHaveBeenCalledWith(
          '/api/pets/42/reminders/export',
          expect.any(String),
        )
      })

      it('uses the pet-specific endpoint for petId = 0 (falsy but non-null)', async () => {
        // petId of 0 is falsy but not null/undefined — the condition is
        // `petId != null`, so 0 IS a valid petId and uses the nested route.
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF(0)

        expect(mockDownloadPDF).toHaveBeenCalledWith(
          '/api/pets/0/reminders/export',
          expect.any(String),
        )
      })
    })

    describe('filename construction', () => {
      it('uses filename "recordatorios.pdf" when no petName is provided', async () => {
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF()

        expect(mockDownloadPDF).toHaveBeenCalledWith(
          expect.any(String),
          'recordatorios.pdf',
        )
      })

      it('appends the slugified petName suffix when petName is provided', async () => {
        // mockSlugify defaults to lowercase-hyphenate passthrough in beforeEach.
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF(42, 'Max Perro')

        // slugify('Max Perro') → 'max-perro'; suffix → '-max-perro'.
        expect(mockDownloadPDF).toHaveBeenCalledWith(
          expect.any(String),
          'recordatorios-max-perro.pdf',
        )
      })

      it('uses "recordatorios.pdf" when petId is provided but petName is undefined', async () => {
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF(42)

        expect(mockDownloadPDF).toHaveBeenCalledWith(
          '/api/pets/42/reminders/export',
          'recordatorios.pdf',
        )
      })

      it('calls slugify with the petName when petName is provided', async () => {
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF(42, 'Luna García')

        expect(mockSlugify).toHaveBeenCalledWith('Luna García')
      })

      it('does NOT call slugify when petName is undefined', async () => {
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF(42)

        expect(mockSlugify).not.toHaveBeenCalled()
      })

      it('combines pet-scoped endpoint and named filename correctly', async () => {
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF(7, 'Rex')

        expect(mockDownloadPDF).toHaveBeenCalledWith(
          '/api/pets/7/reminders/export',
          'recordatorios-rex.pdf',
        )
      })
    })

    describe('loading state', () => {
      it('sets remindersStore.isLoading to true during the export', async () => {
        let loadingDuringCall = false
        mockDownloadPDF.mockImplementationOnce(async () => {
          loadingDuringCall = remindersStore.isLoading
        })
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF()

        expect(loadingDuringCall).toBe(true)
      })

      it('sets remindersStore.isLoading to false after a successful export', async () => {
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF()

        expect(remindersStore.isLoading).toBe(false)
      })

      it('sets remindersStore.isLoading to false even when downloadPDF throws', async () => {
        mockDownloadPDF.mockRejectedValueOnce(new Error('Network failure'))
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF } = useReminders()

        await exportRemindersPDF()

        expect(remindersStore.isLoading).toBe(false)
      })
    })

    describe('error handling', () => {
      it('clears any previous error before starting the export', async () => {
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF, error } = useReminders()

        error.value = 'error previo'
        await exportRemindersPDF()

        expect(error.value).toBeNull()
      })

      it('leaves error as null after a successful export', async () => {
        mockDownloadPDF.mockResolvedValueOnce(undefined)
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF, error } = useReminders()

        await exportRemindersPDF()

        expect(error.value).toBeNull()
      })

      it('stores the error message when downloadPDF throws with { message }', async () => {
        mockDownloadPDF.mockRejectedValueOnce({ message: 'PDF generation failed' })
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF, error } = useReminders()

        await exportRemindersPDF()

        expect(error.value).toBe('PDF generation failed')
      })

      it('stores the error message when downloadPDF throws with { data: { error } }', async () => {
        mockDownloadPDF.mockRejectedValueOnce({ data: { error: 'Forbidden' } })
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF, error } = useReminders()

        await exportRemindersPDF()

        expect(error.value).toBe('Forbidden')
      })

      it('uses the generic fallback message for unexpected error shapes', async () => {
        mockDownloadPDF.mockRejectedValueOnce('unexpected string error')
        const { useReminders } = await import('./useReminders')
        const { exportRemindersPDF, error } = useReminders()

        await exportRemindersPDF()

        expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
      })
    })
  })
})
