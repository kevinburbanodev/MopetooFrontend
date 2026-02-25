// ============================================================
// useAuth — Auth feature composable
// Central API surface for all user-account operations.
// Multipart uploads (photo) bypass useApi() and use $fetch
// directly with FormData, as useApi injects Content-Type: JSON.
// ============================================================

import type {
  RegisterPayload,
  UpdateProfileDTO,
  LoginResponse,
  User,
} from '../types'

export function useAuth() {
  const { post, get, patch, del } = useApi()
  const authStore = useAuthStore()
  const router = useRouter()
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) ?? ''

  const pending = ref(false)
  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  async function login(email: string, password: string): Promise<void> {
    pending.value = true
    error.value = null
    try {
      const response = await post<LoginResponse>('/login', { email, password })
      authStore.setSession(response)
      await router.push('/dashboard')
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      pending.value = false
    }
  }

  async function register(data: RegisterPayload, photo?: File): Promise<void> {
    pending.value = true
    error.value = null
    try {
      if (photo) {
        // Multipart: send all fields + file in a single FormData request
        const formData = buildRegisterFormData(data, photo)
        await $fetch<void>(`${baseURL}/users`, {
          method: 'POST',
          body: formData,
        })
      }
      else {
        await post<void>('/users', data)
      }
      // After registration log the user in automatically
      await login(data.email, data.password)
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      pending.value = false
    }
  }

  function logout(): void {
    authStore.clearSession()
    router.push('/login')
  }

  async function forgotPassword(email: string): Promise<void> {
    pending.value = true
    error.value = null
    try {
      await post<void>('/forgot-password', { email })
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      pending.value = false
    }
  }

  async function resetPassword(token: string, password: string): Promise<void> {
    pending.value = true
    error.value = null
    try {
      await post<void>('/reset-password', { token, password })
      await router.push('/login')
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      pending.value = false
    }
  }

  async function fetchCurrentUser(): Promise<void> {
    pending.value = true
    error.value = null
    try {
      const user = await get<User>('/api/me')
      authStore.setUser(user)
    }
    catch (err: unknown) {
      // A 401 here means the stored token is expired — clear the session
      // so the user is redirected to login on next navigation.
      const status = extractStatus(err)
      if (status === 401) {
        authStore.clearSession()
      }
      else {
        error.value = extractErrorMessage(err)
      }
    }
    finally {
      pending.value = false
    }
  }

  async function updateProfile(data: UpdateProfileDTO, photo?: File): Promise<void> {
    pending.value = true
    error.value = null
    try {
      let user: User
      if (photo) {
        const formData = buildProfileFormData(data, photo)
        const storedToken = authStore.token
        user = await $fetch<User>(`${baseURL}/api/me`, {
          method: 'PATCH',
          headers: storedToken
            ? { Authorization: `Bearer ${storedToken}` }
            : {},
          body: formData,
        })
      }
      else {
        // PATCH /api/me — JSON path via the shared useApi wrapper
        user = await patch<User>('/api/me', data)
      }
      authStore.setUser(user)
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      pending.value = false
    }
  }

  async function deleteAccount(): Promise<void> {
    pending.value = true
    error.value = null
    try {
      await del<void>('/api/me')
      authStore.clearSession()
      await router.push('/')
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      pending.value = false
    }
  }

  return {
    pending,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    fetchCurrentUser,
    updateProfile,
    deleteAccount,
  }
}

// ── Helpers ─────────────────────────────────────────────────

function buildRegisterFormData(data: RegisterPayload, photo: File): FormData {
  const fd = new FormData()
  fd.append('name', data.name)
  fd.append('last_name', data.last_name)
  fd.append('email', data.email)
  fd.append('password', data.password)
  fd.append('country', data.country)
  fd.append('city', data.city)
  fd.append('phone_country_code', data.phone_country_code)
  fd.append('phone', data.phone)
  if (data.birth_date) fd.append('birth_date', data.birth_date)
  fd.append('photo', photo)
  return fd
}

function buildProfileFormData(data: UpdateProfileDTO, photo: File): FormData {
  const fd = new FormData()
  if (data.name !== undefined) fd.append('name', data.name)
  if (data.last_name !== undefined) fd.append('last_name', data.last_name)
  if (data.email !== undefined) fd.append('email', data.email)
  if (data.country !== undefined) fd.append('country', data.country)
  if (data.city !== undefined) fd.append('city', data.city)
  if (data.phone_country_code !== undefined) fd.append('phone_country_code', data.phone_country_code)
  if (data.phone !== undefined) fd.append('phone', data.phone)
  if (data.birth_date !== undefined) fd.append('birth_date', data.birth_date)
  if (data.current_password !== undefined) fd.append('current_password', data.current_password)
  if (data.new_password !== undefined) fd.append('new_password', data.new_password)
  fd.append('photo', photo)
  return fd
}

function extractStatus(err: unknown): number | null {
  if (typeof err === 'object' && err !== null && 'statusCode' in err) {
    return Number((err as { statusCode: unknown }).statusCode)
  }
  if (typeof err === 'object' && err !== null && 'status' in err) {
    return Number((err as { status: unknown }).status)
  }
  return null
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    // ofetch / $fetch wraps the response body in .data
    if ('data' in err) {
      const data = (err as { data: unknown }).data
      if (typeof data === 'object' && data !== null && 'error' in data) {
        return String((data as { error: unknown }).error)
      }
      if (typeof data === 'string' && data.length > 0) {
        return data
      }
    }
    // Plain Error object
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message
    }
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
