// ============================================================
// Shared API types — used across all feature slices
// ============================================================

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface ApiError {
  error: string
  statusCode: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// ── Location types (countries & cities catalog) ──────────────

export interface Country {
  id: number
  name: string
  code: string
  phone_code: string
}

export interface City {
  id: number
  country_id: number
  name: string
}
