// ============================================================
// Petshops feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// RF-700 to RF-709
// ============================================================

export interface PetshopCategory {
  id: string
  name: string   // e.g. "Alimentos", "Accesorios", "Veterinaria"
  slug: string
}

export interface PetshopHours {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

export interface Petshop {
  id: string
  name: string
  description: string
  address: string
  city: string
  phone?: string
  email?: string
  website?: string
  photo_url?: string
  /** Category names, e.g. ["Alimentos", "Accesorios"] */
  categories: string[]
  hours?: PetshopHours
  is_verified: boolean
  /** PRO feature — featured stores appear first in the directory */
  is_featured: boolean
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
}

/** Query parameters for the petshop directory endpoint */
export interface PetshopListFilters {
  search?: string
  city?: string
  category?: string
}

/** API response envelope shape (backend may return either shape) */
export interface PetshopListResponse {
  stores: Petshop[]
  total: number
  page: number
  per_page: number
}
