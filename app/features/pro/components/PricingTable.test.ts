// ============================================================
// PricingTable.test.ts
// Tests for the PricingTable component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// calls usePro() and useAuthStore() directly. We mock usePro at the
// composable boundary via module-level reactive refs (the canonical
// pattern for List/Detail components — see MEMORY.md).
//
// useAuthStore is injected via createTestingPinia + initialState so we
// can control isPro, isSubscribed, and subscription.plan_id.
//
// Key behaviours tested:
//   - Skeleton shown while isLoading is true.
//   - 3 columns rendered when plans are loaded (Free + Monthly + Annual).
//   - Free column "Comenzar gratis" links to /register.
//   - PRO column CTA emits `select-plan` with the plan ID.
//   - Annual savings badge computed and shown correctly.
//   - "Más popular" badge shown for is_popular plans.
//   - "Plan activo ✓" badge shown for the active plan (PRO user).
//   - Features list rendered for each plan.
//   - Empty state shown when no plans and not loading.
//   - fetchPlans called on mount when plans not loaded.
//   - fetchPlans NOT called when plans are already in the store.
//
// What this suite does NOT cover intentionally:
//   - CSS transitions or hover effects.
//   - Actual HTTP calls (usePro composable is fully mocked).
//   - Currency formatting edge cases (Intl.NumberFormat — platform concern).
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
import PricingTable from './PricingTable.vue'
import type { ProPlan, ProSubscription } from '../types'

// ── localStorage stub (module-level) ─────────────────────────
const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))
vi.stubGlobal('localStorage', localStorageMock)

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

// ── usePro mock ───────────────────────────────────────────────
// Module-level reactive refs control what the component sees.
// The component reads proStore.getMonthlyPlan, proStore.getAnnualPlan,
// proStore.isLoading, proStore.hasPlans, and proStore.isSubscribed/subscription.

const mockFetchPlans = vi.fn()
const mockPlans = ref<ProPlan[]>([])
const mockIsLoading = ref(false)
const mockSubscriptionRef = ref<ProSubscription | null>(null)

vi.mock('../composables/usePro', () => ({
  usePro: () => ({
    fetchPlans: mockFetchPlans,
    proStore: {
      get plans() { return mockPlans.value },
      get isLoading() { return mockIsLoading.value },
      get hasPlans() { return mockPlans.value.length > 0 },
      get isSubscribed() { return mockSubscriptionRef.value?.status === 'active' },
      get subscription() { return mockSubscriptionRef.value },
      get getMonthlyPlan() { return mockPlans.value.find(p => p.interval === 'monthly') },
      get getAnnualPlan() { return mockPlans.value.find(p => p.interval === 'annual') },
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
    mockFetchPlans.mockReset()
    mockFetchPlans.mockResolvedValue(undefined)
    mockPlans.value = []
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

  // ── Lifecycle ──────────────────────────────────────────────

  describe('lifecycle', () => {
    it('calls fetchPlans on mount when plans are not loaded', async () => {
      // mockPlans.value is empty → hasPlans is false → fetchPlans should be called
      await mountTable()
      expect(mockFetchPlans).toHaveBeenCalledTimes(1)
    })

    it('does not call fetchPlans when plans are already loaded', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      await mountTable()
      expect(mockFetchPlans).not.toHaveBeenCalled()
    })
  })

  // ── Loading skeleton ───────────────────────────────────────

  describe('loading state', () => {
    it('renders the loading skeleton when isLoading is true', async () => {
      mockIsLoading.value = true
      const wrapper = await mountTable()
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('renders 3 skeleton columns while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountTable()
      const skeletonCards = wrapper.findAll('[aria-hidden="true"]')
      // 3 skeleton columns each with aria-hidden="true"
      expect(skeletonCards.length).toBeGreaterThanOrEqual(3)
    })

    it('shows aria-label "Cargando planes" on the skeleton container', async () => {
      mockIsLoading.value = true
      const wrapper = await mountTable()
      expect(wrapper.find('[aria-label="Cargando planes"]').exists()).toBe(true)
    })

    it('does not render the Free column while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountTable()
      expect(wrapper.text()).not.toContain('Plan Gratuito')
    })
  })

  // ── Pricing columns ────────────────────────────────────────

  describe('when plans are loaded', () => {
    beforeEach(() => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
    })

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

    it('renders the monthly plan name in the PRO monthly column', async () => {
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('PRO Mensual')
    })

    it('renders the annual plan name in the PRO annual column', async () => {
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('PRO Anual')
    })

    it('does not show loading skeleton when plans are loaded', async () => {
      const wrapper = await mountTable()
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('does not show the empty state when plans are loaded', async () => {
      const wrapper = await mountTable()
      expect(wrapper.text()).not.toContain('Los planes PRO no están disponibles')
    })
  })

  // ── Features list ──────────────────────────────────────────

  describe('features list', () => {
    it('renders features for the monthly plan', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('Mascotas ilimitadas')
      expect(wrapper.text()).toContain('Exportar PDF')
      expect(wrapper.text()).toContain('Soporte prioritario')
    })

    it('renders the extra annual plan feature ("2 meses gratis")', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('2 meses gratis')
    })
  })

  // ── select-plan emit ───────────────────────────────────────

  describe('select-plan event', () => {
    it('emits "select-plan" with the monthly plan ID when CTA clicked', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountTable()

      // Monthly plan CTA: btn-outline-primary
      const monthlyBtn = wrapper.find('button.btn-outline-primary')
      await monthlyBtn.trigger('click')

      expect(wrapper.emitted('select-plan')).toHaveLength(1)
      expect(wrapper.emitted('select-plan')![0]).toEqual(['plan-monthly'])
    })

    it('emits "select-plan" with the annual plan ID when CTA clicked', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountTable()

      // Annual plan CTA: btn-primary (solid, not outline)
      const annualBtn = wrapper.find('button.btn-primary')
      await annualBtn.trigger('click')

      expect(wrapper.emitted('select-plan')).toHaveLength(1)
      expect(wrapper.emitted('select-plan')![0]).toEqual(['plan-annual'])
    })
  })

  // ── "Más popular" badge ────────────────────────────────────

  describe('"Más popular" badge', () => {
    it('shows "Más popular" badge for the annual plan (is_popular: true)', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountTable()
      const popularBadge = wrapper.find('.pricing-table__popular-badge')
      expect(popularBadge.exists()).toBe(true)
      expect(popularBadge.text()).toBe('Más popular')
    })

    it('does not show "Más popular" badge for the monthly plan (is_popular: false)', async () => {
      // Set monthly plan as NOT popular, annual plan as popular
      const nonPopularMonthly = { ...mockMonthlyPlan, is_popular: false }
      mockPlans.value = [nonPopularMonthly, mockAnnualPlan]
      const wrapper = await mountTable()
      // Only one popular badge should exist (for the annual plan)
      const popularBadges = wrapper.findAll('.pricing-table__popular-badge')
      expect(popularBadges).toHaveLength(1)
    })

    it('shows "Más popular" aria-label on the badge', async () => {
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountTable()
      expect(wrapper.find('[aria-label="Plan más popular"]').exists()).toBe(true)
    })
  })

  // ── Annual savings badge ───────────────────────────────────

  describe('annual savings badge', () => {
    it('shows savings percentage when annual is cheaper than 12 × monthly', async () => {
      // 29900 * 12 = 358800; annual = 299000
      // savings = Math.round((358800 - 299000) / 358800 * 100) = Math.round(16.67) = 17%
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      const wrapper = await mountTable()
      const savingsBadge = wrapper.find('.pricing-table__savings-badge')
      expect(savingsBadge.exists()).toBe(true)
      expect(savingsBadge.text()).toContain('Ahorra')
      expect(savingsBadge.text()).toContain('%')
    })

    it('does not show savings badge when only one plan is loaded', async () => {
      mockPlans.value = [mockAnnualPlan]
      const wrapper = await mountTable()
      expect(wrapper.find('.pricing-table__savings-badge').exists()).toBe(false)
    })
  })

  // ── "Plan activo ✓" badge ──────────────────────────────────

  describe('"Plan activo" badge', () => {
    it('shows "Plan activo ✓" for the active plan when user is PRO', async () => {
      // isPro is a computed from currentUser.is_pro — must set currentUser, not isPro directly.
      // mockSubscriptionRef controls what proStore.subscription/isSubscribed return
      // (via the mock composable), so isActivePlan() sees isPro=true + isSubscribed=true +
      // subscription.plan_id === plan.id.
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      mockSubscriptionRef.value = mockSubscription // plan_id: 'plan-monthly', status: 'active'

      const wrapper = await mountSuspended(PricingTable, {
        global: {
          plugins: [
            createTestingPinia({
              stubActions: false,
              createSpy: vi.fn,
              initialState: {
                auth: {
                  token: 'test-jwt',
                  // isPro is computed from currentUser.is_pro — set it via currentUser
                  currentUser: { id: '1', is_pro: true },
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
      mockPlans.value = [mockMonthlyPlan, mockAnnualPlan]
      mockSubscriptionRef.value = null

      const wrapper = await mountTable({ isPro: false })
      expect(wrapper.text()).not.toContain('Plan activo')
    })
  })

  // ── Empty state ────────────────────────────────────────────

  describe('empty state', () => {
    it('shows the empty state message when plans array is empty and not loading', async () => {
      mockPlans.value = []
      mockIsLoading.value = false
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('Los planes PRO no están disponibles en este momento')
    })

    it('still renders the Free tier column in the empty state', async () => {
      // The Free tier is always shown — it is hardcoded, not from the API
      mockPlans.value = []
      mockIsLoading.value = false
      const wrapper = await mountTable()
      expect(wrapper.text()).toContain('Plan Gratuito')
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
