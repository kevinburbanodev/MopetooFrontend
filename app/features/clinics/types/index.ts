// ============================================================
// Clinics feature — domain types
// Aligned with Mopetoo backend API (Go + Gin) model.Clinic
// RF-900 to RF-909
// ============================================================

/**
 * model.Clinic — aligned with the Go backend.
 * Public endpoints: GET /clinics, GET /clinics/:id
 */
export interface Clinic {
  id: number
  name: string
  email: string
  phone: string
  address?: string
  city: string
  country: string
  description?: string
  specialties: string[]
  services: string[]
  schedules?: string
  cover_image_url?: string
  facebook_url?: string
  instagram_url?: string
  twitter_url?: string
  plan: string
  plan_expires_at?: string
  verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

/** Query parameters for the clinic directory endpoint */
export interface ClinicListFilters {
  city?: string
  specialty?: string
}

/** API response shape — backend returns plain Clinic[] array */
export interface ClinicListResponse {
  clinics: Clinic[]
  message?: string
}
