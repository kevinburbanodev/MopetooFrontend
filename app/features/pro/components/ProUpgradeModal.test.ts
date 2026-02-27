// ============================================================
// ProUpgradeModal.test.ts
// Tests for the ProUpgradeModal component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// uses Bootstrap.Modal for show/hide, which we stub at module level.
// usePro is mocked at the composable boundary via module-level reactive
// refs. Auth state is injected via createTestingPinia.
//
// Key design points:
//   - modelValue controls visibility (v-model pattern).
//   - When modelValue flips true → opens modal (fetchPlans if not loaded).
//   - "Continuar al pago" calls createCheckoutSession with selectedPlanId.
//   - Spinner shown during checkout (isCheckingOut local state).
//   - Error shown in alert-danger when checkoutError is set.
//   - Annual plan savings badge computed from plan prices.
//   - Monthly plan is selected by default when both plans are in the store
//     and neither is popular; popular plan is pre-selected otherwise.
//   - User can switch to annual plan by clicking the annual plan card.
//   - `update:modelValue(false)` emitted when close button clicked.
//   - Plans loaded on mount if store has none.
//
// Bootstrap mock:
//   The component does `await import('bootstrap')` lazily. We mock the
//   entire 'bootstrap' module so the Modal constructor never touches the
//   real DOM. The mock instance has show/hide spies we can inspect.
//
// What this suite does NOT cover intentionally:
//   - The actual Bootstrap modal DOM transitions (CSS animation).
//   - navigateTo redirect after successful checkout — that is
//     createCheckoutSession's responsibility, tested in usePro.test.ts.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref, nextTick } from 'vue'
import { flushPromises } from '@vue/test-utils'
import ProUpgradeModal from './ProUpgradeModal.vue'
import type { ProPlan, ProSubscription } from '../types'

// ── localStorage stub (module-level) ─────────────────────────
const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))
vi.stubGlobal('localStorage', localStorageMock)

// ── Bootstrap Modal mock ───────────────────────────────────────
// The component lazy-imports bootstrap and calls Modal.getOrCreateInstance
// or `new Modal(el)`. We mock the entire module so no DOM API is needed.

const mockModalShow = vi.fn()
const mockModalHide = vi.fn()
const mockModalInstance = { show: mockModalShow, hide: mockModalHide }

vi.mock('bootstrap', () => ({
  Modal: vi.fn(() => mockModalInstance),
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

// ── usePro mock ───────────────────────────────────────────────
// Module-level reactive refs control what the component reads from the
// composable. createCheckoutSession is a vi.fn() we can assert on.

const mockFetchPlans = vi.fn()
const mockCreateCheckoutSession = vi.fn()
const mockProError = ref<string | null>(null)
const mockPlans = ref<ProPlan[]>([])
const mockIsLoading = ref(false)
const mockSubscriptionRef = ref<ProSubscription | null>(null)

vi.mock('../composables/usePro', () => ({
  usePro: () => ({
    fetchPlans: mockFetchPlans,
    createCheckoutSession: mockCreateCheckoutSession,
    error: mockProError,
    proStore: {
      get plans() { return mockPlans.value },
      get isLoading() { return mockIsLoading.value },
      get hasPlans() { return mockPlans.value.length > 0 },
      get getMonthlyPlan() { return mockPlans.value.find(p => p.interval === 'monthly') },
      get getAnnualPlan() { return mockPlans.value.find(p => p.interval === 'annual') },
      get isSubscribed() { return mockSubscriptionRef.value?.status === 'active' },
      get subscription() { return mockSubscriptionRef.value },
    },
  }),
}))

// ── Suite ─────────────────────────────────────────────────────

describe('ProUpgradeModal', () => {
  beforeEach(() => {
    mockFetchPlans.mockReset()
    mockFetchPlans.mockResolvedValue(undefined)
    mockCreateCheckoutSession.mockReset()
    mockModalShow.mockReset()
    mockModalHide.mockReset()
    mockProError.value = null
    mockPlans.value = []
    mockIsLoading.value = false
    mockSubscriptionRef.value = null
    localStorageMock.getItem.mockReturnValue(null)
  })

  function mountModal(modelValue = false) {
    return mountSuspended(ProUpgradeModal, {
      props: { modelValue },
      global: {
        plugins: [
          createTestingPinia({
            stubActions: false,
            createSpy: vi.fn,
            initialState: { auth: { token: null, isPro: false } },
          }),
        ],
      },
    })
  }

  // ── Initial state / visibility ─────────────────────────────

  describe('when modelValue is false', () => {
    it('renders the modal DOM element (Bootstrap controls visibility via CSS)', async () => {
      const wrapper = await mountModal(false)
      // Modal element always present — Bootstrap adds/removes `show` class
      expect(wrapper.find('.modal').exists()).toBe(true)
    })

    it('does not call createCheckoutSession on initial render', async () => {
      await mountModal(false)
      expect(mockCreateCheckoutSession).not.toHaveBeenCalled()
    })
  })

  // ── Plans loaded on mount ──────────────────────────────────

  describe('plans loading', () => {
    it('calls fetchPlans if no plans are loaded when modal opens', async () => {
      // modelValue: true triggers openModal() which calls fetchPlans when !hasPlans
      mockPlans.value = []
      const wrapper = await mountModal(true)
      await nextTick()
      expect(mockFetchPlans).toHaveBeenCalledTimes(1)
    })

    it('does not call fetchPlans if plans are already loaded', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      await mountModal(true)
      await nextTick()
      expect(mockFetchPlans).not.toHaveBeenCalled()
    })
  })

  // ── Plan cards rendered ────────────────────────────────────

  describe('plan cards', () => {
    it('renders the monthly plan name', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountModal(false)
      expect(wrapper.text()).toContain('PRO Mensual')
    })

    it('renders the annual plan name', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountModal(false)
      expect(wrapper.text()).toContain('PRO Anual')
    })

    it('shows features for the monthly plan', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountModal(false)
      expect(wrapper.text()).toContain('Mascotas ilimitadas')
    })

    it('shows the extra annual plan feature', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountModal(false)
      expect(wrapper.text()).toContain('2 meses gratis')
    })
  })

  // ── Default plan selection ─────────────────────────────────

  describe('default plan selection', () => {
    it('pre-selects the plan marked as is_popular (annual plan)', async () => {
      // The watcher picks the popular plan when plans load
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountModal(false)
      await nextTick()

      // The annual plan card should have border-primary (selected state)
      const annualCard = wrapper.findAll('button.card')[1]
      expect(annualCard.classes()).toContain('border-primary')
    })

    it('pre-selects the first plan when no plan is marked as popular', async () => {
      const nonPopularMonthly = { ...mockMonthlyPlan, is_popular: false }
      const nonPopularAnnual = { ...mockAnnualPlan, is_popular: false }
      mockPlans.value = [nonPopularMonthly, nonPopularAnnual]
      const wrapper = await mountModal(false)
      await nextTick()

      // First plan card should be selected
      const firstCard = wrapper.findAll('button.card')[0]
      expect(firstCard.classes()).toContain('border-primary')
    })
  })

  // ── Plan switching ─────────────────────────────────────────

  describe('plan switching', () => {
    it('selects the monthly plan when the monthly card is clicked', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountModal(false)
      await nextTick()

      const monthlyCard = wrapper.findAll('button.card')[0]
      await monthlyCard.trigger('click')
      await nextTick()

      expect(monthlyCard.classes()).toContain('border-primary')
    })

    it('switches selection to the annual plan when the annual card is clicked', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountModal(false)
      await nextTick()

      const annualCard = wrapper.findAll('button.card')[1]
      await annualCard.trigger('click')
      await nextTick()

      expect(annualCard.classes()).toContain('border-primary')
    })
  })

  // ── "Más popular" badge ────────────────────────────────────

  describe('"Más popular" badge', () => {
    it('shows the "Más popular" badge for the annual plan', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountModal(false)
      const popularBadge = wrapper.find('.pro-modal__popular-badge')
      expect(popularBadge.exists()).toBe(true)
      expect(popularBadge.text()).toBe('Más popular')
    })
  })

  // ── Annual savings badge ───────────────────────────────────

  describe('annual savings badge', () => {
    it('shows "Ahorra X%" badge when annual plan is cheaper than 12 × monthly', async () => {
      // 29900 * 12 = 358800; annual = 299000; savings ≈ 17%
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountModal(false)
      const savingsBadge = wrapper.find('.pro-modal__savings-badge')
      expect(savingsBadge.exists()).toBe(true)
      expect(savingsBadge.text()).toContain('Ahorra')
      expect(savingsBadge.text()).toContain('%')
    })

    it('does not show savings badge when only one plan is loaded', async () => {
      mockPlans.value = [mockAnnualPlan]
      const wrapper = await mountModal(false)
      expect(wrapper.find('.pro-modal__savings-badge').exists()).toBe(false)
    })
  })

  // ── Checkout flow ──────────────────────────────────────────

  describe('checkout flow', () => {
    it('calls createCheckoutSession with the selected plan ID when CTA clicked', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      mockCreateCheckoutSession.mockResolvedValue({
        session_id: 'cs_test',
        checkout_url: 'https://checkout.stripe.com/test',
      })
      const wrapper = await mountModal(false)
      await nextTick() // let watcher select the popular (annual) plan

      const ctaButton = wrapper.find('button.btn-primary.fw-semibold')
      await ctaButton.trigger('click')
      await nextTick()

      expect(mockCreateCheckoutSession).toHaveBeenCalledWith('plan-annual')
    })

    it('shows spinner text "Procesando..." while checkout is in progress', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      let resolveCheckout: () => void
      mockCreateCheckoutSession.mockImplementation(() =>
        new Promise<null>(resolve => { resolveCheckout = () => resolve(null) }),
      )

      const wrapper = await mountModal(false)
      await nextTick()

      const ctaButton = wrapper.find('button.btn-primary.fw-semibold')
      ctaButton.trigger('click') // do NOT await — we want the pending state
      await nextTick()

      expect(wrapper.text()).toContain('Procesando...')
      resolveCheckout!()
    })

    it('shows spinner-border element while checkout is in progress', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      let resolveCheckout: () => void
      mockCreateCheckoutSession.mockImplementation(() =>
        new Promise<null>(resolve => { resolveCheckout = () => resolve(null) }),
      )

      const wrapper = await mountModal(false)
      await nextTick()

      const ctaButton = wrapper.find('button.btn-primary.fw-semibold')
      ctaButton.trigger('click')
      await nextTick()

      expect(wrapper.find('.spinner-border').exists()).toBe(true)
      resolveCheckout!()
    })

    it('shows error alert when createCheckoutSession returns null', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      mockProError.value = null
      mockCreateCheckoutSession.mockImplementation(async () => {
        // Simulate the composable setting error.value on failure
        mockProError.value = 'No se pudo iniciar el proceso de pago.'
        return null
      })

      const wrapper = await mountModal(false)
      await nextTick()

      const ctaButton = wrapper.find('button.btn-primary.fw-semibold')
      await ctaButton.trigger('click')
      await nextTick()

      const errorAlert = wrapper.find('.alert-danger')
      expect(errorAlert.exists()).toBe(true)
      expect(errorAlert.text()).toContain('No se pudo iniciar el proceso de pago.')
    })

    it('CTA button is disabled when no plan is selected', async () => {
      // No plans loaded → selectedPlanId is null → button disabled
      mockPlans.value = []
      const wrapper = await mountModal(false)
      const ctaButton = wrapper.find('button.btn-primary.fw-semibold')
      expect(ctaButton.attributes('disabled')).toBeDefined()
    })
  })

  // ── Close button ───────────────────────────────────────────

  describe('close button', () => {
    it('emits "update:modelValue" with false when close button (btn-close) is clicked', async () => {
      const wrapper = await mountModal(false)
      await wrapper.find('button.btn-close').trigger('click')
      expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
      expect(wrapper.emitted('update:modelValue')![0]).toEqual([false])
    })

    it('emits "update:modelValue" with false when "Cancelar" button is clicked', async () => {
      const wrapper = await mountModal(false)
      await wrapper.find('button.btn-outline-secondary').trigger('click')
      expect(wrapper.emitted('update:modelValue')).toBeDefined()
      const emissions = wrapper.emitted('update:modelValue') as unknown[][]
      expect(emissions.some(e => e[0] === false)).toBe(true)
    })
  })

  // ── Loading skeleton (no plans yet) ────────────────────────

  describe('loading plans skeleton', () => {
    it('shows loading skeleton when isLoading is true and no plans are loaded', async () => {
      mockIsLoading.value = true
      mockPlans.value = []
      const wrapper = await mountModal(false)
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Cargando planes"]').exists()).toBe(true)
    })
  })

  // ── No plans empty state ───────────────────────────────────

  describe('no plans state', () => {
    it('shows "No se pudieron cargar los planes" when not loading and plans are empty', async () => {
      mockPlans.value = []
      mockIsLoading.value = false
      const wrapper = await mountModal(false)
      expect(wrapper.text()).toContain('No se pudieron cargar los planes')
    })
  })

  // ── Modal header ───────────────────────────────────────────

  describe('modal header', () => {
    it('shows the PRO badge in the modal title', async () => {
      const wrapper = await mountModal(false)
      expect(wrapper.find('.modal-title').text()).toContain('PRO')
    })

    it('shows "Elige tu plan Mopetoo PRO" in the modal title', async () => {
      const wrapper = await mountModal(false)
      expect(wrapper.find('.modal-title').text()).toContain('Elige tu plan Mopetoo PRO')
    })
  })
})
