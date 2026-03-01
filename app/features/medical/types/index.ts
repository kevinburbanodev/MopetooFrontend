// ============================================================
// Medical History feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// ============================================================

export interface MedicalRecord {
  id: string
  pet_id: string
  date: string
  symptoms?: string
  diagnosis?: string
  treatment?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateMedicalRecordDTO {
  pet_id: number
  date: string
  symptoms?: string
  diagnosis?: string
  treatment?: string
  notes?: string
}

export type UpdateMedicalRecordDTO = Partial<Omit<CreateMedicalRecordDTO, 'pet_id'>>
