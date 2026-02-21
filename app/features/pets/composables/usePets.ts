// ============================================================
// usePets — Pets feature composable
// Handles CRUD operations for pet profiles.
// The backend uses multipart/form-data for create/update (photo upload).
// ============================================================

import type { Pet, CreatePetPayload, UpdatePetPayload } from '../types'

export function usePets() {
  const { get, del } = useApi()
  const petsStore = usePetsStore()
  const config = useRuntimeConfig()

  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPets(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await get<{ pets?: Pet[], message?: string }>('/api/pets')
      petsStore.setPets(response.pets ?? [])
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      loading.value = false
    }
  }

  async function fetchPet(id: number): Promise<Pet | null> {
    loading.value = true
    error.value = null
    try {
      const pet = await get<Pet>(`/api/pets/${id}`)
      petsStore.selectPet(pet)
      return pet
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  async function createPet(payload: CreatePetPayload): Promise<Pet | null> {
    loading.value = true
    error.value = null
    try {
      const formData = toFormData(payload)
      const pet = await postMultipart<Pet>('/api/pets', formData, config)
      petsStore.addPet(pet)
      return pet
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  async function updatePet(id: number, payload: UpdatePetPayload): Promise<Pet | null> {
    loading.value = true
    error.value = null
    try {
      const formData = toFormData(payload)
      const pet = await putMultipart<Pet>(`/api/pets/${id}`, formData, config)
      petsStore.updatePet(pet)
      return pet
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  async function deletePet(id: number): Promise<boolean> {
    loading.value = true
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
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchPets,
    fetchPet,
    createPet,
    updatePet,
    deletePet,
  }
}

// ── Helpers ─────────────────────────────────────────────────

function toFormData(payload: Record<string, unknown>): FormData {
  const fd = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue
    if (value instanceof File) {
      fd.append(key, value)
    }
    else {
      fd.append(key, String(value))
    }
  }
  return fd
}

async function postMultipart<T>(path: string, body: FormData, config: ReturnType<typeof useRuntimeConfig>): Promise<T> {
  const baseURL = (config.public.apiBase as string) ?? ''
  const token = import.meta.client ? localStorage.getItem('mopetoo_token') : null
  return await $fetch<T>(`${baseURL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  })
}

async function putMultipart<T>(path: string, body: FormData, config: ReturnType<typeof useRuntimeConfig>): Promise<T> {
  const baseURL = (config.public.apiBase as string) ?? ''
  const token = import.meta.client ? localStorage.getItem('mopetoo_token') : null
  return await $fetch<T>(`${baseURL}${path}`, {
    method: 'PUT',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body,
  })
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'data' in err) {
    const data = (err as { data: unknown }).data
    if (typeof data === 'object' && data !== null && 'error' in data) {
      return String((data as { error: unknown }).error)
    }
  }
  return 'Ocurrió un error inesperado.'
}
