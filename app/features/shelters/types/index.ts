// ============================================================
// Shelters & Adoptions feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// RF-500 to RF-509
// ============================================================

export interface Shelter {
  id: string
  name: string
  description: string
  /** Full address string (may duplicate city + address fields) */
  location: string
  city: string
  address: string
  phone: string
  email: string
  website?: string
  photo_url?: string
  /** Species the shelter accepts, e.g. ['dogs', 'cats', 'birds'] */
  species: string[]
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface AdoptionPet {
  id: string
  shelter_id: string
  name: string
  species: string
  breed?: string
  /** Age expressed in months — convert to years/months for display */
  age_months?: number
  gender: 'male' | 'female' | 'unknown'
  size: 'small' | 'medium' | 'large'
  description?: string
  photo_url?: string
  status: 'available' | 'pending' | 'adopted'
  vaccinated: boolean
  neutered: boolean
  created_at: string
  updated_at: string
}

export interface AdoptionRequest {
  id: string
  pet_id: string
  user_id: string
  shelter_id: string
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

/** Query parameters for the shelter directory endpoint */
export interface ShelterFilters {
  city?: string
  species?: string
  search?: string
}

/** Query parameters for listing adoption pets in a shelter */
export interface AdoptionPetFilters {
  species?: string
  gender?: string
  size?: string
  status?: string
}
