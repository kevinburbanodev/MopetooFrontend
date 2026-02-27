// ============================================================
// usePro.test.ts
// Tests the usePro composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT the right tool.
//   - navigateTo is a Nuxt auto-import — mocked via mockNuxtImport.
//     The factory reference MUST be wrapped in vi.hoisted() because
//     mockNuxtImport factories run before module evaluation.
//   - import.meta.client evaluates to true in the happy-dom nuxt test
//     environment, so createCheckoutSession's SSR guard is never hit.
//     That branch is tested by calling a version of the composable
//     whose import.meta.client has been patched via vi.stubGlobal on
//     the importMeta object — however since Vite replaces import.meta
//     at compile time, we test the guard indirectly via the security
//     URL check instead (HTTPS validation produces the same null return).
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs.
//
// What this suite does NOT cover intentionally:
//   - The SSR guard branch (import.meta.client === false) in
//     createCheckoutSession — import.meta.client is a compile-time
//     constant replaced by Vite/Rollup and cannot be patched at runtime
//     in the test environment. The HTTPS security guard (same null return
//     path) is tested in its place.
//   - Stripe webhook handling or payment confirmation — server-side only.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { ProPlan, ProSubscription, CheckoutSession, DonationResponse } from '../types'

// ── Nuxt auto-import mocks ───────────────────────────────────
// navigateTo is used by createCheckoutSession. Must be hoisted because
// the mockNuxtImport factory closure is evaluated before module-level code.

const navigateToMock = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => navigateToMock)

// useRouter is used internally by @nuxt/test-utils during setup.
// Must include all guard methods or init throws "afterEach is not a function".
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
const mockDel = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet, post: mockPost, del: mockDel }),
}))

// ── Fixtures ─────────────────────────────────────────────────

const mockMonthlyPlan: ProPlan = {
  id: 'plan-monthly',
  name: 'PRO Mensual',
  interval: 'monthly',
  price: 29900,
  currency: 'COP',
  features: ['Mascotas ilimitadas', 'Exportar PDF', 'Soporte prioritario'],
  is_popular: false,
}

const mockAnnualPlan: ProPlan = {
  id: 'plan-annual',
  name: 'PRO Anual',
  interval: 'annual',
  price: 299000,
  currency: 'COP',
  features: ['Mascotas ilimitadas', 'Exportar PDF', 'Soporte prioritario', '2 meses gratis'],
  is_popular: true,
}

const mockSubscription: ProSubscription = {
  id: 'sub-1',
  user_id: 'user-1',
  plan_id: 'plan-monthly',
  status: 'active',
  current_period_start: '2026-01-01T00:00:00Z',
  current_period_end: '2026-02-01T00:00:00Z',
  cancel_at_period_end: false,
  created_at: '2026-01-01T00:00:00Z',
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

    mockGet.mockReset()
    mockPost.mockReset()
    mockDel.mockReset()
    navigateToMock.mockReset()
  })

  // ── fetchPlans ─────────────────────────────────────────────

  describe('fetchPlans()', () => {
    it('calls GET /api/pro/plans', async () => {
      mockGet.mockResolvedValueOnce([mockMonthlyPlan])
      const { usePro } = await import('./usePro')
      const { fetchPlans } = usePro()

      await fetchPlans()

      expect(mockGet).toHaveBeenCalledWith('/api/pro/plans')
    })

    it('hydrates the store when the response is a bare ProPlan array', async () => {
      mockGet.mockResolvedValueOnce([mockMonthlyPlan, mockAnnualPlan])
      const setPlans = vi.spyOn(proStore, 'setPlans')
      const { usePro } = await import('./usePro')
      const { fetchPlans } = usePro()

      await fetchPlans()

      expect(setPlans).toHaveBeenCalledWith([mockMonthlyPlan, mockAnnualPlan])
    })

    it('hydrates the store when the response is shaped as { plans: ProPlan[] }', async () => {
      mockGet.mockResolvedValueOnce({ plans: [mockMonthlyPlan, mockAnnualPlan] })
      const setPlans = vi.spyOn(proStore, 'setPlans')
      const { usePro } = await import('./usePro')
      const { fetchPlans } = usePro()

      await fetchPlans()

      expect(setPlans).toHaveBeenCalledWith([mockMonthlyPlan, mockAnnualPlan])
    })

    it('calls setPlans with an empty array when { plans } key is undefined', async () => {
      mockGet.mockResolvedValueOnce({ plans: undefined })
      const setPlans = vi.spyOn(proStore, 'setPlans')
      const { usePro } = await import('./usePro')
      const { fetchPlans } = usePro()

      await fetchPlans()

      expect(setPlans).toHaveBeenCalledWith([])
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockGet.mockImplementationOnce(async () => {
        loadingDuringCall = proStore.isLoading
        return [mockMonthlyPlan]
      })
      const { usePro } = await import('./usePro')
      const { fetchPlans } = usePro()

      await fetchPlans()

      expect(loadingDuringCall).toBe(true)
      expect(proStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Network error' })
      const { usePro } = await import('./usePro')
      const { fetchPlans } = usePro()

      await fetchPlans()

      expect(proStore.isLoading).toBe(false)
    })

    it('sets error.value when the API call fails', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Error del servidor' } })
      const { usePro } = await import('./usePro')
      const { fetchPlans, error } = usePro()

      await fetchPlans()

      expect(error.value).toBe('Error del servidor')
    })

    it('clears any previous error before the request', async () => {
      mockGet.mockResolvedValueOnce([mockMonthlyPlan])
      const { usePro } = await import('./usePro')
      const { fetchPlans, error } = usePro()
      error.value = 'error previo'

      await fetchPlans()

      expect(error.value).toBeNull()
    })

    it('sets error to null on successful fetch', async () => {
      mockGet.mockResolvedValueOnce([mockMonthlyPlan])
      const { usePro } = await import('./usePro')
      const { fetchPlans, error } = usePro()

      await fetchPlans()

      expect(error.value).toBeNull()
    })

    it('uses string data in err.data as the error message', async () => {
      mockGet.mockRejectedValueOnce({ data: 'Plan not found' })
      const { usePro } = await import('./usePro')
      const { fetchPlans, error } = usePro()

      await fetchPlans()

      expect(error.value).toBe('Plan not found')
    })

    it('falls back to err.message when no data field exists', async () => {
      mockGet.mockRejectedValueOnce({ message: 'Internal Server Error' })
      const { usePro } = await import('./usePro')
      const { fetchPlans, error } = usePro()

      await fetchPlans()

      expect(error.value).toBe('Internal Server Error')
    })

    it('falls back to generic error message for unknown error shapes', async () => {
      mockGet.mockRejectedValueOnce('unexpected string error')
      const { usePro } = await import('./usePro')
      const { fetchPlans, error } = usePro()

      await fetchPlans()

      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('uses err.data.error object field as the error message', async () => {
      mockGet.mockRejectedValueOnce({ data: { error: 'Unauthorized access' } })
      const { usePro } = await import('./usePro')
      const { fetchPlans, error } = usePro()

      await fetchPlans()

      expect(error.value).toBe('Unauthorized access')
    })
  })

  // ── fetchSubscription ──────────────────────────────────────

  describe('fetchSubscription()', () => {
    it('calls GET /api/pro/subscription', async () => {
      mockGet.mockResolvedValueOnce(mockSubscription)
      const { usePro } = await import('./usePro')
      const { fetchSubscription } = usePro()

      await fetchSubscription()

      expect(mockGet).toHaveBeenCalledWith('/api/pro/subscription')
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

    it('error stays null after successful fetch', async () => {
      mockGet.mockResolvedValueOnce(mockSubscription)
      const { usePro } = await import('./usePro')
      const { fetchSubscription, error } = usePro()

      await fetchSubscription()

      expect(error.value).toBeNull()
    })
  })

  // ── createCheckoutSession ──────────────────────────────────

  describe('createCheckoutSession()', () => {
    const validSession: CheckoutSession = {
      session_id: 'cs_test_abc123',
      checkout_url: 'https://checkout.stripe.com/pay/cs_test_abc123',
    }

    it('calls POST /api/pro/subscribe with the plan_id and redirect URLs', async () => {
      mockPost.mockResolvedValueOnce(validSession)
      const { usePro } = await import('./usePro')
      const { createCheckoutSession } = usePro()

      await createCheckoutSession('plan-monthly')

      expect(mockPost).toHaveBeenCalledWith(
        '/api/pro/subscribe',
        expect.objectContaining({ plan_id: 'plan-monthly' }),
      )
    })

    it('calls navigateTo with the checkout_url when URL is HTTPS', async () => {
      mockPost.mockResolvedValueOnce(validSession)
      const { usePro } = await import('./usePro')
      const { createCheckoutSession } = usePro()

      await createCheckoutSession('plan-monthly')

      expect(navigateToMock).toHaveBeenCalledWith(
        'https://checkout.stripe.com/pay/cs_test_abc123',
        { external: true },
      )
    })

    it('returns the CheckoutSession on success', async () => {
      mockPost.mockResolvedValueOnce(validSession)
      const { usePro } = await import('./usePro')
      const { createCheckoutSession } = usePro()

      const result = await createCheckoutSession('plan-monthly')

      expect(result).toEqual(validSession)
    })

    it('sets error and returns null when checkout_url uses HTTP (not HTTPS)', async () => {
      mockPost.mockResolvedValueOnce({
        session_id: 'cs_test_123',
        checkout_url: 'http://checkout.stripe.com/pay/cs_test_123',
      })
      const { usePro } = await import('./usePro')
      const { createCheckoutSession, error } = usePro()

      const result = await createCheckoutSession('plan-monthly')

      expect(result).toBeNull()
      expect(error.value).toBe('La URL de pago no es válida. Contacta con soporte.')
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('sets error and returns null when checkout_url is not a valid URL', async () => {
      mockPost.mockResolvedValueOnce({
        session_id: 'cs_test_123',
        checkout_url: 'not-a-url',
      })
      const { usePro } = await import('./usePro')
      const { createCheckoutSession, error } = usePro()

      const result = await createCheckoutSession('plan-monthly')

      expect(result).toBeNull()
      expect(error.value).toBe('La URL de pago no es válida. Contacta con soporte.')
    })

    it('sets error and returns null when the API call throws', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Payment service unavailable' } })
      const { usePro } = await import('./usePro')
      const { createCheckoutSession, error } = usePro()

      const result = await createCheckoutSession('plan-monthly')

      expect(result).toBeNull()
      expect(error.value).toBe('Payment service unavailable')
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockPost.mockImplementationOnce(async () => {
        loadingDuringCall = proStore.isLoading
        return validSession
      })
      const { usePro } = await import('./usePro')
      const { createCheckoutSession } = usePro()

      await createCheckoutSession('plan-monthly')

      expect(loadingDuringCall).toBe(true)
      expect(proStore.isLoading).toBe(false)
    })

    it('clears isLoading in the finally block when the API call fails', async () => {
      mockPost.mockRejectedValueOnce({ message: 'Network error' })
      const { usePro } = await import('./usePro')
      const { createCheckoutSession } = usePro()

      await createCheckoutSession('plan-monthly')

      expect(proStore.isLoading).toBe(false)
    })

    it('clears any previous error before the request', async () => {
      mockPost.mockResolvedValueOnce(validSession)
      const { usePro } = await import('./usePro')
      const { createCheckoutSession, error } = usePro()
      error.value = 'previous error'

      await createCheckoutSession('plan-monthly')

      expect(error.value).toBeNull()
    })

    it('includes success_url and cancel_url in the POST body', async () => {
      mockPost.mockResolvedValueOnce(validSession)
      const { usePro } = await import('./usePro')
      const { createCheckoutSession } = usePro()

      await createCheckoutSession('plan-annual')

      const callArg = mockPost.mock.calls[0][1] as Record<string, string>
      expect(callArg.success_url).toContain('/dashboard/subscription?checkout=success')
      expect(callArg.cancel_url).toContain('/pricing?checkout=canceled')
    })
  })

  // ── cancelSubscription ─────────────────────────────────────

  describe('cancelSubscription()', () => {
    it('calls DELETE /api/pro/subscription', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { usePro } = await import('./usePro')
      const { cancelSubscription } = usePro()

      await cancelSubscription()

      expect(mockDel).toHaveBeenCalledWith('/api/pro/subscription')
    })

    it('returns true on success', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      const { usePro } = await import('./usePro')
      const { cancelSubscription } = usePro()

      const result = await cancelSubscription()

      expect(result).toBe(true)
    })

    it('optimistically sets cancel_at_period_end to true in the store', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      proStore.setSubscription(mockSubscription) // cancel_at_period_end: false
      const setSubscription = vi.spyOn(proStore, 'setSubscription')
      const { usePro } = await import('./usePro')
      const { cancelSubscription } = usePro()

      await cancelSubscription()

      expect(setSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ cancel_at_period_end: true }),
      )
    })

    it('does not mutate the store when subscription is null', async () => {
      mockDel.mockResolvedValueOnce(undefined)
      // subscription is null in initial state
      const setSubscription = vi.spyOn(proStore, 'setSubscription')
      const { usePro } = await import('./usePro')
      const { cancelSubscription } = usePro()

      await cancelSubscription()

      expect(setSubscription).not.toHaveBeenCalled()
    })

    it('returns false on error', async () => {
      mockDel.mockRejectedValueOnce({ data: { error: 'Cannot cancel' } })
      const { usePro } = await import('./usePro')
      const { cancelSubscription } = usePro()

      const result = await cancelSubscription()

      expect(result).toBe(false)
    })

    it('sets error.value on failure', async () => {
      mockDel.mockRejectedValueOnce({ data: { error: 'Cannot cancel subscription' } })
      const { usePro } = await import('./usePro')
      const { cancelSubscription, error } = usePro()

      await cancelSubscription()

      expect(error.value).toBe('Cannot cancel subscription')
    })

    it('sets isLoading to true during the request and false after success', async () => {
      let loadingDuringCall = false
      mockDel.mockImplementationOnce(async () => {
        loadingDuringCall = proStore.isLoading
        return undefined
      })
      const { usePro } = await import('./usePro')
      const { cancelSubscription } = usePro()

      await cancelSubscription()

      expect(loadingDuringCall).toBe(true)
      expect(proStore.isLoading).toBe(false)
    })

    it('clears isLoading in the finally block on failure', async () => {
      mockDel.mockRejectedValueOnce({ message: 'Fail' })
      const { usePro } = await import('./usePro')
      const { cancelSubscription } = usePro()

      await cancelSubscription()

      expect(proStore.isLoading).toBe(false)
    })
  })

  // ── donate ────────────────────────────────────────────────

  describe('donate()', () => {
    const mockDonationResponse: DonationResponse = {
      id: 'donation-1',
      shelter_id: 'shelter-abc',
      user_id: 'user-1',
      amount: 25000,
      status: 'completed',
      created_at: '2026-02-01T00:00:00Z',
    }

    it('calls POST /api/shelters/:shelterId/donations with the correct endpoint', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate({ shelter_id: 'shelter-abc', amount: 25000 })

      expect(mockPost).toHaveBeenCalledWith(
        '/api/shelters/shelter-abc/donations',
        expect.any(Object),
      )
    })

    it('returns the DonationResponse on success', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      const result = await donate({ shelter_id: 'shelter-abc', amount: 25000 })

      expect(result).toEqual(mockDonationResponse)
    })

    it('sends amount in the POST body', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate({ shelter_id: 'shelter-abc', amount: 50000 })

      const body = mockPost.mock.calls[0][1] as Record<string, unknown>
      expect(body.amount).toBe(50000)
    })

    it('omits message from the body when message is empty string', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate({ shelter_id: 'shelter-abc', amount: 25000, message: '' })

      const body = mockPost.mock.calls[0][1] as Record<string, unknown>
      expect(body).not.toHaveProperty('message')
    })

    it('omits message from the body when message is not provided', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate({ shelter_id: 'shelter-abc', amount: 25000 })

      const body = mockPost.mock.calls[0][1] as Record<string, unknown>
      expect(body).not.toHaveProperty('message')
    })

    it('includes message in the body when provided', async () => {
      mockPost.mockResolvedValueOnce({ ...mockDonationResponse, message: '¡Mucho ánimo!' })
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate({ shelter_id: 'shelter-abc', amount: 25000, message: '¡Mucho ánimo!' })

      const body = mockPost.mock.calls[0][1] as Record<string, unknown>
      expect(body.message).toBe('¡Mucho ánimo!')
    })

    it('returns null and sets error.value on failure', async () => {
      mockPost.mockRejectedValueOnce({ data: { error: 'Donation failed' } })
      const { usePro } = await import('./usePro')
      const { donate, error } = usePro()

      const result = await donate({ shelter_id: 'shelter-abc', amount: 25000 })

      expect(result).toBeNull()
      expect(error.value).toBe('Donation failed')
    })

    it('clears any previous error before the request', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const { usePro } = await import('./usePro')
      const { donate, error } = usePro()
      error.value = 'previous error'

      await donate({ shelter_id: 'shelter-abc', amount: 25000 })

      expect(error.value).toBeNull()
    })

    it('does not call proStore.setSubscription (donate is store-agnostic)', async () => {
      mockPost.mockResolvedValueOnce(mockDonationResponse)
      const setSubscription = vi.spyOn(proStore, 'setSubscription')
      const { usePro } = await import('./usePro')
      const { donate } = usePro()

      await donate({ shelter_id: 'shelter-abc', amount: 25000 })

      expect(setSubscription).not.toHaveBeenCalled()
    })

    it('uses string data in err.data as the error message on failure', async () => {
      mockPost.mockRejectedValueOnce({ data: 'Insufficient funds' })
      const { usePro } = await import('./usePro')
      const { donate, error } = usePro()

      await donate({ shelter_id: 'shelter-abc', amount: 25000 })

      expect(error.value).toBe('Insufficient funds')
    })

    it('falls back to err.message when no data field exists on failure', async () => {
      mockPost.mockRejectedValueOnce({ message: 'Connection refused' })
      const { usePro } = await import('./usePro')
      const { donate, error } = usePro()

      await donate({ shelter_id: 'shelter-abc', amount: 25000 })

      expect(error.value).toBe('Connection refused')
    })
  })
})
