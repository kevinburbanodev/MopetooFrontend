// ============================================================
// maintenance.store.test.ts
// Unit tests for useMaintenanceStore.
//
// Strategy:
//   - setActivePinia(createPinia()) in beforeEach for full isolation.
//   - Tests cover initial state, all computed getters (isEnabled,
//     hasStatus), all actions (setStatus, setLoading, clearMaintenance),
//     and a full lifecycle integration scenario.
//
// NOTE: This store is NOT cleared by auth.store.clearSession() —
// maintenance status is a global/public flag, not user-specific data.
// We assert clearMaintenance() works correctly in isolation.
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMaintenanceStore } from './maintenance.store'
import type { MaintenanceStatus } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeStatus(overrides: Partial<MaintenanceStatus> = {}): MaintenanceStatus {
  return {
    is_enabled: false,
    message: undefined,
    updated_at: undefined,
    updated_by: undefined,
    ...overrides,
  }
}

// ── Suite ─────────────────────────────────────────────────────

describe('useMaintenanceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  // ── Initial state ────────────────────────────────────────────

  describe('initial state', () => {
    it('status is null', () => {
      const store = useMaintenanceStore()
      expect(store.status).toBeNull()
    })

    it('isLoading is false', () => {
      const store = useMaintenanceStore()
      expect(store.isLoading).toBe(false)
    })

    it('isEnabled is false when status is null', () => {
      const store = useMaintenanceStore()
      expect(store.isEnabled).toBe(false)
    })

    it('hasStatus is false when status is null', () => {
      const store = useMaintenanceStore()
      expect(store.hasStatus).toBe(false)
    })
  })

  // ── setStatus ────────────────────────────────────────────────

  describe('setStatus', () => {
    it('stores the status object', () => {
      const store = useMaintenanceStore()
      const status = makeStatus({ is_enabled: true })
      store.setStatus(status)
      expect(store.status).toEqual(status)
    })

    it('stores a status with is_enabled: false', () => {
      const store = useMaintenanceStore()
      const status = makeStatus({ is_enabled: false, message: 'All good' })
      store.setStatus(status)
      expect(store.status).toEqual(status)
    })

    it('stores a full status object with all optional fields', () => {
      const store = useMaintenanceStore()
      const status: MaintenanceStatus = {
        is_enabled: true,
        message: 'Site down for maintenance',
        updated_at: '2025-01-15T10:00:00Z',
        updated_by: 'admin@mopetoo.com',
      }
      store.setStatus(status)
      expect(store.status).toEqual(status)
    })

    it('stores a minimal status with only is_enabled', () => {
      const store = useMaintenanceStore()
      const status: MaintenanceStatus = { is_enabled: true }
      store.setStatus(status)
      expect(store.status).toMatchObject({ is_enabled: true })
    })

    it('replaces previous status on second call', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: true, message: 'Old message' }))
      store.setStatus(makeStatus({ is_enabled: false, message: 'New message' }))
      expect(store.status!.is_enabled).toBe(false)
      expect(store.status!.message).toBe('New message')
    })

    it('does not affect isLoading', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: true }))
      expect(store.isLoading).toBe(false)
    })
  })

  // ── setLoading ───────────────────────────────────────────────

  describe('setLoading', () => {
    it('sets isLoading to true', () => {
      const store = useMaintenanceStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading to false', () => {
      const store = useMaintenanceStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('does not affect status', () => {
      const store = useMaintenanceStore()
      store.setLoading(true)
      expect(store.status).toBeNull()
    })

    it('does not affect hasStatus', () => {
      const store = useMaintenanceStore()
      store.setLoading(true)
      expect(store.hasStatus).toBe(false)
    })
  })

  // ── isEnabled computed ───────────────────────────────────────

  describe('isEnabled getter', () => {
    it('returns false when status is null', () => {
      const store = useMaintenanceStore()
      expect(store.isEnabled).toBe(false)
    })

    it('returns true when status.is_enabled is true', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: true }))
      expect(store.isEnabled).toBe(true)
    })

    it('returns false when status.is_enabled is false', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: false }))
      expect(store.isEnabled).toBe(false)
    })

    it('updates reactively when status changes from disabled to enabled', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: false }))
      expect(store.isEnabled).toBe(false)
      store.setStatus(makeStatus({ is_enabled: true }))
      expect(store.isEnabled).toBe(true)
    })

    it('updates reactively when status changes from enabled to disabled', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: true }))
      expect(store.isEnabled).toBe(true)
      store.setStatus(makeStatus({ is_enabled: false }))
      expect(store.isEnabled).toBe(false)
    })
  })

  // ── hasStatus computed ───────────────────────────────────────

  describe('hasStatus getter', () => {
    it('returns false when status is null', () => {
      const store = useMaintenanceStore()
      expect(store.hasStatus).toBe(false)
    })

    it('returns true after setStatus is called', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus())
      expect(store.hasStatus).toBe(true)
    })

    it('returns true regardless of is_enabled value', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: false }))
      expect(store.hasStatus).toBe(true)
    })

    it('returns false again after clearMaintenance is called', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: true }))
      store.clearMaintenance()
      expect(store.hasStatus).toBe(false)
    })
  })

  // ── clearMaintenance ─────────────────────────────────────────

  describe('clearMaintenance', () => {
    it('resets status to null', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: true }))
      store.clearMaintenance()
      expect(store.status).toBeNull()
    })

    it('resets isLoading to false', () => {
      const store = useMaintenanceStore()
      store.setLoading(true)
      store.clearMaintenance()
      expect(store.isLoading).toBe(false)
    })

    it('resets isEnabled to false', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: true }))
      store.clearMaintenance()
      expect(store.isEnabled).toBe(false)
    })

    it('resets hasStatus to false', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus())
      store.clearMaintenance()
      expect(store.hasStatus).toBe(false)
    })

    it('is safe to call when already in initial state', () => {
      const store = useMaintenanceStore()
      expect(() => store.clearMaintenance()).not.toThrow()
      expect(store.status).toBeNull()
      expect(store.isLoading).toBe(false)
    })

    it('resets all fields from a fully populated status', () => {
      const store = useMaintenanceStore()
      store.setStatus({
        is_enabled: true,
        message: 'Down for maintenance',
        updated_at: '2025-01-01T00:00:00Z',
        updated_by: 'admin@mopetoo.com',
      })
      store.setLoading(true)
      store.clearMaintenance()
      expect(store.status).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.isEnabled).toBe(false)
      expect(store.hasStatus).toBe(false)
    })
  })

  // ── Integration ──────────────────────────────────────────────

  describe('integration', () => {
    it('supports a full fetch-then-clear lifecycle', () => {
      const store = useMaintenanceStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
      expect(store.hasStatus).toBe(false)

      store.setStatus(makeStatus({ is_enabled: true }))
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
      expect(store.hasStatus).toBe(true)
      expect(store.isEnabled).toBe(true)

      store.clearMaintenance()
      expect(store.status).toBeNull()
      expect(store.isLoading).toBe(false)
      expect(store.hasStatus).toBe(false)
      expect(store.isEnabled).toBe(false)
    })

    it('supports toggling maintenance on and off via sequential setStatus calls', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: false }))
      expect(store.isEnabled).toBe(false)

      store.setStatus(makeStatus({ is_enabled: true }))
      expect(store.isEnabled).toBe(true)

      store.setStatus(makeStatus({ is_enabled: false }))
      expect(store.isEnabled).toBe(false)
    })

    it('setLoading(false) does not discard an existing status', () => {
      const store = useMaintenanceStore()
      store.setStatus(makeStatus({ is_enabled: true }))
      store.setLoading(false)
      expect(store.status).not.toBeNull()
      expect(store.hasStatus).toBe(true)
    })
  })
})
