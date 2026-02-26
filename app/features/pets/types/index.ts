// ============================================================
// Pets feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// ============================================================

export interface Pet {
  id: string
  user_id: string
  name: string
  /** Backend enum values: 'dog' | 'cat' | 'bird' | 'rabbit' | 'other' */
  species: string
  breed: string
  /** ISO date string, e.g. '2020-03-15' */
  birth_date: string
  /** 'male' | 'female' */
  gender: string
  weight?: number
  color?: string
  microchip?: string
  photo_url?: string
  notes?: string
  veterinarian_id?: string
  created_at: string
  updated_at: string
}

export interface CreatePetDTO {
  name: string
  species: string
  breed: string
  birth_date: string
  gender: string
  weight?: number
  color?: string
  microchip?: string
  notes?: string
  veterinarian_id?: string
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
  photo?: File
}
