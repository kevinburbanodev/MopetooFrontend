import { defineStore } from 'pinia'
import type { User } from '../types'

const TOKEN_KEY = 'mopetoo_token'

export const useAuthStore = defineStore('auth', () => {
  // ── State ──────────────────────────────────────────────────
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(null)

  // ── Getters ────────────────────────────────────────────────
  const isAuthenticated = computed(() => !!token.value)
  const isPro = computed(() => currentUser.value?.is_pro ?? false)

  // ── Actions ────────────────────────────────────────────────
  function setSession(newToken: string, user: User): void {
    token.value = newToken
    currentUser.value = user
    if (import.meta.client) {
      localStorage.setItem(TOKEN_KEY, newToken)
    }
  }

  function clearSession(): void {
    token.value = null
    currentUser.value = null
    if (import.meta.client) {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  function restoreFromStorage(): void {
    if (import.meta.client) {
      const stored = localStorage.getItem(TOKEN_KEY)
      if (stored) {
        token.value = stored
      }
    }
  }

  return {
    currentUser,
    token,
    isAuthenticated,
    isPro,
    setSession,
    clearSession,
    restoreFromStorage,
  }
})
