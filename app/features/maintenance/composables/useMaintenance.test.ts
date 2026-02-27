// ============================================================
// useMaintenance.test.ts
// Tests for the useMaintenance composable.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock — it is a project composable,
//     not a Nuxt built-in, so mockNuxtImport is NOT used.
//   - Pinia is isolated per test via createTestingPinia (stubActions: false)
//     so real store action logic runs and we can inspect store state.
//
// Key behaviours under test:
//   - fetchStatus(): dual API response shapes (envelope vs direct),
//     SILENT error handling (error.value stays null on failure),
//     loading flag lifecycle.
//   - toggleMaintenance(): dual API shapes, error surfacing with all
//     three extractErrorMessage shapes, loading flag lifecycle.
//   - error ref: starts null, cleared at the beginning of each call.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { MaintenanceStatus } from '../types'

// ── useApi mock ───────────────────────────────────────────────

const mockGet = vi.fn()
const mockPut = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet, put: mockPut }),
}))

// ── Fixtures ─────────────────────────────────────────────────

function makeStatus(overrides: Partial<MaintenanceStatus> = {}): MaintenanceStatus {
  return {
    is_enabled: false,
    ...overrides,
  }
}

// ── Suite ─────────────────────────────────────────────────────

describe('useMaintenance', () => {
  let maintenanceStore: ReturnType<typeof import('../stores/maintenance.store').useMaintenanceStore>

  beforeEach(async () => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )
    const { useMaintenanceStore } = await import('../stores/maintenance.store')
    maintenanceStore = useMaintenanceStore()
    mockGet.mockReset()
    mockPut.mockReset()
  })

  // ── fetchStatus — envelope shape ─────────────────────────────

  describe('fetchStatus() — envelope response shape { maintenance: MaintenanceStatus }', () => {
    it('calls GET /api/admin/maintenance', async () => {
      mockGet.mockResolvedValue({ maintenance: makeStatus({ is_enabled: true }) })
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/maintenance')
    })

    it('stores the maintenance field from the envelope', async () => {
      const data = makeStatus({ is_enabled: true, message: 'Maintenance active' })
      mockGet.mockResolvedValue({ maintenance: data })
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.status).toEqual(data)
    })

    it('hasStatus becomes true after successful envelope fetch', async () => {
      mockGet.mockResolvedValue({ maintenance: makeStatus() })
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.hasStatus).toBe(true)
    })

    it('does not set error.value on success', async () => {
      mockGet.mockResolvedValue({ maintenance: makeStatus() })
      const { fetchStatus, error } = useMaintenance()
      await fetchStatus()
      expect(error.value).toBeNull()
    })

    it('stores full envelope status with all optional fields', async () => {
      const data: MaintenanceStatus = {
        is_enabled: true,
        message: 'Back soon',
        updated_at: '2025-01-15T10:00:00Z',
        updated_by: 'admin@mopetoo.com',
      }
      mockGet.mockResolvedValue({ maintenance: data })
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.status).toEqual(data)
    })
  })

  // ── fetchStatus — direct shape ───────────────────────────────

  describe('fetchStatus() — direct response shape MaintenanceStatus', () => {
    it('stores the response directly when no maintenance wrapper present', async () => {
      const data = makeStatus({ is_enabled: true, message: 'test' })
      mockGet.mockResolvedValue(data)
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.status).toEqual(data)
    })

    it('stores direct shape with is_enabled: false', async () => {
      const data = makeStatus({ is_enabled: false })
      mockGet.mockResolvedValue(data)
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.status).toEqual(data)
    })

    it('isEnabled reflects the direct shape is_enabled field', async () => {
      mockGet.mockResolvedValue(makeStatus({ is_enabled: true }))
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.isEnabled).toBe(true)
    })
  })

  // ── fetchStatus — loading lifecycle ──────────────────────────

  describe('fetchStatus() — loading lifecycle', () => {
    it('sets isLoading to true during the request', async () => {
      const loadingStates: boolean[] = []
      mockGet.mockImplementation(async () => {
        loadingStates.push(maintenanceStore.isLoading)
        return makeStatus()
      })
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(loadingStates[0]).toBe(true)
    })

    it('sets isLoading to false after the request completes', async () => {
      mockGet.mockResolvedValue(makeStatus())
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even when the request fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'))
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.isLoading).toBe(false)
    })
  })

  // ── fetchStatus — silent error handling ──────────────────────

  describe('fetchStatus() — silent error handling', () => {
    it('does NOT set error.value when GET fails (silent fail)', async () => {
      mockGet.mockRejectedValue(new Error('403 Forbidden'))
      const { fetchStatus, error } = useMaintenance()
      await fetchStatus()
      expect(error.value).toBeNull()
    })

    it('does not update store status when GET fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'))
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.status).toBeNull()
    })

    it('does not set error even for { data: { error: ... } } shaped failures', async () => {
      mockGet.mockRejectedValue({ data: { error: 'Acceso denegado' } })
      const { fetchStatus, error } = useMaintenance()
      await fetchStatus()
      // fetchStatus silently swallows ALL errors — no error surfacing
      expect(error.value).toBeNull()
    })

    it('preserves existing store status when a subsequent fetch fails', async () => {
      const originalStatus = makeStatus({ is_enabled: false })
      mockGet.mockResolvedValueOnce(originalStatus)
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.status).toEqual(originalStatus)

      mockGet.mockRejectedValue(new Error('Network error'))
      await fetchStatus()
      // Status is NOT cleared on failure
      expect(maintenanceStore.status).toEqual(originalStatus)
    })
  })

  // ── fetchStatus — error cleared on call ──────────────────────

  describe('fetchStatus() — error.value is cleared at the start of each call', () => {
    it('clears error.value at the beginning of fetchStatus', async () => {
      // Inject a previous error state by first calling toggleMaintenance which
      // does surface errors, then verify fetchStatus clears it.
      mockPut.mockRejectedValue({ message: 'Previous toggle error' })
      const { fetchStatus, toggleMaintenance, error } = useMaintenance()
      await toggleMaintenance(true)
      expect(error.value).not.toBeNull()

      mockGet.mockResolvedValue(makeStatus())
      await fetchStatus()
      expect(error.value).toBeNull()
    })
  })

  // ── toggleMaintenance — envelope shape ───────────────────────

  describe('toggleMaintenance() — envelope response shape { maintenance: MaintenanceStatus }', () => {
    it('calls PUT /api/admin/maintenance with { is_enabled: true }', async () => {
      mockPut.mockResolvedValue({ maintenance: makeStatus({ is_enabled: true }) })
      const { toggleMaintenance } = useMaintenance()
      await toggleMaintenance(true)
      expect(mockPut).toHaveBeenCalledWith('/api/admin/maintenance', { is_enabled: true })
    })

    it('calls PUT /api/admin/maintenance with { is_enabled: false }', async () => {
      mockPut.mockResolvedValue({ maintenance: makeStatus({ is_enabled: false }) })
      const { toggleMaintenance } = useMaintenance()
      await toggleMaintenance(false)
      expect(mockPut).toHaveBeenCalledWith('/api/admin/maintenance', { is_enabled: false })
    })

    it('stores the maintenance field from the envelope', async () => {
      const data = makeStatus({ is_enabled: true, message: 'Now active' })
      mockPut.mockResolvedValue({ maintenance: data })
      const { toggleMaintenance } = useMaintenance()
      await toggleMaintenance(true)
      expect(maintenanceStore.status).toEqual(data)
    })

    it('does not set error.value on success', async () => {
      mockPut.mockResolvedValue({ maintenance: makeStatus({ is_enabled: true }) })
      const { toggleMaintenance, error } = useMaintenance()
      await toggleMaintenance(true)
      expect(error.value).toBeNull()
    })

    it('stores full envelope payload with all optional fields', async () => {
      const data: MaintenanceStatus = {
        is_enabled: true,
        message: 'Scheduled maintenance',
        updated_at: '2025-06-01T08:00:00Z',
        updated_by: 'superadmin',
      }
      mockPut.mockResolvedValue({ maintenance: data })
      const { toggleMaintenance } = useMaintenance()
      await toggleMaintenance(true)
      expect(maintenanceStore.status).toEqual(data)
    })
  })

  // ── toggleMaintenance — direct shape ─────────────────────────

  describe('toggleMaintenance() — direct response shape MaintenanceStatus', () => {
    it('stores the response directly when no maintenance wrapper present', async () => {
      const data = makeStatus({ is_enabled: false })
      mockPut.mockResolvedValue(data)
      const { toggleMaintenance } = useMaintenance()
      await toggleMaintenance(false)
      expect(maintenanceStore.status).toEqual(data)
    })

    it('isEnabled reflects the updated direct shape', async () => {
      mockPut.mockResolvedValue(makeStatus({ is_enabled: true }))
      const { toggleMaintenance } = useMaintenance()
      await toggleMaintenance(true)
      expect(maintenanceStore.isEnabled).toBe(true)
    })
  })

  // ── toggleMaintenance — loading lifecycle ────────────────────

  describe('toggleMaintenance() — loading lifecycle', () => {
    it('sets isLoading to true during the request', async () => {
      const loadingStates: boolean[] = []
      mockPut.mockImplementation(async () => {
        loadingStates.push(maintenanceStore.isLoading)
        return makeStatus({ is_enabled: true })
      })
      const { toggleMaintenance } = useMaintenance()
      await toggleMaintenance(true)
      expect(loadingStates[0]).toBe(true)
    })

    it('sets isLoading to false after the request completes', async () => {
      mockPut.mockResolvedValue(makeStatus())
      const { toggleMaintenance } = useMaintenance()
      await toggleMaintenance(false)
      expect(maintenanceStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even after a PUT failure', async () => {
      mockPut.mockRejectedValue({ message: 'Server error' })
      const { toggleMaintenance } = useMaintenance()
      await toggleMaintenance(true)
      expect(maintenanceStore.isLoading).toBe(false)
    })
  })

  // ── toggleMaintenance — error handling (surfaces errors) ─────

  describe('toggleMaintenance() — error handling', () => {
    it('sets error.value from { data: { error: "..." } } shape', async () => {
      mockPut.mockRejectedValue({ data: { error: 'Error de servidor' } })
      const { toggleMaintenance, error } = useMaintenance()
      await toggleMaintenance(true)
      expect(error.value).toBe('Error de servidor')
    })

    it('sets error.value from { data: "string" } shape', async () => {
      mockPut.mockRejectedValue({ data: 'Forbidden' })
      const { toggleMaintenance, error } = useMaintenance()
      await toggleMaintenance(true)
      expect(error.value).toBe('Forbidden')
    })

    it('sets error.value from { message: "..." } shape', async () => {
      mockPut.mockRejectedValue({ message: 'Network error' })
      const { toggleMaintenance, error } = useMaintenance()
      await toggleMaintenance(true)
      expect(error.value).toBe('Network error')
    })

    it('falls back to generic error message for unknown error shape', async () => {
      mockPut.mockRejectedValue('plain string error')
      const { toggleMaintenance, error } = useMaintenance()
      await toggleMaintenance(true)
      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('falls back to generic message for null rejection', async () => {
      mockPut.mockRejectedValue(null)
      const { toggleMaintenance, error } = useMaintenance()
      await toggleMaintenance(true)
      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('does not update the store status when PUT fails', async () => {
      mockPut.mockRejectedValue({ message: 'Server error' })
      const { toggleMaintenance } = useMaintenance()
      await toggleMaintenance(true)
      expect(maintenanceStore.status).toBeNull()
    })
  })

  // ── error ref contract ───────────────────────────────────────

  describe('error ref contract', () => {
    it('starts as null', () => {
      const { error } = useMaintenance()
      expect(error.value).toBeNull()
    })

    it('is cleared at the start of toggleMaintenance regardless of previous error', async () => {
      mockPut.mockRejectedValue({ message: 'First error' })
      const { toggleMaintenance, error } = useMaintenance()
      await toggleMaintenance(true)
      expect(error.value).toBe('First error')

      mockPut.mockResolvedValue(makeStatus({ is_enabled: false }))
      await toggleMaintenance(false)
      expect(error.value).toBeNull()
    })

    it('is cleared at the start of fetchStatus', async () => {
      // Start with a known error via toggleMaintenance
      mockPut.mockRejectedValue({ message: 'Toggle error' })
      const { fetchStatus, toggleMaintenance, error } = useMaintenance()
      await toggleMaintenance(true)
      expect(error.value).not.toBeNull()

      // fetchStatus clears it even if GET also fails (silently)
      mockGet.mockRejectedValue(new Error('403'))
      await fetchStatus()
      expect(error.value).toBeNull()
    })

    it('is null after a successful toggleMaintenance call', async () => {
      mockPut.mockResolvedValue(makeStatus({ is_enabled: true }))
      const { toggleMaintenance, error } = useMaintenance()
      await toggleMaintenance(true)
      expect(error.value).toBeNull()
    })

    it('is null after a successful fetchStatus call', async () => {
      mockGet.mockResolvedValue(makeStatus())
      const { fetchStatus, error } = useMaintenance()
      await fetchStatus()
      expect(error.value).toBeNull()
    })
  })
})
