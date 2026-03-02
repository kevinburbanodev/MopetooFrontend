// ============================================================
// Pro / Monetización feature — domain types
// Aligned with Mopetoo backend API (Go + Gin + PayU Latam)
// RF-800 to RF-809
// ============================================================

/** Plan identifiers sent to POST /api/users/{id}/subscribe. */
export type PlanValue = 'pro_monthly' | 'pro_annual'

/** Billing interval for display purposes. */
export type PlanInterval = 'monthly' | 'annual'

/** Hardcoded plan definition — no API endpoint for plans. */
export interface ProPlanDef {
  value: PlanValue
  name: string
  interval: PlanInterval
  price: number
  currency: string
  features: string[]
  is_popular?: boolean
}

/**
 * PRO plans constant — matches backend env vars (pro_monthly=15000, pro_annual=120000 COP).
 * Pattern: same as BLOG_CATEGORIES — no fetch needed, always available.
 */
export const PRO_PLANS: ProPlanDef[] = [
  {
    value: 'pro_monthly',
    name: 'PRO Mensual',
    interval: 'monthly',
    price: 15000,
    currency: 'COP',
    features: [
      'Mascotas ilimitadas',
      'Exportar perfil en PDF',
      'Recordatorios ilimitados',
      'Historial médico completo',
      'Soporte prioritario',
    ],
  },
  {
    value: 'pro_annual',
    name: 'PRO Anual',
    interval: 'annual',
    price: 120000,
    currency: 'COP',
    features: [
      'Mascotas ilimitadas',
      'Exportar perfil en PDF',
      'Recordatorios ilimitados',
      'Historial médico completo',
      'Soporte prioritario',
      '2 meses gratis',
    ],
    is_popular: true,
  },
]

/** GET /api/users/{id}/subscription response. */
export interface SubscriptionStatus {
  is_pro: boolean
  is_active: boolean
  subscription_plan: string
  subscription_expires_at?: string
  days_remaining: number
}

/** POST /api/users/{id}/subscribe response (PayU form redirect). */
export interface PayUCheckoutResponse {
  checkout_url: string
  form_params: Record<string, string>
  reference_code: string
}

/** POST /api/shelters/{id}/donate response (PayU form redirect). */
export interface DonationCheckoutResponse extends PayUCheckoutResponse {
  platform_fee: number
  shelter_amount: number
}

/** Body for POST /api/shelters/{id}/donate. */
export interface DonationRequest {
  amount: number
  currency?: string
  message?: string
}

/** Donation status values (backend). */
export type DonationStatus = 'pending' | 'approved' | 'declined' | 'error'

/** GET /api/donations/my item. */
export interface UserDonationItem {
  id: number
  shelter_id: number
  amount: number
  currency: string
  message?: string
  status: DonationStatus
  reference_code: string
  created_at: string
}
