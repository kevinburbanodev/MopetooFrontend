// ============================================================
// admin.test.ts — Route middleware: admin
//
// The middleware checks BOTH authentication AND admin role:
//   - Not authenticated → navigateTo('/login')
//   - Authenticated but not admin → navigateTo('/')
//   - Authenticated and admin → returns undefined (pass-through)
//
// isAdmin is a computed: currentUser?.is_admin ?? false
//
// Testing strategy:
//   - useAuthStore is provided by createTestingPinia with controlled
//     initial state to cover all three branches.
//   - navigateTo is mocked via mockNuxtImport wrapped in vi.hoisted().
//   - defineNuxtRouteMiddleware is mocked to pass the handler through
//     so we can call it directly as a plain function.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'

// ── Nuxt auto-import mocks ───────────────────────────────────

const navigateToMock = vi.hoisted(() => vi.fn((path: string) => ({ path })))
mockNuxtImport('navigateTo', () => navigateToMock)

mockNuxtImport(
  'defineNuxtRouteMiddleware',
  () => (handler: Function) => handler,
)

// ── Suite ─────────────────────────────────────────────────────

describe('admin middleware', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
    vi.resetModules()
  })

  describe('when the user is NOT authenticated', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: { token: null, currentEntity: null },
          },
        }),
      )
    })

    it('calls navigateTo with /login', async () => {
      const middleware = (await import('./admin')).default as Function
      middleware({}, {})
      expect(navigateToMock).toHaveBeenCalledWith('/login')
    })

    it('returns the result of navigateTo (redirect signal)', async () => {
      const middleware = (await import('./admin')).default as Function
      const result = middleware({}, {})
      expect(result).toEqual({ path: '/login' })
    })
  })

  describe('when the user IS authenticated but is NOT an admin', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: {
              token: 'jwt.test.token',
              currentEntity: { id: 1, is_admin: false },
              entityType: 'user',
            },
          },
        }),
      )
    })

    it('calls navigateTo with / (forbidden redirect)', async () => {
      const middleware = (await import('./admin')).default as Function
      middleware({}, {})
      expect(navigateToMock).toHaveBeenCalledWith('/')
    })

    it('returns the result of navigateTo pointing to /', async () => {
      const middleware = (await import('./admin')).default as Function
      const result = middleware({}, {})
      expect(result).toEqual({ path: '/' })
    })

    it('does not redirect to /login (only to /)', async () => {
      const middleware = (await import('./admin')).default as Function
      middleware({}, {})
      expect(navigateToMock).not.toHaveBeenCalledWith('/login')
    })
  })

  describe('when the user IS authenticated AND is an admin', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: {
              token: 'admin.jwt.token',
              currentEntity: { id: 1, is_admin: true },
              entityType: 'user',
            },
          },
        }),
      )
    })

    it('does not call navigateTo', async () => {
      const middleware = (await import('./admin')).default as Function
      middleware({}, {})
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('returns undefined (pass-through)', async () => {
      const middleware = (await import('./admin')).default as Function
      const result = middleware({}, {})
      expect(result).toBeUndefined()
    })
  })
})
