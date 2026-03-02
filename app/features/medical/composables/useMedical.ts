// ============================================================
// useMedical — Medical History feature composable
// Central API surface for all medical record CRUD operations.
// State is owned by useMedicalStore; this composable is the
// API layer that keeps the store in sync.
// ============================================================

import type { MedicalRecord, CreateMedicalRecordDTO, UpdateMedicalRecordDTO } from '../types'
import { extractErrorMessage } from '../../shared/utils/extractErrorMessage'

export function useMedical() {
  const { get, post, put, del } = useApi()
  const medicalStore = useMedicalStore()

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
        medicalStore.setRecords(normalizeRecords(response))
      }
      else {
        medicalStore.setRecords(normalizeRecords(response.medical_records ?? []))
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
  async function fetchMedicalRecord(recordId: string): Promise<MedicalRecord | null> {
    medicalStore.setLoading(true)
    error.value = null
    try {
      const record = await get<MedicalRecord>(
        `/api/medical-records/${recordId}`,
      )
      const normalized = normalizeRecord(record)
      medicalStore.setSelectedRecord(normalized)
      return normalized
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
        `/api/medical-records`,
        { ...data, pet_id: Number(petId) },
      )
      const normalized = normalizeRecord(record)
      medicalStore.addRecord(normalized)
      return normalized
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
    recordId: string,
    data: UpdateMedicalRecordDTO,
  ): Promise<MedicalRecord | null> {
    medicalStore.setLoading(true)
    error.value = null
    try {
      const record = await put<MedicalRecord>(
        `/api/medical-records/${recordId}`,
        data,
      )
      const normalized = normalizeRecord(record)
      // Preserve created_at from the existing record in the store
      // since the backend UpdateMedicalRecordResponse may not include it
      const existing = medicalStore.getRecordById(recordId)
      if (existing && !normalized.created_at) {
        normalized.created_at = existing.created_at
      }
      medicalStore.updateRecord(normalized)
      return normalized
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
  async function deleteMedicalRecord(recordId: string): Promise<boolean> {
    medicalStore.setLoading(true)
    error.value = null
    try {
      await del<void>(`/api/medical-records/${recordId}`)
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
   * Export the pet's profile (including medical history) as a PDF blob
   * and trigger a browser download.
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
      const { downloadPDF, slugify } = useExportPDF()
      const slug = petName ? slugify(petName) : petId
      await downloadPDF(`/api/pets/${petId}/export`, `historial-medico-${slug}.pdf`)
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

function normalizeRecord(record: MedicalRecord): MedicalRecord {
  return { ...record, id: String(record.id), pet_id: String(record.pet_id) }
}

function normalizeRecords(records: MedicalRecord[]): MedicalRecord[] {
  return records.map(normalizeRecord)
}

