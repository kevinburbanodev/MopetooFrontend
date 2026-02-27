// ============================================================
// useStats — business logic for statistics and metrics
// RF-1100 to RF-1109
//
// Endpoints:
//   GET /api/admin/stats           — platform KPI overview
//   GET /api/admin/stats/revenue   — monthly revenue time series
//   GET /api/admin/stats/activity  — recent platform activity log
//
// All endpoints are admin-only. Dual API response shapes are
// supported for both envelope and direct formats.
// ============================================================

import { ref } from 'vue'
import type {
  StatsOverview,
  StatsOverviewResponse,
  RevenueDataPoint,
  RevenueFilters,
  RevenueStatsResponse,
  ActivityEntry,
  ActivityLogResponse,
} from '../types'

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
  const api = useApi()
  const statsStore = useStatsStore()
  const error = ref<string | null>(null)
  const revenueLoading = ref(false)

  /**
   * Fetch platform overview KPIs from /api/admin/stats.
   * Supports both direct StatsOverview and { stats: StatsOverview } envelopes.
   * Sets isLoading on the store during the request.
   */
  async function fetchOverview(): Promise<void> {
    statsStore.setLoading(true)
    error.value = null
    try {
      const response = await api.get<StatsOverview | StatsOverviewResponse>('/api/admin/stats')
      let data: StatsOverview
      if (
        response &&
        typeof response === 'object' &&
        'stats' in response &&
        (response as StatsOverviewResponse).stats
      ) {
        data = (response as StatsOverviewResponse).stats as StatsOverview
      } else {
        data = response as StatsOverview
      }
      statsStore.setOverview(data)
    } catch (err: unknown) {
      error.value = extractErrorMessage(err)
    } finally {
      statsStore.setLoading(false)
    }
  }

  /**
   * Fetch monthly revenue time series from /api/admin/stats/revenue.
   * Supports both RevenueDataPoint[] direct array and { data: [] } envelope.
   * Uses local revenueLoading ref (not store isLoading) so StatsChart and
   * RevenueReport can show their own skeleton independently of the overview.
   */
  async function fetchRevenueData(filters?: RevenueFilters): Promise<void> {
    revenueLoading.value = true
    error.value = null
    try {
      const params = new URLSearchParams()
      if (filters?.months) params.set('months', String(filters.months))
      const qs = params.toString()
      const path = qs ? `/api/admin/stats/revenue?${qs}` : '/api/admin/stats/revenue'
      const response = await api.get<RevenueDataPoint[] | RevenueStatsResponse>(path)
      const data: RevenueDataPoint[] = Array.isArray(response)
        ? response
        : ((response as RevenueStatsResponse).data ?? [])
      statsStore.setRevenueData(data)
    } catch (err: unknown) {
      error.value = extractErrorMessage(err)
    } finally {
      revenueLoading.value = false
    }
  }

  /**
   * Fetch recent platform activity log from /api/admin/stats/activity.
   * Supports both ActivityEntry[] direct array and { activities: [], total: N } envelope.
   */
  async function fetchActivityLog(): Promise<void> {
    error.value = null
    try {
      const response = await api.get<ActivityEntry[] | ActivityLogResponse>(
        '/api/admin/stats/activity',
      )
      if (Array.isArray(response)) {
        statsStore.setActivityEntries(response, response.length)
      } else {
        const envelope = response as ActivityLogResponse
        statsStore.setActivityEntries(
          envelope.activities ?? [],
          envelope.total ?? 0,
        )
      }
    } catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
  }

  return {
    error,
    revenueLoading,
    statsStore,
    fetchOverview,
    fetchRevenueData,
    fetchActivityLog,
  }
}
