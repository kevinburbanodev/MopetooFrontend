// ============================================================
// usePets — Pets feature composable
// Central API surface for all pet CRUD operations.
//
// All create/update requests use multipart/form-data because
// the backend (Go + Gin) binds with `form:""` struct tags,
// not `json:""` tags. JSON requests will silently fail to bind.
//
// The backend requires photo on create (binding:"required").
// Photo is optional on update.
// ============================================================

import type { Pet, CreatePetDTO, UpdatePetDTO } from '../types'
import { extractErrorMessage } from '../../shared/utils/extractErrorMessage'

export function usePets() {
  const { get, del } = useApi()
  const petsStore = usePetsStore()
  const authStore = useAuthStore()
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) ?? ''

  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  /**
   * Fetch the authenticated user's full pet list and hydrate the store.
   * Uses the user_id decoded from the JWT to call the correct endpoint.
   *
   * Backend response shapes:
   *   - Pet[] when pets exist
   *   - { message: string } when no pets exist
   */
  async function fetchPets(): Promise<void> {
    petsStore.setLoading(true)
    error.value = null
    try {
      const entityId = getEntityIdFromToken()
      if (!entityId) {
        error.value = 'No se pudo identificar al usuario'
        return
      }
      const response = await get<Pet[] | { message?: string }>(`/api/pets/user/${entityId}`)
      if (Array.isArray(response)) {
        petsStore.setPets(normalizePets(response))
      }
      else {
        // Backend returns { message: "No existen mascotas..." } when empty
        petsStore.setPets([])
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
      const normalized = normalizePet(pet)
      petsStore.setSelectedPet(normalized)
      return normalized
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
   * Create a new pet. Always sent as multipart/form-data because
   * the backend uses `form:""` struct tags and requires a photo file.
   */
  async function createPet(data: CreatePetDTO, photo: File): Promise<Pet | null> {
    petsStore.setLoading(true)
    error.value = null
    try {
      const formData = buildPetFormData(data, photo)
      const pet = await multipartRequest<Pet>('POST', '/api/pets', formData, authStore.token, baseURL)
      const normalized = normalizePet(pet)
      petsStore.addPet(normalized)
      return normalized
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
   * Update an existing pet. Always sent as multipart/form-data
   * via PUT (backend only accepts PUT, not PATCH).
   */
  async function updatePet(id: string, data: UpdatePetDTO, photo?: File): Promise<Pet | null> {
    petsStore.setLoading(true)
    error.value = null
    try {
      const formData = buildPetFormData(data, photo)
      const pet = await multipartRequest<Pet>('PUT', `/api/pets/${id}`, formData, authStore.token, baseURL)
      const normalized = normalizePet(pet)
      petsStore.updatePet(normalized)
      return normalized
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
 * Decode the user_id from the JWT stored in the auth store.
 * Returns the user_id as a string, or null if the token is missing/invalid.
 */
function getEntityIdFromToken(): string | null {
  const authStore = useAuthStore()
  if (!authStore.token) return null
  try {
    const payload = JSON.parse(atob(authStore.token.split('.')[1]))
    return payload.user_id != null ? String(payload.user_id) : null
  }
  catch {
    return null
  }
}

/**
 * Normalize a single pet from the backend response.
 * Coerces id and user_id from number (backend uint) to string (frontend convention).
 */
function normalizePet(pet: Pet): Pet {
  return {
    ...pet,
    id: String(pet.id),
    user_id: String(pet.user_id),
  }
}

/**
 * Normalize an array of pets from the backend response.
 */
function normalizePets(pets: Pet[]): Pet[] {
  return pets.map(normalizePet)
}

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
  method: 'POST' | 'PUT',
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

