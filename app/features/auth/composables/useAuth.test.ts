// ============================================================
// useAuth.test.ts
// Tests the useAuth composable in a Nuxt test environment.
//
// Mocking strategy:
//   - useApi() is mocked via vi.mock because it is an auto-imported
//     composable defined inside the project (not a Nuxt built-in).
//   - $fetch (global) is stubbed via vi.stubGlobal for the multipart
//     paths that bypass useApi.
//   - useAuthStore is accessed via createTestingPinia so we get a real
//     reactive store whose actions we can spy on.
//   - useRouter / navigateTo are the Nuxt auto-imports that must be
//     mocked through mockNuxtImport.
//   - useRuntimeConfig is mocked to return a stable baseURL.
// ============================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia } from 'pinia'
import { createTestingPinia } from '@pinia/testing'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import type { LoginResponse, User } from '../types'

// ── Nuxt auto-import mocks ───────────────────────────────────

const navigateToMock = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => navigateToMock)

const routerPushMock = vi.hoisted(() => vi.fn())
mockNuxtImport('useRouter', () => () => ({
  push: routerPushMock,
  replace: vi.fn(),
  go: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  beforeEach: vi.fn(() => vi.fn()),
  afterEach: vi.fn(() => vi.fn()),
  beforeResolve: vi.fn(() => vi.fn()),
  onError: vi.fn(() => vi.fn()),
  resolve: vi.fn(),
  addRoute: vi.fn(),
  removeRoute: vi.fn(),
  hasRoute: vi.fn(),
  getRoutes: vi.fn(() => []),
  currentRoute: { value: { path: '/', params: {}, query: {}, hash: '' } },
  options: {},
}))

// ── useApi mock ──────────────────────────────────────────────

const apiPostMock = vi.fn()
const apiGetMock = vi.fn()
const apiPatchMock = vi.fn()
const apiDelMock = vi.fn()

vi.mock('../../shared/composables/useApi', () => ({
  useApi: () => ({
    post: apiPostMock,
    get: apiGetMock,
    patch: apiPatchMock,
    del: apiDelMock,
  }),
}))

// ── $fetch global stub ───────────────────────────────────────
const fetchMock = vi.fn()

// ── Fake JWT helper ──────────────────────────────────────────
// Creates a JWT token that decodes to the given payload.
function makeFakeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256' }))
  const body = btoa(JSON.stringify(payload))
  return `${header}.${body}.fakesignature`
}

const FAKE_JWT = makeFakeJwt({
  user_id: 1,
  email: 'ana@example.com',
  entity_type: 'user',
  is_admin: false,
})

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
  token: FAKE_JWT,
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
function makeFile(name = 'photo.jpg'): File {
  return new File(['(binary)'], name, { type: 'image/jpeg' })
}

// ── Suite ────────────────────────────────────────────────────

describe('useAuth', () => {
  let authStore: ReturnType<typeof import('../stores/auth.store').useAuthStore>

  beforeEach(async () => {
    setActivePinia(
      createTestingPinia({ stubActions: false, createSpy: vi.fn }),
    )

    const { useAuthStore } = await import('../stores/auth.store')
    authStore = useAuthStore()

    apiPostMock.mockReset()
    apiGetMock.mockReset()
    apiPatchMock.mockReset()
    apiDelMock.mockReset()
    routerPushMock.mockReset()
    navigateToMock.mockReset()
    fetchMock.mockReset()

    vi.stubGlobal('$fetch', fetchMock)

    vi.stubGlobal('localStorage', {
      getItem: vi.fn(() => FAKE_JWT),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
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

    it('calls authStore.setSession with the API response and entity type on success', async () => {
      apiPostMock.mockResolvedValueOnce(mockLoginResponse)
      const setSessionSpy = vi.spyOn(authStore, 'setSession')
      const { useAuth } = await import('./useAuth')
      const { login } = useAuth()

      await login('ana@example.com', 'Secret123!')

      expect(setSessionSpy).toHaveBeenCalledWith(mockLoginResponse, 'user')
    })

    it('calls the shelter login endpoint when entityType is shelter', async () => {
      apiPostMock.mockResolvedValueOnce({ token: 'tok', shelter: {} })
      const { useAuth } = await import('./useAuth')
      const { login } = useAuth()

      await login('shelter@example.com', 'pass', 'shelter')

      expect(apiPostMock).toHaveBeenCalledWith('/shelters/login', {
        email: 'shelter@example.com',
        password: 'pass',
      })
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
        return new Promise<LoginResponse>(resolve =>
          setTimeout(() => resolve(mockLoginResponse), 0),
        )
      })
      const { useAuth } = await import('./useAuth')
      const { login, pending } = useAuth()

      const loginPromise = login('ana@example.com', 'Secret123!')
      pendingDuringCall = pending.value
      await loginPromise

      expect(pendingDuringCall).toBe(true)
      expect(pending.value).toBe(false)
    })
  })

  // ── register ───────────────────────────────────────────────

  describe('register()', () => {
    it('calls POST /users with JSON body when no photo is provided', async () => {
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
    it('calls the correct profile endpoint based on entityType', async () => {
      // Seed the store with a token and entityType so fetchCurrentUser
      // can decode the user_id and call the right endpoint.
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiGetMock.mockResolvedValueOnce(mockUser)
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser } = useAuth()

      await fetchCurrentUser()

      expect(apiGetMock).toHaveBeenCalledWith('/api/users/1')
    })

    it('calls authStore.setEntity with the API response on success', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiGetMock.mockResolvedValueOnce(mockUser)
      const setEntitySpy = vi.spyOn(authStore, 'setEntity')
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser } = useAuth()

      await fetchCurrentUser()

      expect(setEntitySpy).toHaveBeenCalledWith(mockUser, 'user')
    })

    it('calls clearSession on a 401 response', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiGetMock.mockRejectedValueOnce({ statusCode: 401 })
      const clearSessionSpy = vi.spyOn(authStore, 'clearSession')
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser } = useAuth()

      await fetchCurrentUser()

      expect(clearSessionSpy).toHaveBeenCalledOnce()
    })

    it('does not call clearSession on a non-401 error', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiGetMock.mockRejectedValueOnce({ statusCode: 500, data: { error: 'Server error' } })
      const clearSessionSpy = vi.spyOn(authStore, 'clearSession')
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser } = useAuth()

      await fetchCurrentUser()

      expect(clearSessionSpy).not.toHaveBeenCalled()
    })

    it('sets error for non-401 API failures', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiGetMock.mockRejectedValueOnce({ statusCode: 500, data: { error: 'Internal error' } })
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser, error } = useAuth()

      await fetchCurrentUser()

      expect(error.value).toBe('Internal error')
    })

    it('sets pending to false after the request', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiGetMock.mockResolvedValueOnce(mockUser)
      const { useAuth } = await import('./useAuth')
      const { fetchCurrentUser, pending } = useAuth()

      await fetchCurrentUser()

      expect(pending.value).toBe(false)
    })
  })

  // ── updateProfile ──────────────────────────────────────────

  describe('updateProfile()', () => {
    it('calls PATCH /api/users/:id with JSON body when no photo is provided', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      const updatedUser: User = { ...mockUser, name: 'Ana Updated' }
      apiPatchMock.mockResolvedValueOnce(updatedUser)
      const { useAuth } = await import('./useAuth')
      const { updateProfile } = useAuth()

      await updateProfile({ name: 'Ana Updated' })

      expect(apiPatchMock).toHaveBeenCalledWith('/api/users/1', { name: 'Ana Updated' })
    })

    it('calls authStore.setEntity with the updated user and entity type on JSON success', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      const updatedUser: User = { ...mockUser, name: 'Ana Updated' }
      apiPatchMock.mockResolvedValueOnce(updatedUser)
      const setEntitySpy = vi.spyOn(authStore, 'setEntity')
      const { useAuth } = await import('./useAuth')
      const { updateProfile } = useAuth()

      await updateProfile({ name: 'Ana Updated' })

      expect(setEntitySpy).toHaveBeenCalledWith(updatedUser, 'user')
    })

    it('calls $fetch with FormData when a photo is provided', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      const updatedUser: User = { ...mockUser, name: 'Ana Updated' }
      fetchMock.mockResolvedValueOnce(updatedUser)
      const { useAuth } = await import('./useAuth')
      const { updateProfile } = useAuth()

      await updateProfile({ name: 'Ana Updated' }, makeFile())

      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/api/users/1',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.any(FormData),
        }),
      )
    })

    it('attaches Authorization header when a stored token exists during photo upload', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      const updatedUser: User = { ...mockUser }
      fetchMock.mockResolvedValueOnce(updatedUser)
      const { useAuth } = await import('./useAuth')
      const { updateProfile } = useAuth()

      await updateProfile({ name: 'X' }, makeFile())

      expect(fetchMock).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { Authorization: `Bearer ${FAKE_JWT}` },
        }),
      )
    })

    it('sets error on PATCH failure', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiPatchMock.mockRejectedValueOnce({ data: { error: 'Email inválido' } })
      const { useAuth } = await import('./useAuth')
      const { updateProfile, error } = useAuth()

      await updateProfile({ email: 'bad' })

      expect(error.value).toBe('Email inválido')
    })

    it('calls the shelter endpoint when entityType is shelter', async () => {
      const shelterJwt = makeFakeJwt({ user_id: 5, email: 'shelter@example.com', entity_type: 'shelter', is_admin: false })
      authStore.token = shelterJwt
      authStore.entityType = 'shelter'
      apiPatchMock.mockResolvedValueOnce({ id: 5, organization_name: 'Refugio' })
      const setEntitySpy = vi.spyOn(authStore, 'setEntity')
      const { useAuth } = await import('./useAuth')
      const { updateProfile } = useAuth()

      await updateProfile({ name: 'Refugio Updated' })

      expect(apiPatchMock).toHaveBeenCalledWith('/api/shelters/5', { name: 'Refugio Updated' })
      expect(setEntitySpy).toHaveBeenCalledWith(expect.any(Object), 'shelter')
    })

    it('sets error when token cannot be decoded', async () => {
      authStore.token = null
      authStore.entityType = 'user'
      const { useAuth } = await import('./useAuth')
      const { updateProfile, error } = useAuth()

      await updateProfile({ name: 'X' })

      expect(error.value).toBe('No se pudo identificar la sesión')
    })
  })

  // ── deleteAccount ──────────────────────────────────────────

  describe('deleteAccount()', () => {
    it('calls DELETE /api/users/:id', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiDelMock.mockResolvedValueOnce(undefined)
      const { useAuth } = await import('./useAuth')
      const { deleteAccount } = useAuth()

      await deleteAccount()

      expect(apiDelMock).toHaveBeenCalledWith('/api/users/1')
    })

    it('calls clearSession after deletion', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiDelMock.mockResolvedValueOnce(undefined)
      const clearSessionSpy = vi.spyOn(authStore, 'clearSession')
      const { useAuth } = await import('./useAuth')
      const { deleteAccount } = useAuth()

      await deleteAccount()

      expect(clearSessionSpy).toHaveBeenCalledOnce()
    })

    it('navigates to / after deletion', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiDelMock.mockResolvedValueOnce(undefined)
      const { useAuth } = await import('./useAuth')
      const { deleteAccount } = useAuth()

      await deleteAccount()

      expect(routerPushMock).toHaveBeenCalledWith('/')
    })

    it('sets error on failure and does not navigate', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiDelMock.mockRejectedValueOnce({ data: { error: 'No se puede eliminar' } })
      const { useAuth } = await import('./useAuth')
      const { deleteAccount, error } = useAuth()

      await deleteAccount()

      expect(error.value).toBe('No se puede eliminar')
      expect(routerPushMock).not.toHaveBeenCalled()
    })

    it('sets pending to false after deletion regardless of outcome', async () => {
      authStore.token = FAKE_JWT
      authStore.entityType = 'user'
      apiDelMock.mockRejectedValueOnce({ message: 'Network error' })
      const { useAuth } = await import('./useAuth')
      const { deleteAccount, pending } = useAuth()

      await deleteAccount()

      expect(pending.value).toBe(false)
    })

    it('calls the store endpoint when entityType is store', async () => {
      const storeJwt = makeFakeJwt({ user_id: 7, email: 'store@example.com', entity_type: 'store', is_admin: false })
      authStore.token = storeJwt
      authStore.entityType = 'store'
      apiDelMock.mockResolvedValueOnce(undefined)
      const { useAuth } = await import('./useAuth')
      const { deleteAccount } = useAuth()

      await deleteAccount()

      expect(apiDelMock).toHaveBeenCalledWith('/api/stores/7')
    })

    it('sets error when token cannot be decoded', async () => {
      authStore.token = null
      authStore.entityType = 'user'
      const { useAuth } = await import('./useAuth')
      const { deleteAccount, error } = useAuth()

      await deleteAccount()

      expect(error.value).toBe('No se pudo identificar la sesión')
    })
  })
})
