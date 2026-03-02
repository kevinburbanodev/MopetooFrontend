// ============================================================
// useToast.test.ts
// Tests for the useToast composable.
//
// Strategy: mock `vue-sonner`'s `toast` object at the module level
// and verify that toastError/toastSuccess/toastInfo call the correct
// toast method with the expected arguments.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'

// ── vue-sonner mock ─────────────────────────────────────────
const mockToast = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
  info: vi.fn(),
}))

vi.mock('vue-sonner', () => ({
  toast: mockToast,
}))

// Import AFTER the mock is set up
import { useToast } from './useToast'

// ── Suite ─────────────────────────────────────────────────────

describe('useToast', () => {
  beforeEach(() => {
    mockToast.error.mockReset()
    mockToast.success.mockReset()
    mockToast.info.mockReset()
  })

  // ── toastError ──────────────────────────────────────────────

  describe('toastError', () => {
    it('calls toast.error with default title "Error"', () => {
      const { toastError } = useToast()
      toastError('Algo salió mal')

      expect(mockToast.error).toHaveBeenCalledWith(
        'Error',
        { description: 'Algo salió mal', duration: 5000 },
      )
    })

    it('calls toast.error with a custom title when provided', () => {
      const { toastError } = useToast()
      toastError('No se pudo guardar', 'Error de guardado')

      expect(mockToast.error).toHaveBeenCalledWith(
        'Error de guardado',
        { description: 'No se pudo guardar', duration: 5000 },
      )
    })

    it('uses 5000ms duration for error toasts', () => {
      const { toastError } = useToast()
      toastError('Error message')

      const callArgs = mockToast.error.mock.calls[0]
      expect(callArgs[1].duration).toBe(5000)
    })
  })

  // ── toastSuccess ────────────────────────────────────────────

  describe('toastSuccess', () => {
    it('calls toast.success with default title "¡Listo!"', () => {
      const { toastSuccess } = useToast()
      toastSuccess('Operación completada')

      expect(mockToast.success).toHaveBeenCalledWith(
        '¡Listo!',
        { description: 'Operación completada', duration: 4000 },
      )
    })

    it('calls toast.success with a custom title when provided', () => {
      const { toastSuccess } = useToast()
      toastSuccess('Tu mascota fue registrada', '¡Mascota creada!')

      expect(mockToast.success).toHaveBeenCalledWith(
        '¡Mascota creada!',
        { description: 'Tu mascota fue registrada', duration: 4000 },
      )
    })

    it('uses 4000ms duration for success toasts', () => {
      const { toastSuccess } = useToast()
      toastSuccess('OK')

      const callArgs = mockToast.success.mock.calls[0]
      expect(callArgs[1].duration).toBe(4000)
    })
  })

  // ── toastInfo ───────────────────────────────────────────────

  describe('toastInfo', () => {
    it('calls toast.info with default title "Información"', () => {
      const { toastInfo } = useToast()
      toastInfo('Tu sesión está por expirar')

      expect(mockToast.info).toHaveBeenCalledWith(
        'Información',
        { description: 'Tu sesión está por expirar', duration: 4000 },
      )
    })

    it('calls toast.info with a custom title when provided', () => {
      const { toastInfo } = useToast()
      toastInfo('Hay mantenimiento programado', 'Aviso')

      expect(mockToast.info).toHaveBeenCalledWith(
        'Aviso',
        { description: 'Hay mantenimiento programado', duration: 4000 },
      )
    })

    it('uses 4000ms duration for info toasts', () => {
      const { toastInfo } = useToast()
      toastInfo('Info')

      const callArgs = mockToast.info.mock.calls[0]
      expect(callArgs[1].duration).toBe(4000)
    })
  })

  // ── Return value ────────────────────────────────────────────

  describe('return value', () => {
    it('returns toastError, toastSuccess, and toastInfo functions', () => {
      const result = useToast()
      expect(typeof result.toastError).toBe('function')
      expect(typeof result.toastSuccess).toBe('function')
      expect(typeof result.toastInfo).toBe('function')
    })
  })
})
