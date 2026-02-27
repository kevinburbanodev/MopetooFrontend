// ============================================================
// Maintenance store — manages global maintenance mode state
// RF-1200 to RF-1209
//
// NOTE: This store is NOT added to auth.store.ts clearSession().
// Maintenance status is a global/public platform flag, not
// user-specific data. It persists across sessions intentionally
// so the app can surface the maintenance page without an API call.
// ============================================================

import { defineStore } from 'pinia'
import type { MaintenanceStatus } from '../types'

export const useMaintenanceStore = defineStore('maintenance', () => {
  // ── State ──────────────────────────────────────────────────

  /** The last known maintenance status from the API. Null until first fetch. */
  const status = ref<MaintenanceStatus | null>(null)

  /** True while a fetch or toggle request is in flight. */
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────

  /**
   * Whether maintenance mode is currently active.
   * Defaults to false when status has not been fetched yet,
   * which means the app renders normally on first load.
   */
  const isEnabled = computed<boolean>(() => status.value?.is_enabled ?? false)

  /** True once we have received a status response from the API. */
  const hasStatus = computed<boolean>(() => status.value !== null)

  // ── Actions ────────────────────────────────────────────────

  function setStatus(newStatus: MaintenanceStatus): void {
    status.value = newStatus
  }

  function setLoading(val: boolean): void {
    isLoading.value = val
  }

  /**
   * Reset to the initial state.
   * Called when admin explicitly clears state or on app reset.
   * NOT called from auth.store.clearSession() (see module header).
   */
  function clearMaintenance(): void {
    status.value = null
    isLoading.value = false
  }

  return {
    // State
    status,
    isLoading,
    // Getters
    isEnabled,
    hasStatus,
    // Actions
    setStatus,
    setLoading,
    clearMaintenance,
  }
})
