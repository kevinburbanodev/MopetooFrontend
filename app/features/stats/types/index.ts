// ============================================================
// Stats feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// RF-1100 to RF-1109
// ============================================================

// ── Overview (platform KPIs) ────────────────────────────────
// GET /api/admin/stats/overview → nested structure

export interface OverviewUsers {
  total: number
  active: number
  suspended: number
  new_in_period: number
  pro_active: number
  free: number
  conversion_rate_pct: number
}

export interface OverviewShelters {
  total: number
  active: number
  suspended: number
  verified: number
}

export interface OverviewStores {
  total: number
  active: number
  suspended: number
  featured: number
}

export interface OverviewClinics {
  total: number
  active: number
  suspended: number
  pro: number
}

export interface OverviewRevenue {
  total_accumulated: number
  in_period: number
  monthly_subscriptions: number
  annual_subscriptions: number
  arpu: number
}

export interface OverviewDonations {
  total_amount: number
  in_period: number
  platform_fees_accumulated: number
  net_to_shelters: number
  total_count: number
  unique_donors: number
  avg_donation: number
}

export interface OverviewContent {
  total_pets: number
  total_reminders: number
  total_medical_records: number
  active_adoption_listings: number
  adopted_in_period: number
  blog_posts_published: number
}

/** Aggregated platform KPIs. Matches GET /api/admin/stats/overview. */
export interface StatsOverview {
  generated_at: string
  period: { from: string; to: string }
  users: OverviewUsers
  shelters: OverviewShelters
  stores: OverviewStores
  clinics: OverviewClinics
  revenue_cop: OverviewRevenue
  donations_cop: OverviewDonations
  content: OverviewContent
}

// ── Revenue time series ─────────────────────────────────────
// GET /api/admin/stats/revenue

/** A single point in the revenue time series. */
export interface RevenueSeriesPoint {
  date: string     // "YYYY-MM-DD" format
  revenue: number  // COP amount
  count: number    // transaction count
}

/** Revenue breakdown by plan. */
export interface RevenueByPlan {
  [plan: string]: { revenue: number; count: number }
}

/** Full revenue stats response from the backend. */
export interface RevenueStats {
  generated_at: string
  period: { from: string; to: string }
  total_accumulated_cop: number
  in_period_cop: number
  by_plan: RevenueByPlan
  approved_transactions: number
  arpu: number
  series: RevenueSeriesPoint[]
}

/** Query filters for the revenue endpoint. */
export interface RevenueFilters {
  from?: string  // ISO-8601 date
  to?: string    // ISO-8601 date
}
