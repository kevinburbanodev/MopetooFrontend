// ============================================================
// useAuth — Auth feature composable
// Wraps API calls for login, register, logout, password reset.
// ============================================================

import type { LoginPayload, RegisterPayload, ForgotPasswordPayload, ResetPasswordPayload, LoginResponse } from '../types'

export function useAuth() {
  const { post } = useApi()
  const authStore = useAuthStore()
  const router = useRouter()

  const loading = ref(false)
  const error = ref<string | null>(null)

  async function login(payload: LoginPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await post<LoginResponse>('/login', payload)
      authStore.setSession(response.token, response.user)
      await router.push('/')
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await post<void>('/users', payload)
      await router.push('/auth/login')
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      loading.value = false
    }
  }

  async function logout(): Promise<void> {
    authStore.clearSession()
    await router.push('/auth/login')
  }

  async function forgotPassword(payload: ForgotPasswordPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await post<void>('/forgot-password', payload)
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      loading.value = false
    }
  }

  async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await post<void>('/reset-password', payload)
      await router.push('/auth/login')
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
  }
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'data' in err) {
    const data = (err as { data: unknown }).data
    if (typeof data === 'object' && data !== null && 'error' in data) {
      return String((data as { error: unknown }).error)
    }
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
