// ============================================================
// useMedical.test.ts
// Tests the useMedical composable in a Nuxt test environment.
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
//   - exportPDF — it is guarded by import.meta.client (SSR env = server;
//     the guard short-circuits immediately), and its body relies on Blob
//     responses and DOM manipulation that are not meaningfully testable
//     in the happy-dom test environment. We verify that the function is
//     exposed in the return value as a smoke test.
//   - Network retry logic — no retry exists; nothing to test.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { MedicalRecord } from '../types'

// ── useApi mock ──────────────────────────────────────────────
// useApi is a project composable — vi.mock intercepts the module.

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()
const mockDel = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet, post: mockPost, put: mockPut, del: mockDel }),
}))

// ── Fixtures ─────────────────────────────────────────────────

function makeRecord(overrides: Partial<MedicalRecord> = {}): MedicalRecord {
  return {
    id: '1',
    pet_id: '42',
    date: '2024-06-15',
    veterinarian: 'Dr. García',
    diagnosis: 'Control rutinario',
    treatment: 'Vitaminas y desparasitante',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const recordA = makeRecord({ id: '1', date: '2024-06-15', veterinarian: 'Dr. García' })
const recordB = makeRecord({ id: '2', date: '2024-07-20', veterinarian: 'Dra. López', diagnosis: 'Vacunación' })

// ── Suite ─────────────────────────────────────────────────────

describe('useMedical', () => {
  let medicalStore: ReturnType<typeof import('../stores/medical.store').useMedicalStore>

  beforeEach(async () => {
    // Isolate Pinia per test.
    // stubActions: false so real store action logic runs.
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    const { useMedicalStore } = await import('../stores/medical.store')
    medicalStore = useMedicalStore()

    mockGet.mockReset()
    mockPost.mockReset()
    mockPut.mockReset()
    mockDel.mockReset()
  })

  // ── fetchMedicalHistory ────────────────────────────────────

  describe('fetchMedicalHistory()', () => {
    it('calls GET /api/pets/{petId}/medical-records with the correct petId', async () => {
      mockGet.mockResolvedValueOnce([recordA])
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory } = useMedical()

      await fetchMedicalHistory('42')

      expect(mockGet).toHaveBeenCalledWith('/api/pets/42/medical-records')
    })

    it('hydrates the store when the response is a bare MedicalRecord array', async () => {
      mockGet.mockResolvedValueOnce([recordA, recordB])
      const setRecordsSpy = vi.spyOn(medicalStore, 'setRecords')
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory } = useMedical()

      await fetchMedicalHistory('42')

      expect(setRecordsSpy).toHaveBeenCalledWith([recordA, recordB])
    })

    it('hydrates the store when the response is shaped as { medical_records: MedicalRecord[] }', async () => {
      mockGet.mockResolvedValueOnce({ medical_records: [recordA, recordB] })
      const setRecordsSpy = vi.spyOn(medicalStore, 'setRecords')
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory } = useMedical()

      await fetchMedicalHistory('42')

      expect(setRecordsSpy).toHaveBeenCalledWith([recordA, recordB])
    })

    it('calls setRecords with an empty array when { medical_records } key is missing', async () => {
      mockGet.mockResolvedValueOnce({})
      const setRecordsSpy = vi.spyOn(medicalStore, 'setRecords')
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory } = useMedical()

      await fetchMedicalHistory('42')

      expect(setRecordsSpy).toHaveBeenCalledWith([])
    })

    it('calls setRecords with an empty array when medical_records key is null/undefined', async () => {
      mockGet.mockResolvedValueOnce({ medical_records: undefined })
      const setRecordsSpy = vi.spyOn(medicalStore, 'setRecords')
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory } = useMedical()

      await fetchMedicalHistory('42')

      expect(setRecordsSpy).toHaveBeenCalledWith([])
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = medicalStore.isLoading
        return [recordA]
      })
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory } = useMedical()

      await fetchMedicalHistory('42')

      expect(loadingDuringCall).toBe(true)
      expect(medicalStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory } = useMedical()

      await fetchMedicalHistory('42')

      expect(medicalStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Sin autorización' } })
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory, error } = useMedical()

      await fetchMedicalHistory('42')

      expect(error.value).toBe('Sin autorización')
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce([recordA])
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory, error } = useMedical()

      error.value = 'error previo'
      await fetchMedicalHistory('42')

      expect(error.value).toBeNull()
    })

    it('sets error to null on successful fetch', async () => {
      mockGet.mockResolvedValueOnce([recordA])
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory, error } = useMedical()

      await fetchMedicalHistory('42')

      expect(error.value).toBeNull()
    })

    it('falls back to the generic error message for unexpected error shapes', async () => {
      mockGet.mockRejectedValueOnce('unexpected string error')
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory, error } = useMedical()

      await fetchMedicalHistory('42')

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('passes a different petId correctly to the URL', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory } = useMedical()

      await fetchMedicalHistory('99')

      expect(mockGet).toHaveBeenCalledWith('/api/pets/99/medical-records')
    })
  })

  // ── fetchMedicalRecord ─────────────────────────────────────

  describe('fetchMedicalRecord()', () => {
    it('calls GET /api/pets/{petId}/medical-records/{recordId} with the correct ids', async () => {
      mockGet.mockResolvedValueOnce(recordA)
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalRecord } = useMedical()

      await fetchMedicalRecord('42', '1')

      expect(mockGet).toHaveBeenCalledWith('/api/pets/42/medical-records/1')
    })

    it('calls setSelectedRecord on the store with the returned record', async () => {
      mockGet.mockResolvedValueOnce(recordA)
      const setSelectedRecordSpy = vi.spyOn(medicalStore, 'setSelectedRecord')
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalRecord } = useMedical()

      await fetchMedicalRecord('42', '1')

      expect(setSelectedRecordSpy).toHaveBeenCalledWith(recordA)
    })

    it('returns the record on success', async () => {
      mockGet.mockResolvedValueOnce(recordA)
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalRecord } = useMedical()

      const result = await fetchMedicalRecord('42', '1')

      expect(result).toEqual(recordA)
    })

    it('returns null when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404, data: { error: 'Not found' } })
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalRecord } = useMedical()

      const result = await fetchMedicalRecord('42', '999')

      expect(result).toBeNull()
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'No encontrado' } })
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalRecord, error } = useMedical()

      await fetchMedicalRecord('42', '999')

      expect(error.value).toBe('No encontrado')
    })

    it('does NOT call setSelectedRecord when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404 })
      const setSelectedRecordSpy = vi.spyOn(medicalStore, 'setSelectedRecord')
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalRecord } = useMedical()

      await fetchMedicalRecord('42', '999')

      expect(setSelectedRecordSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to false after success', async () => {
      mockGet.mockResolvedValueOnce(recordA)
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalRecord } = useMedical()

      await fetchMedicalRecord('42', '1')

      expect(medicalStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalRecord } = useMedical()

      await fetchMedicalRecord('42', '1')

      expect(medicalStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce(recordA)
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalRecord, error } = useMedical()

      error.value = 'error previo'
      await fetchMedicalRecord('42', '1')

      expect(error.value).toBeNull()
    })
  })

  // ── createMedicalRecord ────────────────────────────────────

  describe('createMedicalRecord()', () => {
    const payload = {
      date: '2024-06-15',
      veterinarian: 'Dr. García',
      diagnosis: 'Control rutinario',
      treatment: 'Vitaminas y desparasitante',
    }

    it('calls POST /api/pets/{petId}/medical-records with the payload', async () => {
      mockPost.mockResolvedValueOnce(recordA)
      const { useMedical } = await import('./useMedical')
      const { createMedicalRecord } = useMedical()

      await createMedicalRecord('42', payload)

      expect(mockPost).toHaveBeenCalledWith('/api/pets/42/medical-records', payload)
    })

    it('calls addRecord on the store with the returned record (prepend)', async () => {
      mockPost.mockResolvedValueOnce(recordA)
      const addRecordSpy = vi.spyOn(medicalStore, 'addRecord')
      const { useMedical } = await import('./useMedical')
      const { createMedicalRecord } = useMedical()

      await createMedicalRecord('42', payload)

      expect(addRecordSpy).toHaveBeenCalledWith(recordA)
    })

    it('returns the created record on success', async () => {
      mockPost.mockResolvedValueOnce(recordA)
      const { useMedical } = await import('./useMedical')
      const { createMedicalRecord } = useMedical()

      const result = await createMedicalRecord('42', payload)

      expect(result).toEqual(recordA)
    })

    it('returns null on failure', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
      const { useMedical } = await import('./useMedical')
      const { createMedicalRecord } = useMedical()

      const result = await createMedicalRecord('42', payload)

      expect(result).toBeNull()
    })

    it('sets error with the API message on failure', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
      const { useMedical } = await import('./useMedical')
      const { createMedicalRecord, error } = useMedical()

      await createMedicalRecord('42', payload)

      expect(error.value).toBe('Validation failed')
    })

    it('does NOT call addRecord on failure', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Validation failed' } })
      const addRecordSpy = vi.spyOn(medicalStore, 'addRecord')
      const { useMedical } = await import('./useMedical')
      const { createMedicalRecord } = useMedical()

      await createMedicalRecord('42', payload)

      expect(addRecordSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to true during the request', async () => {
      let loadingDuringCall = false
      mockPost.mockImplementationOnce(async () => {
        loadingDuringCall = medicalStore.isLoading
        return recordA
      })
      const { useMedical } = await import('./useMedical')
      const { createMedicalRecord } = useMedical()

      await createMedicalRecord('42', payload)

      expect(loadingDuringCall).toBe(true)
    })

    it('sets isLoading to false after success', async () => {
      mockPost.mockResolvedValueOnce(recordA)
      const { useMedical } = await import('./useMedical')
      const { createMedicalRecord } = useMedical()

      await createMedicalRecord('42', payload)

      expect(medicalStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockPost.mockRejectedValueOnce({ message: 'Network error' })
      const { useMedical } = await import('./useMedical')
      const { createMedicalRecord } = useMedical()

      await createMedicalRecord('42', payload)

      expect(medicalStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      mockPost.mockResolvedValueOnce(recordA)
      const { useMedical } = await import('./useMedical')
      const { createMedicalRecord, error } = useMedical()

      error.value = 'error previo'
      await createMedicalRecord('42', payload)

      expect(error.value).toBeNull()
    })
  })

  // ── updateMedicalRecord ────────────────────────────────────

  describe('updateMedicalRecord()', () => {
    const patchPayload = { diagnosis: 'Diagnóstico actualizado', treatment: 'Tratamiento nuevo' }
    const updatedRecord = { ...recordA, ...patchPayload }

    it('calls PUT /api/pets/{petId}/medical-records/{recordId} with the correct ids and payload', async () => {
      mockPut.mockResolvedValueOnce(updatedRecord)
      const { useMedical } = await import('./useMedical')
      const { updateMedicalRecord } = useMedical()

      await updateMedicalRecord('42', '1', patchPayload)

      expect(mockPut).toHaveBeenCalledWith('/api/pets/42/medical-records/1', patchPayload)
    })

    it('calls updateRecord on the store with the returned record', async () => {
      mockPut.mockResolvedValueOnce(updatedRecord)
      const updateStoreSpy = vi.spyOn(medicalStore, 'updateRecord')
      const { useMedical } = await import('./useMedical')
      const { updateMedicalRecord } = useMedical()

      await updateMedicalRecord('42', '1', patchPayload)

      expect(updateStoreSpy).toHaveBeenCalledWith(updatedRecord)
    })

    it('returns the updated record on success', async () => {
      mockPut.mockResolvedValueOnce(updatedRecord)
      const { useMedical } = await import('./useMedical')
      const { updateMedicalRecord } = useMedical()

      const result = await updateMedicalRecord('42', '1', patchPayload)

      expect(result).toEqual(updatedRecord)
    })

    it('returns null on failure', async () => {
      mockPut.mockRejectedValueOnce({ data: { error: 'Not found' } })
      const { useMedical } = await import('./useMedical')
      const { updateMedicalRecord } = useMedical()

      const result = await updateMedicalRecord('42', '999', patchPayload)

      expect(result).toBeNull()
    })

    it('sets error with the API message on failure', async () => {
      mockPut.mockRejectedValueOnce({ data: { error: 'Not found' } })
      const { useMedical } = await import('./useMedical')
      const { updateMedicalRecord, error } = useMedical()

      await updateMedicalRecord('42', '999', patchPayload)

      expect(error.value).toBe('Not found')
    })

    it('does NOT call store.updateRecord on failure', async () => {
      mockPut.mockRejectedValueOnce({ message: 'Network error' })
      const updateStoreSpy = vi.spyOn(medicalStore, 'updateRecord')
      const { useMedical } = await import('./useMedical')
      const { updateMedicalRecord } = useMedical()

      await updateMedicalRecord('42', '1', patchPayload)

      expect(updateStoreSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to false after success', async () => {
      mockPut.mockResolvedValueOnce(updatedRecord)
      const { useMedical } = await import('./useMedical')
      const { updateMedicalRecord } = useMedical()

      await updateMedicalRecord('42', '1', patchPayload)

      expect(medicalStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockPut.mockRejectedValueOnce({ message: 'Network error' })
      const { useMedical } = await import('./useMedical')
      const { updateMedicalRecord } = useMedical()

      await updateMedicalRecord('42', '1', patchPayload)

      expect(medicalStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      mockPut.mockResolvedValueOnce(updatedRecord)
      const { useMedical } = await import('./useMedical')
      const { updateMedicalRecord, error } = useMedical()

      error.value = 'error previo'
      await updateMedicalRecord('42', '1', patchPayload)

      expect(error.value).toBeNull()
    })

    it('passes different petId and recordId to URL correctly', async () => {
      mockPut.mockResolvedValueOnce(makeRecord({ id: '5', pet_id: '99' }))
      const { useMedical } = await import('./useMedical')
      const { updateMedicalRecord } = useMedical()

      await updateMedicalRecord('99', '5', patchPayload)

      expect(mockPut).toHaveBeenCalledWith('/api/pets/99/medical-records/5', patchPayload)
    })
  })

  // ── deleteMedicalRecord ────────────────────────────────────

  describe('deleteMedicalRecord()', () => {
    it('calls DELETE /api/pets/{petId}/medical-records/{recordId} with the correct ids', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord } = useMedical()

      await deleteMedicalRecord('42', '1')

      expect(mockDel).toHaveBeenCalledWith('/api/pets/42/medical-records/1')
    })

    it('calls removeRecord on the store with the correct id on success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const removeRecordSpy = vi.spyOn(medicalStore, 'removeRecord')
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord } = useMedical()

      await deleteMedicalRecord('42', '1')

      expect(removeRecordSpy).toHaveBeenCalledWith('1')
    })

    it('returns true on success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord } = useMedical()

      const result = await deleteMedicalRecord('42', '1')

      expect(result).toBe(true)
    })

    it('returns false on API failure', async () => {
      mockDel.mockRejectedValueOnce({ data: { error: 'Forbidden' } })
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord } = useMedical()

      const result = await deleteMedicalRecord('42', '1')

      expect(result).toBe(false)
    })

    it('does NOT call removeRecord on the store when the API call fails', async () => {
      mockDel.mockRejectedValueOnce({ data: { error: 'Forbidden' } })
      const removeRecordSpy = vi.spyOn(medicalStore, 'removeRecord')
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord } = useMedical()

      await deleteMedicalRecord('42', '1')

      expect(removeRecordSpy).not.toHaveBeenCalled()
    })

    it('sets error with the API message on failure', async () => {
      mockDel.mockRejectedValueOnce({ data: { error: 'Forbidden' } })
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord, error } = useMedical()

      await deleteMedicalRecord('42', '1')

      expect(error.value).toBe('Forbidden')
    })

    it('sets isLoading to true during the request', async () => {
      let loadingDuringCall = false
      mockDel.mockImplementationOnce(async () => {
        loadingDuringCall = medicalStore.isLoading
      })
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord } = useMedical()

      await deleteMedicalRecord('42', '1')

      expect(loadingDuringCall).toBe(true)
    })

    it('sets isLoading to false after success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord } = useMedical()

      await deleteMedicalRecord('42', '1')

      expect(medicalStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockDel.mockRejectedValueOnce({ message: 'Network error' })
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord } = useMedical()

      await deleteMedicalRecord('42', '1')

      expect(medicalStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord, error } = useMedical()

      error.value = 'error previo'
      await deleteMedicalRecord('42', '1')

      expect(error.value).toBeNull()
    })

    it('falls back to the generic error message for unexpected error shapes', async () => {
      mockDel.mockRejectedValueOnce('unexpected string error')
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord, error } = useMedical()

      await deleteMedicalRecord('42', '1')

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('passes different petId and recordId to URL correctly', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { useMedical } = await import('./useMedical')
      const { deleteMedicalRecord } = useMedical()

      await deleteMedicalRecord('99', '5')

      expect(mockDel).toHaveBeenCalledWith('/api/pets/99/medical-records/5')
    })
  })

  // ── exportPDF existence ────────────────────────────────────

  describe('exportPDF export contract', () => {
    it('exposes exportPDF as a function in the return value', async () => {
      const { useMedical } = await import('./useMedical')
      const { exportPDF } = useMedical()
      expect(typeof exportPDF).toBe('function')
    })

    it('exportPDF is a no-op (returns undefined) when import.meta.client is false (SSR guard)', async () => {
      // In the Nuxt test environment (SSR), import.meta.client is false.
      // exportPDF checks this guard and returns immediately without side effects.
      const { useMedical } = await import('./useMedical')
      const { exportPDF } = useMedical()
      // Should resolve without throwing and without calling any mocks
      await expect(exportPDF('42', 'Luna')).resolves.toBeUndefined()
      expect(mockGet).not.toHaveBeenCalled()
    })
  })

  // ── error ref contract ─────────────────────────────────────

  describe('error ref', () => {
    it('starts as null', async () => {
      const { useMedical } = await import('./useMedical')
      const { error } = useMedical()
      expect(error.value).toBeNull()
    })

    it('is set on failure and then cleared on the next successful call', async () => {
      mockGet
        .mockRejectedValueOnce({ data: { error: 'Fallo temporal' } })
        .mockResolvedValueOnce([recordA])

      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory, error } = useMedical()

      await fetchMedicalHistory('42')
      expect(error.value).toBe('Fallo temporal')

      await fetchMedicalHistory('42')
      expect(error.value).toBeNull()
    })

    it('extracts error from { data: { error: string } } shape', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Mensaje del servidor' } })
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory, error } = useMedical()

      await fetchMedicalHistory('42')

      expect(error.value).toBe('Mensaje del servidor')
    })

    it('extracts error from { data: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ data: 'Error como string' })
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory, error } = useMedical()

      await fetchMedicalHistory('42')

      expect(error.value).toBe('Error como string')
    })

    it('extracts error from { message: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Error de red' })
      const { useMedical } = await import('./useMedical')
      const { fetchMedicalHistory, error } = useMedical()

      await fetchMedicalHistory('42')

      expect(error.value).toBe('Error de red')
    })
  })
})
