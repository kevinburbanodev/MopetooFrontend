// ============================================================
// Admin feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// RF-1000 to RF-1009
// ============================================================

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
  is_active: boolean
  pets_count: number
  created_at: string
  updated_at: string
}

export interface AdminUserFilters {
  search?: string
  plan?: string
  active?: boolean
  country?: string
  page?: number
  limit?: number
}

export interface AdminUsersResponse {
  users: AdminUser[]
  total: number
  page: number
  limit: number
}

// ── Shelters ───────────────────────────────────────────────

/** Admin view of a shelter entity. */
export interface AdminShelter {
  id: number
  name: string
  city: string
  country?: string
  email?: string
  phone?: string
  is_verified: boolean
  is_active: boolean
  pets_count: number
  created_at: string
}

export interface AdminSheltersResponse {
  shelters: AdminShelter[]
  total: number
  page: number
  limit: number
}

// ── Petshops ───────────────────────────────────────────────

/** Admin view of a petshop / pet-friendly store entity. */
export interface AdminPetshop {
  id: number
  name: string
  city: string
  email?: string
  phone?: string
  is_active: boolean
  plan: 'free' | 'featured'
  created_at: string
}

export interface AdminPetshopsResponse {
  stores: AdminPetshop[]
  total: number
  page: number
  limit: number
}

// ── Clinics ────────────────────────────────────────────────

/** Admin view of a veterinary clinic entity. */
export interface AdminClinic {
  id: number
  name: string
  city: string
  email?: string
  phone?: string
  is_verified: boolean
  is_active: boolean
  plan: 'free' | 'pro'
  specialties?: string[]
  created_at: string
}

export interface AdminClinicsResponse {
  clinics: AdminClinic[]
  total: number
  page: number
  limit: number
}

// ── Transactions ───────────────────────────────────────────

export type TransactionStatus = 'pending' | 'approved' | 'declined' | 'error'

/** Subscription transaction record. */
export interface AdminTransaction {
  id: number
  user_id: number
  plan: string
  amount_cop: number
  status: TransactionStatus
  reference: string
  created_at: string
}

export interface AdminTransactionFilters {
  user_id?: number
  plan?: string
  status?: TransactionStatus
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface AdminTransactionsResponse {
  transactions: AdminTransaction[]
  total: number
  page: number
  limit: number
}

// ── Donations ──────────────────────────────────────────────

/** Donation record (separate from subscription transactions). */
export interface AdminDonation {
  id: number
  user_id: number
  shelter_id: number
  amount_cop: number
  status: TransactionStatus
  reference: string
  created_at: string
}

export interface AdminDonationFilters {
  user_id?: number
  shelter_id?: number
  status?: TransactionStatus
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface AdminDonationsResponse {
  donations: AdminDonation[]
  total: number
  page: number
  limit: number
}

// ── Shared filter type ─────────────────────────────────────

/** Generic pagination + search filters for admin list endpoints. */
export interface AdminFilters {
  search?: string
  page?: number
  limit?: number
}
