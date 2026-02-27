// ============================================================
// useShelters — Shelters & Adoptions feature composable
// Central API surface for shelter directory and adoption pet
// operations. State is owned by useSheltersStore; this
// composable is the API layer that keeps the store in sync.
// ============================================================

import type {
  Shelter,
  AdoptionPet,
  AdoptionRequest,
  ShelterFilters,
  AdoptionPetFilters,
} from '../types'

export function useShelters() {
  const { get, post } = useApi()
  const sheltersStore = useSheltersStore()

  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  /**
   * Fetch all shelters, optionally filtered.
   * Handles both `{ shelters: Shelter[] }` and bare `Shelter[]` shapes.
   */
  async function fetchShelters(filters?: ShelterFilters): Promise<void> {
    sheltersStore.setLoading(true)
    error.value = null
    try {
      // Build query string from non-empty filter values
      const params = new URLSearchParams()
      if (filters?.city) params.set('city', filters.city)
      if (filters?.species) params.set('species', filters.species)
      if (filters?.search) params.set('search', filters.search)
      const qs = params.toString()
      const path = qs ? `/api/shelters?${qs}` : '/api/shelters'

      const response = await get<{ shelters?: Shelter[] } | Shelter[]>(path)
      if (Array.isArray(response)) {
        sheltersStore.setShelters(response)
      }
      else {
        sheltersStore.setShelters(response.shelters ?? [])
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      sheltersStore.setLoading(false)
    }
  }

  /**
   * Fetch a single shelter by id and store it as selectedShelter.
   * Returns the shelter or null on failure.
   */
  async function fetchShelterById(id: string): Promise<Shelter | null> {
    sheltersStore.setLoading(true)
    error.value = null
    try {
      const shelter = await get<Shelter>(`/api/shelters/${id}`)
      sheltersStore.setSelectedShelter(shelter)
      return shelter
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      sheltersStore.setLoading(false)
    }
  }

  /**
   * Fetch all adoption pets for a shelter, optionally filtered.
   * Handles both `{ pets: AdoptionPet[] }` and bare `AdoptionPet[]` shapes.
   */
  async function fetchAdoptionPets(
    shelterId: string,
    filters?: AdoptionPetFilters,
  ): Promise<void> {
    sheltersStore.setLoading(true)
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.species) params.set('species', filters.species)
      if (filters?.gender) params.set('gender', filters.gender)
      if (filters?.size) params.set('size', filters.size)
      if (filters?.status) params.set('status', filters.status)
      const qs = params.toString()
      const path = qs
        ? `/api/shelters/${shelterId}/pets?${qs}`
        : `/api/shelters/${shelterId}/pets`

      const response = await get<{ pets?: AdoptionPet[] } | AdoptionPet[]>(path)
      if (Array.isArray(response)) {
        sheltersStore.setAdoptionPets(response)
      }
      else {
        sheltersStore.setAdoptionPets(response.pets ?? [])
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      sheltersStore.setLoading(false)
    }
  }

  /**
   * Fetch a single adoption pet by id and store it as selectedAdoptionPet.
   * Returns the pet or null on failure.
   */
  async function fetchAdoptionPetById(
    shelterId: string,
    petId: string,
  ): Promise<AdoptionPet | null> {
    sheltersStore.setLoading(true)
    error.value = null
    try {
      const pet = await get<AdoptionPet>(`/api/shelters/${shelterId}/pets/${petId}`)
      sheltersStore.setSelectedAdoptionPet(pet)
      return pet
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      sheltersStore.setLoading(false)
    }
  }

  /**
   * Submit an adoption request for a pet. Requires authentication.
   * Returns the created AdoptionRequest or null on failure.
   */
  async function submitAdoptionRequest(
    shelterId: string,
    petId: string,
    message: string,
  ): Promise<AdoptionRequest | null> {
    sheltersStore.setLoading(true)
    error.value = null
    try {
      const request = await post<AdoptionRequest>(
        `/api/shelters/${shelterId}/pets/${petId}/adopt`,
        { message },
      )
      return request
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      sheltersStore.setLoading(false)
    }
  }

  return {
    error,
    sheltersStore,
    fetchShelters,
    fetchShelterById,
    fetchAdoptionPets,
    fetchAdoptionPetById,
    submitAdoptionRequest,
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
