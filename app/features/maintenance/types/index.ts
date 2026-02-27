// ============================================================
// Maintenance types — RF-1200 to RF-1209
// ============================================================

/**
 * The current maintenance mode status returned by the backend.
 * `is_enabled` is the authoritative flag; the remaining fields
 * are informational and may be absent in older API versions.
 */
export interface MaintenanceStatus {
  /** Whether maintenance mode is currently active */
  is_enabled: boolean
  /** Optional custom message displayed on the maintenance page */
  message?: string
  /** ISO-8601 timestamp of the last state change */
  updated_at?: string
  /** Username of the admin who last toggled maintenance mode */
  updated_by?: string
}

/**
 * Envelope response shape returned by GET /api/admin/maintenance.
 * Some backend versions may return MaintenanceStatus directly.
 */
export interface MaintenanceResponse {
  maintenance: MaintenanceStatus
}

/**
 * Request body for PUT /api/admin/maintenance.
 */
export interface ToggleMaintenanceRequest {
  is_enabled: boolean
}
