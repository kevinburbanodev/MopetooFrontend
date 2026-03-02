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
import type { StatsOverview, RevenueSeriesPoint, RevenueStats } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeOverview(overrides: Partial<StatsOverview> = {}): StatsOverview {
  return {
    generated_at: '2025-01-15T10:00:00Z',
    period: { from: '2025-01-01', to: '2025-01-31' },
    users: { total: 100, active: 90, suspended: 10, new_in_period: 5, pro_active: 20, free: 80, conversion_rate_pct: 20 },
    shelters: { total: 15, active: 12, suspended: 3, verified: 10 },
    stores: { total: 30, active: 28, suspended: 2, featured: 5 },
    clinics: { total: 20, active: 18, suspended: 2, pro: 8 },
    revenue_cop: { total_accumulated: 5_000_000, in_period: 300_000, monthly_subscriptions: 200_000, annual_subscriptions: 100_000, arpu: 15_000 },
    donations_cop: { total_amount: 1_000_000, in_period: 80_000, platform_fees_accumulated: 50_000, net_to_shelters: 950_000, total_count: 80, unique_donors: 40, avg_donation: 12_500 },
    content: { total_pets: 250, total_reminders: 500, total_medical_records: 300, active_adoption_listings: 45, adopted_in_period: 10, blog_posts_published: 25 },
    ...overrides,
  }
}

function makeSeriesPoint(overrides: Partial<RevenueSeriesPoint> = {}): RevenueSeriesPoint {
  return {
    date: '2025-01-01',
    revenue: 1_200_000,
    count: 15,
    ...overrides,
  }
}

function makeRevenueStats(overrides: Partial<RevenueStats> = {}): RevenueStats {
  return {
    generated_at: '2025-01-15T10:00:00Z',
    period: { from: '2025-01-01', to: '2025-01-31' },
    total_accumulated_cop: 5_000_000,
    in_period_cop: 300_000,
    by_plan: { pro_monthly: { revenue: 200_000, count: 10 } },
    approved_transactions: 25,
    arpu: 15_000,
    series: [makeSeriesPoint()],
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

    it('revenueStats is null', () => {
      const store = useStatsStore()
      expect(store.revenueStats).toBeNull()
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

    it('hasRevenueStats is false', () => {
      const store = useStatsStore()
      expect(store.hasRevenueStats).toBe(false)
    })
  })

  // ── setOverview ──────────────────────────────────────────────

  describe('setOverview', () => {
    it('stores the overview object', () => {
      const store = useStatsStore()
      const data = makeOverview()
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
      store.setOverview(makeOverview({ users: { total: 10, active: 9, suspended: 1, new_in_period: 1, pro_active: 2, free: 8, conversion_rate_pct: 20 } }))
      store.setOverview(makeOverview({ users: { total: 99, active: 90, suspended: 9, new_in_period: 5, pro_active: 20, free: 79, conversion_rate_pct: 20 } }))
      expect(store.overview!.users.total).toBe(99)
    })

    it('does not affect revenueData or revenueStats', () => {
      const store = useStatsStore()
      store.setOverview(makeOverview())
      expect(store.revenueData).toEqual([])
      expect(store.revenueStats).toBeNull()
    })
  })

  // ── setRevenueData ───────────────────────────────────────────

  describe('setRevenueData', () => {
    it('stores the revenue series array', () => {
      const store = useStatsStore()
      const data = [makeSeriesPoint({ date: '2025-01-01' }), makeSeriesPoint({ date: '2025-02-01' })]
      store.setRevenueData(data)
      expect(store.revenueData).toEqual(data)
    })

    it('hasRevenueData becomes true when array is non-empty', () => {
      const store = useStatsStore()
      store.setRevenueData([makeSeriesPoint()])
      expect(store.hasRevenueData).toBe(true)
    })

    it('hasRevenueData is false when array is empty', () => {
      const store = useStatsStore()
      store.setRevenueData([makeSeriesPoint()])
      store.setRevenueData([])
      expect(store.hasRevenueData).toBe(false)
    })

    it('replaces previous data on second call', () => {
      const store = useStatsStore()
      store.setRevenueData([makeSeriesPoint({ date: '2025-01-01' })])
      store.setRevenueData([makeSeriesPoint({ date: '2025-06-01' })])
      expect(store.revenueData[0].date).toBe('2025-06-01')
      expect(store.revenueData).toHaveLength(1)
    })

    it('does not affect overview or revenueStats', () => {
      const store = useStatsStore()
      store.setRevenueData([makeSeriesPoint()])
      expect(store.overview).toBeNull()
      expect(store.revenueStats).toBeNull()
    })
  })

  // ── setRevenueStats ───────────────────────────────────────────

  describe('setRevenueStats', () => {
    it('stores the revenue stats object', () => {
      const store = useStatsStore()
      const data = makeRevenueStats()
      store.setRevenueStats(data)
      expect(store.revenueStats).toEqual(data)
    })

    it('hasRevenueStats becomes true', () => {
      const store = useStatsStore()
      store.setRevenueStats(makeRevenueStats())
      expect(store.hasRevenueStats).toBe(true)
    })

    it('replaces previous stats on second call', () => {
      const store = useStatsStore()
      store.setRevenueStats(makeRevenueStats({ total_accumulated_cop: 100 }))
      store.setRevenueStats(makeRevenueStats({ total_accumulated_cop: 999 }))
      expect(store.revenueStats!.total_accumulated_cop).toBe(999)
    })

    it('does not affect overview or revenueData', () => {
      const store = useStatsStore()
      store.setRevenueStats(makeRevenueStats())
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
      store.setRevenueData([makeSeriesPoint()])
      store.clearStats()
      expect(store.revenueData).toEqual([])
    })

    it('resets revenueStats to null', () => {
      const store = useStatsStore()
      store.setRevenueStats(makeRevenueStats())
      store.clearStats()
      expect(store.revenueStats).toBeNull()
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
      store.setRevenueData([makeSeriesPoint()])
      store.clearStats()
      expect(store.hasRevenueData).toBe(false)
    })

    it('hasRevenueStats is false after clear', () => {
      const store = useStatsStore()
      store.setRevenueStats(makeRevenueStats())
      store.clearStats()
      expect(store.hasRevenueStats).toBe(false)
    })
  })

  // ── Integration ──────────────────────────────────────────────

  describe('integration', () => {
    it('supports a full load-then-clear cycle', () => {
      const store = useStatsStore()
      store.setLoading(true)
      store.setOverview(makeOverview())
      store.setRevenueData([makeSeriesPoint()])
      store.setRevenueStats(makeRevenueStats())
      store.setLoading(false)
      expect(store.hasOverview).toBe(true)
      expect(store.hasRevenueData).toBe(true)
      expect(store.hasRevenueStats).toBe(true)
      store.clearStats()
      expect(store.hasOverview).toBe(false)
      expect(store.hasRevenueData).toBe(false)
      expect(store.hasRevenueStats).toBe(false)
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
