// ============================================================
// useStats.test.ts
// Tests the useStats composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT used.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs and we can spy on it.
//   - Tests verify: dual API shapes, query param building, loading flags,
//     error extraction, and store mutation correctness.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { StatsOverview, RevenueDataPoint, ActivityEntry } from '../types'

// ── useApi mock ───────────────────────────────────────────────

const mockGet = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet }),
}))

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
    it('calls GET /api/admin/stats', async () => {
      mockGet.mockResolvedValue(makeOverview())
      const { fetchOverview } = useStats()
      await fetchOverview()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/stats')
    })

    it('stores overview when response is a direct StatsOverview', async () => {
      const data = makeOverview({ total_users: 42 })
      mockGet.mockResolvedValue(data)
      const { fetchOverview } = useStats()
      await fetchOverview()
      expect(statsStore.overview).toEqual(data)
    })

    it('stores overview when response is { stats: StatsOverview } envelope', async () => {
      const data = makeOverview({ total_users: 77 })
      mockGet.mockResolvedValue({ stats: data })
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

    it('does not mutate revenueData or activityEntries', async () => {
      mockGet.mockResolvedValue(makeOverview())
      const { fetchOverview } = useStats()
      await fetchOverview()
      expect(statsStore.revenueData).toEqual([])
      expect(statsStore.activityEntries).toEqual([])
    })
  })

  // ── fetchRevenueData ──────────────────────────────────────────

  describe('fetchRevenueData', () => {
    it('calls GET /api/admin/stats/revenue without params when no filters', async () => {
      mockGet.mockResolvedValue([])
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/stats/revenue')
    })

    it('includes months param in query string when filter provided', async () => {
      mockGet.mockResolvedValue([])
      const { fetchRevenueData } = useStats()
      await fetchRevenueData({ months: 6 })
      expect(mockGet).toHaveBeenCalledWith('/api/admin/stats/revenue?months=6')
    })

    it('stores data when response is a direct RevenueDataPoint array', async () => {
      const data = [makeRevenuePoint({ month: '2025-01' }), makeRevenuePoint({ month: '2025-02' })]
      mockGet.mockResolvedValue(data)
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(statsStore.revenueData).toEqual(data)
    })

    it('stores data when response is { data: [...] } envelope', async () => {
      const data = [makeRevenuePoint({ month: '2025-03' })]
      mockGet.mockResolvedValue({ data })
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(statsStore.revenueData).toEqual(data)
    })

    it('stores empty array when envelope data field is missing', async () => {
      mockGet.mockResolvedValue({})
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(statsStore.revenueData).toEqual([])
    })

    it('sets revenueLoading true during fetch and false after', async () => {
      const loadingStates: boolean[] = []
      const { fetchRevenueData, revenueLoading } = useStats()
      mockGet.mockImplementation(async () => {
        loadingStates.push(revenueLoading.value)
        return []
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
      mockGet.mockResolvedValue([])
      const { fetchRevenueData } = useStats()
      statsStore.setLoading(false)
      await fetchRevenueData()
      expect(statsStore.isLoading).toBe(false)
    })

    it('does not mutate activityEntries', async () => {
      mockGet.mockResolvedValue([makeRevenuePoint()])
      const { fetchRevenueData } = useStats()
      await fetchRevenueData()
      expect(statsStore.activityEntries).toEqual([])
    })
  })

  // ── fetchActivityLog ──────────────────────────────────────────

  describe('fetchActivityLog', () => {
    it('calls GET /api/admin/stats/activity', async () => {
      mockGet.mockResolvedValue([])
      const { fetchActivityLog } = useStats()
      await fetchActivityLog()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/stats/activity')
    })

    it('stores entries when response is a direct ActivityEntry array', async () => {
      const entries = [makeActivityEntry({ id: 'a1' }), makeActivityEntry({ id: 'a2' })]
      mockGet.mockResolvedValue(entries)
      const { fetchActivityLog } = useStats()
      await fetchActivityLog()
      expect(statsStore.activityEntries).toEqual(entries)
    })

    it('sets totalActivity to array length for direct array response', async () => {
      const entries = [makeActivityEntry(), makeActivityEntry()]
      mockGet.mockResolvedValue(entries)
      const { fetchActivityLog } = useStats()
      await fetchActivityLog()
      expect(statsStore.totalActivity).toBe(2)
    })

    it('stores entries when response is { activities: [...], total: N } envelope', async () => {
      const entries = [makeActivityEntry({ id: 'b1' })]
      mockGet.mockResolvedValue({ activities: entries, total: 200 })
      const { fetchActivityLog } = useStats()
      await fetchActivityLog()
      expect(statsStore.activityEntries).toEqual(entries)
    })

    it('uses total from envelope response', async () => {
      const entries = [makeActivityEntry()]
      mockGet.mockResolvedValue({ activities: entries, total: 500 })
      const { fetchActivityLog } = useStats()
      await fetchActivityLog()
      expect(statsStore.totalActivity).toBe(500)
    })

    it('stores empty array when envelope activities field is missing', async () => {
      mockGet.mockResolvedValue({ total: 0 })
      const { fetchActivityLog } = useStats()
      await fetchActivityLog()
      expect(statsStore.activityEntries).toEqual([])
    })

    it('sets error on API failure', async () => {
      mockGet.mockRejectedValue({ message: 'Actividad no disponible' })
      const { fetchActivityLog, error } = useStats()
      await fetchActivityLog()
      expect(error.value).toBe('Actividad no disponible')
    })

    it('hasActivity is true after successful fetch with entries', async () => {
      mockGet.mockResolvedValue([makeActivityEntry()])
      const { fetchActivityLog } = useStats()
      await fetchActivityLog()
      expect(statsStore.hasActivity).toBe(true)
    })

    it('hasActivity is false after fetch with empty array', async () => {
      mockGet.mockResolvedValue([])
      const { fetchActivityLog } = useStats()
      await fetchActivityLog()
      expect(statsStore.hasActivity).toBe(false)
    })

    it('clears error on success after previous failure', async () => {
      mockGet.mockRejectedValue({ message: 'Error' })
      const { fetchActivityLog, error } = useStats()
      await fetchActivityLog()
      expect(error.value).not.toBeNull()
      mockGet.mockResolvedValue([])
      await fetchActivityLog()
      expect(error.value).toBeNull()
    })

    it('does not mutate overview or revenueData', async () => {
      mockGet.mockResolvedValue([makeActivityEntry()])
      const { fetchActivityLog } = useStats()
      await fetchActivityLog()
      expect(statsStore.overview).toBeNull()
      expect(statsStore.revenueData).toEqual([])
    })
  })
})
