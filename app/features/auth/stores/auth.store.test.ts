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

    it('has null currentEntity on creation', () => {
      const store = useAuthStore()
      expect(store.currentEntity).toBeNull()
    })

    it('has null entityType on creation', () => {
      const store = useAuthStore()
      expect(store.entityType).toBeNull()
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

    it('isPro is false when currentEntity is null', () => {
      const store = useAuthStore()
      expect(store.isPro).toBe(false)
    })

    it('isAdmin is false when currentEntity is null', () => {
      const store = useAuthStore()
      expect(store.isAdmin).toBe(false)
    })

    it('isUser is false when entityType is null', () => {
      const store = useAuthStore()
      expect(store.isUser).toBe(false)
    })
  })

  // ── setSession ─────────────────────────────────────────────

  describe('setSession()', () => {
    it('sets the token from the login response', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      expect(store.token).toBe('jwt.test.token')
    })

    it('sets currentUser from the login response', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      expect(store.currentUser).toEqual(mockUser)
    })

    it('sets currentEntity from the login response', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      expect(store.currentEntity).toEqual(mockUser)
    })

    it('sets entityType to user', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      expect(store.entityType).toBe('user')
    })

    it('makes isAuthenticated true after setting a token', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      expect(store.isAuthenticated).toBe(true)
    })

    it('persists the token to localStorage', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mopetoo_token',
        'jwt.test.token',
      )
    })

    it('persists the entityType to localStorage', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'mopetoo_entity_type',
        'user',
      )
    })

    it('persists exactly the token value from the response', () => {
      const store = useAuthStore()
      const response: LoginResponse = { ...mockLoginResponse, token: 'different.token.value' }
      store.setSession(response, 'user')
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
      store.setSession(mockLoginResponse, 'user')
      store.clearSession()
      expect(store.token).toBeNull()
    })

    it('sets currentUser to null', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      store.clearSession()
      expect(store.currentUser).toBeNull()
    })

    it('sets currentEntity to null', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      store.clearSession()
      expect(store.currentEntity).toBeNull()
    })

    it('sets entityType to null', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      store.clearSession()
      expect(store.entityType).toBeNull()
    })

    it('makes isAuthenticated false', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      store.clearSession()
      expect(store.isAuthenticated).toBe(false)
    })

    it('removes the token from localStorage', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      store.clearSession()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mopetoo_token')
    })

    it('removes the entityType from localStorage', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      store.clearSession()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('mopetoo_entity_type')
    })
  })

  // ── setUser ────────────────────────────────────────────────

  describe('setUser()', () => {
    it('replaces currentUser without touching the token', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')

      const updatedUser: User = { ...mockUser, name: 'Ana Updated' }
      store.setUser(updatedUser)

      expect(store.currentUser).toEqual(updatedUser)
      // Token must remain unchanged
      expect(store.token).toBe('jwt.test.token')
    })

    it('does not write to localStorage when updating user', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      localStorageMock.setItem.mockClear() // clear the call from setSession

      store.setUser({ ...mockUser, name: 'New Name' })

      expect(localStorageMock.setItem).not.toHaveBeenCalled()
    })
  })

  // ── Computed: isPro ────────────────────────────────────────

  describe('isPro computed', () => {
    it('is false for a regular user', () => {
      const store = useAuthStore()
      store.setSession({ token: 'tok', user: mockUser }, 'user')
      expect(store.isPro).toBe(false)
    })

    it('is true for a pro user', () => {
      const store = useAuthStore()
      store.setSession({ token: 'tok', user: mockProUser }, 'user')
      expect(store.isPro).toBe(true)
    })

    it('falls back to false when currentEntity is null', () => {
      const store = useAuthStore()
      expect(store.isPro).toBe(false)
    })
  })

  // ── Computed: isAdmin ──────────────────────────────────────

  describe('isAdmin computed', () => {
    it('is false for a regular user', () => {
      const store = useAuthStore()
      store.setSession({ token: 'tok', user: mockUser }, 'user')
      expect(store.isAdmin).toBe(false)
    })

    it('is true for an admin user', () => {
      const store = useAuthStore()
      store.setSession({ token: 'tok', user: mockAdminUser }, 'user')
      expect(store.isAdmin).toBe(true)
    })

    it('falls back to false when currentEntity is null', () => {
      const store = useAuthStore()
      expect(store.isAdmin).toBe(false)
    })
  })

  // ── Computed: entity type checks ───────────────────────────

  describe('entity type computeds', () => {
    it('isUser is true when entityType is user', () => {
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      expect(store.isUser).toBe(true)
    })

    it('isShelter is true when entityType is shelter', () => {
      const store = useAuthStore()
      store.setSession({ token: 'tok', shelter: { id: 1, organization_name: 'Test' } } as any, 'shelter')
      expect(store.isShelter).toBe(true)
    })

    it('currentUser returns null when entityType is not user', () => {
      const store = useAuthStore()
      store.setSession({ token: 'tok', shelter: { id: 1, organization_name: 'Test' } } as any, 'shelter')
      expect(store.currentUser).toBeNull()
    })
  })

  // ── restoreFromStorage ─────────────────────────────────────

  describe('restoreFromStorage()', () => {
    it('sets the token from localStorage when a value is stored', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'mopetoo_token') return 'stored.jwt.token'
        if (key === 'mopetoo_entity_type') return 'user'
        return null
      })
      const store = useAuthStore()
      store.restoreFromStorage()
      expect(store.token).toBe('stored.jwt.token')
    })

    it('sets entityType from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'mopetoo_token') return 'stored.jwt.token'
        if (key === 'mopetoo_entity_type') return 'shelter'
        return null
      })
      const store = useAuthStore()
      store.restoreFromStorage()
      expect(store.entityType).toBe('shelter')
    })

    it('defaults entityType to user when not stored', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'mopetoo_token') return 'stored.jwt.token'
        return null
      })
      const store = useAuthStore()
      store.restoreFromStorage()
      expect(store.entityType).toBe('user')
    })

    it('makes isAuthenticated true when a stored token is found', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'mopetoo_token') return 'stored.jwt.token'
        return null
      })
      const store = useAuthStore()
      store.restoreFromStorage()
      expect(store.isAuthenticated).toBe(true)
    })

    it('does not change the token when localStorage returns null', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useAuthStore()
      store.restoreFromStorage()
      expect(store.token).toBeNull()
    })

    it('reads from the correct localStorage keys', () => {
      localStorageMock.getItem.mockReturnValue(null)
      const store = useAuthStore()
      store.restoreFromStorage()
      expect(localStorageMock.getItem).toHaveBeenCalledWith('mopetoo_token')
      expect(localStorageMock.getItem).toHaveBeenCalledWith('mopetoo_entity_type')
    })

    it('does not overwrite a token already in state if storage is empty', () => {
      // Simulate: store has a token set via setSession, then restoreFromStorage
      // is called again with an empty localStorage.
      const store = useAuthStore()
      store.setSession(mockLoginResponse, 'user')
      localStorageMock.getItem.mockReturnValue(null)
      store.restoreFromStorage()
      // The already-set token from setSession should remain.
      expect(store.token).toBe('jwt.test.token')
    })
  })
})
