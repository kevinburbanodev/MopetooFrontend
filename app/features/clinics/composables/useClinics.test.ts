// ============================================================
// useClinics.test.ts
// Tests the useClinics composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT the right tool.
//   - useRuntimeConfig is NOT mocked here. NUXT_PUBLIC_API_BASE is
//     provided via vitest.config.ts env options.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs and we can spy on it.
//
// Endpoint notes:
//   - GET /clinics (public, no /api prefix) returns plain Clinic[] array.
//   - GET /clinics/:id returns single Clinic object.
//   - Backend supports ?city= and ?specialty= query params (no search).
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { Clinic } from '../types'

// ── useApi mock ──────────────────────────────────────────────

const mockGet = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet }),
}))

// ── Fixtures ─────────────────────────────────────────────────

function makeClinic(overrides: Partial<Clinic> = {}): Clinic {
  return {
    id: 1,
    name: 'Clínica Veterinaria Los Andes',
    email: 'info@clinicaandes.com',
    phone: '+57 300 987 6543',
    address: 'Calle 72 #15-30',
    city: 'Bogotá',
    country: 'Colombia',
    description: 'Atención veterinaria integral para toda tu familia',
    specialties: ['Cirugía', 'Dermatología'],
    services: ['Consulta general', 'Vacunación'],
    schedules: 'Lunes a Viernes: 8:00 AM - 6:00 PM',
    cover_image_url: 'https://example.com/clinica.jpg',
    plan: 'free',
    verified: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const clinicA = makeClinic({ id: 1, name: 'Los Andes Vet' })
const clinicB = makeClinic({ id: 2, name: 'Clínica Animal Sur', city: 'Medellín', plan: 'pro' })

// ── Suite ─────────────────────────────────────────────────────

describe('useClinics', () => {
  let clinicsStore: ReturnType<typeof import('../stores/clinics.store').useClinicsStore>

  beforeEach(async () => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    const { useClinicsStore } = await import('../stores/clinics.store')
    clinicsStore = useClinicsStore()

    mockGet.mockReset()
  })

  // ── fetchClinics ───────────────────────────────────────────

  describe('fetchClinics()', () => {
    it('calls GET /clinics when no filters are provided', async () => {
      mockGet.mockResolvedValueOnce([clinicA])
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics()

      expect(mockGet).toHaveBeenCalledWith('/clinics')
    })

    it('hydrates the store when the response is a bare Clinic array', async () => {
      mockGet.mockResolvedValueOnce([clinicA, clinicB])
      const setClinicsSpy = vi.spyOn(clinicsStore, 'setClinics')
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics()

      expect(setClinicsSpy).toHaveBeenCalledWith([clinicA, clinicB])
    })

    it('hydrates the store when the response is shaped as { clinics: Clinic[] }', async () => {
      mockGet.mockResolvedValueOnce({ clinics: [clinicA, clinicB] })
      const setClinicsSpy = vi.spyOn(clinicsStore, 'setClinics')
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics()

      expect(setClinicsSpy).toHaveBeenCalledWith([clinicA, clinicB])
    })

    it('calls setClinics with an empty array when { clinics } key is missing', async () => {
      mockGet.mockResolvedValueOnce({})
      const setClinicsSpy = vi.spyOn(clinicsStore, 'setClinics')
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics()

      expect(setClinicsSpy).toHaveBeenCalledWith([])
    })

    it('calls setClinics with an empty array when clinics key is undefined', async () => {
      mockGet.mockResolvedValueOnce({ clinics: undefined })
      const setClinicsSpy = vi.spyOn(clinicsStore, 'setClinics')
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics()

      expect(setClinicsSpy).toHaveBeenCalledWith([])
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = clinicsStore.isLoading
        return [clinicA]
      })
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics()

      expect(loadingDuringCall).toBe(true)
      expect(clinicsStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics()

      expect(clinicsStore.isLoading).toBe(false)
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Error del servidor' } })
      const { useClinics } = await import('./useClinics')
      const { fetchClinics, error } = useClinics()

      await fetchClinics()

      expect(error.value).toBe('Error del servidor')
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce([clinicA])
      const { useClinics } = await import('./useClinics')
      const { fetchClinics, error } = useClinics()

      error.value = 'error previo'
      await fetchClinics()

      expect(error.value).toBeNull()
    })

    it('sets error to null on successful fetch', async () => {
      mockGet.mockResolvedValueOnce([clinicA])
      const { useClinics } = await import('./useClinics')
      const { fetchClinics, error } = useClinics()

      await fetchClinics()

      expect(error.value).toBeNull()
    })

    it('falls back to generic error message for unexpected error shapes', async () => {
      mockGet.mockRejectedValueOnce('unexpected string error')
      const { useClinics } = await import('./useClinics')
      const { fetchClinics, error } = useClinics()

      await fetchClinics()

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })
  })

  // ── fetchClinics with filters ──────────────────────────────

  describe('fetchClinics(filters)', () => {
    it('appends city filter as a query string parameter', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics({ city: 'Bogotá' })

      expect(mockGet).toHaveBeenCalledWith('/clinics?city=Bogot%C3%A1')
    })

    it('appends specialty filter as a query string parameter', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics({ specialty: 'Cirugía' })

      expect(mockGet).toHaveBeenCalledWith('/clinics?specialty=Cirug%C3%ADa')
    })

    it('omits empty filter values from the query string', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics({ city: '', specialty: '' })

      expect(mockGet).toHaveBeenCalledWith('/clinics')
    })

    it('combines multiple filter parameters correctly', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics({ city: 'Bogotá', specialty: 'Cirugía' })

      const calledPath: string = mockGet.mock.calls[0][0]
      expect(calledPath).toContain('/clinics?')
      expect(calledPath).toContain('city=')
      expect(calledPath).toContain('specialty=')
    })

    it('calls GET /clinics (no query string) when filters object is empty', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics({})

      expect(mockGet).toHaveBeenCalledWith('/clinics')
    })

    it('calls GET /clinics (no query string) when filters is undefined', async () => {
      mockGet.mockResolvedValueOnce([])
      const { useClinics } = await import('./useClinics')
      const { fetchClinics } = useClinics()

      await fetchClinics(undefined)

      expect(mockGet).toHaveBeenCalledWith('/clinics')
    })
  })

  // ── fetchClinicById ────────────────────────────────────────

  describe('fetchClinicById()', () => {
    it('calls GET /clinics/{id} when id is not in the store cache', async () => {
      mockGet.mockResolvedValueOnce(clinicA)
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      await fetchClinicById(1)

      expect(mockGet).toHaveBeenCalledWith('/clinics/1')
    })

    it('returns the clinic from the store cache without calling the API (store-first lookup)', async () => {
      clinicsStore.setClinics([clinicA])
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      const result = await fetchClinicById(1)

      expect(mockGet).not.toHaveBeenCalled()
      expect(result).toEqual(clinicA)
    })

    it('calls setSelectedClinic via store-first lookup when cache hit', async () => {
      clinicsStore.setClinics([clinicA])
      const setSelectedSpy = vi.spyOn(clinicsStore, 'setSelectedClinic')
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      await fetchClinicById(1)

      expect(setSelectedSpy).toHaveBeenCalledWith(clinicA)
    })

    it('falls back to API call when id is not in the store cache', async () => {
      clinicsStore.setClinics([clinicA])
      mockGet.mockResolvedValueOnce(clinicB)
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      await fetchClinicById(2)

      expect(mockGet).toHaveBeenCalledWith('/clinics/2')
    })

    it('calls setSelectedClinic on the store with the returned clinic', async () => {
      mockGet.mockResolvedValueOnce(clinicA)
      const setSelectedSpy = vi.spyOn(clinicsStore, 'setSelectedClinic')
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      await fetchClinicById(1)

      expect(setSelectedSpy).toHaveBeenCalledWith(clinicA)
    })

    it('returns the clinic on success', async () => {
      mockGet.mockResolvedValueOnce(clinicA)
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      const result = await fetchClinicById(1)

      expect(result).toEqual(clinicA)
    })

    it('returns null when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404, data: { error: 'Not found' } })
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      const result = await fetchClinicById(999)

      expect(result).toBeNull()
    })

    it('sets error when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'No encontrado' } })
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById, error } = useClinics()

      await fetchClinicById(999)

      expect(error.value).toBe('No encontrado')
    })

    it('does NOT call setSelectedClinic when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404 })
      const setSelectedSpy = vi.spyOn(clinicsStore, 'setSelectedClinic')
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      await fetchClinicById(999)

      expect(setSelectedSpy).not.toHaveBeenCalled()
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = clinicsStore.isLoading
        return clinicA
      })
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      await fetchClinicById(1)

      expect(loadingDuringCall).toBe(true)
      expect(clinicsStore.isLoading).toBe(false)
    })

    it('sets isLoading to false after failure', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      await fetchClinicById(1)

      expect(clinicsStore.isLoading).toBe(false)
    })

    it('does NOT set isLoading when returning from store cache (no network round-trip)', async () => {
      clinicsStore.setClinics([clinicA])
      const setLoadingSpy = vi.spyOn(clinicsStore, 'setLoading')
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      await fetchClinicById(1)

      expect(setLoadingSpy).not.toHaveBeenCalled()
    })

    it('passes a different clinicId correctly to the URL', async () => {
      mockGet.mockResolvedValueOnce(clinicB)
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById } = useClinics()

      await fetchClinicById(42)

      expect(mockGet).toHaveBeenCalledWith('/clinics/42')
    })

    it('clears any previous error before the network request', async () => {
      mockGet.mockResolvedValueOnce(clinicA)
      const { useClinics } = await import('./useClinics')
      const { fetchClinicById, error } = useClinics()

      error.value = 'error previo'
      await fetchClinicById(1)

      expect(error.value).toBeNull()
    })
  })

  // ── error ref contract ─────────────────────────────────────

  describe('error ref', () => {
    it('starts as null', async () => {
      const { useClinics } = await import('./useClinics')
      const { error } = useClinics()
      expect(error.value).toBeNull()
    })

    it('is set on failure and then cleared on the next successful call', async () => {
      mockGet
        .mockRejectedValueOnce({ data: { error: 'Fallo temporal' } })
        .mockResolvedValueOnce([clinicA])

      const { useClinics } = await import('./useClinics')
      const { fetchClinics, error } = useClinics()

      await fetchClinics()
      expect(error.value).toBe('Fallo temporal')

      await fetchClinics()
      expect(error.value).toBeNull()
    })

    it('extracts error from { data: { error: string } } shape', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Mensaje del servidor' } })
      const { useClinics } = await import('./useClinics')
      const { fetchClinics, error } = useClinics()

      await fetchClinics()

      expect(error.value).toBe('Mensaje del servidor')
    })

    it('extracts error from { data: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ data: 'Error como string' })
      const { useClinics } = await import('./useClinics')
      const { fetchClinics, error } = useClinics()

      await fetchClinics()

      expect(error.value).toBe('Error como string')
    })

    it('extracts error from { message: string } shape', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Error de red' })
      const { useClinics } = await import('./useClinics')
      const { fetchClinics, error } = useClinics()

      await fetchClinics()

      expect(error.value).toBe('Error de red')
    })
  })
})
