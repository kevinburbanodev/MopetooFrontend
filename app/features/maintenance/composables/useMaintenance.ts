// ============================================================
// useMaintenance — business logic for maintenance mode
// RF-1200 to RF-1209
//
// Endpoints:
//   GET   /api/admin/maintenance            — current status (admin-only)
//   PATCH /api/admin/maintenance/activate    — activate with message (admin-only)
//   PATCH /api/admin/maintenance/deactivate  — deactivate (admin-only)
//
// All endpoints are admin-protected. fetchStatus() fails silently
// so non-admin users and guests never see an error from this
// composable — they simply have no status loaded.
// ============================================================

import { ref } from 'vue'
import type { MaintenanceStatus, ActivateMaintenanceRequest } from '../types'

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
  const { get, patch } = useApi()
  const maintenanceStore = useMaintenanceStore()
  const error = ref<string | null>(null)

  /**
   * Fetch the current maintenance status from the API.
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
      const data = await get<MaintenanceStatus>('/api/admin/maintenance')
      maintenanceStore.setStatus(data)
    } catch {
      // Fail silently — see module header for rationale.
    } finally {
      maintenanceStore.setLoading(false)
    }
  }

  /**
   * Activate maintenance mode with a message and optional estimated return.
   *
   * On success the store is updated optimistically so the UI reflects
   * the new state immediately without a second fetch.
   */
  async function activateMaintenance(request: ActivateMaintenanceRequest): Promise<void> {
    maintenanceStore.setLoading(true)
    error.value = null
    try {
      await patch<{ message: string }>('/api/admin/maintenance/activate', request)
      maintenanceStore.setStatus({
        is_active: true,
        message: request.message,
        estimated_return: request.estimated_return,
        activated_at: new Date().toISOString(),
      })
    } catch (err: unknown) {
      error.value = extractErrorMessage(err)
    } finally {
      maintenanceStore.setLoading(false)
    }
  }

  /**
   * Deactivate maintenance mode.
   *
   * On success the store is updated so the UI reflects the change immediately.
   */
  async function deactivateMaintenance(): Promise<void> {
    maintenanceStore.setLoading(true)
    error.value = null
    try {
      await patch<{ message: string }>('/api/admin/maintenance/deactivate', {})
      maintenanceStore.setStatus({ is_active: false })
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
    activateMaintenance,
    deactivateMaintenance,
  }
}
