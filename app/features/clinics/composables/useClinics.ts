// ============================================================
// useClinics — Clinic directory feature composable
// Central API surface for the clinic directory.
// State is owned by useClinicsStore; this composable is the
// API layer that keeps the store in sync.
//
// Public endpoints (no auth required):
//   GET /clinics?city=&specialty=  → Clinic[] (plain array)
//   GET /clinics/:id               → Clinic object
// ============================================================

import type { Clinic, ClinicListFilters, ClinicListResponse } from '../types'
import { extractErrorMessage } from '../../shared/utils/extractErrorMessage'

export function useClinics() {
  const { get } = useApi()
  const clinicsStore = useClinicsStore()

  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  /**
   * Fetch all clinics, optionally filtered.
   * Handles both plain `Clinic[]` array and `{ clinics: Clinic[] }` envelope
   * for robustness (backend returns plain array).
   */
  async function fetchClinics(filters?: ClinicListFilters): Promise<void> {
    clinicsStore.setLoading(true)
    error.value = null
    try {
      // Build query string from non-empty filter values
      const params = new URLSearchParams()
      if (filters?.city) params.set('city', filters.city)
      if (filters?.specialty) params.set('specialty', filters.specialty)
      const qs = params.toString()
      const path = qs ? `/clinics?${qs}` : '/clinics'

      const response = await get<ClinicListResponse | Clinic[]>(path)
      if (Array.isArray(response)) {
        clinicsStore.setClinics(response)
      }
      else {
        clinicsStore.setClinics(response.clinics ?? [])
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      clinicsStore.setLoading(false)
    }
  }

  /**
   * Fetch a single clinic by id. Checks the clinics[] array first
   * (store-first lookup — avoids a network round-trip when navigating
   * from the list to the detail view).
   * Calls setSelectedClinic() on success.
   * Returns the clinic or null on failure.
   */
  async function fetchClinicById(id: number): Promise<Clinic | null> {
    // Store-first: if we already loaded this clinic in the list, reuse it.
    const cached = clinicsStore.clinics.find(c => c.id === id)
    if (cached) {
      clinicsStore.setSelectedClinic(cached)
      return cached
    }

    clinicsStore.setLoading(true)
    error.value = null
    try {
      const clinic = await get<Clinic>(`/clinics/${id}`)
      clinicsStore.setSelectedClinic(clinic)
      return clinic
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      clinicsStore.setLoading(false)
    }
  }

  return {
    error,
    clinicsStore,
    fetchClinics,
    fetchClinicById,
  }
}

