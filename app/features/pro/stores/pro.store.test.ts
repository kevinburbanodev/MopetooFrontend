// ============================================================
// pro.store.test.ts
// Tests the useProStore Pinia store in isolation.
//
// Strategy: uses the real store (no stubActions) so that action
// implementations are exercised, not mocked away. Each test gets
// a fresh pinia via setActivePinia(createPinia()) in beforeEach.
//
// What this suite does NOT cover intentionally:
//   - HTTP / API calls — those are composable concerns (usePro.test.ts)
//   - Component rendering — covered in component test files
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProStore } from './pro.store'
import type { ProPlan, ProSubscription } from '../types'

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

describe('useProStore', () => {
  beforeEach(() => {
    // Fresh pinia per test — no state leaks between tests
    setActivePinia(createPinia())
  })

  // ── Initial state ──────────────────────────────────────────

  describe('initial state', () => {
    it('has subscription as null', () => {
      const store = useProStore()
      expect(store.subscription).toBeNull()
    })

    it('has an empty plans array', () => {
      const store = useProStore()
      expect(store.plans).toEqual([])
    })

    it('has isLoading as false', () => {
      const store = useProStore()
      expect(store.isLoading).toBe(false)
    })

    it('isSubscribed is false with no subscription', () => {
      const store = useProStore()
      expect(store.isSubscribed).toBe(false)
    })

    it('hasPlans is false with an empty plans array', () => {
      const store = useProStore()
      expect(store.hasPlans).toBe(false)
    })
  })

  // ── setSubscription ────────────────────────────────────────

  describe('setSubscription()', () => {
    it('sets subscription to the provided value', () => {
      const store = useProStore()
      store.setSubscription(mockSubscription)
      expect(store.subscription).toEqual(mockSubscription)
    })

    it('replaces a previously set subscription', () => {
      const store = useProStore()
      store.setSubscription(mockSubscription)
      const updated = { ...mockSubscription, plan_id: 'plan-annual' }
      store.setSubscription(updated)
      expect(store.subscription?.plan_id).toBe('plan-annual')
    })

    it('sets subscription to null when called with null', () => {
      const store = useProStore()
      store.setSubscription(mockSubscription)
      store.setSubscription(null)
      expect(store.subscription).toBeNull()
    })

    it('stores all subscription fields intact', () => {
      const store = useProStore()
      store.setSubscription(mockSubscription)
      expect(store.subscription?.id).toBe('sub-1')
      expect(store.subscription?.status).toBe('active')
      expect(store.subscription?.cancel_at_period_end).toBe(false)
    })
  })

  // ── clearSubscription ──────────────────────────────────────

  describe('clearSubscription()', () => {
    it('sets subscription to null', () => {
      const store = useProStore()
      store.setSubscription(mockSubscription)
      store.clearSubscription()
      expect(store.subscription).toBeNull()
    })

    it('is safe to call when subscription is already null', () => {
      const store = useProStore()
      expect(() => store.clearSubscription()).not.toThrow()
      expect(store.subscription).toBeNull()
    })

    it('does not affect the plans array', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan])
      store.setSubscription(mockSubscription)
      store.clearSubscription()
      expect(store.plans).toHaveLength(1)
    })
  })

  // ── setPlans ───────────────────────────────────────────────

  describe('setPlans()', () => {
    it('replaces the plans array with the provided list', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan, mockAnnualPlan])
      expect(store.plans).toEqual([mockMonthlyPlan, mockAnnualPlan])
    })

    it('overwrites any previously stored plans', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan])
      store.setPlans([mockAnnualPlan])
      expect(store.plans).toEqual([mockAnnualPlan])
    })

    it('accepts an empty array, clearing all plans', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan])
      store.setPlans([])
      expect(store.plans).toEqual([])
    })

    it('makes hasPlans true after setting a non-empty array', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan])
      expect(store.hasPlans).toBe(true)
    })
  })

  // ── setLoading ─────────────────────────────────────────────

  describe('setLoading()', () => {
    it('sets isLoading to true', () => {
      const store = useProStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading back to false', () => {
      const store = useProStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('is idempotent when called with the same value', () => {
      const store = useProStore()
      store.setLoading(false)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('does not affect subscription or plans', () => {
      const store = useProStore()
      store.setSubscription(mockSubscription)
      store.setPlans([mockMonthlyPlan])
      store.setLoading(true)
      expect(store.subscription).toEqual(mockSubscription)
      expect(store.plans).toHaveLength(1)
    })
  })

  // ── clearPro ───────────────────────────────────────────────

  describe('clearPro()', () => {
    it('resets subscription to null', () => {
      const store = useProStore()
      store.setSubscription(mockSubscription)
      store.clearPro()
      expect(store.subscription).toBeNull()
    })

    it('resets plans to an empty array', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan, mockAnnualPlan])
      store.clearPro()
      expect(store.plans).toEqual([])
    })

    it('resets isLoading to false', () => {
      const store = useProStore()
      store.setLoading(true)
      store.clearPro()
      expect(store.isLoading).toBe(false)
    })

    it('makes hasPlans false after clearing', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan])
      store.clearPro()
      expect(store.hasPlans).toBe(false)
    })

    it('makes isSubscribed false after clearing', () => {
      const store = useProStore()
      store.setSubscription(mockSubscription)
      store.clearPro()
      expect(store.isSubscribed).toBe(false)
    })

    it('is safe to call when already in initial state', () => {
      const store = useProStore()
      expect(() => store.clearPro()).not.toThrow()
      expect(store.subscription).toBeNull()
      expect(store.plans).toEqual([])
      expect(store.isLoading).toBe(false)
    })
  })

  // ── isSubscribed getter ────────────────────────────────────

  describe('isSubscribed getter', () => {
    it('is true when subscription status is "active"', () => {
      const store = useProStore()
      store.setSubscription({ ...mockSubscription, status: 'active' })
      expect(store.isSubscribed).toBe(true)
    })

    it('is false when subscription status is "canceled"', () => {
      const store = useProStore()
      store.setSubscription({ ...mockSubscription, status: 'canceled' })
      expect(store.isSubscribed).toBe(false)
    })

    it('is false when subscription status is "past_due"', () => {
      const store = useProStore()
      store.setSubscription({ ...mockSubscription, status: 'past_due' })
      expect(store.isSubscribed).toBe(false)
    })

    it('is false when subscription status is "inactive"', () => {
      const store = useProStore()
      store.setSubscription({ ...mockSubscription, status: 'inactive' })
      expect(store.isSubscribed).toBe(false)
    })

    it('is false when subscription is null', () => {
      const store = useProStore()
      // subscription starts as null
      expect(store.isSubscribed).toBe(false)
    })

    it('transitions from false to true when subscription becomes active', () => {
      const store = useProStore()
      expect(store.isSubscribed).toBe(false)
      store.setSubscription(mockSubscription)
      expect(store.isSubscribed).toBe(true)
    })
  })

  // ── hasPlans getter ────────────────────────────────────────

  describe('hasPlans getter', () => {
    it('is false when plans array is empty', () => {
      const store = useProStore()
      expect(store.hasPlans).toBe(false)
    })

    it('is true when at least one plan exists', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan])
      expect(store.hasPlans).toBe(true)
    })

    it('becomes false again after clearPro', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan])
      store.clearPro()
      expect(store.hasPlans).toBe(false)
    })

    it('stays true when multiple plans are loaded', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan, mockAnnualPlan])
      expect(store.hasPlans).toBe(true)
    })
  })

  // ── getMonthlyPlan getter ──────────────────────────────────

  describe('getMonthlyPlan getter', () => {
    it('returns undefined when plans array is empty', () => {
      const store = useProStore()
      expect(store.getMonthlyPlan).toBeUndefined()
    })

    it('returns the plan with interval === "monthly"', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan, mockAnnualPlan])
      expect(store.getMonthlyPlan).toEqual(mockMonthlyPlan)
    })

    it('returns undefined when only an annual plan is loaded', () => {
      const store = useProStore()
      store.setPlans([mockAnnualPlan])
      expect(store.getMonthlyPlan).toBeUndefined()
    })

    it('returns the correct plan when plans are in reverse order', () => {
      const store = useProStore()
      store.setPlans([mockAnnualPlan, mockMonthlyPlan])
      expect(store.getMonthlyPlan?.id).toBe('plan-monthly')
    })
  })

  // ── getAnnualPlan getter ───────────────────────────────────

  describe('getAnnualPlan getter', () => {
    it('returns undefined when plans array is empty', () => {
      const store = useProStore()
      expect(store.getAnnualPlan).toBeUndefined()
    })

    it('returns the plan with interval === "annual"', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan, mockAnnualPlan])
      expect(store.getAnnualPlan).toEqual(mockAnnualPlan)
    })

    it('returns undefined when only a monthly plan is loaded', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan])
      expect(store.getAnnualPlan).toBeUndefined()
    })

    it('returns the correct plan when plans are in reverse order', () => {
      const store = useProStore()
      store.setPlans([mockAnnualPlan, mockMonthlyPlan])
      expect(store.getAnnualPlan?.id).toBe('plan-annual')
    })

    it('is_popular field is preserved correctly', () => {
      const store = useProStore()
      store.setPlans([mockMonthlyPlan, mockAnnualPlan])
      expect(store.getAnnualPlan?.is_popular).toBe(true)
      expect(store.getMonthlyPlan?.is_popular).toBe(false)
    })
  })
})
