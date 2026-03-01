// ============================================================
// useStats — business logic for statistics and metrics
// RF-1100 to RF-1109
//
// Endpoints:
//   GET /api/admin/stats/overview  — platform KPI overview
//   GET /api/admin/stats/revenue   — revenue time series + aggregates
//
// All endpoints are admin-only.
// ============================================================

import { ref } from 'vue'
import type { StatsOverview, RevenueStats, RevenueFilters } from '../types'

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    if ('data' in err) {
      const data = (err as { data: unknown }).data
      if (typeof data === 'object' && data !== null && 'error' in data) {
        return String((data as { error: unknown }).error)
      }
      if (typeof data === 'string' && data.length > 0) return data
    }
    if (
      'message' in err &&
      typeof (err as { message: unknown }).message === 'string'
    ) {
      return (err as { message: string }).message
    }
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}

export function useStats() {
  const { get } = useApi()
  const statsStore = useStatsStore()
  const error = ref<string | null>(null)
  const revenueLoading = ref(false)

  /**
   * Fetch platform overview KPIs from /api/admin/stats/overview.
   * Sets isLoading on the store during the request.
   */
  async function fetchOverview(): Promise<void> {
    statsStore.setLoading(true)
    error.value = null
    try {
      const data = await get<StatsOverview>('/api/admin/stats/overview')
      statsStore.setOverview(data)
    } catch (err: unknown) {
      error.value = extractErrorMessage(err)
    } finally {
      statsStore.setLoading(false)
    }
  }

  /**
   * Fetch revenue stats from /api/admin/stats/revenue.
   * Uses local revenueLoading ref (not store isLoading) so StatsChart and
   * RevenueReport can show their own skeleton independently of the overview.
   *
   * Stores both the full RevenueStats (aggregates) and the series array
   * (for chart/table rendering).
   */
  async function fetchRevenueData(filters?: RevenueFilters): Promise<void> {
    revenueLoading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.from) params.set('from', filters.from)
      if (filters?.to) params.set('to', filters.to)
      const qs = params.toString()
      const path = qs ? `/api/admin/stats/revenue?${qs}` : '/api/admin/stats/revenue'
      const data = await get<RevenueStats>(path)
      statsStore.setRevenueStats(data)
      statsStore.setRevenueData(data.series)
    } catch (err: unknown) {
      error.value = extractErrorMessage(err)
    } finally {
      revenueLoading.value = false
    }
  }

  return {
    error,
    revenueLoading,
    statsStore,
    fetchOverview,
    fetchRevenueData,
  }
}
