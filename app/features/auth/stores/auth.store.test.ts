// ============================================================
// auth.store.test.ts
// Tests the auth Pinia store in isolation using createTestingPinia.
//
// What this suite does NOT cover intentionally:
//   - The auth.client.ts plugin (integration concern, not store logic)
//   - localStorage behaviour in SSR (import.meta.client is false there;
//     the guard makes it a no-op, which is correct — nothing to assert)
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth.store'
import type { LoginResponse, User } from '../types'

// ── Fixtures ────────────────────────────────────────────────

const mockUser: User = {
  id: 1,
  name: 'Ana',
  last_name: 'Gómez',
  email: 'ana@example.com',
  country: 'CO',
  city: 'Bogotá',
  phone_country_code: '+57',
  phone: '3001234567',
  is_pro: false,
  is_admin: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockProUser: User = {
  ...mockUser,
  id: 2,
  is_pro: true,
  is_admin: false,
}

const mockAdminUser: User = {
  ...mockUser,
  id: 3,
  is_pro: false,
  is_admin: true,
}

const mockLoginResponse: LoginResponse = {
  token: 'jwt.test.token',
  user: mockUser,
}

// ── localStorage mock ────────────────────────────────────────
// We stub the global so the import.meta.client guard in the store
// is effectively bypassed in a jsdom/happy-dom environment where
// import.meta.client evaluates to true.

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

// ── Suite ────────────────────────────────────────────────────

describe('useAuthStore', () => {
  beforeEach(() => {
    // Fresh pinia per test — no shared state between tests
    setActivePinia(createPinia())

    // Reset the localStorage mock's call history and stored values
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    localStorageMock.clear()

    // Inject into the global so the store's localStorage calls hit the mock
    vi.stubGlobal('localStorage', localStorageMock)
  })

  // ── Initial state ──────────────────────────────────────────

  describe('initial state', () => {
    it('has null currentUser on creation', () => {
      const store = useAuthStore()
      expect(store.currentUser).toBeNull()
    })

    it('has null token on creation', () => {
      const store = useAuthStore()
      expect(store.token).toBeNull()
    })

    it('has isPending false on creation', () => {
      const store = useAuthStore()
      expect(store.isPending).toBe(false)
    })

    it('isAuthenticated is false when token is null', () => {
      const store = useAuthStore()
      expect(store.isAuthenticated).toBe(false)
    })

    it('isPro is false when currentUser is null', () => {
      const store = useAuthStore()
      expect(store.isPro).toBe(false)
    })

    it('isAdmin is false when currentUser is null', () => {
      const store = useAuthStore()
      expect(store.isAdmin).toBe(false)
    })
  })

  // ── setSession ─────────────────────────────────────────────

  describe('setSession()', () => {
    it('sets the token from the login response', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse)
      expect(store.token).toBe('jwt.test.token')
    })

    it('sets currentUser from the login response', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse)
      expect(store.currentUser).toEqual(mockUser)
    })

    it('makes isAuthenticated true after setting a token', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse)
      expect(store.isAuthenticated).toBe(true)
    })

    it('persists the token to localStorage', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mopetoo_token',
        'jwt.test.token',
      )
    })

    it('persists exactly the token value from the response', () => {
      const store = useAuthStore()
      const response: LoginResponse = { ...mockLoginResponse, token: 'different.token.value' }
      store.setSession(response)
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mopetoo_token',
        'different.token.value',
      )
    })
  })

  // ── clearSession ───────────────────────────────────────────

  describe('clearSession()', () => {
    it('sets token to null', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse)
      store.clearSession()
      expect(store.token).toBeNull()
    })

    it('sets currentUser to null', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse)
      store.clearSession()
      expect(store.currentUser).toBeNull()
    })

    it('makes isAuthenticated false', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse)
      store.clearSession()
      expect(store.isAuthenticated).toBe(false)
    })

    it('removes the token from localStorage', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse)
      store.clearSession()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mopetoo_token')
    })
  })

  // ── setUser ────────────────────────────────────────────────

  describe('setUser()', () => {
    it('replaces currentUser without touching the token', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse)

      const updatedUser: User = { ...mockUser, name: 'Ana Updated' }
      store.setUser(updatedUser)

      expect(store.currentUser).toEqual(updatedUser)
      // Token must remain unchanged
      expect(store.token).toBe('jwt.test.token')
    })

    it('does not write to localStorage when updating user', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse)
      localStorageMock.setItem.mockClear() // clear the call from setSession

      store.setUser({ ...mockUser, name: 'New Name' })

      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  // ── Computed: isPro ────────────────────────────────────────

  describe('isPro computed', () => {
    it('is false for a regular user', () => {
      const store = useAuthStore()
      store.setSession({ token: 'tok', user: mockUser })
      expect(store.isPro).toBe(false)
    })

    it('is true for a pro user', () => {
      const store = useAuthStore()
      store.setSession({ token: 'tok', user: mockProUser })
      expect(store.isPro).toBe(true)
    })

    it('falls back to false when currentUser is null', () => {
      const store = useAuthStore()
      expect(store.isPro).toBe(false)
    })
  })

  // ── Computed: isAdmin ──────────────────────────────────────

  describe('isAdmin computed', () => {
    it('is false for a regular user', () => {
      const store = useAuthStore()
      store.setSession({ token: 'tok', user: mockUser })
      expect(store.isAdmin).toBe(false)
    })

    it('is true for an admin user', () => {
      const store = useAuthStore()
      store.setSession({ token: 'tok', user: mockAdminUser })
      expect(store.isAdmin).toBe(true)
    })

    it('falls back to false when currentUser is null', () => {
      const store = useAuthStore()
      expect(store.isAdmin).toBe(false)
    })
  })

  // ── restoreFromStorage ─────────────────────────────────────

  describe('restoreFromStorage()', () => {
    it('sets the token from localStorage when a value is stored', () => {
      localStorageMock.getItem.mockReturnValueOnce('stored.jwt.token')
      const store = useAuthStore()
      store.restoreFromStorage()
      expect(store.token).toBe('stored.jwt.token')
    })

    it('makes isAuthenticated true when a stored token is found', () => {
      localStorageMock.getItem.mockReturnValueOnce('stored.jwt.token')
      const store = useAuthStore()
      store.restoreFromStorage()
      expect(store.isAuthenticated).toBe(true)
    })

    it('does not change the token when localStorage returns null', () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      const store = useAuthStore()
      store.restoreFromStorage()
      expect(store.token).toBeNull()
    })

    it('reads from the correct localStorage key', () => {
      localStorageMock.getItem.mockReturnValueOnce(null)
      const store = useAuthStore()
      store.restoreFromStorage()
      expect(localStorageMock.getItem).toHaveBeenCalledWith('mopetoo_token')
    })

    it('does not overwrite a token already in state if storage is empty', () => {
      // Simulate: store has a token set via setSession, then restoreFromStorage
      // is called again with an empty localStorage.
      const store = useAuthStore()
      store.setSession(mockLoginResponse)
      localStorageMock.getItem.mockReturnValueOnce(null)
      store.restoreFromStorage()
      // The already-set token from setSession should remain.
      expect(store.token).toBe('jwt.test.token')
    })
  })
})
