// ============================================================
// auth.test.ts — Route middleware: auth
//
// The middleware protects /admin/** routes only. Redirects to /
// when the user has no active session. Non-admin routes pass through.
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

// ── Suite ────────────────────────────────────────────────────

describe('auth middleware', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
    vi.resetModules()
  })

  describe('when the user IS authenticated', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: { token: 'jwt.test.token', currentEntity: { id: 1 }, entityType: 'user' },
          },
        }),
      )
    })

    it('does not redirect on /admin routes', async () => {
      const middleware = (await import('./auth')).default as Function
      middleware({ path: '/admin' }, {})

      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('returns undefined (pass-through) for /admin', async () => {
      const middleware = (await import('./auth')).default as Function
      const result = middleware({ path: '/admin/users' }, {})

      expect(result).toBeUndefined()
    })
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

    it('redirects /admin routes to /', async () => {
      const middleware = (await import('./auth')).default as Function
      middleware({ path: '/admin' }, {})

      expect(navigateToMock).toHaveBeenCalledWith('/')
    })

    it('returns the redirect signal for /admin routes', async () => {
      const middleware = (await import('./auth')).default as Function
      const result = middleware({ path: '/admin/users' }, {})

      expect(result).toEqual({ path: '/' })
    })

    it('does NOT redirect non-admin routes', async () => {
      const middleware = (await import('./auth')).default as Function
      middleware({ path: '/blog' }, {})

      expect(navigateToMock).not.toHaveBeenCalled()
    })
  })
})
