// ============================================================
// guest.test.ts — Route middleware: guest
//
// The middleware reads useAuthStore().isAuthenticated and calls
// navigateTo('/dashboard') when the user already has an active session.
// Unauthenticated users pass through (undefined return).
//
// Testing strategy mirrors auth.test.ts: pinia initialState controls
// the isAuthenticated computed, mockNuxtImport intercepts navigateTo.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ── Nuxt auto-import mocks ───────────────────────────────────

const navigateToMock = vi.fn((path: string) => ({ path }))
mockNuxtImport('navigateTo', () => navigateToMock)

mockNuxtImport(
  'defineNuxtRouteMiddleware',
  () => (handler: Function) => handler,
)

// ── Suite ────────────────────────────────────────────────────

describe('guest middleware', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
    vi.resetModules()
  })

  describe('when the user IS authenticated', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: { token: 'jwt.test.token', currentUser: { id: 1 } },
          },
        }),
      )
    })

    it('calls navigateTo with /dashboard', async () => {
      const middleware = (await import('./guest')).default as Function
      middleware({}, {})

      expect(navigateToMock).toHaveBeenCalledWith('/dashboard')
    })

    it('returns the result of navigateTo (redirect signal)', async () => {
      const middleware = (await import('./guest')).default as Function
      const result = middleware({}, {})

      expect(result).toEqual({ path: '/dashboard' })
    })
  })

  describe('when the user is NOT authenticated', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: { token: null, currentUser: null },
          },
        }),
      )
    })

    it('does not call navigateTo', async () => {
      const middleware = (await import('./guest')).default as Function
      middleware({}, {})

      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('returns undefined (pass-through)', async () => {
      const middleware = (await import('./guest')).default as Function
      const result = middleware({}, {})

      expect(result).toBeUndefined()
    })
  })
})
