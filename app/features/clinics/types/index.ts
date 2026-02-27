// ============================================================
// Clinics feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// RF-900 to RF-909
// ============================================================

export interface ClinicSpecialty {
  id: string
  name: string   // e.g. "Cirugía", "Dermatología", "Cardiología"
  slug: string
}

export interface ClinicHours {
  monday?: string
  tuesday?: string
  wednesday?: string
  thursday?: string
  friday?: string
  saturday?: string
  sunday?: string
}

export interface Clinic {
  id: string
  name: string
  description: string
  address: string
  city: string
  phone?: string
  email?: string
  website?: string
  photo_url?: string
  /** Specialty names, e.g. ["Cirugía", "Dermatología"] */
  specialties: string[]
  hours?: ClinicHours
  is_verified: boolean
  /** PRO feature — featured clinics appear first in the directory */
  is_featured: boolean
  latitude?: number
  longitude?: number
  created_at: string
  updated_at: string
}

/** Query parameters for the clinic directory endpoint */
export interface ClinicListFilters {
  search?: string
  city?: string
  specialty?: string
}

/** API response envelope shape (backend may return either shape) */
export interface ClinicListResponse {
  clinics: Clinic[]
  total: number
  page: number
  per_page: number
}
