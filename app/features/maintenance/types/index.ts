// ============================================================
// Maintenance types — RF-1200 to RF-1209
// Aligned with Mopetoo backend API (Go + Gin)
//
// Endpoints:
//   GET   /api/admin/maintenance           → MaintenanceStatus
//   PATCH /api/admin/maintenance/activate   → { message }
//   PATCH /api/admin/maintenance/deactivate → { message }
// ============================================================

/**
 * The current maintenance mode status returned by the backend.
 * `is_active` is the authoritative flag; the remaining fields
 * are informational and may be absent.
 */
export interface MaintenanceStatus {
  /** Whether maintenance mode is currently active */
  is_active: boolean
  /** Optional custom message displayed on the maintenance page */
  message?: string
  /** ISO-8601 datetime — estimated time of return from maintenance */
  estimated_return?: string
  /** ISO-8601 timestamp of when maintenance was last activated */
  activated_at?: string
  /** Numeric ID of the admin who activated maintenance mode */
  activated_by_admin_id?: number
}

/**
 * Request body for PATCH /api/admin/maintenance/activate.
 */
export interface ActivateMaintenanceRequest {
  message: string
  estimated_return?: string
}
