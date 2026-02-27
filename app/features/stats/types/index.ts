// ============================================================
// Stats feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// RF-1100 to RF-1109
// ============================================================

// ── Overview (platform KPIs) ────────────────────────────────

/** Aggregated platform KPI statistics. Matches GET /api/admin/stats. */
export interface StatsOverview {
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

/** Dual API shape — backend may return envelope or direct object. */
export interface StatsOverviewResponse {
  stats?: StatsOverview
  [key: string]: unknown
}

// ── Revenue time series ─────────────────────────────────────

/** Revenue data for a single calendar month. */
export interface RevenueDataPoint {
  month: string          // "YYYY-MM" format, e.g. "2025-01"
  subscriptions: number  // COP — revenue from PRO subscriptions
  donations: number      // COP — revenue from shelter donations
  total: number          // subscriptions + donations
}

/** Dual API shape for the revenue endpoint. */
export interface RevenueStatsResponse {
  data?: RevenueDataPoint[]
  [key: string]: unknown
}

/** Query filters for the revenue time-series endpoint. */
export interface RevenueFilters {
  months?: number  // Number of past months to include (default: 6)
}

// ── Activity log ────────────────────────────────────────────

/** All possible activity event types tracked by the platform. */
export type ActivityType =
  | 'user_registered'
  | 'pet_created'
  | 'adoption_requested'
  | 'subscription_created'
  | 'donation_made'

/** A single platform activity entry. */
export interface ActivityEntry {
  id: string | number
  type: ActivityType
  description: string
  user_email?: string
  created_at: string
}

/** Dual API shape for the activity log endpoint. */
export interface ActivityLogResponse {
  activities?: ActivityEntry[]
  total?: number
  [key: string]: unknown
}
