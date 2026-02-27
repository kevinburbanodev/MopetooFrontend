// ============================================================
// Petshops store — manages the petshop directory list and
// the currently selected petshop.
// clearPetshops() exists for API symmetry; petshop data is
// public so it is NOT called from auth.store.clearSession().
// ============================================================

import { defineStore } from 'pinia'
import type { Petshop } from '../types'

export const usePetshopsStore = defineStore('petshops', () => {
  // ── State ──────────────────────────────────────────────────
  const petshops = ref<Petshop[]>([])
  const selectedPetshop = ref<Petshop | null>(null)
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasPetshops = computed(() => petshops.value.length > 0)

  /**
   * Stores where is_featured === true — used to render the
   * "Tiendas Destacadas" section above the main grid.
   */
  const getFeaturedPetshops = computed<Petshop[]>(() =>
    petshops.value.filter(p => p.is_featured),
  )

  // ── Actions ────────────────────────────────────────────────

  function setPetshops(items: Petshop[]): void {
    petshops.value = items
  }

  function addPetshop(item: Petshop): void {
    petshops.value.unshift(item)
  }

  function setSelectedPetshop(item: Petshop): void {
    selectedPetshop.value = item
  }

  function clearSelectedPetshop(): void {
    selectedPetshop.value = null
  }

  function setLoading(val: boolean): void {
    isLoading.value = val
  }

  /**
   * Reset all petshop state. Not called from clearSession()
   * because petshop data is public (no user-specific content).
   */
  function clearPetshops(): void {
    petshops.value = []
    selectedPetshop.value = null
  }

  return {
    // State
    petshops,
    selectedPetshop,
    isLoading,
    // Getters
    hasPetshops,
    getFeaturedPetshops,
    // Actions
    setPetshops,
    addPetshop,
    setSelectedPetshop,
    clearSelectedPetshop,
    setLoading,
    clearPetshops,
  }
})
