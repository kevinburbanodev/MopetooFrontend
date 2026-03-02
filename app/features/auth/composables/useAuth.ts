// ============================================================
// useAuth — Auth feature composable
// Central API surface for all entity-account operations.
// Supports 4 entity types: user, shelter, store, clinic.
// Multipart uploads (photo) bypass useApi() and use $fetch
// directly with FormData, as useApi injects Content-Type: JSON.
// ============================================================

import type {
  EntityType,
  RegisterPayload,
  RegisterShelterPayload,
  RegisterStorePayload,
  RegisterClinicPayload,
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
} from '../types'
import { extractErrorMessage } from '../../shared/utils/extractErrorMessage'

export function useAuth() {
  const { post, get, patch, del } = useApi()
  const authStore = useAuthStore()
  const router = useRouter()
  const config = useRuntimeConfig()
  const baseURL = (config.public.apiBase as string) ?? ''

  const pending = ref(false)
  const error = ref<string | null>(null)

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
      await login(data.email, data.password, 'user')
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      pending.value = false
    }
  }

  async function registerShelter(data: RegisterShelterPayload): Promise<void> {
    pending.value = true
    error.value = null
    try {
      await post<void>('/shelters/register', data)
      await login(data.email, data.password, 'shelter')
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      pending.value = false
    }
  }

  async function registerStore(data: RegisterStorePayload): Promise<void> {
    pending.value = true
    error.value = null
    try {
      await post<void>('/stores/register', data)
      await login(data.email, data.password, 'store')
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      pending.value = false
    }
  }

  async function registerClinic(data: RegisterClinicPayload): Promise<void> {
    pending.value = true
    error.value = null
    try {
      await post<void>('/clinics/register', data)
      await login(data.email, data.password, 'clinic')
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
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
      let entity: AuthEntity
      if (photo) {
        const formData = buildProfileFormData(data, photo)
        const storedToken = authStore.token
        entity = await $fetch<AuthEntity>(`${baseURL}${endpoint}`, {
          method: 'PATCH',
          headers: storedToken
            ? { Authorization: `Bearer ${storedToken}` }
            : {},
          body: formData,
        })
      }
      else {
        entity = await patch<AuthEntity>(endpoint, data)
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
    login,
    register,
    registerShelter,
    registerStore,
    registerClinic,
    logout,
    forgotPassword,
    resetPassword,
    fetchCurrentUser,
    updateProfile,
    deleteAccount,
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

