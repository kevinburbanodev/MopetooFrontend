// ============================================================
// pro.store.test.ts
// Tests the useProStore Pinia store in isolation.
//
// Strategy: uses the real store (no stubActions) so that action
// implementations are exercised, not mocked away. Each test gets
// a fresh pinia via setActivePinia(createPinia()) in beforeEach.
//
// Key design changes from Stripe version:
//   - Plans removed from store — now hardcoded in PRO_PLANS constant.
//   - Subscription type: SubscriptionStatus (is_pro, is_active, etc.)
//   - isSubscribed: is_pro && is_active (not status === 'active').
//   - No setPlans, hasPlans, getMonthlyPlan, getAnnualPlan.
//
// What this suite does NOT cover intentionally:
//   - HTTP / API calls — those are composable concerns (usePro.test.ts)
//   - Component rendering — covered in component test files
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useProStore } from './pro.store'
import type { SubscriptionStatus } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

const mockSubscription: SubscriptionStatus = {
  is_pro: true,
  is_active: true,
  subscription_plan: 'pro_monthly',
  subscription_expires_at: '2026-02-01T00:00:00Z',
  days_remaining: 30,
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

    it('has isLoading as false', () => {
      const store = useProStore()
      expect(store.isLoading).toBe(false)
    })

    it('isSubscribed is false with no subscription', () => {
      const store = useProStore()
      expect(store.isSubscribed).toBe(false)
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
      const updated = { ...mockSubscription, subscription_plan: 'pro_annual' }
      store.setSubscription(updated)
      expect(store.subscription?.subscription_plan).toBe('pro_annual')
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
      expect(store.subscription?.is_pro).toBe(true)
      expect(store.subscription?.is_active).toBe(true)
      expect(store.subscription?.subscription_plan).toBe('pro_monthly')
      expect(store.subscription?.days_remaining).toBe(30)
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

    it('does not affect isLoading', () => {
      const store = useProStore()
      store.setLoading(true)
      store.setSubscription(mockSubscription)
      store.clearSubscription()
      expect(store.isLoading).toBe(true)
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

    it('does not affect subscription', () => {
      const store = useProStore()
      store.setSubscription(mockSubscription)
      store.setLoading(true)
      expect(store.subscription).toEqual(mockSubscription)
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

    it('resets isLoading to false', () => {
      const store = useProStore()
      store.setLoading(true)
      store.clearPro()
      expect(store.isLoading).toBe(false)
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
      expect(store.isLoading).toBe(false)
    })
  })

  // ── isSubscribed getter ────────────────────────────────────

  describe('isSubscribed getter', () => {
    it('is true when is_pro=true and is_active=true', () => {
      const store = useProStore()
      store.setSubscription({ ...mockSubscription, is_pro: true, is_active: true })
      expect(store.isSubscribed).toBe(true)
    })

    it('is false when is_pro=true but is_active=false', () => {
      const store = useProStore()
      store.setSubscription({ ...mockSubscription, is_pro: true, is_active: false })
      expect(store.isSubscribed).toBe(false)
    })

    it('is false when is_pro=false and is_active=true', () => {
      const store = useProStore()
      store.setSubscription({ ...mockSubscription, is_pro: false, is_active: true })
      expect(store.isSubscribed).toBe(false)
    })

    it('is false when is_pro=false and is_active=false', () => {
      const store = useProStore()
      store.setSubscription({ ...mockSubscription, is_pro: false, is_active: false })
      expect(store.isSubscribed).toBe(false)
    })

    it('is false when subscription is null', () => {
      const store = useProStore()
      expect(store.isSubscribed).toBe(false)
    })

    it('transitions from false to true when subscription becomes active', () => {
      const store = useProStore()
      expect(store.isSubscribed).toBe(false)
      store.setSubscription(mockSubscription)
      expect(store.isSubscribed).toBe(true)
    })
  })
})
