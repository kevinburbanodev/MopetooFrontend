// ============================================================
// useAuth — Auth feature composable
// Central API surface for all entity-account operations.
// Supports 4 entity types: user, shelter, store, clinic.
// Multipart uploads (photo) bypass useApi() and use $fetch
// directly with FormData, as useApi injects Content-Type: JSON.
// ============================================================

import type {
  EntityType,
  UpdateProfileDTO,
  LoginResponse,
  ShelterLoginResponse,
  StoreLoginResponse,
  ClinicLoginResponse,
  User,
  AuthEntity,
  AuthShelter,
  AuthStore as AuthStoreType,
  AuthClinic,
  VerifyEmailPayload,
} from '../types'
import { extractErrorMessage } from '../../shared/utils/extractErrorMessage'

export function useAuth() {
  const { post, get, put, patch, del } = useApi()
  const authStore = useAuthStore()
  const router = useRouter()
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) ?? ''

  const pending = ref(false)
  const error = ref<string | null>(null)

  // ── Email verification state ──────────────────────────────
  const verificationPending = ref(false)
  const verificationEmail = ref<string | null>(null)
  const verificationEntityType = ref<EntityType | null>(null)

  // ── Public API ──────────────────────────────────────────────

  async function login(
    email: string,
    password: string,
    entityType: EntityType = 'user',
  ): Promise<void> {
    pending.value = true
    error.value = null
    try {
      const endpoint = getLoginEndpoint(entityType)
      const response = await post<
        LoginResponse | ShelterLoginResponse | StoreLoginResponse | ClinicLoginResponse
      >(endpoint, { email, password })
      authStore.setSession(response, entityType)
      await router.push('/admin')
    }
    catch (err: unknown) {
      // Intercept 403 email_not_verified
      const status = extractStatus(err)
      const errorData = extractErrorData(err)
      if (status === 403 && errorData?.error === 'email_not_verified' && errorData?.email) {
        verificationPending.value = true
        verificationEmail.value = errorData.email as string
        verificationEntityType.value = entityType
        error.value = null
        return
      }
      error.value = extractErrorMessage(err)
    }
    finally {
      pending.value = false
    }
  }

  async function verifyEmail(code: string): Promise<void> {
    if (!verificationEmail.value || !verificationEntityType.value) return
    pending.value = true
    error.value = null
    try {
      const payload: VerifyEmailPayload = {
        email: verificationEmail.value,
        code,
        entity_type: verificationEntityType.value,
      }
      const response = await post<
        LoginResponse | ShelterLoginResponse | StoreLoginResponse | ClinicLoginResponse
      >('/verify-email', payload)
      authStore.setSession(response, verificationEntityType.value)
      verificationPending.value = false
      verificationEmail.value = null
      verificationEntityType.value = null
      await router.push('/admin')
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      pending.value = false
    }
  }

  async function resendVerificationCode(): Promise<{ success: boolean }> {
    if (!verificationEmail.value || !verificationEntityType.value) return { success: false }
    pending.value = true
    error.value = null
    try {
      await post<void>('/resend-verification', {
        email: verificationEmail.value,
        entity_type: verificationEntityType.value,
      })
      return { success: true }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return { success: false }
    }
    finally {
      pending.value = false
    }
  }

  function cancelVerification(): void {
    verificationPending.value = false
    verificationEmail.value = null
    verificationEntityType.value = null
    error.value = null
  }

  function logout(): void {
    authStore.clearSession()
    router.push('/')
  }

  async function fetchCurrentUser(): Promise<void> {
    pending.value = true
    error.value = null
    try {
      const type = authStore.entityType ?? 'user'
      const entity = await fetchEntityProfile(type)
      authStore.setEntity(entity, type)
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
      const type = authStore.entityType ?? 'user'
      const entityId = decodeEntityIdFromToken()
      if (!entityId) {
        error.value = 'No se pudo identificar la sesión'
        return
      }
      const endpoint = getProfileEndpoint(type, entityId)
      // Remap last_name → lastname for backend compatibility
      const { last_name, ...rest } = data
      const payload = last_name !== undefined ? { ...rest, lastname: last_name } : rest

      let entity: AuthEntity
      if (photo) {
        const formData = buildProfileFormData(data, photo)
        const storedToken = authStore.token
        entity = await $fetch<AuthEntity>(`${baseURL}${endpoint}`, {
          method: 'PUT',
          headers: storedToken
            ? { Authorization: `Bearer ${storedToken}` }
            : {},
          body: formData,
        })
      }
      else {
        entity = await put<AuthEntity>(endpoint, payload)
      }
      authStore.setEntity(entity, type)
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
      const type = authStore.entityType ?? 'user'
      const entityId = decodeEntityIdFromToken()
      if (!entityId) {
        error.value = 'No se pudo identificar la sesión'
        return
      }
      await del<void>(getProfileEndpoint(type, entityId))
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
    verificationPending,
    verificationEmail,
    verificationEntityType,
    login,
    logout,
    fetchCurrentUser,
    updateProfile,
    deleteAccount,
    verifyEmail,
    resendVerificationCode,
    cancelVerification,
  }
}

// ── Helpers ─────────────────────────────────────────────────

function getLoginEndpoint(entityType: EntityType): string {
  switch (entityType) {
    case 'shelter': return '/shelters/login'
    case 'store': return '/stores/login'
    case 'clinic': return '/clinics/login'
    default: return '/login'
  }
}

function getProfileEndpoint(entityType: EntityType, entityId: string): string {
  switch (entityType) {
    case 'shelter': return `/api/shelters/${entityId}`
    case 'store': return `/api/stores/${entityId}`
    case 'clinic': return `/api/clinics/${entityId}`
    default: return `/api/users/${entityId}`
  }
}

async function fetchEntityProfile(type: EntityType): Promise<AuthEntity> {
  const { get } = useApi()
  const entityId = decodeEntityIdFromToken()
  if (!entityId) throw new Error('No se pudo obtener el ID de la sesión')

  const endpoint = getProfileEndpoint(type, entityId)

  switch (type) {
    case 'shelter': return await get<AuthShelter>(endpoint)
    case 'store': return await get<AuthStoreType>(endpoint)
    case 'clinic': return await get<AuthClinic>(endpoint)
    default: return await get<User>(endpoint)
  }
}

function decodeEntityIdFromToken(): string | null {
  const authStore = useAuthStore()
  if (!authStore.token) return null
  try {
    const payload = JSON.parse(atob(authStore.token.split('.')[1]))
    return payload.user_id != null ? String(payload.user_id) : null
  }
  catch {
    return null
  }
}

function buildProfileFormData(data: UpdateProfileDTO, photo: File): FormData {
  const fd = new FormData()
  if (data.name !== undefined) fd.append('name', data.name)
  if (data.last_name !== undefined) fd.append('lastname', data.last_name)
  if (data.email !== undefined) fd.append('email', data.email)
  if (data.country_id !== undefined) fd.append('country_id', String(data.country_id))
  if (data.city_id !== undefined) fd.append('city_id', String(data.city_id))
  if (data.phone !== undefined) fd.append('phone', data.phone)
  if (data.birth_date !== undefined) fd.append('birth_date', data.birth_date)
  if (data.current_password !== undefined) fd.append('current_password', data.current_password)
  if (data.new_password !== undefined) fd.append('new_password', data.new_password)
  fd.append('profile_picture', photo)
  return fd
}

function extractErrorData(err: unknown): Record<string, unknown> | null {
  if (typeof err === 'object' && err !== null && 'data' in err) {
    const data = (err as { data: unknown }).data
    if (typeof data === 'object' && data !== null) {
      return data as Record<string, unknown>
    }
  }
  return null
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

