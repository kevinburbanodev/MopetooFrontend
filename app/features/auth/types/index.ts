// ============================================================
// Auth feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// ============================================================

export interface User {
  id: number
  name: string
  last_name: string
  email: string
  country: string
  city: string
  phone_country_code: string
  phone: string
  profile_picture_url?: string
  birth_date?: string
  is_pro: boolean
  created_at: string
  updated_at: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface RegisterPayload {
  name: string
  last_name: string
  email: string
  password: string
  country: string
  city: string
  phone_country_code: string
  phone: string
  birth_date?: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}
