// ============================================================
// Pet public profile — domain types
// Aligned with backend GET /pets/public/:slug response
// ============================================================

export interface PetPhoto {
  id: number
  pet_id: number
  photo_url: string
  is_primary: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Pet {
  id: number
  user_id: number
  name: string
  species: string
  breed?: string | null
  birth_date?: string | null
  weight?: number | null
  gender?: string | null
  photo_url: string
  notes?: string | null
  public_profile_enabled: boolean
  public_profile_slug?: string | null
  public_contact_message?: string | null
  created_at: string
  updated_at: string
}

export interface PublicPetProfile {
  pet: Pet
  photos: PetPhoto[]
}
