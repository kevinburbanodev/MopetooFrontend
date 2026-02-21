// ============================================================
// Medical feature — domain types
// ============================================================

export interface MedicalRecord {
  id: number
  pet_id: number
  date: string
  symptoms?: string
  diagnosis?: string
  treatment?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateMedicalRecordPayload {
  pet_id: number
  date: string
  symptoms?: string
  diagnosis?: string
  treatment?: string
  notes?: string
}

export interface UpdateMedicalRecordPayload {
  date?: string
  symptoms?: string
  diagnosis?: string
  treatment?: string
  notes?: string
}
