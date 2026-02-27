// ============================================================
// usePetshops — Petshop directory feature composable
// Central API surface for the petshop directory.
// State is owned by usePetshopsStore; this composable is the
// API layer that keeps the store in sync.
// ============================================================

import type { Petshop, PetshopListFilters, PetshopListResponse } from '../types'

export function usePetshops() {
  const { get } = useApi()
  const petshopsStore = usePetshopsStore()

  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  /**
   * Fetch all petshops, optionally filtered.
   * Handles both `{ stores: Petshop[] }` envelope and plain `Petshop[]` shapes.
   */
  async function fetchPetshops(filters?: PetshopListFilters): Promise<void> {
    petshopsStore.setLoading(true)
    error.value = null
    try {
      // Build query string from non-empty filter values
      const params = new URLSearchParams()
      if (filters?.search) params.set('search', filters.search)
      if (filters?.city) params.set('city', filters.city)
      if (filters?.category) params.set('category', filters.category)
      const qs = params.toString()
      const path = qs ? `/api/stores?${qs}` : '/api/stores'

      const response = await get<PetshopListResponse | Petshop[]>(path)
      if (Array.isArray(response)) {
        petshopsStore.setPetshops(response)
      }
      else {
        petshopsStore.setPetshops(response.stores ?? [])
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      petshopsStore.setLoading(false)
    }
  }

  /**
   * Fetch a single petshop by id. Checks the petshops[] array first
   * (store-first lookup — avoids a network round-trip when navigating
   * from the list to the detail view).
   * Calls setSelectedPetshop() on success.
   * Returns the petshop or null on failure.
   */
  async function fetchPetshopById(id: string): Promise<Petshop | null> {
    // Store-first: if we already loaded this petshop in the list, reuse it.
    const cached = petshopsStore.petshops.find(p => p.id === id)
    if (cached) {
      petshopsStore.setSelectedPetshop(cached)
      return cached
    }

    petshopsStore.setLoading(true)
    error.value = null
    try {
      const petshop = await get<Petshop>(`/api/stores/${id}`)
      petshopsStore.setSelectedPetshop(petshop)
      return petshop
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      petshopsStore.setLoading(false)
    }
  }

  return {
    error,
    petshopsStore,
    fetchPetshops,
    fetchPetshopById,
  }
}

// ── Helpers ─────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    if ('data' in err) {
      const data = (err as { data: unknown }).data
      if (typeof data === 'object' && data !== null && 'error' in data) {
        return String((data as { error: unknown }).error)
      }
      if (typeof data === 'string' && data.length > 0) return data
    }
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message
    }
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
