// ============================================================
// Pro store — manages PRO subscription state and plan catalogue.
// Subscription is user-specific data: clearPro() IS called from
// auth.store.clearSession() to prevent data leakage on logout.
// ============================================================

import { defineStore } from 'pinia'
import type { ProPlan, ProSubscription } from '../types'

export const useProStore = defineStore('pro', () => {
  // ── State ──────────────────────────────────────────────────
  const subscription = ref<ProSubscription | null>(null)
  const plans = ref<ProPlan[]>([])
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────

  /** True when the user has an active (non-canceled, non-past_due) subscription. */
  const isSubscribed = computed(() => subscription.value?.status === 'active')

  /** True when the plans catalogue has been loaded from the API. */
  const hasPlans = computed(() => plans.value.length > 0)

  /** The monthly plan from the catalogue, or undefined if not yet loaded. */
  const getMonthlyPlan = computed<ProPlan | undefined>(() =>
    plans.value.find(p => p.interval === 'monthly'),
  )

  /** The annual plan from the catalogue, or undefined if not yet loaded. */
  const getAnnualPlan = computed<ProPlan | undefined>(() =>
    plans.value.find(p => p.interval === 'annual'),
  )

  // ── Actions ────────────────────────────────────────────────

  function setSubscription(sub: ProSubscription | null): void {
    subscription.value = sub
  }

  function clearSubscription(): void {
    subscription.value = null
  }

  function setPlans(items: ProPlan[]): void {
    plans.value = items
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
    plans.value = []
    isLoading.value = false
  }

  return {
    // State
    subscription,
    plans,
    isLoading,
    // Getters
    isSubscribed,
    hasPlans,
    getMonthlyPlan,
    getAnnualPlan,
    // Actions
    setSubscription,
    clearSubscription,
    setPlans,
    setLoading,
    clearPro,
  }
})
