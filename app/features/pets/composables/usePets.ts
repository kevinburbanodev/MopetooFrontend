// ============================================================
// usePets — Pets feature composable
// Central API surface for all pet CRUD operations.
// Photo uploads bypass useApi() (which injects Content-Type: JSON)
// and use $fetch directly with FormData and a manual Bearer header.
// ============================================================

import type { Pet, CreatePetDTO, UpdatePetDTO } from '../types'

export function usePets() {
  const { get, del } = useApi()
  const petsStore = usePetsStore()
  const authStore = useAuthStore()
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) ?? ''

  const pending = ref(false)
  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  /**
   * Fetch the authenticated user's full pet list and hydrate the store.
   * Handles responses shaped as `{ pets: Pet[] }` or a bare `Pet[]`.
   */
  async function fetchPets(): Promise<void> {
    petsStore.setLoading(true)
    error.value = null
    try {
      // The backend may return { pets: Pet[] } or Pet[] — handle both shapes
      const response = await get<{ pets?: Pet[] } | Pet[]>('/api/pets')
      if (Array.isArray(response)) {
        petsStore.setPets(response)
      }
      else {
        petsStore.setPets(response.pets ?? [])
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      petsStore.setLoading(false)
    }
  }

  /**
   * Fetch a single pet by id and store it as the selectedPet.
   * Returns the pet or null on failure.
   */
  async function fetchPetById(id: string): Promise<Pet | null> {
    petsStore.setLoading(true)
    error.value = null
    try {
      const pet = await get<Pet>(`/api/pets/${id}`)
      petsStore.setSelectedPet(pet)
      return pet
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      petsStore.setLoading(false)
    }
  }

  /**
   * Create a new pet. If a photo is supplied it is sent as multipart/form-data;
   * otherwise a JSON POST is used.
   */
  async function createPet(data: CreatePetDTO, photo?: File): Promise<Pet | null> {
    petsStore.setLoading(true)
    error.value = null
    try {
      let pet: Pet
      if (photo) {
        const formData = buildPetFormData(data, photo)
        pet = await multipartRequest<Pet>('POST', '/api/pets', formData, authStore.token, baseURL)
      }
      else {
        // No photo — send plain JSON via useApi's post (already set up for JSON)
        const { post } = useApi()
        pet = await post<Pet>('/api/pets', data)
      }
      petsStore.addPet(pet)
      return pet
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      petsStore.setLoading(false)
    }
  }

  /**
   * Update an existing pet. Uses PATCH; upgrades to multipart if a new photo is provided.
   */
  async function updatePet(id: string, data: UpdatePetDTO, photo?: File): Promise<Pet | null> {
    petsStore.setLoading(true)
    error.value = null
    try {
      let pet: Pet
      if (photo) {
        const formData = buildPetFormData(data, photo)
        pet = await multipartRequest<Pet>('PATCH', `/api/pets/${id}`, formData, authStore.token, baseURL)
      }
      else {
        const { patch } = useApi()
        pet = await patch<Pet>(`/api/pets/${id}`, data)
      }
      petsStore.updatePet(pet)
      return pet
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      petsStore.setLoading(false)
    }
  }

  /**
   * Delete a pet by id and remove it from the store.
   * Returns true on success, false on failure.
   */
  async function deletePet(id: string): Promise<boolean> {
    petsStore.setLoading(true)
    error.value = null
    try {
      await del<void>(`/api/pets/${id}`)
      petsStore.removePet(id)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
    finally {
      petsStore.setLoading(false)
    }
  }

  /**
   * Export a pet's profile as a PDF blob and trigger a browser download.
   * Client-only — guarded via import.meta.client inside useExportPDF.
   *
   * @param petId   - The pet's ID (used as a fallback filename slug)
   * @param petName - Optional pet name used to build the filename
   */
  async function exportProfilePDF(petId: string, petName?: string): Promise<void> {
    petsStore.setLoading(true)
    error.value = null
    try {
      const { downloadPDF, slugify } = useExportPDF()
      const slug = petName ? slugify(petName) : petId
      await downloadPDF(`/api/pets/${petId}/export`, `perfil-${slug}.pdf`)
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      petsStore.setLoading(false)
    }
  }

  return {
    pending,
    error,
    fetchPets,
    fetchPetById,
    createPet,
    updatePet,
    deletePet,
    exportProfilePDF,
    petsStore,
  }
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * Build a FormData object from DTO fields + optional photo.
 * Only appends keys whose values are not undefined/null.
 */
function buildPetFormData(data: Record<string, unknown>, photo?: File): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) continue
    fd.append(key, String(value))
  }
  if (photo) {
    fd.append('photo', photo)
  }
  return fd
}

/**
 * Send a multipart request directly via $fetch, bypassing the JSON wrapper.
 * Token is read from the auth store (already reactive; avoids duplicate
 * localStorage reads inconsistent with the store state).
 */
async function multipartRequest<T>(
  method: 'POST' | 'PATCH' | 'PUT',
  path: string,
  body: FormData,
  token: string | null,
  baseURL: string,
): Promise<T> {
  return await $fetch<T>(`${baseURL}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  })
}

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
