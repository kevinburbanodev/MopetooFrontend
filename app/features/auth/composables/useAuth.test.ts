// ============================================================
// useAuth.test.ts
// Tests the useAuth composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock because it is an auto-imported
//     composable defined inside the project (not a Nuxt built-in).
//     mockNuxtImport is reserved for Nuxt/ofetch auto-imports.
//   - $fetch (global) is stubbed via vi.stubGlobal for the multipart
//     paths that bypass useApi.
//   - useAuthStore is accessed via createTestingPinia so we get a real
//     reactive store whose actions we can spy on.
//   - useRouter / navigateTo are the Nuxt auto-imports that must be
//     mocked through mockNuxtImport.
//   - useRuntimeConfig is mocked to return a stable baseURL.
//
// What this suite does NOT cover intentionally:
//   - buildRegisterFormData / buildProfileFormData field assembly — those
//     are tested implicitly through the FormData branch assertions.
//   - The SCSS / Bootstrap layer — not relevant to composable logic.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { LoginResponse, User } from '../types'

// ── Nuxt auto-import mocks ───────────────────────────────────

// navigateTo is used by logout, resetPassword, deleteAccount.
// We need a stable mock reference to assert calls against.
const navigateToMock = vi.fn()
mockNuxtImport('navigateTo', () => navigateToMock)

// useRouter is used by login and logout (router.push).
const routerPushMock = vi.fn()
mockNuxtImport('useRouter', () => () => ({ push: routerPushMock }))

// useRuntimeConfig provides the base API URL.
mockNuxtImport('useRuntimeConfig', () => () => ({
  public: { apiBase: 'http://localhost:4000' },
}))

// ── useApi mock ──────────────────────────────────────────────
// useApi is NOT a Nuxt built-in, so we mock it with vi.mock.
// Each test replaces the inner implementations via the returned spies.

const apiPostMock = vi.fn()
const apiGetMock = vi.fn()
const apiPatchMock = vi.fn()
const apiDelMock = vi.fn()

vi.mock('../../../shared/composables/useApi', () => ({
  useApi: () => ({
    post: apiPostMock,
    get: apiGetMock,
    patch: apiPatchMock,
    del: apiDelMock,
  }),
}))

// ── $fetch global stub ───────────────────────────────────────
// Multipart photo paths bypass useApi and call $fetch directly.
const fetchMock = vi.fn()

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

const mockLoginResponse: LoginResponse = {
  token: 'jwt.test.token',
  user: mockUser,
}

const minimalRegisterPayload = {
  name: 'Ana',
  last_name: 'Gómez',
  email: 'ana@example.com',
  password: 'Secret123!',
  country: 'CO',
  city: 'Bogotá',
  phone_country_code: '+57',
  phone: '3001234567',
}

// ── Helper ───────────────────────────────────────────────────
// Builds a fake File for multipart tests.
function makeFile(name = 'photo.jpg'): File {
  return new File(['(binary)'], name, { type: 'image/jpeg' })
}

// ── Suite ────────────────────────────────────────────────────

describe('useAuth', () => {
  let authStore: ReturnType<typeof import('../stores/auth.store').useAuthStore>

  beforeEach(async () => {
    // Isolate Pinia per test — stubActions: false so real action logic runs.
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    // Resolve the store after pinia is active.
    const { useAuthStore } = await import('../stores/auth.store')
    authStore = useAuthStore()

    // Reset all API mocks — prevents call counts from bleeding between tests.
    apiPostMock.mockReset()
    apiGetMock.mockReset()
    apiPatchMock.mockReset()
    apiDelMock.mockReset()
    routerPushMock.mockReset()
    navigateToMock.mockReset()
    fetchMock.mockReset()

    // Inject the $fetch stub globally for multipart paths.
    vi.stubGlobal('$fetch', fetchMock)

    // Stub localStorage for the updateProfile photo path.
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => 'stored.jwt'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  // ── login ──────────────────────────────────────────────────

  describe('login()', () => {
    it('calls POST /login with email and password', async () => {
      apiPostMock.mockResolvedValueOnce(mockLoginResponse)
      const { useAuth } = await import('./useAuth')
      const { login } = useAuth()

      await login('ana@example.com', 'Secret123!')

      expect(apiPostMock).toHaveBeenCalledWith('/login', {
        email: 'ana@example.com',
        password: 'Secret123!',
      })
    })

    it('calls authStore.setSession with the API response on success', async () => {
      apiPostMock.mockResolvedValueOnce(mockLoginResponse)
      const setSessionSpy = vi.spyOn(authStore, 'setSession')
      const { useAuth } = await import('./useAuth')
      const { login } = useAuth()

      await login('ana@example.com', 'Secret123!')

      expect(setSessionSpy).toHaveBeenCalledWith(mockLoginResponse)
    })

    it('navigates to /dashboard after successful login', async () => {
      apiPostMock.mockResolvedValueOnce(mockLoginResponse)
      const { useAuth } = await import('./useAuth')
      const { login } = useAuth()

      await login('ana@example.com', 'Secret123!')

      expect(routerPushMock).toHaveBeenCalledWith('/dashboard')
    })

    it('clears error before the request', async () => {
      apiPostMock.mockResolvedValueOnce(mockLoginResponse)
      const { useAuth } = await import('./useAuth')
      const { login, error } = useAuth()

      // Pre-seed an error
      error.value = 'previous error'
      await login('ana@example.com', 'Secret123!')

      expect(error.value).toBeNull()
    })

    it('sets error with the API message on failure', async () => {
      apiPostMock.mockRejectedValueOnce({
        data: { error: 'Credenciales inválidas' },
      })
      const { useAuth } = await import('./useAuth')
      const { login, error } = useAuth()

      await login('ana@example.com', 'wrong-password')

      expect(error.value).toBe('Credenciales inválidas')
    })

    it('does not call setSession when login fails', async () => {
      apiPostMock.mockRejectedValueOnce({ data: { error: 'Unauthorized' } })
      const setSessionSpy = vi.spyOn(authStore, 'setSession')
      const { useAuth } = await import('./useAuth')
      const { login } = useAuth()

      await login('ana@example.com', 'wrong')

      expect(setSessionSpy).not.toHaveBeenCalled()
    })

    it('sets pending to true during the request and false after', async () => {
      let pendingDuringCall = false
      apiPostMock.mockImplementationOnce(async () => {
        // Capture pending mid-flight by returning a deferred promise
        return new Promise<LoginResponse>(resolve =>
          setTimeout(() => resolve(mockLoginResponse), 0),
        )
      })
      const { useAuth } = await import('./useAuth')
      const { login, pending } = useAuth()

      const loginPromise = login('ana@example.com', 'Secret123!')
      // pending should be true while the promise is in flight
      pendingDuringCall = pending.value
      await loginPromise

      expect(pendingDuringCall).toBe(true)
      expect(pending.value).toBe(false)
    })
  })

  // ── register ───────────────────────────────────────────────

  describe('register()', () => {
    it('calls POST /users with JSON body when no photo is provided', async () => {
      // register calls login internally after POST /users — mock both
      apiPostMock
        .mockResolvedValueOnce(undefined) // POST /users
        .mockResolvedValueOnce(mockLoginResponse) // POST /login (auto-login)

      const { useAuth } = await import('./useAuth')
      const { register } = useAuth()

      await register(minimalRegisterPayload)

      expect(apiPostMock).toHaveBeenCalledWith('/users', minimalRegisterPayload)
    })

    it('calls $fetch with FormData when a photo file is provided', async () => {
      fetchMock.mockResolvedValueOnce(undefined) // POST /users multipart
      apiPostMock.mockResolvedValueOnce(mockLoginResponse) // auto-login

      const { useAuth } = await import('./useAuth')
      const { register } = useAuth()
      const photo = makeFile()

      await register(minimalRegisterPayload, photo)

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/users',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData),
        }),
      )
    })

    it('does NOT call useApi.post when a photo is provided', async () => {
      fetchMock.mockResolvedValueOnce(undefined)
      apiPostMock.mockResolvedValueOnce(mockLoginResponse)

      const { useAuth } = await import('./useAuth')
      const { register } = useAuth()

      await register(minimalRegisterPayload, makeFile())

      // First call is the auto-login, not /users
      expect(apiPostMock).not.toHaveBeenCalledWith('/users', expect.anything())
    })

    it('sets error on failure', async () => {
      apiPostMock.mockRejectedValueOnce({ data: { error: 'Email ya registrado' } })
      const { useAuth } = await import('./useAuth')
      const { register, error } = useAuth()

      await register(minimalRegisterPayload)

      expect(error.value).toBe('Email ya registrado')
    })
  })

  // ── logout ─────────────────────────────────────────────────

  describe('logout()', () => {
    it('calls clearSession on the auth store', async () => {
      const clearSessionSpy = vi.spyOn(authStore, 'clearSession')
      const { useAuth } = await import('./useAuth')
      const { logout } = useAuth()

      logout()

      expect(clearSessionSpy).toHaveBeenCalledOnce()
    })

    it('pushes to /login route', async () => {
      const { useAuth } = await import('./useAuth')
      const { logout } = useAuth()

      logout()

      expect(routerPushMock).toHaveBeenCalledWith('/login')
    })
  })

  // ── forgotPassword ─────────────────────────────────────────

  describe('forgotPassword()', () => {
    it('calls POST /forgot-password with the email', async () => {
      apiPostMock.mockResolvedValueOnce(undefined)
      const { useAuth } = await import('./useAuth')
      const { forgotPassword } = useAuth()

      await forgotPassword('ana@example.com')

      expect(apiPostMock).toHaveBeenCalledWith('/forgot-password', {
        email: 'ana@example.com',
      })
    })

    it('sets pending to false after the request completes', async () => {
      apiPostMock.mockResolvedValueOnce(undefined)
      const { useAuth } = await import('./useAuth')
      const { forgotPassword, pending } = useAuth()

      await forgotPassword('ana@example.com')

      expect(pending.value).toBe(false)
    })

    it('sets error on API failure', async () => {
      apiPostMock.mockRejectedValueOnce({ data: { error: 'Usuario no encontrado' } })
      const { useAuth } = await import('./useAuth')
      const { forgotPassword, error } = useAuth()

      await forgotPassword('noexiste@example.com')

      expect(error.value).toBe('Usuario no encontrado')
    })
  })

  // ── resetPassword ──────────────────────────────────────────

  describe('resetPassword()', () => {
    it('calls POST /reset-password with token and password', async () => {
      apiPostMock.mockResolvedValueOnce(undefined)
      const { useAuth } = await import('./useAuth')
      const { resetPassword } = useAuth()

      await resetPassword('reset-token-abc', 'NewSecret123!')

      expect(apiPostMock).toHaveBeenCalledWith('/reset-password', {
        token: 'reset-token-abc',
        password: 'NewSecret123!',
      })
    })

    it('navigates to /login after a successful reset', async () => {
      apiPostMock.mockResolvedValueOnce(undefined)
      const { useAuth } = await import('./useAuth')
      const { resetPassword } = useAuth()

      await resetPassword('reset-token-abc', 'NewSecret123!')

      expect(routerPushMock).toHaveBeenCalledWith('/login')
    })

    it('sets error on failure and does not navigate', async () => {
      apiPostMock.mockRejectedValueOnce({ data: { error: 'Token expirado' } })
      const { useAuth } = await import('./useAuth')
      const { resetPassword, error } = useAuth()

      await resetPassword('expired-token', 'NewSecret123!')

      expect(error.value).toBe('Token expirado')
      expect(routerPushMock).not.toHaveBeenCalled()
    })
  })

  // ── fetchCurrentUser ───────────────────────────────────────

  describe('fetchCurrentUser()', () => {
    it('calls GET /api/me', async () => {
      apiGetMock.mockResolvedValueOnce(mockUser)
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser } = useAuth()

      await fetchCurrentUser()

      expect(apiGetMock).toHaveBeenCalledWith('/api/me')
    })

    it('calls authStore.setUser with the API response on success', async () => {
      apiGetMock.mockResolvedValueOnce(mockUser)
      const setUserSpy = vi.spyOn(authStore, 'setUser')
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser } = useAuth()

      await fetchCurrentUser()

      expect(setUserSpy).toHaveBeenCalledWith(mockUser)
    })

    it('calls clearSession on a 401 response', async () => {
      apiGetMock.mockRejectedValueOnce({ statusCode: 401 })
      const clearSessionSpy = vi.spyOn(authStore, 'clearSession')
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser } = useAuth()

      await fetchCurrentUser()

      expect(clearSessionSpy).toHaveBeenCalledOnce()
    })

    it('does not call clearSession on a non-401 error', async () => {
      apiGetMock.mockRejectedValueOnce({ statusCode: 500, data: { error: 'Server error' } })
      const clearSessionSpy = vi.spyOn(authStore, 'clearSession')
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser } = useAuth()

      await fetchCurrentUser()

      expect(clearSessionSpy).not.toHaveBeenCalled()
    })

    it('sets error for non-401 API failures', async () => {
      apiGetMock.mockRejectedValueOnce({ statusCode: 500, data: { error: 'Internal error' } })
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser, error } = useAuth()

      await fetchCurrentUser()

      expect(error.value).toBe('Internal error')
    })

    it('sets pending to false after the request', async () => {
      apiGetMock.mockResolvedValueOnce(mockUser)
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser, pending } = useAuth()

      await fetchCurrentUser()

      expect(pending.value).toBe(false)
    })
  })

  // ── updateProfile ──────────────────────────────────────────

  describe('updateProfile()', () => {
    it('calls PATCH /api/me with JSON body when no photo is provided', async () => {
      const updatedUser: User = { ...mockUser, name: 'Ana Updated' }
      apiPatchMock.mockResolvedValueOnce(updatedUser)
      const { useAuth } = await import('./useAuth')
      const { updateProfile } = useAuth()

      await updateProfile({ name: 'Ana Updated' })

      expect(apiPatchMock).toHaveBeenCalledWith('/api/me', { name: 'Ana Updated' })
    })

    it('calls authStore.setUser with the updated user on JSON success', async () => {
      const updatedUser: User = { ...mockUser, name: 'Ana Updated' }
      apiPatchMock.mockResolvedValueOnce(updatedUser)
      const setUserSpy = vi.spyOn(authStore, 'setUser')
      const { useAuth } = await import('./useAuth')
      const { updateProfile } = useAuth()

      await updateProfile({ name: 'Ana Updated' })

      expect(setUserSpy).toHaveBeenCalledWith(updatedUser)
    })

    it('calls $fetch with FormData when a photo is provided', async () => {
      const updatedUser: User = { ...mockUser, name: 'Ana Updated' }
      fetchMock.mockResolvedValueOnce(updatedUser)
      const { useAuth } = await import('./useAuth')
      const { updateProfile } = useAuth()

      await updateProfile({ name: 'Ana Updated' }, makeFile())

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/me',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.any(FormData),
        }),
      )
    })

    it('attaches Authorization header when a stored token exists during photo upload', async () => {
      const updatedUser: User = { ...mockUser }
      fetchMock.mockResolvedValueOnce(updatedUser)
      const { useAuth } = await import('./useAuth')
      const { updateProfile } = useAuth()

      await updateProfile({ name: 'X' }, makeFile())

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: 'Bearer stored.jwt' },
        }),
      )
    })

    it('sets error on PATCH failure', async () => {
      apiPatchMock.mockRejectedValueOnce({ data: { error: 'Email inválido' } })
      const { useAuth } = await import('./useAuth')
      const { updateProfile, error } = useAuth()

      await updateProfile({ email: 'bad' })

      expect(error.value).toBe('Email inválido')
    })
  })

  // ── deleteAccount ──────────────────────────────────────────

  describe('deleteAccount()', () => {
    it('calls DELETE /api/me', async () => {
      apiDelMock.mockResolvedValueOnce(undefined)
      const { useAuth } = await import('./useAuth')
      const { deleteAccount } = useAuth()

      await deleteAccount()

      expect(apiDelMock).toHaveBeenCalledWith('/api/me')
    })

    it('calls clearSession after deletion', async () => {
      apiDelMock.mockResolvedValueOnce(undefined)
      const clearSessionSpy = vi.spyOn(authStore, 'clearSession')
      const { useAuth } = await import('./useAuth')
      const { deleteAccount } = useAuth()

      await deleteAccount()

      expect(clearSessionSpy).toHaveBeenCalledOnce()
    })

    it('navigates to / after deletion', async () => {
      apiDelMock.mockResolvedValueOnce(undefined)
      const { useAuth } = await import('./useAuth')
      const { deleteAccount } = useAuth()

      await deleteAccount()

      expect(routerPushMock).toHaveBeenCalledWith('/')
    })

    it('sets error on failure and does not navigate', async () => {
      apiDelMock.mockRejectedValueOnce({ data: { error: 'No se puede eliminar' } })
      const { useAuth } = await import('./useAuth')
      const { deleteAccount, error } = useAuth()

      await deleteAccount()

      expect(error.value).toBe('No se puede eliminar')
      expect(routerPushMock).not.toHaveBeenCalled()
    })

    it('sets pending to false after deletion regardless of outcome', async () => {
      apiDelMock.mockRejectedValueOnce({ message: 'Network error' })
      const { useAuth } = await import('./useAuth')
      const { deleteAccount, pending } = useAuth()

      await deleteAccount()

      expect(pending.value).toBe(false)
    })
  })
})
