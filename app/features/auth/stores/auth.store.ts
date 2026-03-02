// ============================================================
// Auth store — manages authentication session state
// Supports 4 entity types: user, shelter, store, clinic.
// Token persisted to localStorage under key mopetoo_token.
// Entity type persisted under key mopetoo_entity_type.
// restoreFromStorage() is called by auth.client.ts plugin on boot.
// ============================================================

import { defineStore } from 'pinia'
import type {
  User,
  AuthEntity,
  AuthStore as AuthStoreType,
  AuthClinic,
  EntityType,
  LoginResponse,
  ShelterLoginResponse,
  StoreLoginResponse,
  ClinicLoginResponse,
} from '../types'

const TOKEN_KEY = 'mopetoo_token'
const ENTITY_TYPE_KEY = 'mopetoo_entity_type'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────────
  const currentEntity = ref<AuthEntity | null>(null)
  const entityType = ref<EntityType | null>(null)
  const token = ref<string | null>(null)
  const isPending = ref(false)

  // ── Backward-compatible alias ─────────────────────────────
  // Many existing components/composables read authStore.currentUser.
  // This computed returns the entity ONLY when entity_type is 'user',
  // giving type-safe access without breaking existing code.
  const currentUser = computed<User | null>(() =>
    entityType.value === 'user' ? currentEntity.value as User : null,
  )

  // ── Getters ────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value)

  const isUser = computed(() => entityType.value === 'user')
  const isShelter = computed(() => entityType.value === 'shelter')
  const isStore = computed(() => entityType.value === 'store')
  const isClinic = computed(() => entityType.value === 'clinic')

  const isPro = computed(() => {
    if (!currentEntity.value) return false
    if (entityType.value === 'user') return (currentEntity.value as User).is_pro
    if (entityType.value === 'store') return (currentEntity.value as AuthStoreType).plan !== 'free'
    if (entityType.value === 'clinic') return (currentEntity.value as AuthClinic).plan !== 'free'
    return false
  })

  const isAdmin = computed(() => {
    if (entityType.value === 'user' && currentEntity.value) {
      return (currentEntity.value as User).is_admin
    }
    return false
  })

  // ── Actions ────────────────────────────────────────────────

  /**
   * Hydrate store from a successful login/register response.
   */
  function setSession(
    response: LoginResponse | ShelterLoginResponse | StoreLoginResponse | ClinicLoginResponse,
    type: EntityType,
  ): void {
    token.value = response.token
    entityType.value = type

    if (type === 'user') currentEntity.value = (response as LoginResponse).user
    else if (type === 'shelter') currentEntity.value = (response as ShelterLoginResponse).shelter
    else if (type === 'store') currentEntity.value = (response as StoreLoginResponse).store
    else if (type === 'clinic') currentEntity.value = (response as ClinicLoginResponse).clinic

    if (import.meta.client) {
      localStorage.setItem(TOKEN_KEY, response.token)
      localStorage.setItem(ENTITY_TYPE_KEY, type)
    }
  }

  /**
   * Clear all session state and remove token from localStorage.
   * Also resets any feature stores that hold user-specific data so that
   * a subsequent user on the same device never sees stale data.
   */
  function clearSession(): void {
    token.value = null
    currentEntity.value = null
    entityType.value = null
    if (import.meta.client) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(ENTITY_TYPE_KEY)
      // Clear feature stores that cache user-specific data.
      // Each store must be imported lazily here (not at module level) to avoid
      // circular dependency issues between store files.
      const petsStore = usePetsStore()
      petsStore.setPets([])
      petsStore.clearSelectedPet()
      const remindersStore = useRemindersStore()
      remindersStore.clearReminders()
      const medicalStore = useMedicalStore()
      medicalStore.clearMedicalRecords()
      const sheltersStore = useSheltersStore()
      sheltersStore.clearShelters()
      const proStore = useProStore()
      proStore.clearPro()
      const adminStore = useAdminStore()
      adminStore.clearAdmin()
      const statsStore = useStatsStore()
      statsStore.clearStats()
    }
  }

  /**
   * Rehydrate token and entityType from localStorage on client-side boot.
   * Does not fetch the user profile — that is handled by the auth plugin.
   */
  function restoreFromStorage(): void {
    if (import.meta.client) {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedType = localStorage.getItem(ENTITY_TYPE_KEY) as EntityType | null
      if (storedToken) {
        token.value = storedToken
        entityType.value = storedType ?? 'user'
      }
    }
  }

  /**
   * Update the in-memory entity after a profile fetch or edit.
   */
  function setEntity(entity: AuthEntity, type: EntityType): void {
    currentEntity.value = entity
    entityType.value = type
  }

  /**
   * Update the in-memory user object after a profile edit.
   * Backward-compatible alias for setEntity with type 'user'.
   */
  function setUser(user: User): void {
    currentEntity.value = user
    entityType.value = 'user'
  }

  return {
    // State
    currentEntity,
    currentUser,
    entityType,
    token,
    isPending,
    // Getters
    isAuthenticated,
    isUser,
    isShelter,
    isStore,
    isClinic,
    isPro,
    isAdmin,
    // Actions
    setSession,
    clearSession,
    restoreFromStorage,
    setEntity,
    setUser,
  }
})
