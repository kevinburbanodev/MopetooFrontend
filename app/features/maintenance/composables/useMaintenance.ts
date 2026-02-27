// ============================================================
// useMaintenance — business logic for maintenance mode
// RF-1200 to RF-1209
//
// Endpoints:
//   GET /api/admin/maintenance — current maintenance status (admin-only)
//   PUT /api/admin/maintenance — toggle maintenance mode (admin-only)
//
// Both endpoints are admin-protected. fetchStatus() fails silently
// so non-admin users and guests never see an error from this
// composable — they simply have no status loaded.
//
// Dual API response shapes supported:
//   { maintenance: MaintenanceStatus }  — envelope format
//   MaintenanceStatus                  — direct format
// ============================================================

import { ref } from 'vue'
import type {
  MaintenanceStatus,
  MaintenanceResponse,
  ToggleMaintenanceRequest,
} from '../types'

/**
 * Normalise error values from $fetch into a human-readable string.
 * Matches the extractErrorMessage pattern used across all slices.
 */
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

export function useMaintenance() {
  const api = useApi()
  const maintenanceStore = useMaintenanceStore()
  const error = ref<string | null>(null)

  /**
   * Fetch the current maintenance status from the API.
   *
   * Handles both envelope (`{ maintenance: MaintenanceStatus }`) and
   * direct (`MaintenanceStatus`) response shapes.
   *
   * Fails silently on error — this is intentional. The endpoint is
   * admin-only and non-admin callers (including the maintenance
   * middleware) should not surface an error to the user when the
   * request is rejected with a 403.
   */
  async function fetchStatus(): Promise<void> {
    maintenanceStore.setLoading(true)
    error.value = null
    try {
      const response = await api.get<MaintenanceStatus | MaintenanceResponse>(
        '/api/admin/maintenance',
      )

      let data: MaintenanceStatus
      if (
        response &&
        typeof response === 'object' &&
        'maintenance' in response &&
        (response as MaintenanceResponse).maintenance
      ) {
        data = (response as MaintenanceResponse).maintenance
      } else {
        data = response as MaintenanceStatus
      }

      maintenanceStore.setStatus(data)
    } catch {
      // Fail silently — see module header for rationale.
      // We intentionally do NOT set error.value here so that
      // non-admin callers don't display a confusing error message.
    } finally {
      maintenanceStore.setLoading(false)
    }
  }

  /**
   * Toggle maintenance mode on or off.
   *
   * Unlike fetchStatus(), this surfaces errors because it is only
   * called from the admin UI where the operator expects feedback.
   *
   * On success the store is updated with the response payload so the
   * UI reflects the new state immediately without a second fetch.
   */
  async function toggleMaintenance(enabled: boolean): Promise<void> {
    maintenanceStore.setLoading(true)
    error.value = null
    try {
      const body: ToggleMaintenanceRequest = { is_enabled: enabled }
      const response = await api.put<MaintenanceStatus | MaintenanceResponse>(
        '/api/admin/maintenance',
        body,
      )

      // Normalise dual API shapes (same as fetchStatus)
      let data: MaintenanceStatus
      if (
        response &&
        typeof response === 'object' &&
        'maintenance' in response &&
        (response as MaintenanceResponse).maintenance
      ) {
        data = (response as MaintenanceResponse).maintenance
      } else {
        data = response as MaintenanceStatus
      }

      maintenanceStore.setStatus(data)
    } catch (err: unknown) {
      error.value = extractErrorMessage(err)
    } finally {
      maintenanceStore.setLoading(false)
    }
  }

  return {
    error,
    maintenanceStore,
    fetchStatus,
    toggleMaintenance,
  }
}
