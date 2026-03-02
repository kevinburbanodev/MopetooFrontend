// ============================================================
// usePro — Pro / Monetización feature composable
// Central API surface for PRO subscriptions and shelter donations.
// Plans are hardcoded constants (PRO_PLANS) — no fetch needed.
// State is owned by useProStore; this composable is the API
// layer that keeps the store in sync.
//
// Payment flow: PayU Latam form-based redirect.
// The backend returns checkout_url + form_params → we create a
// hidden <form> and submit it to PayU.
// ============================================================

import type {
  PlanValue,
  SubscriptionStatus,
  PayUCheckoutResponse,
  DonationCheckoutResponse,
  DonationRequest,
} from '../types'
import { extractErrorMessage } from '../../shared/utils/extractErrorMessage'

export function usePro() {
  const { get, post } = useApi()
  const proStore = useProStore()
  const authStore = useAuthStore()

  const error = ref<string | null>(null)

  // ── Subscription ────────────────────────────────────────────

  /**
   * Fetch the current user's PRO subscription status.
   * Guard: requires userId from authStore.currentEntity.
   * On 404 (no subscription), sets subscription to null — normal state.
   */
  async function fetchSubscription(): Promise<void> {
    const userId = authStore.currentEntity?.id
    if (!userId) return

    proStore.setLoading(true)
    error.value = null
    try {
      const sub = await get<SubscriptionStatus>(`/api/users/${userId}/subscription`)
      proStore.setSubscription(sub)
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

  // ── Subscribe (PayU checkout) ─────────────────────────────

  /**
   * Start a PRO subscription checkout via PayU.
   *
   * SSR guard: this function creates a DOM form — must only run client-side.
   *
   * Security: validates that checkout_url uses HTTPS before redirect.
   *
   * Returns the PayUCheckoutResponse on success, null on failure.
   */
  async function subscribe(plan: PlanValue): Promise<PayUCheckoutResponse | null> {
    if (!import.meta.client) return null

    const userId = authStore.currentEntity?.id
    if (!userId) {
      error.value = 'Debes iniciar sesión para suscribirte.'
      return null
    }

    proStore.setLoading(true)
    error.value = null
    try {
      const response = await post<PayUCheckoutResponse>(
        `/api/users/${userId}/subscribe`,
        { plan },
      )

      // Security guard: only redirect to verified HTTPS URLs.
      let isHttps = false
      try {
        isHttps = new URL(response.checkout_url).protocol === 'https:'
      }
      catch {
        isHttps = false
      }

      if (!isHttps) {
        error.value = 'La URL de pago no es válida. Contacta con soporte.'
        return null
      }

      submitPayUForm(response.checkout_url, response.form_params)
      return response
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      proStore.setLoading(false)
    }
  }

  // ── Donations (PayU checkout) ─────────────────────────────

  /**
   * Submit a monetary donation to a shelter via PayU.
   *
   * Security: shelter_id is validated against a safe pattern before
   * interpolation into the API path to prevent path traversal.
   *
   * Returns DonationCheckoutResponse on success, null on failure.
   */
  async function donate(
    shelterId: number,
    data: DonationRequest,
  ): Promise<DonationCheckoutResponse | null> {
    error.value = null

    // Guard: shelterId must be a positive integer.
    if (typeof shelterId !== 'number' || shelterId <= 0 || !Number.isInteger(shelterId)) {
      error.value = 'ID de refugio no válido.'
      return null
    }

    try {
      const response = await post<DonationCheckoutResponse>(
        `/api/shelters/${shelterId}/donate`,
        {
          amount: data.amount,
          ...(data.currency ? { currency: data.currency } : {}),
          ...(data.message ? { message: data.message } : {}),
        },
      )

      // Redirect to PayU checkout if running client-side
      if (import.meta.client) {
        submitPayUForm(response.checkout_url, response.form_params)
      }

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
    fetchSubscription,
    subscribe,
    donate,
  }
}

// ── Helpers ─────────────────────────────────────────────────

/**
 * PayU form-based redirect.
 * Creates a hidden <form> with method=POST action=checkoutUrl,
 * adds <input type="hidden"> for each form_params entry,
 * appends to body and submits. Standard PayU Latam integration pattern.
 */
function submitPayUForm(checkoutUrl: string, formParams: Record<string, string>): void {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = checkoutUrl
  form.style.display = 'none'

  for (const [name, value] of Object.entries(formParams)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
}
