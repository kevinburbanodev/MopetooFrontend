// ============================================================
// Auth feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// ============================================================

import type { Country, City } from '../../shared/types/api.types'

// ── Entity type discriminator ──────────────────────────────
export type EntityType = 'user' | 'shelter' | 'store' | 'clinic'

// ── Regular user ───────────────────────────────────────────
export interface User {
  id: number
  name: string
  last_name: string
  email: string
  country_id: number
  country?: Country
  city_id: number
  city?: City
  phone: string
  profile_picture_url?: string
  birth_date?: string
  is_pro: boolean
  is_admin: boolean
  created_at: string
  updated_at: string
}

// ── Shelter (Refugio) ──────────────────────────────────────
export interface AuthShelter {
  id: number
  organization_name: string
  email: string
  description: string
  country_id: number
  country?: Country
  city_id: number
  city?: City
  phone: string
  logo_url?: string
  website?: string
  verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Store (Tienda pet-friendly) ────────────────────────────
export interface AuthStore {
  id: number
  name: string
  email: string
  description?: string
  logo_url?: string
  country_id: number
  country?: Country
  city_id: number
  city?: City
  phone: string
  whatsapp_link?: string
  website?: string
  verified: boolean
  is_active: boolean
  plan: string
  created_at: string
  updated_at: string
}

// ── Clinic (Clínica veterinaria) ───────────────────────────
export interface AuthClinic {
  id: number
  name: string
  email: string
  phone: string
  address?: string
  country_id: number
  country?: Country
  city_id: number
  city?: City
  description?: string
  specialties: string[]
  services: string[]
  schedules?: string
  cover_image_url?: string
  plan: string
  plan_expires_at?: string
  verified: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

// ── Union type for the current authenticated entity ────────
export type AuthEntity = User | AuthShelter | AuthStore | AuthClinic

// ── Login payloads & responses ─────────────────────────────
export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface ShelterLoginResponse {
  token: string
  shelter: AuthShelter
}

export interface StoreLoginResponse {
  token: string
  store: AuthStore
}

export interface ClinicLoginResponse {
  token: string
  clinic: AuthClinic
}

// ── Registration payloads ──────────────────────────────────
export interface RegisterPayload {
  name: string
  last_name: string
  email: string
  password: string
  country_id: number
  city_id: number
  phone: string
  birth_date?: string
}

export interface RegisterShelterPayload {
  organization_name: string
  email: string
  password: string
  description: string
  country_id: number
  city_id: number
  phone: string
}

export interface RegisterStorePayload {
  name: string
  email: string
  password: string
  description: string
  country_id: number
  city_id: number
  phone: string
}

export interface RegisterClinicPayload {
  name: string
  email: string
  password: string
  phone: string
  address: string
  country_id: number
  city_id: number
  description: string
}

// ── Profile update ─────────────────────────────────────────
// Used for PATCH /api/{entity-type}/:id — all fields optional
export interface UpdateProfileDTO {
  name?: string
  last_name?: string
  email?: string
  country_id?: number
  city_id?: number
  phone?: string
  birth_date?: string
  current_password?: string
  new_password?: string
}

// ── Email verification ───────────────────────────────────
export interface VerifyEmailPayload {
  email: string
  code: string
  entity_type: EntityType
}

export interface ResendVerificationPayload {
  email: string
  entity_type: EntityType
}

// ── Password recovery ──────────────────────────────────────
export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
}

// ── JWT payload (for client-side decoding) ─────────────────
export interface JwtPayload {
  user_id: number
  email: string
  entity_type: EntityType
  is_admin: boolean
  exp: number
  iat: number
}
