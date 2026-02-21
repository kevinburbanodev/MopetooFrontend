// ============================================================
// useMedicalRecords — Medical feature composable
// ============================================================

import type { MedicalRecord, CreateMedicalRecordPayload, UpdateMedicalRecordPayload } from '../types'

export function useMedicalRecords() {
  const { get, post, put, del } = useApi()

  const records = ref<MedicalRecord[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRecordsByPet(petId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await get<{ medical_records: MedicalRecord[], message?: string }>(
        `/api/pets/${petId}/medical-records`,
      )
      records.value = response.medical_records ?? []
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      loading.value = false
    }
  }

  async function createRecord(payload: CreateMedicalRecordPayload): Promise<MedicalRecord | null> {
    loading.value = true
    error.value = null
    try {
      const record = await post<MedicalRecord>('/api/medical-records', payload)
      records.value.unshift(record) // Ordered DESC by date
      return record
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  async function updateRecord(id: number, payload: UpdateMedicalRecordPayload): Promise<MedicalRecord | null> {
    loading.value = true
    error.value = null
    try {
      const record = await put<MedicalRecord>(`/api/medical-records/${id}`, payload)
      const idx = records.value.findIndex(r => r.id === id)
      if (idx !== -1) records.value[idx] = record
      return record
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  async function deleteRecord(id: number): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await del<void>(`/api/medical-records/${id}`)
      records.value = records.value.filter(r => r.id !== id)
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
    records,
    loading,
    error,
    fetchRecordsByPet,
    createRecord,
    updateRecord,
    deleteRecord,
  }
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
