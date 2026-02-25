// ============================================================
// Auth store — manages authentication session state
// Token persisted to localStorage under key mopetoo_token.
// restoreFromStorage() is called by auth.client.ts plugin on boot.
// ============================================================

import { defineStore } from 'pinia'
import type { User, LoginResponse } from '../types'

const TOKEN_KEY = 'mopetoo_token'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────────
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(null)
  const isPending = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value)
  const isPro = computed(() => currentUser.value?.is_pro ?? false)
  const isAdmin = computed(() => currentUser.value?.is_admin ?? false)

  // ── Actions ────────────────────────────────────────────────

  /**
   * Hydrate store from a successful login/register response.
   */
  function setSession(response: LoginResponse): void {
    token.value = response.token
    currentUser.value = response.user
    if (import.meta.client) {
      localStorage.setItem(TOKEN_KEY, response.token)
    }
  }

  /**
   * Clear all session state and remove token from localStorage.
   */
  function clearSession(): void {
    token.value = null
    currentUser.value = null
    if (import.meta.client) {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  /**
   * Rehydrate token from localStorage on client-side boot.
   * Does not fetch the user profile — that is handled by the auth plugin.
   */
  function restoreFromStorage(): void {
    if (import.meta.client) {
      const stored = localStorage.getItem(TOKEN_KEY)
      if (stored) {
        token.value = stored
      }
    }
  }

  /**
   * Update the in-memory user object after a profile edit.
   */
  function setUser(user: User): void {
    currentUser.value = user
  }

  return {
    // State
    currentUser,
    token,
    isPending,
    // Getters
    isAuthenticated,
    isPro,
    isAdmin,
    // Actions
    setSession,
    clearSession,
    restoreFromStorage,
    setUser,
  }
})
