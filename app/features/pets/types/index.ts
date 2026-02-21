// ============================================================
// Pets feature — domain types
// Aligned with Mopetoo backend API
// ============================================================

export interface Pet {
  id: number
  user_id: number
  name: string
  species: string
  breed?: string
  age?: number
  weight?: number
  gender?: string
  photo_url: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreatePetPayload {
  name: string
  species: string
  breed?: string
  age?: number
  weight?: number
  gender?: string
  notes?: string
  photo: File
}

export interface UpdatePetPayload {
  name?: string
  species?: string
  breed?: string
  age?: number
  weight?: number
  gender?: string
  notes?: string
  photo?: File
}
