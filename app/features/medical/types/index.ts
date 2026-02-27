// ============================================================
// Medical History feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// ============================================================

export interface MedicalRecord {
  id: string
  pet_id: string
  /** ISO date string, e.g. '2024-06-15' */
  date: string
  veterinarian: string
  diagnosis: string
  treatment: string
  notes?: string
  /** Weight in kg at the time of the visit */
  weight?: number
  /** ISO date string for the next scheduled visit */
  next_visit?: string
  created_at: string
  updated_at: string
}

export interface CreateMedicalRecordDTO {
  date: string
  veterinarian: string
  diagnosis: string
  treatment: string
  notes?: string
  weight?: number
  next_visit?: string
}

export type UpdateMedicalRecordDTO = Partial<CreateMedicalRecordDTO>
