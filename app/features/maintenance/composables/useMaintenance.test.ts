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
//   - fetchStatus(): calls GET /api/admin/maintenance, stores response,
//     SILENT error handling (error.value stays null on failure),
//     loading flag lifecycle.
//   - activateMaintenance(): calls PATCH /api/admin/maintenance/activate
//     with { message, estimated_return? }, optimistic store update,
//     error surfacing with all extractErrorMessage shapes.
//   - deactivateMaintenance(): calls PATCH /api/admin/maintenance/deactivate,
//     optimistic store update, error surfacing.
//   - error ref: starts null, cleared at the beginning of each call.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import type { MaintenanceStatus } from '../types'

// ── useApi mock ───────────────────────────────────────────────

const mockGet = vi.fn()
const mockPatch = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({ get: mockGet, patch: mockPatch }),
}))

// ── Fixtures ─────────────────────────────────────────────────

function makeStatus(overrides: Partial<MaintenanceStatus> = {}): MaintenanceStatus {
  return {
    is_active: false,
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
    mockPatch.mockReset()
  })

  // ── fetchStatus ────────────────────────────────────────────────

  describe('fetchStatus()', () => {
    it('calls GET /api/admin/maintenance', async () => {
      mockGet.mockResolvedValue(makeStatus({ is_active: true }))
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(mockGet).toHaveBeenCalledWith('/api/admin/maintenance')
    })

    it('stores the response in the store', async () => {
      const data = makeStatus({ is_active: true, message: 'Maintenance active' })
      mockGet.mockResolvedValue(data)
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.status).toEqual(data)
    })

    it('hasStatus becomes true after successful fetch', async () => {
      mockGet.mockResolvedValue(makeStatus())
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.hasStatus).toBe(true)
    })

    it('does not set error.value on success', async () => {
      mockGet.mockResolvedValue(makeStatus())
      const { fetchStatus, error } = useMaintenance()
      await fetchStatus()
      expect(error.value).toBeNull()
    })

    it('stores full status with all optional fields', async () => {
      const data: MaintenanceStatus = {
        is_active: true,
        message: 'Back soon',
        estimated_return: '2025-01-15T12:00:00Z',
        activated_at: '2025-01-15T10:00:00Z',
        activated_by_admin_id: 1,
      }
      mockGet.mockResolvedValue(data)
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.status).toEqual(data)
    })

    it('stores status with is_active: false', async () => {
      const data = makeStatus({ is_active: false })
      mockGet.mockResolvedValue(data)
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.status).toEqual(data)
    })

    it('isEnabled reflects the is_active field', async () => {
      mockGet.mockResolvedValue(makeStatus({ is_active: true }))
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
      expect(error.value).toBeNull()
    })

    it('preserves existing store status when a subsequent fetch fails', async () => {
      const originalStatus = makeStatus({ is_active: false })
      mockGet.mockResolvedValueOnce(originalStatus)
      const { fetchStatus } = useMaintenance()
      await fetchStatus()
      expect(maintenanceStore.status).toEqual(originalStatus)

      mockGet.mockRejectedValue(new Error('Network error'))
      await fetchStatus()
      expect(maintenanceStore.status).toEqual(originalStatus)
    })
  })

  // ── activateMaintenance ───────────────────────────────────────

  describe('activateMaintenance()', () => {
    it('calls PATCH /api/admin/maintenance/activate with request body', async () => {
      mockPatch.mockResolvedValue({ message: 'Modo mantenimiento activado' })
      const { activateMaintenance } = useMaintenance()
      await activateMaintenance({ message: 'Down for updates' })
      expect(mockPatch).toHaveBeenCalledWith(
        '/api/admin/maintenance/activate',
        { message: 'Down for updates' },
      )
    })

    it('sends estimated_return when provided', async () => {
      mockPatch.mockResolvedValue({ message: 'Modo mantenimiento activado' })
      const { activateMaintenance } = useMaintenance()
      await activateMaintenance({
        message: 'Scheduled maintenance',
        estimated_return: '2025-06-01T14:00:00Z',
      })
      expect(mockPatch).toHaveBeenCalledWith(
        '/api/admin/maintenance/activate',
        { message: 'Scheduled maintenance', estimated_return: '2025-06-01T14:00:00Z' },
      )
    })

    it('optimistically updates store with is_active: true after success', async () => {
      mockPatch.mockResolvedValue({ message: 'Modo mantenimiento activado' })
      const { activateMaintenance } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(maintenanceStore.status?.is_active).toBe(true)
    })

    it('stores the message in optimistic update', async () => {
      mockPatch.mockResolvedValue({ message: 'Modo mantenimiento activado' })
      const { activateMaintenance } = useMaintenance()
      await activateMaintenance({ message: 'Custom message' })
      expect(maintenanceStore.status?.message).toBe('Custom message')
    })

    it('stores estimated_return in optimistic update', async () => {
      mockPatch.mockResolvedValue({ message: 'ok' })
      const { activateMaintenance } = useMaintenance()
      await activateMaintenance({
        message: 'Down',
        estimated_return: '2025-06-01T14:00:00Z',
      })
      expect(maintenanceStore.status?.estimated_return).toBe('2025-06-01T14:00:00Z')
    })

    it('sets activated_at in optimistic update', async () => {
      mockPatch.mockResolvedValue({ message: 'ok' })
      const { activateMaintenance } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(maintenanceStore.status?.activated_at).toBeDefined()
    })

    it('does not set error.value on success', async () => {
      mockPatch.mockResolvedValue({ message: 'ok' })
      const { activateMaintenance, error } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(error.value).toBeNull()
    })

    it('isEnabled becomes true after activation', async () => {
      mockPatch.mockResolvedValue({ message: 'ok' })
      const { activateMaintenance } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(maintenanceStore.isEnabled).toBe(true)
    })
  })

  // ── activateMaintenance — loading lifecycle ───────────────────

  describe('activateMaintenance() — loading lifecycle', () => {
    it('sets isLoading to true during the request', async () => {
      const loadingStates: boolean[] = []
      mockPatch.mockImplementation(async () => {
        loadingStates.push(maintenanceStore.isLoading)
        return { message: 'ok' }
      })
      const { activateMaintenance } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(loadingStates[0]).toBe(true)
    })

    it('sets isLoading to false after the request completes', async () => {
      mockPatch.mockResolvedValue({ message: 'ok' })
      const { activateMaintenance } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(maintenanceStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even after a failure', async () => {
      mockPatch.mockRejectedValue({ message: 'Server error' })
      const { activateMaintenance } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(maintenanceStore.isLoading).toBe(false)
    })
  })

  // ── activateMaintenance — error handling ──────────────────────

  describe('activateMaintenance() — error handling', () => {
    it('sets error.value from { data: { error: "..." } } shape', async () => {
      mockPatch.mockRejectedValue({ data: { error: 'Error de servidor' } })
      const { activateMaintenance, error } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(error.value).toBe('Error de servidor')
    })

    it('sets error.value from { data: "string" } shape', async () => {
      mockPatch.mockRejectedValue({ data: 'Forbidden' })
      const { activateMaintenance, error } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(error.value).toBe('Forbidden')
    })

    it('sets error.value from { message: "..." } shape', async () => {
      mockPatch.mockRejectedValue({ message: 'Network error' })
      const { activateMaintenance, error } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(error.value).toBe('Network error')
    })

    it('falls back to generic error message for unknown error shape', async () => {
      mockPatch.mockRejectedValue('plain string error')
      const { activateMaintenance, error } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('does not update the store status when PATCH fails', async () => {
      mockPatch.mockRejectedValue({ message: 'Server error' })
      const { activateMaintenance } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(maintenanceStore.status).toBeNull()
    })
  })

  // ── deactivateMaintenance ─────────────────────────────────────

  describe('deactivateMaintenance()', () => {
    it('calls PATCH /api/admin/maintenance/deactivate with empty body', async () => {
      mockPatch.mockResolvedValue({ message: 'Modo mantenimiento desactivado' })
      const { deactivateMaintenance } = useMaintenance()
      await deactivateMaintenance()
      expect(mockPatch).toHaveBeenCalledWith(
        '/api/admin/maintenance/deactivate',
        {},
      )
    })

    it('optimistically updates store with is_active: false after success', async () => {
      // Start with active state
      maintenanceStore.setStatus(makeStatus({ is_active: true, message: 'Down' }))

      mockPatch.mockResolvedValue({ message: 'ok' })
      const { deactivateMaintenance } = useMaintenance()
      await deactivateMaintenance()
      expect(maintenanceStore.status?.is_active).toBe(false)
    })

    it('isEnabled becomes false after deactivation', async () => {
      maintenanceStore.setStatus(makeStatus({ is_active: true }))

      mockPatch.mockResolvedValue({ message: 'ok' })
      const { deactivateMaintenance } = useMaintenance()
      await deactivateMaintenance()
      expect(maintenanceStore.isEnabled).toBe(false)
    })

    it('does not set error.value on success', async () => {
      mockPatch.mockResolvedValue({ message: 'ok' })
      const { deactivateMaintenance, error } = useMaintenance()
      await deactivateMaintenance()
      expect(error.value).toBeNull()
    })
  })

  // ── deactivateMaintenance — loading lifecycle ─────────────────

  describe('deactivateMaintenance() — loading lifecycle', () => {
    it('sets isLoading to true during the request', async () => {
      const loadingStates: boolean[] = []
      mockPatch.mockImplementation(async () => {
        loadingStates.push(maintenanceStore.isLoading)
        return { message: 'ok' }
      })
      const { deactivateMaintenance } = useMaintenance()
      await deactivateMaintenance()
      expect(loadingStates[0]).toBe(true)
    })

    it('sets isLoading to false after the request completes', async () => {
      mockPatch.mockResolvedValue({ message: 'ok' })
      const { deactivateMaintenance } = useMaintenance()
      await deactivateMaintenance()
      expect(maintenanceStore.isLoading).toBe(false)
    })

    it('sets isLoading to false even after a failure', async () => {
      mockPatch.mockRejectedValue({ message: 'Server error' })
      const { deactivateMaintenance } = useMaintenance()
      await deactivateMaintenance()
      expect(maintenanceStore.isLoading).toBe(false)
    })
  })

  // ── deactivateMaintenance — error handling ────────────────────

  describe('deactivateMaintenance() — error handling', () => {
    it('sets error.value from { data: { error: "..." } } shape', async () => {
      mockPatch.mockRejectedValue({ data: { error: 'Error de servidor' } })
      const { deactivateMaintenance, error } = useMaintenance()
      await deactivateMaintenance()
      expect(error.value).toBe('Error de servidor')
    })

    it('sets error.value from { message: "..." } shape', async () => {
      mockPatch.mockRejectedValue({ message: 'Network error' })
      const { deactivateMaintenance, error } = useMaintenance()
      await deactivateMaintenance()
      expect(error.value).toBe('Network error')
    })

    it('falls back to generic error for null rejection', async () => {
      mockPatch.mockRejectedValue(null)
      const { deactivateMaintenance, error } = useMaintenance()
      await deactivateMaintenance()
      expect(error.value).toBe('Ocurrió un error inesperado. Intenta de nuevo.')
    })

    it('does not update the store status when PATCH fails', async () => {
      mockPatch.mockRejectedValue({ message: 'Server error' })
      const { deactivateMaintenance } = useMaintenance()
      await deactivateMaintenance()
      expect(maintenanceStore.status).toBeNull()
    })
  })

  // ── error ref contract ───────────────────────────────────────

  describe('error ref contract', () => {
    it('starts as null', () => {
      const { error } = useMaintenance()
      expect(error.value).toBeNull()
    })

    it('is cleared at the start of activateMaintenance regardless of previous error', async () => {
      mockPatch.mockRejectedValue({ message: 'First error' })
      const { activateMaintenance, error } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(error.value).toBe('First error')

      mockPatch.mockResolvedValue({ message: 'ok' })
      await activateMaintenance({ message: 'Down again' })
      expect(error.value).toBeNull()
    })

    it('is cleared at the start of deactivateMaintenance', async () => {
      mockPatch.mockRejectedValue({ message: 'First error' })
      const { activateMaintenance, deactivateMaintenance, error } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(error.value).not.toBeNull()

      mockPatch.mockResolvedValue({ message: 'ok' })
      await deactivateMaintenance()
      expect(error.value).toBeNull()
    })

    it('is cleared at the start of fetchStatus', async () => {
      mockPatch.mockRejectedValue({ message: 'Toggle error' })
      const { fetchStatus, activateMaintenance, error } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
      expect(error.value).not.toBeNull()

      mockGet.mockRejectedValue(new Error('403'))
      await fetchStatus()
      expect(error.value).toBeNull()
    })

    it('is null after a successful activateMaintenance call', async () => {
      mockPatch.mockResolvedValue({ message: 'ok' })
      const { activateMaintenance, error } = useMaintenance()
      await activateMaintenance({ message: 'Down' })
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
