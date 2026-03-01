// ============================================================
// Stats store — manages statistics and metrics state
// RF-1100 to RF-1109
// ============================================================

import { defineStore } from 'pinia'
import type { StatsOverview, RevenueSeriesPoint, RevenueStats } from '../types'

export const useStatsStore = defineStore('stats', () => {
  // ── State ──────────────────────────────────────────────────
  const overview = ref<StatsOverview | null>(null)
  const revenueData = ref<RevenueSeriesPoint[]>([])
  const revenueStats = ref<RevenueStats | null>(null)
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasOverview = computed(() => overview.value !== null)
  const hasRevenueData = computed(() => revenueData.value.length > 0)
  const hasRevenueStats = computed(() => revenueStats.value !== null)

  // ── Actions ────────────────────────────────────────────────

  function setOverview(data: StatsOverview): void {
    overview.value = data
  }

  function setRevenueData(data: RevenueSeriesPoint[]): void {
    revenueData.value = data
  }

  function setRevenueStats(data: RevenueStats): void {
    revenueStats.value = data
  }

  function setLoading(val: boolean): void {
    isLoading.value = val
  }

  /**
   * Reset all stats state. Called from auth.store.clearSession() since
   * stats data is fetched from admin-only endpoints and should not
   * persist across sessions.
   */
  function clearStats(): void {
    overview.value = null
    revenueData.value = []
    revenueStats.value = null
    isLoading.value = false
  }

  return {
    // State
    overview,
    revenueData,
    revenueStats,
    isLoading,
    // Getters
    hasOverview,
    hasRevenueData,
    hasRevenueStats,
    // Actions
    setOverview,
    setRevenueData,
    setRevenueStats,
    setLoading,
    clearStats,
  }
})
