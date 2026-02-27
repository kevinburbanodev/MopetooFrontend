// ============================================================
// Admin feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// RF-1000 to RF-1009
// ============================================================

// ── KPI stats ──────────────────────────────────────────────

/** Aggregated platform statistics shown on the admin dashboard. */
export interface AdminStats {
  total_users: number
  total_pets: number
  total_shelters: number
  total_clinics: number
  total_stores: number
  total_adoptions: number
  total_pro_subscriptions: number
  total_donations: number
  revenue_total: number
  revenue_month: number
}

// ── Users ──────────────────────────────────────────────────

/** Admin view of a registered user. */
export interface AdminUser {
  id: number
  name: string
  last_name: string
  email: string
  country: string
  city: string
  phone?: string
  profile_picture_url?: string
  is_pro: boolean
  is_admin: boolean
  pets_count: number
  created_at: string
  updated_at: string
}

export interface AdminUserFilters {
  search?: string
  is_pro?: boolean
  is_admin?: boolean
  page?: number
  per_page?: number
}

export interface AdminUsersResponse {
  users: AdminUser[]
  total: number
  page: number
  per_page: number
}

// ── Shelters ───────────────────────────────────────────────

/** Admin view of a shelter entity. */
export interface AdminShelter {
  id: string
  name: string
  city: string
  email?: string
  phone?: string
  is_verified: boolean
  is_featured: boolean
  pets_count: number
  created_at: string
}

export interface AdminSheltersResponse {
  shelters: AdminShelter[]
  total: number
  page: number
  per_page: number
}

// ── Petshops ───────────────────────────────────────────────

/** Admin view of a petshop / pet-friendly store entity. */
export interface AdminPetshop {
  id: string
  name: string
  city: string
  email?: string
  phone?: string
  is_verified: boolean
  is_featured: boolean
  created_at: string
}

export interface AdminPetshopsResponse {
  stores: AdminPetshop[]
  total: number
  page: number
  per_page: number
}

// ── Clinics ────────────────────────────────────────────────

/** Admin view of a veterinary clinic entity. */
export interface AdminClinic {
  id: string
  name: string
  city: string
  email?: string
  phone?: string
  is_verified: boolean
  is_featured: boolean
  specialties: string[]
  created_at: string
}

export interface AdminClinicsResponse {
  clinics: AdminClinic[]
  total: number
  page: number
  per_page: number
}

// ── Transactions ───────────────────────────────────────────

export type TransactionType = 'subscription' | 'donation'
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'refunded'

/** Financial transaction record (subscription payment or donation). */
export interface AdminTransaction {
  id: string
  user_id: number
  user_name: string
  user_email: string
  type: TransactionType
  amount: number
  currency: string
  status: TransactionStatus
  description: string
  created_at: string
}

export interface AdminTransactionsResponse {
  transactions: AdminTransaction[]
  total: number
  page: number
  per_page: number
}

// ── Shared filter type ─────────────────────────────────────

/** Generic pagination + search filters for admin list endpoints. */
export interface AdminFilters {
  search?: string
  page?: number
  per_page?: number
}
