// ============================================================
// useMedical — Medical History feature composable
// Central API surface for all medical record CRUD operations.
// State is owned by useMedicalStore; this composable is the
// API layer that keeps the store in sync.
// ============================================================

import type { MedicalRecord, CreateMedicalRecordDTO, UpdateMedicalRecordDTO } from '../types'

export function useMedical() {
  const { get, post, put, del } = useApi()
  const medicalStore = useMedicalStore()
  const authStore = useAuthStore()

  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  /**
   * Fetch all medical records for a given pet.
   * Handles both `{ medical_records: MedicalRecord[] }` and bare `MedicalRecord[]` shapes.
   */
  async function fetchMedicalHistory(petId: string): Promise<void> {
    medicalStore.setLoading(true)
    error.value = null
    try {
      const response = await get<{ medical_records?: MedicalRecord[] } | MedicalRecord[]>(
        `/api/pets/${petId}/medical-records`,
      )
      if (Array.isArray(response)) {
        medicalStore.setRecords(response)
      }
      else {
        medicalStore.setRecords(response.medical_records ?? [])
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      medicalStore.setLoading(false)
    }
  }

  /**
   * Fetch a single medical record by id and store it as selectedRecord.
   * Returns the record or null on failure.
   */
  async function fetchMedicalRecord(petId: string, recordId: string): Promise<MedicalRecord | null> {
    medicalStore.setLoading(true)
    error.value = null
    try {
      const record = await get<MedicalRecord>(
        `/api/pets/${petId}/medical-records/${recordId}`,
      )
      medicalStore.setSelectedRecord(record)
      return record
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      medicalStore.setLoading(false)
    }
  }

  /**
   * Create a new medical record and add it to the store.
   * Returns the created record or null on failure.
   */
  async function createMedicalRecord(
    petId: string,
    data: CreateMedicalRecordDTO,
  ): Promise<MedicalRecord | null> {
    medicalStore.setLoading(true)
    error.value = null
    try {
      const record = await post<MedicalRecord>(
        `/api/pets/${petId}/medical-records`,
        data,
      )
      medicalStore.addRecord(record)
      return record
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      medicalStore.setLoading(false)
    }
  }

  /**
   * Update a medical record and sync the store.
   * Returns the updated record or null on failure.
   */
  async function updateMedicalRecord(
    petId: string,
    recordId: string,
    data: UpdateMedicalRecordDTO,
  ): Promise<MedicalRecord | null> {
    medicalStore.setLoading(true)
    error.value = null
    try {
      const record = await put<MedicalRecord>(
        `/api/pets/${petId}/medical-records/${recordId}`,
        data,
      )
      medicalStore.updateRecord(record)
      return record
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      medicalStore.setLoading(false)
    }
  }

  /**
   * Delete a medical record and remove it from the store.
   * Returns true on success, false on failure.
   */
  async function deleteMedicalRecord(petId: string, recordId: string): Promise<boolean> {
    medicalStore.setLoading(true)
    error.value = null
    try {
      await del<void>(`/api/pets/${petId}/medical-records/${recordId}`)
      medicalStore.removeRecord(recordId)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
    finally {
      medicalStore.setLoading(false)
    }
  }

  /**
   * Export the pet's medical history as a PDF blob and trigger a browser download.
   * This is a client-only operation — always guarded by import.meta.client.
   *
   * @param petId - The pet's ID
   * @param petName - Optional pet name used to build the filename (e.g. "historial-luna.pdf")
   */
  async function exportPDF(petId: string, petName?: string): Promise<void> {
    if (!import.meta.client) return

    medicalStore.setLoading(true)
    error.value = null
    try {
      const config = useRuntimeConfig()
      const baseURL = (config.public.apiBase as string) ?? ''
      const token = authStore.token

      const response = await $fetch<Blob>(
        `${baseURL}/api/pets/${petId}/medical-records/export`,
        {
          method: 'GET',
          responseType: 'blob',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      )

      // Construct a safe filename from the pet name
      const safeName = petName
        ? petName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : petId
      const filename = `historial-medico-${safeName}.pdf`

      // Trigger download via a temporary anchor element
      const url = window.URL.createObjectURL(response)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)
      window.URL.revokeObjectURL(url)
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      medicalStore.setLoading(false)
    }
  }

  return {
    error,
    medicalStore,
    fetchMedicalHistory,
    fetchMedicalRecord,
    createMedicalRecord,
    updateMedicalRecord,
    deleteMedicalRecord,
    exportPDF,
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
