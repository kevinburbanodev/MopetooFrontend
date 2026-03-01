// ============================================================
// ProUpgradeModal.test.ts
// Tests for the ProUpgradeModal component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// uses Bootstrap.Modal for show/hide, which we stub at module level.
// usePro is mocked at the composable boundary. Plans come from
// PRO_PLANS constant (always available — no fetch, no loading).
//
// Key design changes from Stripe version:
//   - No fetchPlans on modal open — plans are constants.
//   - No loading skeleton tests — plans always present.
//   - No empty state tests — PRO_PLANS constant always has plans.
//   - subscribe() replaces createCheckoutSession().
//   - selectedPlan is PlanValue (not string ID).
//   - Pre-selected plan: is_popular (annual by default).
//
// Bootstrap mock:
//   The component does `await import('bootstrap')` lazily. We mock the
//   entire 'bootstrap' module so the Modal constructor never touches the
//   real DOM.
//
// What this suite does NOT cover intentionally:
//   - The actual Bootstrap modal DOM transitions (CSS animation).
//   - PayU redirect — that is subscribe()'s responsibility, tested in usePro.test.ts.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref, nextTick } from 'vue'
import ProUpgradeModal from './ProUpgradeModal.vue'

// ── localStorage stub (module-level) ─────────────────────────
const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))
vi.stubGlobal('localStorage', localStorageMock)

// ── Bootstrap Modal mock ───────────────────────────────────────
const mockModalShow = vi.fn()
const mockModalHide = vi.fn()
const mockModalInstance = {
  show: mockModalShow,
  hide: mockModalHide,
}

vi.mock('bootstrap', () => ({
  Modal: vi.fn(() => mockModalInstance),
}))

// ── usePro mock ───────────────────────────────────────────────
const mockSubscribe = vi.fn()
const mockProError = ref<string | null>(null)

vi.mock('../composables/usePro', () => ({
  usePro: () => ({
    subscribe: mockSubscribe,
    error: mockProError,
  }),
}))

// ── Suite ─────────────────────────────────────────────────────

describe('ProUpgradeModal', () => {
  beforeEach(() => {
    mockSubscribe.mockReset()
    mockModalShow.mockReset()
    mockModalHide.mockReset()
    mockProError.value = null
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
      expect(wrapper.find('.modal').exists()).toBe(true)
    })

    it('does not call subscribe on initial render', async () => {
      await mountModal(false)
      expect(mockSubscribe).not.toHaveBeenCalled()
    })
  })

  // ── Plan cards rendered (always — from PRO_PLANS constant) ──

  describe('plan cards', () => {
    it('renders the monthly plan name', async () => {
      const wrapper = await mountModal(false)
      expect(wrapper.text()).toContain('PRO Mensual')
    })

    it('renders the annual plan name', async () => {
      const wrapper = await mountModal(false)
      expect(wrapper.text()).toContain('PRO Anual')
    })

    it('shows features for the monthly plan', async () => {
      const wrapper = await mountModal(false)
      expect(wrapper.text()).toContain('Mascotas ilimitadas')
    })

    it('shows the extra annual plan feature', async () => {
      const wrapper = await mountModal(false)
      expect(wrapper.text()).toContain('2 meses gratis')
    })
  })

  // ── Default plan selection ─────────────────────────────────

  describe('default plan selection', () => {
    it('pre-selects the annual plan (is_popular: true) by default', async () => {
      const wrapper = await mountModal(false)
      await nextTick()

      // The annual plan card should have border-primary (selected state)
      const annualCard = wrapper.findAll('button.card')[1]
      expect(annualCard.classes()).toContain('border-primary')
    })
  })

  // ── Plan switching ─────────────────────────────────────────

  describe('plan switching', () => {
    it('selects the monthly plan when the monthly card is clicked', async () => {
      const wrapper = await mountModal(false)
      await nextTick()

      const monthlyCard = wrapper.findAll('button.card')[0]
      await monthlyCard.trigger('click')
      await nextTick()

      expect(monthlyCard.classes()).toContain('border-primary')
    })

    it('switches selection to the annual plan when the annual card is clicked', async () => {
      const wrapper = await mountModal(false)
      await nextTick()

      // First click monthly to change selection
      const monthlyCard = wrapper.findAll('button.card')[0]
      await monthlyCard.trigger('click')
      await nextTick()

      // Then click annual
      const annualCard = wrapper.findAll('button.card')[1]
      await annualCard.trigger('click')
      await nextTick()

      expect(annualCard.classes()).toContain('border-primary')
    })
  })

  // ── "Más popular" badge ────────────────────────────────────

  describe('"Más popular" badge', () => {
    it('shows the "Más popular" badge for the annual plan', async () => {
      const wrapper = await mountModal(false)
      const popularBadge = wrapper.find('.pro-modal__popular-badge')
      expect(popularBadge.exists()).toBe(true)
      expect(popularBadge.text()).toBe('Más popular')
    })
  })

  // ── Annual savings badge ───────────────────────────────────

  describe('annual savings badge', () => {
    it('shows "Ahorra 33%" badge', async () => {
      const wrapper = await mountModal(false)
      const savingsBadge = wrapper.find('.pro-modal__savings-badge')
      expect(savingsBadge.exists()).toBe(true)
      expect(savingsBadge.text()).toContain('Ahorra')
      expect(savingsBadge.text()).toContain('33%')
    })
  })

  // ── Checkout flow ──────────────────────────────────────────

  describe('checkout flow', () => {
    it('calls subscribe with the selected plan value when CTA clicked', async () => {
      mockSubscribe.mockResolvedValue({
        checkout_url: 'https://checkout.payulatam.com/test',
        form_params: {},
        reference_code: 'ref-001',
      })
      const wrapper = await mountModal(false)
      await nextTick() // let default plan selection happen (annual/popular)

      const ctaButton = wrapper.find('button.btn-primary.fw-semibold')
      await ctaButton.trigger('click')
      await nextTick()

      expect(mockSubscribe).toHaveBeenCalledWith('pro_annual')
    })

    it('shows spinner text "Procesando..." while checkout is in progress', async () => {
      let resolveCheckout: () => void
      mockSubscribe.mockImplementation(() =>
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
      let resolveCheckout: () => void
      mockSubscribe.mockImplementation(() =>
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

    it('shows error alert when subscribe returns null', async () => {
      mockProError.value = null
      mockSubscribe.mockImplementation(async () => {
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
