// ============================================================
// Pro store — manages PRO subscription state.
// Plans are hardcoded constants (PRO_PLANS) — no store state needed.
// Subscription is user-specific data: clearPro() IS called from
// auth.store.clearSession() to prevent data leakage on logout.
// ============================================================

import { defineStore } from 'pinia'
import type { SubscriptionStatus } from '../types'

export const useProStore = defineStore('pro', () => {
  // ── State ──────────────────────────────────────────────────
  const subscription = ref<SubscriptionStatus | null>(null)
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────

  /** True when the user has an active PRO subscription. */
  const isSubscribed = computed(
    () => subscription.value?.is_pro === true && subscription.value?.is_active === true,
  )

  // ── Actions ────────────────────────────────────────────────

  function setSubscription(sub: SubscriptionStatus | null): void {
    subscription.value = sub
  }

  function clearSubscription(): void {
    subscription.value = null
  }

  function setLoading(val: boolean): void {
    isLoading.value = val
  }

  /**
   * Full reset — called from auth.store.clearSession() on logout.
   * Subscription is user-specific; must be cleared to prevent data
   * leakage when a different user signs in on the same device.
   */
  function clearPro(): void {
    subscription.value = null
    isLoading.value = false
  }

  return {
    // State
    subscription,
    isLoading,
    // Getters
    isSubscribed,
    // Actions
    setSubscription,
    clearSubscription,
    setLoading,
    clearPro,
  }
})
