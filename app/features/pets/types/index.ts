// ============================================================
// Pets feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
//
// Backend model fields:
//   id (uint), user_id (uint), name, species, breed (*string),
//   age (*int, years), weight (*float64), gender (*string),
//   photo_url (string), notes (*string), created_at, updated_at
// ============================================================

export interface Pet {
  id: string
  user_id: string
  name: string
  /** Backend enum values: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other' */
  species: string
  breed: string
  /** Approximate age in years (backend stores as *int) */
  age?: number
  /** 'male' | 'female' */
  gender: string
  weight?: number
  photo_url?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreatePetDTO {
  name: string
  species: string
  breed: string
  gender: string
  age?: number
  weight?: number
  notes?: string
}

export type UpdatePetDTO = Partial<CreatePetDTO>

export interface PetsState {
  pets: Pet[]
  selectedPet: Pet | null
  isLoading: boolean
}

/** Payload emitted by PetForm on submit */
export interface PetFormSubmitPayload {
  data: CreatePetDTO
  photo: File
}
