// ============================================================
// PricingTable.test.ts
// Tests for the PricingTable component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// uses PRO_PLANS constant (always available — no fetch, no loading).
// usePro is mocked at the composable boundary.
//
// Key design changes from Stripe version:
//   - No fetchPlans lifecycle tests — plans are constants.
//   - No loading skeleton tests — plans always available.
//   - No empty state tests — PRO_PLANS constant always has plans.
//   - isActivePlan: subscription_plan === plan.value (not plan_id).
//   - Emit: plan.value (PlanValue) instead of plan.id (string).
//
// What this suite does NOT cover intentionally:
//   - CSS transitions or hover effects.
//   - Currency formatting edge cases (Intl.NumberFormat).
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
import PricingTable from './PricingTable.vue'
import type { SubscriptionStatus } from '../types'

// ── localStorage stub (module-level) ─────────────────────────
const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))
vi.stubGlobal('localStorage', localStorageMock)

// ── usePro mock ───────────────────────────────────────────────
// Plans come from the PRO_PLANS constant imported by the component,
// not from the store. The mock only needs proStore for subscription state.

const mockIsLoading = ref(false)
const mockSubscriptionRef = ref<SubscriptionStatus | null>(null)

vi.mock('../composables/usePro', () => ({
  usePro: () => ({
    proStore: {
      get isLoading() { return mockIsLoading.value },
      get isSubscribed() {
        return mockSubscriptionRef.value?.is_pro === true && mockSubscriptionRef.value?.is_active === true
      },
      get subscription() { return mockSubscriptionRef.value },
    },
  }),
}))

// ── NuxtLink stub ─────────────────────────────────────────────
const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

// ── Suite ─────────────────────────────────────────────────────

describe('PricingTable', () => {
  beforeEach(() => {
    mockIsLoading.value = false
    mockSubscriptionRef.value = null
    localStorageMock.getItem.mockReturnValue(null)
  })

  function mountTable(authState: { isPro?: boolean; isAuthenticated?: boolean } = {}) {
    return mountSuspended(PricingTable, {
      global: {
        plugins: [
          createTestingPinia({
            stubActions: false,
            createSpy: vi.fn,
            initialState: {
              auth: {
                token: authState.isAuthenticated !== false ? null : null,
                isPro: authState.isPro ?? false,
              },
            },
          }),
        ],
        stubs: { NuxtLink: NuxtLinkStub },
      },
    })
  }

  // ── Pricing columns (always visible) ────────────────────────

  describe('pricing columns', () => {
    it('renders the Free tier column with "Plan Gratuito" heading', async () => {
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('Plan Gratuito')
    })

    it('Free column shows "Comenzar gratis" link to /register', async () => {
      const wrapper = await mountTable()
      const registerLink = wrapper.find('a[href="/register"]')
      expect(registerLink.exists()).toBe(true)
      expect(registerLink.text()).toContain('Comenzar gratis')
    })

    it('renders the monthly plan name "PRO Mensual"', async () => {
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('PRO Mensual')
    })

    it('renders the annual plan name "PRO Anual"', async () => {
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('PRO Anual')
    })

    it('does not show loading skeleton (plans are always available)', async () => {
      const wrapper = await mountTable()
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })
  })

  // ── Features list ──────────────────────────────────────────

  describe('features list', () => {
    it('renders features for the monthly plan', async () => {
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('Mascotas ilimitadas')
      expect(wrapper.text()).toContain('Exportar perfil en PDF')
      expect(wrapper.text()).toContain('Soporte prioritario')
    })

    it('renders the extra annual plan feature ("2 meses gratis")', async () => {
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('2 meses gratis')
    })
  })

  // ── select-plan emit ───────────────────────────────────────

  describe('select-plan event', () => {
    it('emits "select-plan" with "pro_monthly" when monthly CTA clicked', async () => {
      const wrapper = await mountTable()

      // Monthly plan CTA: btn-outline-primary
      const monthlyBtn = wrapper.find('button.btn-outline-primary')
      await monthlyBtn.trigger('click')

      expect(wrapper.emitted('select-plan')).toHaveLength(1)
      expect(wrapper.emitted('select-plan')![0]).toEqual(['pro_monthly'])
    })

    it('emits "select-plan" with "pro_annual" when annual CTA clicked', async () => {
      const wrapper = await mountTable()

      // Annual plan CTA: btn-primary (solid, not outline)
      const annualBtn = wrapper.find('button.btn-primary')
      await annualBtn.trigger('click')

      expect(wrapper.emitted('select-plan')).toHaveLength(1)
      expect(wrapper.emitted('select-plan')![0]).toEqual(['pro_annual'])
    })
  })

  // ── "Más popular" badge ────────────────────────────────────

  describe('"Más popular" badge', () => {
    it('shows "Más popular" badge for the annual plan (is_popular: true)', async () => {
      const wrapper = await mountTable()
      const popularBadge = wrapper.find('.pricing-table__popular-badge')
      expect(popularBadge.exists()).toBe(true)
      expect(popularBadge.text()).toBe('Más popular')
    })

    it('shows "Más popular" aria-label on the badge', async () => {
      const wrapper = await mountTable()
      expect(wrapper.find('[aria-label="Plan más popular"]').exists()).toBe(true)
    })
  })

  // ── Annual savings badge ───────────────────────────────────

  describe('annual savings badge', () => {
    it('shows savings percentage (33% for 15000*12=180000 vs 120000)', async () => {
      const wrapper = await mountTable()
      const savingsBadge = wrapper.find('.pricing-table__savings-badge')
      expect(savingsBadge.exists()).toBe(true)
      expect(savingsBadge.text()).toContain('Ahorra')
      expect(savingsBadge.text()).toContain('33%')
    })
  })

  // ── "Plan activo ✓" badge ──────────────────────────────────

  describe('"Plan activo" badge', () => {
    it('shows "Plan activo ✓" for the active plan when user is PRO', async () => {
      mockSubscriptionRef.value = {
        is_pro: true,
        is_active: true,
        subscription_plan: 'pro_monthly',
        subscription_expires_at: '2026-02-01T00:00:00Z',
        days_remaining: 30,
      }

      const wrapper = await mountSuspended(PricingTable, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              createSpy: vi.fn,
              initialState: {
                auth: {
                  token: 'test-jwt',
                  currentEntity: { id: 1, is_pro: true },
                  entityType: 'user',
                },
              },
            }),
          ],
          stubs: { NuxtLink: NuxtLinkStub },
        },
      })

      expect(wrapper.text()).toContain('Plan activo')
    })

    it('does not show "Plan activo ✓" for a non-PRO user', async () => {
      mockSubscriptionRef.value = null
      const wrapper = await mountTable({ isPro: false })
      expect(wrapper.text()).not.toContain('Plan activo')
    })
  })

  // ── Section structure ──────────────────────────────────────

  describe('section structure', () => {
    it('renders the section with aria-label "Planes y precios de Mopetoo"', async () => {
      const wrapper = await mountTable()
      expect(wrapper.find('section[aria-label="Planes y precios de Mopetoo"]').exists()).toBe(true)
    })

    it('renders the "Planes y precios" heading', async () => {
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('Planes y precios')
    })
  })
})
