// ============================================================
// useStats.test.ts
// Tests the useStats composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT used.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs and we can spy on it.
//   - Tests verify: endpoint calls, query params, loading flags,
//     error extraction, store mutation correctness, and RevenueStats
//     aggregate handling.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { StatsOverview, RevenueStats, RevenueSeriesPoint } from '../types'

// ── useApi mock ───────────────────────────────────────────────

const mockGet = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet }),
}))

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

describe('useStats', () => {
  let statsStore: ReturnType<typeof import('../stores/stats.store').useStatsStore>

  beforeEach(async () => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )
    const { useStatsStore } = await import('../stores/stats.store')
    statsStore = useStatsStore()
    mockGet.mockReset()
  })

  // ── fetchOverview ─────────────────────────────────────────────

  describe('fetchOverview', () => {
    it('calls GET /api/admin/stats/overview', async () => {
      mockGet.mockResolvedValue(makeOverview())
      const { fetchOverview } = useStats()
      await fetchOverview()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/stats/overview')
    })

    it('stores overview from direct response', async () => {
      const data = makeOverview()
      mockGet.mockResolvedValue(data)
      const { fetchOverview } = useStats()
      await fetchOverview()
      expect(statsStore.overview).toEqual(data)
    })

    it('hasOverview is true after successful fetch', async () => {
      mockGet.mockResolvedValue(makeOverview())
      const { fetchOverview } = useStats()
      await fetchOverview()
      expect(statsStore.hasOverview).toBe(true)
    })

    it('stores the nested users structure', async () => {
      const data = makeOverview()
      mockGet.mockResolvedValue(data)
      const { fetchOverview } = useStats()
      await fetchOverview()
      expect(statsStore.overview!.users.total).toBe(100)
      expect(statsStore.overview!.users.pro_active).toBe(20)
    })

    it('stores the nested revenue_cop structure', async () => {
      const data = makeOverview()
      mockGet.mockResolvedValue(data)
      const { fetchOverview } = useStats()
      await fetchOverview()
      expect(statsStore.overview!.revenue_cop.total_accumulated).toBe(5_000_000)
      expect(statsStore.overview!.revenue_cop.in_period).toBe(300_000)
    })

    it('sets isLoading to true during the request and false after', async () => {
      const loadingStates: boolean[] = []
      mockGet.mockImplementation(async () => {
        loadingStates.push(statsStore.isLoading)
        return makeOverview()
      })
      const { fetchOverview } = useStats()
      await fetchOverview()
      expect(loadingStates[0]).toBe(true)
      expect(statsStore.isLoading).toBe(false)
    })

    it('sets isLoading false even when request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'))
      const { fetchOverview } = useStats()
      await fetchOverview()
      expect(statsStore.isLoading).toBe(false)
    })

    it('sets error message on API failure', async () => {
      mockGet.mockRejectedValue({ message: 'Servidor no disponible' })
      const { fetchOverview, error } = useStats()
      await fetchOverview()
      expect(error.value).toBe('Servidor no disponible')
    })

    it('clears error on successful fetch after previous error', async () => {
      mockGet.mockRejectedValue({ message: 'Error' })
      const { fetchOverview, error } = useStats()
      await fetchOverview()
      expect(error.value).not.toBeNull()
      mockGet.mockResolvedValue(makeOverview())
      await fetchOverview()
      expect(error.value).toBeNull()
    })

    it('extracts error from { data: { error: "..." } } API error shape', async () => {
      mockGet.mockRejectedValue({ data: { error: 'Acceso denegado' } })
      const { fetchOverview, error } = useStats()
      await fetchOverview()
      expect(error.value).toBe('Acceso denegado')
    })

    it('uses generic fallback message for unknown error shape', async () => {
      mockGet.mockRejectedValue('string error')
      const { fetchOverview, error } = useStats()
      await fetchOverview()
      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('does not mutate revenueData', async () => {
      mockGet.mockResolvedValue(makeOverview())
      const { fetchOverview } = useStats()
      await fetchOverview()
      expect(statsStore.revenueData).toEqual([])
    })
  })

  // ── fetchRevenueData ──────────────────────────────────────────

  describe('fetchRevenueData', () => {
    it('calls GET /api/admin/stats/revenue without params when no filters', async () => {
      mockGet.mockResolvedValue(makeRevenueStats())
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/stats/revenue')
    })

    it('includes from param in query string when filter provided', async () => {
      mockGet.mockResolvedValue(makeRevenueStats())
      const { fetchRevenueData } = useStats()
      await fetchRevenueData({ from: '2025-01-01' })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/stats/revenue?from=2025-01-01')
    })

    it('includes both from and to params when both provided', async () => {
      mockGet.mockResolvedValue(makeRevenueStats())
      const { fetchRevenueData } = useStats()
      await fetchRevenueData({ from: '2025-01-01', to: '2025-06-30' })
      const calledPath = mockGet.mock.calls[0][0] as string
      expect(calledPath).toContain('from=2025-01-01')
      expect(calledPath).toContain('to=2025-06-30')
    })

    it('stores the series array in revenueData', async () => {
      const series = [makeSeriesPoint({ date: '2025-01-01' }), makeSeriesPoint({ date: '2025-02-01' })]
      mockGet.mockResolvedValue(makeRevenueStats({ series }))
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(statsStore.revenueData).toEqual(series)
    })

    it('stores the full RevenueStats object in revenueStats', async () => {
      const data = makeRevenueStats({ total_accumulated_cop: 9_999 })
      mockGet.mockResolvedValue(data)
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(statsStore.revenueStats).toEqual(data)
    })

    it('hasRevenueStats is true after successful fetch', async () => {
      mockGet.mockResolvedValue(makeRevenueStats())
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(statsStore.hasRevenueStats).toBe(true)
    })

    it('hasRevenueData is true when series is non-empty', async () => {
      mockGet.mockResolvedValue(makeRevenueStats({ series: [makeSeriesPoint()] }))
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(statsStore.hasRevenueData).toBe(true)
    })

    it('sets revenueLoading true during fetch and false after', async () => {
      const loadingStates: boolean[] = []
      const { fetchRevenueData, revenueLoading } = useStats()
      mockGet.mockImplementation(async () => {
        loadingStates.push(revenueLoading.value)
        return makeRevenueStats()
      })
      await fetchRevenueData()
      expect(loadingStates[0]).toBe(true)
      expect(revenueLoading.value).toBe(false)
    })

    it('sets revenueLoading false even when request fails', async () => {
      mockGet.mockRejectedValue(new Error('fail'))
      const { fetchRevenueData, revenueLoading } = useStats()
      await fetchRevenueData()
      expect(revenueLoading.value).toBe(false)
    })

    it('sets error on API failure', async () => {
      mockGet.mockRejectedValue({ message: 'Error de datos' })
      const { fetchRevenueData, error } = useStats()
      await fetchRevenueData()
      expect(error.value).toBe('Error de datos')
    })

    it('does not affect store isLoading flag', async () => {
      mockGet.mockResolvedValue(makeRevenueStats())
      const { fetchRevenueData } = useStats()
      statsStore.setLoading(false)
      await fetchRevenueData()
      expect(statsStore.isLoading).toBe(false)
    })

    it('stores aggregates (total_accumulated_cop, approved_transactions, arpu)', async () => {
      const data = makeRevenueStats({
        total_accumulated_cop: 10_000_000,
        approved_transactions: 50,
        arpu: 20_000,
      })
      mockGet.mockResolvedValue(data)
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(statsStore.revenueStats!.total_accumulated_cop).toBe(10_000_000)
      expect(statsStore.revenueStats!.approved_transactions).toBe(50)
      expect(statsStore.revenueStats!.arpu).toBe(20_000)
    })

    it('stores by_plan breakdown', async () => {
      const data = makeRevenueStats({
        by_plan: {
          pro_monthly: { revenue: 200_000, count: 10 },
          pro_annual: { revenue: 500_000, count: 5 },
        },
      })
      mockGet.mockResolvedValue(data)
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(statsStore.revenueStats!.by_plan.pro_monthly.revenue).toBe(200_000)
      expect(statsStore.revenueStats!.by_plan.pro_annual.count).toBe(5)
    })
  })
})
