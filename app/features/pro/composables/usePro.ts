// ============================================================
// usePro — Pro / Monetización feature composable
// Central API surface for PRO subscriptions, plan catalogue,
// checkout sessions, and shelter donations.
// State is owned by useProStore; this composable is the API
// layer that keeps the store in sync.
// ============================================================

import type {
  ProPlan,
  CheckoutSession,
  DonationRequest,
  DonationResponse,
} from '../types'

export function usePro() {
  const { get, post, del } = useApi()
  const proStore = useProStore()
  const authStore = useAuthStore()

  const error = ref<string | null>(null)

  // ── Plan catalogue ──────────────────────────────────────────

  /**
   * Fetch all available PRO plans from the catalogue.
   * Handles both `{ plans: ProPlan[] }` envelope and plain `ProPlan[]` shapes.
   * Sets the store plans array on success.
   */
  async function fetchPlans(): Promise<void> {
    proStore.setLoading(true)
    error.value = null
    try {
      const response = await get<{ plans: ProPlan[] } | ProPlan[]>('/api/pro/plans')
      if (Array.isArray(response)) {
        proStore.setPlans(response)
      }
      else {
        proStore.setPlans(response.plans ?? [])
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      proStore.setLoading(false)
    }
  }

  // ── Subscription ────────────────────────────────────────────

  /**
   * Fetch the current user's PRO subscription.
   * On 404 (no active subscription), sets subscription to null — this is
   * a normal state for non-PRO users, not an error condition.
   */
  async function fetchSubscription(): Promise<void> {
    proStore.setLoading(true)
    error.value = null
    try {
      const sub = await get('/api/pro/subscription')
      proStore.setSubscription(sub as Parameters<typeof proStore.setSubscription>[0])
    }
    catch (err: unknown) {
      // 404 = user has no subscription — not an error to surface to the UI
      const status = (err as { status?: number; statusCode?: number })?.status
        ?? (err as { status?: number; statusCode?: number })?.statusCode
      if (status === 404) {
        proStore.setSubscription(null)
      }
      else {
        error.value = extractErrorMessage(err)
      }
    }
    finally {
      proStore.setLoading(false)
    }
  }

  // ── Checkout ────────────────────────────────────────────────

  /**
   * Create a Stripe Checkout session and redirect the user.
   *
   * SSR guard: this function accesses `window.location.origin` which is only
   * available on the client. Call it from user interactions (click handlers),
   * never on the server.
   *
   * Security: validates that the returned checkout_url uses HTTPS before
   * calling navigateTo — prevents open redirect to non-HTTPS URLs.
   *
   * Returns the CheckoutSession on success, null on failure.
   * Caller may inspect `error.value` for a user-facing message.
   */
  async function createCheckoutSession(planId: string): Promise<CheckoutSession | null> {
    // This function requires browser APIs — must not run server-side.
    if (!import.meta.client) return null

    proStore.setLoading(true)
    error.value = null
    try {
      const origin = window.location.origin
      const session = await post<CheckoutSession>('/api/pro/subscribe', {
        plan_id: planId,
        success_url: `${origin}/dashboard/subscription?checkout=success`,
        cancel_url: `${origin}/pricing?checkout=canceled`,
      })

      // Security guard: only redirect to verified HTTPS URLs.
      // Prevents open-redirect exploitation if the backend is compromised.
      let isHttps = false
      try {
        isHttps = new URL(session.checkout_url).protocol === 'https:'
      }
      catch {
        isHttps = false
      }

      if (!isHttps) {
        error.value = 'La URL de pago no es válida. Contacta con soporte.'
        return null
      }

      await navigateTo(session.checkout_url, { external: true })
      return session
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      proStore.setLoading(false)
    }
  }

  // ── Cancellation ────────────────────────────────────────────

  /**
   * Cancel the active subscription at the end of the billing period.
   * Updates the store subscription with cancel_at_period_end: true so the
   * UI can show the "cancelación programada" notice without a re-fetch.
   */
  async function cancelSubscription(): Promise<boolean> {
    proStore.setLoading(true)
    error.value = null
    try {
      await del('/api/pro/subscription')
      // Reflect cancellation in the store immediately
      if (proStore.subscription) {
        proStore.setSubscription({
          ...proStore.subscription,
          cancel_at_period_end: true,
        })
      }
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
    finally {
      proStore.setLoading(false)
    }
  }

  // ── Donations ───────────────────────────────────────────────

  /**
   * Submit a monetary donation to a shelter.
   * Does not mutate the pro store — donation state is owned by the
   * calling component.
   * Returns DonationResponse on success, null on failure.
   *
   * Security: shelter_id is validated against a safe UUID/alphanumeric
   * pattern before interpolation into the API path to prevent path
   * traversal (e.g. shelter_id = "../admin" or "%2F..%2F").
   */
  async function donate(data: DonationRequest): Promise<DonationResponse | null> {
    error.value = null

    // Guard: shelter_id must be a UUID or alphanumeric slug — no path separators.
    const SHELTER_ID_RE = /^[\w-]{1,64}$/
    if (!SHELTER_ID_RE.test(data.shelter_id)) {
      error.value = 'ID de refugio no válido.'
      return null
    }

    try {
      const response = await post<DonationResponse>(
        `/api/shelters/${data.shelter_id}/donations`,
        {
          amount: data.amount,
          ...(data.message ? { message: data.message } : {}),
        },
      )
      return response
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
  }

  return {
    error,
    proStore,
    authStore,
    fetchPlans,
    fetchSubscription,
    createCheckoutSession,
    cancelSubscription,
    donate,
  }
}

// ── Helpers ─────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    if ('data' in err) {
      const data = (err as { data: unknown }).data
      if (typeof data === 'object' && data !== null && 'error' in data) {
        return String((data as { error: unknown }).error)
      }
      if (typeof data === 'string' && data.length > 0) return data
    }
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message
    }
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
