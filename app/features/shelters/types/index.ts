// ============================================================
// Shelters & Adoptions feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// RF-500 to RF-509
//
// Backend model: flat "Adoption Listings" — no public shelter
// directory endpoints. All data comes from:
//   GET  /api/adoption-listings
//   GET  /api/adoption-listings/:id
//   POST /api/adoption-listings/:id/requests
// ============================================================

export interface AdoptionListing {
  id: number
  shelter_id: number
  name: string
  species: string
  breed: string
  age?: number
  weight?: number
  gender: string
  photo_url: string
  story?: string
  city: string
  country: string
  status: 'available' | 'pending' | 'adopted'
  created_at: string
  updated_at: string
}

export interface AdoptionRequest {
  id: number
  adoption_listing_id: number
  user_id: number
  message: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}
