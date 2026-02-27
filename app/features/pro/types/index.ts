// ============================================================
// Pro / Monetización feature — domain types
// Aligned with Mopetoo backend API (Go + Gin)
// RF-800 to RF-809
// ============================================================

/** Billing interval for a PRO plan. */
export type PlanInterval = 'monthly' | 'annual'

/** Current state of a user's PRO subscription. */
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'inactive'

/** Lifecycle state of a shelter donation. */
export type DonationStatus = 'pending' | 'completed' | 'failed'

export interface ProPlan {
  id: string
  name: string           // e.g. "PRO Mensual", "PRO Anual"
  interval: PlanInterval
  price: number          // display as-is (in COP or USD per backend)
  currency: string       // 'COP' | 'USD'
  features: string[]     // feature description strings
  is_popular?: boolean   // when true, show "Más popular" badge
}

export interface ProSubscription {
  id: string
  user_id: string
  plan_id: string
  /** Populated by the backend when it returns the plan inline. */
  plan?: ProPlan
  status: SubscriptionStatus
  current_period_start: string  // ISO 8601
  current_period_end: string    // ISO 8601
  /** When true, subscription ends at period end instead of renewing. */
  cancel_at_period_end: boolean
  created_at: string
}

/** Stripe-hosted checkout session returned after POST /api/pro/subscribe. */
export interface CheckoutSession {
  session_id: string
  checkout_url: string  // HTTPS URL to Stripe-hosted checkout
}

/** Body for POST /api/pro/subscribe. */
export interface SubscribeRequest {
  plan_id: string
  success_url: string
  cancel_url: string
}

/** Body for POST /api/shelters/:shelterId/donations. */
export interface DonationRequest {
  shelter_id: string
  /** Positive integer — units per backend convention (cents or full units). */
  amount: number
  message?: string
}

export interface DonationResponse {
  id: string
  shelter_id: string
  user_id: string
  amount: number
  message?: string
  status: DonationStatus
  created_at: string
}
