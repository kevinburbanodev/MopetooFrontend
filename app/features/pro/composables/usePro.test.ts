// ============================================================
// usePro.test.ts
// Tests the usePro composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT the right tool.
//   - useAuthStore provides currentEntity.id for user-specific endpoints.
//   - HTMLFormElement.prototype.submit is mocked to verify PayU form
//     redirect without actually navigating.
//   - document.createElement is spied on to verify form construction.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false).
//
// Key design changes from Stripe version:
//   - No fetchPlans() — plans are constants.
//   - No cancelSubscription() — no backend endpoint.
//   - fetchSubscription → GET /api/users/{userId}/subscription
//   - subscribe(plan) → POST /api/users/{userId}/subscribe (PayU form redirect)
//   - donate(shelterId, data) → POST /api/shelters/{id}/donate (PayU form redirect)
//
// What this suite does NOT cover intentionally:
//   - SSR guard branch (import.meta.client === false) — compile-time constant.
//   - PayU webhook confirmation — server-side only.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { SubscriptionStatus, PayUCheckoutResponse, DonationCheckoutResponse } from '../types'

// ── Nuxt auto-import mocks ───────────────────────────────────

mockNuxtImport('useRouter', () => () => ({
  push: vi.fn(),
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  beforeEach: vi.fn(() => vi.fn()),
  afterEach: vi.fn(() => vi.fn()),
  beforeResolve: vi.fn(() => vi.fn()),
  onError: vi.fn(() => vi.fn()),
  resolve: vi.fn(),
  addRoute: vi.fn(),
  removeRoute: vi.fn(),
  hasRoute: vi.fn(),
  getRoutes: vi.fn(() => []),
  currentRoute: { value: { path: '/', params: {}, query: {}, hash: '' } },
  options: {},
}))

// ── useApi mock ──────────────────────────────────────────────

const mockGet = vi.fn()
const mockPost = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet, post: mockPost }),
}))

// ── form.submit mock ─────────────────────────────────────────
// submitPayUForm creates a hidden <form> and calls form.submit().
// We mock submit to prevent actual navigation.
const mockFormSubmit = vi.fn()

// ── Fixtures ─────────────────────────────────────────────────

const mockSubscription: SubscriptionStatus = {
  is_pro: true,
  is_active: true,
  subscription_plan: 'pro_monthly',
  subscription_expires_at: '2026-02-01T00:00:00Z',
  days_remaining: 30,
}

const mockPayUResponse: PayUCheckoutResponse = {
  checkout_url: 'https://checkout.payulatam.com/ppp-web-gateway-payu/',
  form_params: {
    merchantId: '123456',
    referenceCode: 'ref-001',
    amount: '15000',
    currency: 'COP',
    signature: 'abc123',
  },
  reference_code: 'ref-001',
}

const mockDonationResponse: DonationCheckoutResponse = {
  checkout_url: 'https://checkout.payulatam.com/ppp-web-gateway-payu/',
  form_params: {
    merchantId: '123456',
    referenceCode: 'don-001',
    amount: '25000',
    currency: 'COP',
    signature: 'xyz789',
  },
  reference_code: 'don-001',
  platform_fee: 2500,
  shelter_amount: 22500,
}

// ── Suite ─────────────────────────────────────────────────────

describe('usePro', () => {
  let proStore: ReturnType<typeof import('../stores/pro.store').useProStore>

  beforeEach(async () => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )
    const { useProStore } = await import('../stores/pro.store')
    proStore = useProStore()

    // Set up auth store with a user so userId guard passes
    const { useAuthStore } = await import('../../auth/stores/auth.store')
    const authStore = useAuthStore()
    authStore.currentEntity = { id: 42, email: 'test@test.com', is_pro: false } as any
    authStore.entityType = 'user'

    mockGet.mockReset()
    mockPost.mockReset()
    mockFormSubmit.mockReset()

    // Mock form.submit — submitPayUForm appends a form to document.body and calls submit()
    vi.spyOn(HTMLFormElement.prototype, 'submit').mockImplementation(mockFormSubmit)
  })

  // ── fetchSubscription ──────────────────────────────────────

  describe('fetchSubscription()', () => {
    it('calls GET /api/users/{userId}/subscription', async () => {
      mockGet.mockResolvedValueOnce(mockSubscription)
      const { usePro } = await import('./usePro')
      const { fetchSubscription } = usePro()

      await fetchSubscription()

      expect(mockGet).toHaveBeenCalledWith('/api/users/42/subscription')
    })

    it('sets subscription in the store on success', async () => {
      mockGet.mockResolvedValueOnce(mockSubscription)
      const setSubscription = vi.spyOn(proStore, 'setSubscription')
      const { usePro } = await import('./usePro')
      const { fetchSubscription } = usePro()

      await fetchSubscription()

      expect(setSubscription).toHaveBeenCalledWith(mockSubscription)
    })

    it('sets subscription to null on 404 error (user has no subscription)', async () => {
      mockGet.mockRejectedValueOnce({ status: 404, message: 'Not Found' })
      const setSubscription = vi.spyOn(proStore, 'setSubscription')
      const { usePro } = await import('./usePro')
      const { fetchSubscription } = usePro()

      await fetchSubscription()

      expect(setSubscription).toHaveBeenCalledWith(null)
    })

    it('does not set error.value on 404 (no subscription is a normal state)', async () => {
      mockGet.mockRejectedValueOnce({ status: 404, message: 'Not Found' })
      const { usePro } = await import('./usePro')
      const { fetchSubscription, error } = usePro()

      await fetchSubscription()

      expect(error.value).toBeNull()
    })

    it('also handles 404 via statusCode field', async () => {
      mockGet.mockRejectedValueOnce({ statusCode: 404, message: 'Not Found' })
      const setSubscription = vi.spyOn(proStore, 'setSubscription')
      const { usePro } = await import('./usePro')
      const { fetchSubscription } = usePro()

      await fetchSubscription()

      expect(setSubscription).toHaveBeenCalledWith(null)
    })

    it('sets error.value on non-404 errors (e.g. 500)', async () => {
      mockGet.mockRejectedValueOnce({ status: 500, data: { error: 'Server error' } })
      const { usePro } = await import('./usePro')
      const { fetchSubscription, error } = usePro()

      await fetchSubscription()

      expect(error.value).toBe('Server error')
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = proStore.isLoading
        return mockSubscription
      })
      const { usePro } = await import('./usePro')
      const { fetchSubscription } = usePro()

      await fetchSubscription()

      expect(loadingDuringCall).toBe(true)
      expect(proStore.isLoading).toBe(false)
    })

    it('clears isLoading in the finally block on 404 error', async () => {
      mockGet.mockRejectedValueOnce({ status: 404 })
      const { usePro } = await import('./usePro')
      const { fetchSubscription } = usePro()

      await fetchSubscription()

      expect(proStore.isLoading).toBe(false)
    })

    it('clears isLoading in the finally block on 500 error', async () => {
      mockGet.mockRejectedValueOnce({ status: 500, message: 'Fail' })
      const { usePro } = await import('./usePro')
      const { fetchSubscription } = usePro()

      await fetchSubscription()

      expect(proStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce(mockSubscription)
      const { usePro } = await import('./usePro')
      const { fetchSubscription, error } = usePro()
      error.value = 'previous error'

      await fetchSubscription()

      expect(error.value).toBeNull()
    })

    it('does NOT call API when userId is missing', async () => {
      // Clear the currentEntity so userId is undefined
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().currentEntity = null as any
      const { usePro } = await import('./usePro')
      const { fetchSubscription } = usePro()

      await fetchSubscription()

      expect(mockGet).not.toHaveBeenCalled()
    })
  })

  // ── subscribe ──────────────────────────────────────────────

  describe('subscribe()', () => {
    it('calls POST /api/users/{userId}/subscribe with the plan', async () => {
      mockPost.mockResolvedValueOnce(mockPayUResponse)
      const { usePro } = await import('./usePro')
      const { subscribe } = usePro()

      await subscribe('pro_monthly')

      expect(mockPost).toHaveBeenCalledWith(
        '/api/users/42/subscribe',
        { plan: 'pro_monthly' },
      )
    })

    it('returns the PayUCheckoutResponse on success', async () => {
      mockPost.mockResolvedValueOnce(mockPayUResponse)
      const { usePro } = await import('./usePro')
      const { subscribe } = usePro()

      const result = await subscribe('pro_monthly')

      expect(result).toEqual(mockPayUResponse)
    })

    it('submits a hidden form to PayU on success (form.submit called)', async () => {
      mockPost.mockResolvedValueOnce(mockPayUResponse)
      const { usePro } = await import('./usePro')
      const { subscribe } = usePro()

      await subscribe('pro_monthly')

      expect(mockFormSubmit).toHaveBeenCalledTimes(1)
    })

    it('sets error and returns null when checkout_url uses HTTP (not HTTPS)', async () => {
      mockPost.mockResolvedValueOnce({
        ...mockPayUResponse,
        checkout_url: 'http://checkout.payulatam.com/test',
      })
      const { usePro } = await import('./usePro')
      const { subscribe, error } = usePro()

      const result = await subscribe('pro_monthly')

      expect(result).toBeNull()
      expect(error.value).toBe('La URL de pago no es válida. Contacta con soporte.')
      expect(mockFormSubmit).not.toHaveBeenCalled()
    })

    it('sets error and returns null when checkout_url is not a valid URL', async () => {
      mockPost.mockResolvedValueOnce({
        ...mockPayUResponse,
        checkout_url: 'not-a-url',
      })
      const { usePro } = await import('./usePro')
      const { subscribe, error } = usePro()

      const result = await subscribe('pro_monthly')

      expect(result).toBeNull()
      expect(error.value).toBe('La URL de pago no es válida. Contacta con soporte.')
    })

    it('sets error and returns null when the API call throws', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Payment service unavailable' } })
      const { usePro } = await import('./usePro')
      const { subscribe, error } = usePro()

      const result = await subscribe('pro_monthly')

      expect(result).toBeNull()
      expect(error.value).toBe('Payment service unavailable')
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockPost.mockImplementationOnce(async () => {
        loadingDuringCall = proStore.isLoading
        return mockPayUResponse
      })
      const { usePro } = await import('./usePro')
      const { subscribe } = usePro()

      await subscribe('pro_monthly')

      expect(loadingDuringCall).toBe(true)
      expect(proStore.isLoading).toBe(false)
    })

    it('clears isLoading in the finally block when the API call fails', async () => {
      mockPost.mockRejectedValueOnce({ message: 'Network error' })
      const { usePro } = await import('./usePro')
      const { subscribe } = usePro()

      await subscribe('pro_monthly')

      expect(proStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      mockPost.mockResolvedValueOnce(mockPayUResponse)
      const { usePro } = await import('./usePro')
      const { subscribe, error } = usePro()
      error.value = 'previous error'

      await subscribe('pro_monthly')

      expect(error.value).toBeNull()
    })

    it('returns null and sets error when userId is missing', async () => {
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().currentEntity = null as any
      const { usePro } = await import('./usePro')
      const { subscribe, error } = usePro()

      const result = await subscribe('pro_monthly')

      expect(result).toBeNull()
      expect(error.value).toBe('Debes iniciar sesión para suscribirte.')
      expect(mockPost).not.toHaveBeenCalled()
    })

    it('uses string data in err.data as the error message', async () => {
      mockPost.mockRejectedValueOnce({ data: 'Plan not found' })
      const { usePro } = await import('./usePro')
      const { subscribe, error } = usePro()

      await subscribe('pro_monthly')

      expect(error.value).toBe('Plan not found')
    })

    it('falls back to err.message when no data field exists', async () => {
      mockPost.mockRejectedValueOnce({ message: 'Internal Server Error' })
      const { usePro } = await import('./usePro')
      const { subscribe, error } = usePro()

      await subscribe('pro_monthly')

      expect(error.value).toBe('Internal Server Error')
    })

    it('falls back to generic error message for unknown error shapes', async () => {
      mockPost.mockRejectedValueOnce('unexpected string error')
      const { usePro } = await import('./usePro')
      const { subscribe, error } = usePro()

      await subscribe('pro_monthly')

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })
  })

  // ── donate ────────────────────────────────────────────────

  describe('donate()', () => {
    it('calls POST /api/shelters/{id}/donate with the correct endpoint', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate('shelter-abc', { amount: 25000 })

      expect(mockPost).toHaveBeenCalledWith(
        '/api/shelters/shelter-abc/donate',
        expect.any(Object),
      )
    })

    it('returns the DonationCheckoutResponse on success', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      const result = await donate('shelter-abc', { amount: 25000 })

      expect(result).toEqual(mockDonationResponse)
    })

    it('submits a hidden form to PayU on success', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate('shelter-abc', { amount: 25000 })

      expect(mockFormSubmit).toHaveBeenCalledTimes(1)
    })

    it('sends amount in the POST body', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate('shelter-abc', { amount: 50000 })

      const body = mockPost.mock.calls[0][1] as Record<string, unknown>
      expect(body.amount).toBe(50000)
    })

    it('omits message from the body when not provided', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate('shelter-abc', { amount: 25000 })

      const body = mockPost.mock.calls[0][1] as Record<string, unknown>
      expect(body).not.toHaveProperty('message')
    })

    it('includes message in the body when provided', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate('shelter-abc', { amount: 25000, message: '¡Mucho ánimo!' })

      const body = mockPost.mock.calls[0][1] as Record<string, unknown>
      expect(body.message).toBe('¡Mucho ánimo!')
    })

    it('returns null and sets error.value on failure', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Donation failed' } })
      const { usePro } = await import('./usePro')
      const { donate, error } = usePro()

      const result = await donate('shelter-abc', { amount: 25000 })

      expect(result).toBeNull()
      expect(error.value).toBe('Donation failed')
    })

    it('clears any previous error before the request', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate, error } = usePro()
      error.value = 'previous error'

      await donate('shelter-abc', { amount: 25000 })

      expect(error.value).toBeNull()
    })

    it('does not call proStore.setSubscription (donate is store-agnostic)', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const setSubscription = vi.spyOn(proStore, 'setSubscription')
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate('shelter-abc', { amount: 25000 })

      expect(setSubscription).not.toHaveBeenCalled()
    })

    it('rejects shelter_id with path separators (security guard)', async () => {
      const { usePro } = await import('./usePro')
      const { donate, error } = usePro()

      const result = await donate('../admin', { amount: 25000 })

      expect(result).toBeNull()
      expect(error.value).toBe('ID de refugio no válido.')
      expect(mockPost).not.toHaveBeenCalled()
    })

    it('rejects shelter_id with encoded slashes (security guard)', async () => {
      const { usePro } = await import('./usePro')
      const { donate, error } = usePro()

      const result = await donate('%2F..%2Fadmin', { amount: 25000 })

      expect(result).toBeNull()
      expect(error.value).toBe('ID de refugio no válido.')
    })

    it('uses string data in err.data as the error message on failure', async () => {
      mockPost.mockRejectedValueOnce({ data: 'Insufficient funds' })
      const { usePro } = await import('./usePro')
      const { donate, error } = usePro()

      await donate('shelter-abc', { amount: 25000 })

      expect(error.value).toBe('Insufficient funds')
    })

    it('falls back to err.message when no data field exists on failure', async () => {
      mockPost.mockRejectedValueOnce({ message: 'Connection refused' })
      const { usePro } = await import('./usePro')
      const { donate, error } = usePro()

      await donate('shelter-abc', { amount: 25000 })

      expect(error.value).toBe('Connection refused')
    })
  })
})
