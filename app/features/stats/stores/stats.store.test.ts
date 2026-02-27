// ============================================================
// stats.store.test.ts
// Unit tests for useStatsStore.
//
// Strategy:
//   - setActivePinia(createPinia()) before each test for full isolation.
//   - Tests cover initial state, all getters, all actions, and clearStats.
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStatsStore } from './stats.store'
import type { StatsOverview, RevenueDataPoint, ActivityEntry } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeOverview(overrides: Partial<StatsOverview> = {}): StatsOverview {
  return {
    total_users: 100,
    total_pets: 250,
    total_shelters: 15,
    total_clinics: 20,
    total_stores: 30,
    total_adoptions: 45,
    total_pro_subscriptions: 60,
    total_donations: 80,
    revenue_total: 5_000_000,
    revenue_month: 300_000,
    ...overrides,
  }
}

function makeRevenuePoint(overrides: Partial<RevenueDataPoint> = {}): RevenueDataPoint {
  return {
    month: '2025-01',
    subscriptions: 1_000_000,
    donations: 200_000,
    total: 1_200_000,
    ...overrides,
  }
}

function makeActivityEntry(overrides: Partial<ActivityEntry> = {}): ActivityEntry {
  return {
    id: 'act-1',
    type: 'user_registered',
    description: 'Usuario registrado: test@example.com',
    user_email: 'test@example.com',
    created_at: '2025-01-15T10:30:00Z',
    ...overrides,
  }
}

// ── Suite ─────────────────────────────────────────────────────

describe('useStatsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── Initial state ────────────────────────────────────────────

  describe('initial state', () => {
    it('overview is null', () => {
      const store = useStatsStore()
      expect(store.overview).toBeNull()
    })

    it('revenueData is an empty array', () => {
      const store = useStatsStore()
      expect(store.revenueData).toEqual([])
    })

    it('activityEntries is an empty array', () => {
      const store = useStatsStore()
      expect(store.activityEntries).toEqual([])
    })

    it('totalActivity is 0', () => {
      const store = useStatsStore()
      expect(store.totalActivity).toBe(0)
    })

    it('isLoading is false', () => {
      const store = useStatsStore()
      expect(store.isLoading).toBe(false)
    })

    it('hasOverview is false', () => {
      const store = useStatsStore()
      expect(store.hasOverview).toBe(false)
    })

    it('hasRevenueData is false', () => {
      const store = useStatsStore()
      expect(store.hasRevenueData).toBe(false)
    })

    it('hasActivity is false', () => {
      const store = useStatsStore()
      expect(store.hasActivity).toBe(false)
    })
  })

  // ── setOverview ──────────────────────────────────────────────

  describe('setOverview', () => {
    it('stores the overview object', () => {
      const store = useStatsStore()
      const data = makeOverview({ total_users: 42 })
      store.setOverview(data)
      expect(store.overview).toEqual(data)
    })

    it('hasOverview becomes true', () => {
      const store = useStatsStore()
      store.setOverview(makeOverview())
      expect(store.hasOverview).toBe(true)
    })

    it('replaces previous overview on second call', () => {
      const store = useStatsStore()
      store.setOverview(makeOverview({ total_users: 10 }))
      store.setOverview(makeOverview({ total_users: 99 }))
      expect(store.overview!.total_users).toBe(99)
    })

    it('does not affect revenueData or activityEntries', () => {
      const store = useStatsStore()
      store.setOverview(makeOverview())
      expect(store.revenueData).toEqual([])
      expect(store.activityEntries).toEqual([])
    })
  })

  // ── setRevenueData ───────────────────────────────────────────

  describe('setRevenueData', () => {
    it('stores the revenue array', () => {
      const store = useStatsStore()
      const data = [makeRevenuePoint({ month: '2025-01' }), makeRevenuePoint({ month: '2025-02' })]
      store.setRevenueData(data)
      expect(store.revenueData).toEqual(data)
    })

    it('hasRevenueData becomes true when array is non-empty', () => {
      const store = useStatsStore()
      store.setRevenueData([makeRevenuePoint()])
      expect(store.hasRevenueData).toBe(true)
    })

    it('hasRevenueData is false when array is empty', () => {
      const store = useStatsStore()
      store.setRevenueData([makeRevenuePoint()])
      store.setRevenueData([])
      expect(store.hasRevenueData).toBe(false)
    })

    it('replaces previous data on second call', () => {
      const store = useStatsStore()
      store.setRevenueData([makeRevenuePoint({ month: '2025-01' })])
      store.setRevenueData([makeRevenuePoint({ month: '2025-06' })])
      expect(store.revenueData[0].month).toBe('2025-06')
      expect(store.revenueData).toHaveLength(1)
    })

    it('does not affect overview or activityEntries', () => {
      const store = useStatsStore()
      store.setRevenueData([makeRevenuePoint()])
      expect(store.overview).toBeNull()
      expect(store.activityEntries).toEqual([])
    })
  })

  // ── setActivityEntries ───────────────────────────────────────

  describe('setActivityEntries', () => {
    it('stores the activity array', () => {
      const store = useStatsStore()
      const entries = [makeActivityEntry({ id: 'a1' }), makeActivityEntry({ id: 'a2' })]
      store.setActivityEntries(entries, 2)
      expect(store.activityEntries).toEqual(entries)
    })

    it('stores the total count', () => {
      const store = useStatsStore()
      store.setActivityEntries([makeActivityEntry()], 150)
      expect(store.totalActivity).toBe(150)
    })

    it('hasActivity becomes true when array is non-empty', () => {
      const store = useStatsStore()
      store.setActivityEntries([makeActivityEntry()], 1)
      expect(store.hasActivity).toBe(true)
    })

    it('hasActivity is false when array is empty', () => {
      const store = useStatsStore()
      store.setActivityEntries([makeActivityEntry()], 1)
      store.setActivityEntries([], 0)
      expect(store.hasActivity).toBe(false)
    })

    it('totalActivity updates to 0 on empty call', () => {
      const store = useStatsStore()
      store.setActivityEntries([makeActivityEntry()], 42)
      store.setActivityEntries([], 0)
      expect(store.totalActivity).toBe(0)
    })

    it('replaces previous entries on second call', () => {
      const store = useStatsStore()
      store.setActivityEntries([makeActivityEntry({ id: 'old' })], 1)
      store.setActivityEntries([makeActivityEntry({ id: 'new' })], 1)
      expect(store.activityEntries[0].id).toBe('new')
    })

    it('does not affect overview or revenueData', () => {
      const store = useStatsStore()
      store.setActivityEntries([makeActivityEntry()], 1)
      expect(store.overview).toBeNull()
      expect(store.revenueData).toEqual([])
    })
  })

  // ── setLoading ───────────────────────────────────────────────

  describe('setLoading', () => {
    it('sets isLoading to true', () => {
      const store = useStatsStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading to false', () => {
      const store = useStatsStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })
  })

  // ── clearStats ───────────────────────────────────────────────

  describe('clearStats', () => {
    it('resets overview to null', () => {
      const store = useStatsStore()
      store.setOverview(makeOverview())
      store.clearStats()
      expect(store.overview).toBeNull()
    })

    it('resets revenueData to empty array', () => {
      const store = useStatsStore()
      store.setRevenueData([makeRevenuePoint()])
      store.clearStats()
      expect(store.revenueData).toEqual([])
    })

    it('resets activityEntries to empty array', () => {
      const store = useStatsStore()
      store.setActivityEntries([makeActivityEntry()], 1)
      store.clearStats()
      expect(store.activityEntries).toEqual([])
    })

    it('resets totalActivity to 0', () => {
      const store = useStatsStore()
      store.setActivityEntries([makeActivityEntry()], 99)
      store.clearStats()
      expect(store.totalActivity).toBe(0)
    })

    it('resets isLoading to false', () => {
      const store = useStatsStore()
      store.setLoading(true)
      store.clearStats()
      expect(store.isLoading).toBe(false)
    })

    it('hasOverview is false after clear', () => {
      const store = useStatsStore()
      store.setOverview(makeOverview())
      store.clearStats()
      expect(store.hasOverview).toBe(false)
    })

    it('hasRevenueData is false after clear', () => {
      const store = useStatsStore()
      store.setRevenueData([makeRevenuePoint()])
      store.clearStats()
      expect(store.hasRevenueData).toBe(false)
    })

    it('hasActivity is false after clear', () => {
      const store = useStatsStore()
      store.setActivityEntries([makeActivityEntry()], 1)
      store.clearStats()
      expect(store.hasActivity).toBe(false)
    })
  })

  // ── Integration ──────────────────────────────────────────────

  describe('integration', () => {
    it('supports a full load-then-clear cycle', () => {
      const store = useStatsStore()
      store.setLoading(true)
      store.setOverview(makeOverview())
      store.setRevenueData([makeRevenuePoint()])
      store.setActivityEntries([makeActivityEntry()], 1)
      store.setLoading(false)
      expect(store.hasOverview).toBe(true)
      expect(store.hasRevenueData).toBe(true)
      expect(store.hasActivity).toBe(true)
      store.clearStats()
      expect(store.hasOverview).toBe(false)
      expect(store.hasRevenueData).toBe(false)
      expect(store.hasActivity).toBe(false)
      expect(store.isLoading).toBe(false)
    })

    it('isLoading false does not affect data state', () => {
      const store = useStatsStore()
      store.setOverview(makeOverview())
      store.setLoading(false)
      expect(store.hasOverview).toBe(true)
    })
  })
})
