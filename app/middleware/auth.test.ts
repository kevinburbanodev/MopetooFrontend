// ============================================================
// auth.test.ts — Route middleware: auth
//
// The middleware reads useAuthStore().isAuthenticated and calls
// navigateTo('/login') when the user has no session.
//
// Testing strategy:
//   - useAuthStore is provided by createTestingPinia with controlled
//     initial state so we can test both authenticated and
//     unauthenticated branches without touching real localStorage.
//   - navigateTo is mocked via mockNuxtImport — we assert the return
//     value of the middleware because Nuxt route middleware returns the
//     result of navigateTo() to signal a redirect.
//   - defineNuxtRouteMiddleware is mocked so the middleware factory
//     executes synchronously in tests without a real Nuxt context.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ── Nuxt auto-import mocks ───────────────────────────────────

// navigateTo must be mocked BEFORE importing the middleware so the
// module-level reference inside the middleware captures the mock.
const navigateToMock = vi.hoisted(() => vi.fn((path: string) => ({ path })))
mockNuxtImport('navigateTo', () => navigateToMock)

// defineNuxtRouteMiddleware passes the handler through unchanged in
// tests — we only care about the handler's return value, not the wrapper.
mockNuxtImport(
  'defineNuxtRouteMiddleware',
  () => (handler: Function) => handler,
)

// ── Suite ────────────────────────────────────────────────────

describe('auth middleware', () => {
  // The middleware factory is re-imported inside each test via a dynamic
  // import after pinia is set up so the store is available in the module scope.

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

    it('does not call navigateTo', async () => {
      const middleware = (await import('./auth')).default as Function
      // Middleware receives (to, from) — pass stubs; only isAuthenticated matters
      middleware({}, {})

      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('returns undefined (pass-through)', async () => {
      const middleware = (await import('./auth')).default as Function
      const result = middleware({}, {})

      expect(result).toBeUndefined()
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

    it('calls navigateTo with /login', async () => {
      const middleware = (await import('./auth')).default as Function
      middleware({}, {})

      expect(navigateToMock).toHaveBeenCalledWith('/login')
    })

    it('returns the result of navigateTo (redirect signal)', async () => {
      const middleware = (await import('./auth')).default as Function
      const result = middleware({}, {})

      // The return value IS the return from navigateTo — Nuxt uses it to redirect
      expect(result).toEqual({ path: '/login' })
    })
  })
})
