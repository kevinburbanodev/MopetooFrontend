// ============================================================
// maintenance.test.ts — Route middleware: maintenance
//
// The middleware implements three rules:
//   1. Admin users always bypass maintenance — they must always be
//      able to reach the admin panel to disable it. Return undefined.
//   2. If maintenance IS enabled AND the user is NOT on /maintenance
//      AND the user is NOT an admin → redirect to /maintenance.
//   3. If maintenance is NOT enabled AND the user IS on /maintenance
//      → redirect to / (maintenance is over).
//
// Key reads from stores:
//   - authStore.isAdmin — computed: currentUser?.is_admin ?? false
//   - maintenanceStore.isEnabled — computed: status?.is_enabled ?? false
//
// Testing strategy:
//   - navigateTo is mocked via mockNuxtImport wrapped in vi.hoisted()
//     (per the established pattern in admin.test.ts).
//   - defineNuxtRouteMiddleware is mocked to return the handler directly
//     so we can call it as a plain function.
//   - Both stores are controlled via createTestingPinia with initialState.
//   - Middleware is dynamically imported AFTER pinia is activated
//     (vi.resetModules() ensures a fresh module per test group).
//   - maintenanceStore.isEnabled is a computed from status.is_enabled,
//     so we set initialState: { maintenance: { status: { is_enabled: true } } }
//     NOT { maintenance: { isEnabled: true } } which is ignored.
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

describe('maintenance middleware', () => {
  beforeEach(() => {
    navigateToMock.mockClear()
    vi.resetModules()
  })

  // ── Admin user bypass ────────────────────────────────────────

  describe('when the user IS an admin (authStore.isAdmin = true)', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: {
              token: 'admin.jwt.token',
              currentUser: { id: 1, is_admin: true },
            },
            maintenance: {
              status: { is_enabled: true },
            },
          },
        }),
      )
    })

    it('does NOT call navigateTo even when maintenance is enabled', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/dashboard' }, {})
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('returns undefined (pass-through) for a non-maintenance page', async () => {
      const middleware = (await import('./maintenance')).default as Function
      const result = middleware({ path: '/dashboard' }, {})
      expect(result).toBeUndefined()
    })

    it('does NOT redirect admin away from /maintenance even when maintenance is enabled', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/maintenance' }, {})
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('returns undefined when admin visits /maintenance with maintenance enabled', async () => {
      const middleware = (await import('./maintenance')).default as Function
      const result = middleware({ path: '/maintenance' }, {})
      expect(result).toBeUndefined()
    })

    it('does NOT redirect admin even when navigating to /', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/' }, {})
      expect(navigateToMock).not.toHaveBeenCalled()
    })
  })

  // ── Admin user — maintenance disabled ───────────────────────

  describe('when the user IS an admin and maintenance is DISABLED', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: {
              token: 'admin.jwt.token',
              currentUser: { id: 1, is_admin: true },
            },
            maintenance: {
              status: { is_enabled: false },
            },
          },
        }),
      )
    })

    it('does NOT call navigateTo when admin visits /maintenance with maintenance disabled', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/maintenance' }, {})
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('returns undefined — admin always bypasses middleware logic', async () => {
      const middleware = (await import('./maintenance')).default as Function
      const result = middleware({ path: '/' }, {})
      expect(result).toBeUndefined()
    })
  })

  // ── Non-admin, maintenance ENABLED ──────────────────────────

  describe('when the user is NOT an admin and maintenance IS enabled', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: {
              token: 'user.jwt.token',
              currentUser: { id: 2, is_admin: false },
            },
            maintenance: {
              status: { is_enabled: true },
            },
          },
        }),
      )
    })

    it('redirects to /maintenance when navigating to /', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/' }, {})
      expect(navigateToMock).toHaveBeenCalledWith('/maintenance')
    })

    it('returns the navigateTo result (redirect signal) for /', async () => {
      const middleware = (await import('./maintenance')).default as Function
      const result = middleware({ path: '/' }, {})
      expect(result).toEqual({ path: '/maintenance' })
    })

    it('redirects to /maintenance when navigating to /dashboard', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/dashboard' }, {})
      expect(navigateToMock).toHaveBeenCalledWith('/maintenance')
    })

    it('returns the redirect signal for /dashboard', async () => {
      const middleware = (await import('./maintenance')).default as Function
      const result = middleware({ path: '/dashboard' }, {})
      expect(result).toEqual({ path: '/maintenance' })
    })

    it('redirects to /maintenance when navigating to /blog', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/blog' }, {})
      expect(navigateToMock).toHaveBeenCalledWith('/maintenance')
    })

    it('does NOT redirect when the user is already on /maintenance', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/maintenance' }, {})
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('returns undefined when the user is already on /maintenance', async () => {
      const middleware = (await import('./maintenance')).default as Function
      const result = middleware({ path: '/maintenance' }, {})
      expect(result).toBeUndefined()
    })
  })

  // ── Non-admin, maintenance DISABLED ─────────────────────────

  describe('when the user is NOT an admin and maintenance is NOT enabled', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: {
              token: 'user.jwt.token',
              currentUser: { id: 2, is_admin: false },
            },
            maintenance: {
              status: { is_enabled: false },
            },
          },
        }),
      )
    })

    it('does NOT redirect when navigating to /', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/' }, {})
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('returns undefined for / (pass-through)', async () => {
      const middleware = (await import('./maintenance')).default as Function
      const result = middleware({ path: '/' }, {})
      expect(result).toBeUndefined()
    })

    it('does NOT redirect when navigating to /dashboard', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/dashboard' }, {})
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('redirects to / when the user is on /maintenance but maintenance is now disabled', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/maintenance' }, {})
      expect(navigateToMock).toHaveBeenCalledWith('/')
    })

    it('returns { path: "/" } when redirecting stale /maintenance visitors', async () => {
      const middleware = (await import('./maintenance')).default as Function
      const result = middleware({ path: '/maintenance' }, {})
      expect(result).toEqual({ path: '/' })
    })
  })

  // ── Unauthenticated user (no currentUser) ───────────────────

  describe('when the user is unauthenticated (no token, no currentUser)', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: {
              token: null,
              currentUser: null,
            },
            maintenance: {
              status: { is_enabled: true },
            },
          },
        }),
      )
    })

    it('redirects to /maintenance (unauthenticated users are NOT admins)', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/' }, {})
      expect(navigateToMock).toHaveBeenCalledWith('/maintenance')
    })

    it('returns the redirect signal for unauthenticated user navigating to /login', async () => {
      const middleware = (await import('./maintenance')).default as Function
      const result = middleware({ path: '/login' }, {})
      expect(result).toEqual({ path: '/maintenance' })
    })

    it('does NOT redirect unauthenticated user already on /maintenance', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/maintenance' }, {})
      expect(navigateToMock).not.toHaveBeenCalled()
    })
  })

  // ── No status fetched yet (status = null, isEnabled defaults false) ──

  describe('when no maintenance status has been fetched (status = null)', () => {
    beforeEach(() => {
      setActivePinia(
        createTestingPinia({
          initialState: {
            auth: {
              token: 'user.jwt.token',
              currentUser: { id: 2, is_admin: false },
            },
            maintenance: {
              // status is null — isEnabled computed defaults to false
              status: null,
            },
          },
        }),
      )
    })

    it('does NOT redirect — defaults to maintenance OFF (safe default)', async () => {
      const middleware = (await import('./maintenance')).default as Function
      middleware({ path: '/' }, {})
      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('returns undefined for normal navigation when status is unknown', async () => {
      const middleware = (await import('./maintenance')).default as Function
      const result = middleware({ path: '/blog' }, {})
      expect(result).toBeUndefined()
    })
  })
})
