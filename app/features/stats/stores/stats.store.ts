// ============================================================
// Stats store — manages statistics and metrics state
// RF-1100 to RF-1109
// ============================================================

import { defineStore } from 'pinia'
import type { StatsOverview, RevenueDataPoint, ActivityEntry } from '../types'

export const useStatsStore = defineStore('stats', () => {
  // ── State ──────────────────────────────────────────────────
  const overview = ref<StatsOverview | null>(null)
  const revenueData = ref<RevenueDataPoint[]>([])
  const activityEntries = ref<ActivityEntry[]>([])
  const totalActivity = ref(0)
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasOverview = computed(() => overview.value !== null)
  const hasRevenueData = computed(() => revenueData.value.length > 0)
  const hasActivity = computed(() => activityEntries.value.length > 0)

  // ── Actions ────────────────────────────────────────────────

  function setOverview(data: StatsOverview): void {
    overview.value = data
  }

  function setRevenueData(data: RevenueDataPoint[]): void {
    revenueData.value = data
  }

  function setActivityEntries(data: ActivityEntry[], total: number): void {
    activityEntries.value = data
    totalActivity.value = total
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
    activityEntries.value = []
    totalActivity.value = 0
    isLoading.value = false
  }

  return {
    // State
    overview,
    revenueData,
    activityEntries,
    totalActivity,
    isLoading,
    // Getters
    hasOverview,
    hasRevenueData,
    hasActivity,
    // Actions
    setOverview,
    setRevenueData,
    setActivityEntries,
    setLoading,
    clearStats,
  }
})
