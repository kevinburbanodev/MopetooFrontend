// ============================================================
// DonationForm.test.ts
// Tests for the DonationForm component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The form is
// inside a <ClientOnly> block — in the happy-dom test environment,
// import.meta.client is true, so <ClientOnly> renders its default
// slot immediately. No special handling is needed.
//
// Auth state: injected via createTestingPinia. Unauthenticated users
// see a login CTA; authenticated users see the donation form.
//
// usePro: mocked at the composable boundary. The `donate` function is
// a vi.fn() we control per test. The `error` ref is a reactive ref we
// set to simulate API error states.
//
// Key design changes from Stripe version:
//   - donate() signature: donate(shelterId, { amount, message }) instead
//     of donate({ shelter_id, amount, message }).
//   - On success: shows "Redirigiendo al pago..." state (PayU redirect),
//     NOT a thank-you inline state.
//   - No "Hacer otra donación" reset button — user leaves the app.
//   - DonationCheckoutResponse return type (not DonationResponse).
//
// Form submit: use `wrapper.find('form').trigger('submit')` — clicking
// the submit button does NOT fire @submit.prevent in happy-dom.
//
// What this suite does NOT cover intentionally:
//   - COP currency formatting edge cases (Intl.NumberFormat — platform).
//   - The <ClientOnly> SSR fallback spinner (not rendered client-side).
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref, nextTick } from 'vue'
import DonationForm from './DonationForm.vue'
import type { DonationCheckoutResponse } from '../types'

// ── localStorage stub (module-level) ─────────────────────────
const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))
vi.stubGlobal('localStorage', localStorageMock)

// ── usePro mock ───────────────────────────────────────────────

const mockDonate = vi.fn()
const mockProError = ref<string | null>(null)

vi.mock('../composables/usePro', () => ({
  usePro: () => ({
    donate: mockDonate,
    error: mockProError,
  }),
}))

// ── NuxtLink stub ─────────────────────────────────────────────
const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

// ── Fixtures ─────────────────────────────────────────────────

const mockDonationCheckoutResponse: DonationCheckoutResponse = {
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

const defaultProps = {
  shelterId: 'shelter-abc',
  shelterName: 'Hogar Animal Bogotá',
}

// ── Helper ────────────────────────────────────────────────────

function mountForm(
  authState: { isAuthenticated?: boolean } = {},
  props = defaultProps,
) {
  return mountSuspended(DonationForm, {
    props,
    global: {
      plugins: [
        createTestingPinia({
          stubActions: false,
          createSpy: vi.fn,
          initialState: {
            auth: {
              token: authState.isAuthenticated ? 'test-jwt' : null,
            },
          },
        }),
      ],
      stubs: { NuxtLink: NuxtLinkStub },
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────

describe('DonationForm', () => {
  beforeEach(() => {
    mockDonate.mockReset()
    mockDonate.mockResolvedValue(mockDonationCheckoutResponse)
    mockProError.value = null
    localStorageMock.getItem.mockReturnValue(null)
  })

  // ── Unauthenticated state ──────────────────────────────────

  describe('when the user is unauthenticated', () => {
    it('shows the login CTA and not the form', async () => {
      const wrapper = await mountForm({ isAuthenticated: false })
      expect(wrapper.find('[aria-label="Inicia sesión para donar"]').exists()).toBe(true)
      expect(wrapper.find('form').exists()).toBe(false)
    })

    it('shows "Inicia sesión para donar" heading in the CTA', async () => {
      const wrapper = await mountForm({ isAuthenticated: false })
      expect(wrapper.text()).toContain('Inicia sesión para donar')
    })

    it('includes a link to /login in the CTA', async () => {
      const wrapper = await mountForm({ isAuthenticated: false })
      const loginLink = wrapper.find('a[href="/login"]')
      expect(loginLink.exists()).toBe(true)
    })

    it('includes a link to /register in the CTA', async () => {
      const wrapper = await mountForm({ isAuthenticated: false })
      const registerLink = wrapper.find('a[href="/register"]')
      expect(registerLink.exists()).toBe(true)
    })

    it('mentions the shelter name in the CTA copy', async () => {
      const wrapper = await mountForm({ isAuthenticated: false })
      expect(wrapper.text()).toContain('Hogar Animal Bogotá')
    })

    it('does not call donate() when the user is unauthenticated', async () => {
      await mountForm({ isAuthenticated: false })
      expect(mockDonate).not.toHaveBeenCalled()
    })
  })

  // ── Authenticated state — form rendering ───────────────────

  describe('when the user is authenticated', () => {
    it('shows the donation form', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      expect(wrapper.find('form').exists()).toBe(true)
    })

    it('shows the shelter name in the heading copy', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      expect(wrapper.text()).toContain('Hogar Animal Bogotá')
    })

    it('renders 4 preset amount buttons', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      expect(presetButtons).toHaveLength(4)
    })

    it('renders the custom amount input field', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      expect(wrapper.find('#donation-custom-amount').exists()).toBe(true)
    })

    it('renders the message textarea', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      expect(wrapper.find('#donation-message').exists()).toBe(true)
    })

    it('does not show the login CTA', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      expect(wrapper.find('[aria-label="Inicia sesión para donar"]').exists()).toBe(false)
    })
  })

  // ── Preset amount selection ────────────────────────────────

  describe('preset amount selection', () => {
    it('clicking a preset button applies btn-success class (active state)', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[2].trigger('click')
      expect(presetButtons[2].classes()).toContain('btn-success')
    })

    it('clicking a different preset deactivates the previous one', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[0].trigger('click')
      await presetButtons[1].trigger('click')
      expect(presetButtons[0].classes()).not.toContain('btn-success')
      expect(presetButtons[1].classes()).toContain('btn-success')
    })

    it('clicking a preset button sets aria-pressed="true"', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[0].trigger('click')
      expect(presetButtons[0].attributes('aria-pressed')).toBe('true')
    })

    it('unclicked preset buttons have aria-pressed="false"', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      expect(presetButtons[0].attributes('aria-pressed')).toBe('false')
    })
  })

  // ── Custom amount field ────────────────────────────────────

  describe('custom amount field', () => {
    it('deselects any preset when the custom amount field is focused', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[0].trigger('click')

      const customInput = wrapper.find('#donation-custom-amount')
      await customInput.trigger('focus')
      await nextTick()

      expect(presetButtons[0].classes()).not.toContain('btn-success')
    })
  })

  // ── Validation ─────────────────────────────────────────────

  describe('validation', () => {
    it('does not call donate() when no amount is selected or entered', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      await wrapper.find('form').trigger('submit')
      await nextTick()
      expect(mockDonate).not.toHaveBeenCalled()
    })

    it('adds "was-validated" class to the form after a failed submit', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      await wrapper.find('form').trigger('submit')
      await nextTick()
      expect(wrapper.find('form').classes()).toContain('was-validated')
    })

    it('shows the amount invalid-feedback div after submitting with no amount', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      await wrapper.find('form').trigger('submit')
      await nextTick()
      expect(wrapper.find('#donation-amount-error').exists()).toBe(true)
    })

    it('applies is-invalid to the custom amount input when amount is invalid', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      await wrapper.find('form').trigger('submit')
      await nextTick()
      expect(wrapper.find('#donation-custom-amount').classes()).toContain('is-invalid')
    })

    it('shows text-danger on the counter when message exceeds 200 chars', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const longMessage = 'a'.repeat(201)
      await wrapper.find('#donation-message').setValue(longMessage)
      await wrapper.find('form').trigger('submit')
      await nextTick()
      expect(wrapper.find('.text-danger').exists()).toBe(true)
    })

    it('shows the message invalid-feedback div when message exceeds 200 chars', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const longMessage = 'a'.repeat(201)
      await wrapper.find('#donation-message').setValue(longMessage)
      await wrapper.find('form').trigger('submit')
      await nextTick()
      expect(wrapper.find('#donation-message-error').exists()).toBe(true)
    })
  })

  // ── Valid submit ───────────────────────────────────────────

  describe('valid submit', () => {
    it('calls donate() with the correct shelterId and preset amount', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[2].trigger('click') // 25000

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(mockDonate).toHaveBeenCalledWith(
        'shelter-abc',
        expect.objectContaining({ amount: 25000 }),
      )
    })

    it('calls donate() with the correct amount via preset selection', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[1].trigger('click') // 10000

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(mockDonate).toHaveBeenCalledWith(
        'shelter-abc',
        expect.objectContaining({ amount: 10000 }),
      )
    })

    it('includes message in the donate() payload when non-empty', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[0].trigger('click') // 5000
      await wrapper.find('#donation-message').setValue('¡Mucho ánimo para los animales!')

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(mockDonate).toHaveBeenCalledWith(
        'shelter-abc',
        expect.objectContaining({ message: '¡Mucho ánimo para los animales!' }),
      )
    })

    it('omits message from the donate() payload when message is blank', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[0].trigger('click')

      await wrapper.find('form').trigger('submit')
      await nextTick()

      const callArgs = mockDonate.mock.calls[0] as [string, Record<string, unknown>]
      expect(callArgs[1].message).toBeUndefined()
    })

    it('trims whitespace-only message and omits it', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[0].trigger('click')
      await wrapper.find('#donation-message').setValue('   ')

      await wrapper.find('form').trigger('submit')
      await nextTick()

      const callArgs = mockDonate.mock.calls[0] as [string, Record<string, unknown>]
      expect(callArgs[1].message).toBeUndefined()
    })
  })

  // ── Redirect state (PayU) ─────────────────────────────────

  describe('redirect state', () => {
    it('shows "Redirigiendo al pago..." after a successful donation', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[2].trigger('click')

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.text()).toContain('Redirigiendo al pago...')
    })

    it('shows the shelter name in the redirect message', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[0].trigger('click')

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.text()).toContain('Hogar Animal Bogotá')
    })

    it('hides the form in the redirect state', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[0].trigger('click')

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.find('form').exists()).toBe(false)
    })

    it('shows a spinner in the redirect state', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[0].trigger('click')

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.find('.spinner-border').exists()).toBe(true)
    })
  })

  // ── Error state ────────────────────────────────────────────

  describe('error state', () => {
    it('shows an error alert when donate() returns null', async () => {
      mockDonate.mockImplementation(async () => {
        mockProError.value = 'Error al procesar la donación'
        return null
      })

      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[0].trigger('click')

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.find('.alert-danger').exists()).toBe(true)
      expect(wrapper.find('.alert-danger').text()).toContain('Error al procesar la donación')
    })

    it('does not show the redirect state when donate() returns null', async () => {
      mockDonate.mockResolvedValue(null)

      const wrapper = await mountForm({ isAuthenticated: true })
      const presetButtons = wrapper.findAll('[aria-label^="Donar"]')
      await presetButtons[0].trigger('click')

      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.text()).not.toContain('Redirigiendo al pago...')
    })
  })

  // ── Message character counter ──────────────────────────────

  describe('message character counter', () => {
    it('shows "200 / 200 caracteres" counter initially', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      const counter = wrapper.find('[aria-live="polite"]')
      expect(counter.text()).toContain('200')
      expect(counter.text()).toContain('caracteres')
    })

    it('decrements counter as the user types in the message field', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      await wrapper.find('#donation-message').setValue('Hola')
      const counter = wrapper.find('[aria-live="polite"]')
      expect(counter.text()).toContain('196')
    })
  })

  // ── Section structure ──────────────────────────────────────

  describe('section structure', () => {
    it('renders section with aria-label "Formulario de donación"', async () => {
      const wrapper = await mountForm({ isAuthenticated: true })
      expect(wrapper.find('section[aria-label="Formulario de donación"]').exists()).toBe(true)
    })
  })
})
