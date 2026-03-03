// ============================================================
// Shelters & Adoptions feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// RF-500 to RF-509
//
// Backend endpoints:
//   GET  /shelters                          → public directory
//   GET  /shelters/:id                      → public detail
//   GET  /adoption-listings                 → public (with shelter embedded)
//   GET  /adoption-listings/:id             → public (with shelter embedded)
//   POST /api/adoption-listings/:id/requests → protected
// ============================================================

import type { Country, City } from '../../shared/types/api.types'

/** Full shelter model — matches backend Shelter struct */
export interface Shelter {
  id: number
  organization_name: string
  email: string
  description?: string
  country_id: number
  country?: Country
  city_id: number
  city?: City
  phone: string
  address?: string
  logo_url?: string
  website?: string
  verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Lightweight shelter summary embedded in adoption listings */
export interface ShelterInfo {
  id: number
  name: string
  city_id?: number
  email?: string
  phone?: string
}

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
  country_id?: number
  city_id?: number
  status: 'available' | 'pending' | 'adopted'
  shelter?: ShelterInfo
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
