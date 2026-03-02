// ============================================================
// Petshops store — manages the petshop directory list,
// the currently selected petshop, and store products.
// clearPetshops() exists for API symmetry; petshop data is
// public so it is NOT called from auth.store.clearSession().
// ============================================================

import { defineStore } from 'pinia'
import type { Petshop, StoreProduct } from '../types'

export const usePetshopsStore = defineStore('petshops', () => {
  // ── State ──────────────────────────────────────────────────
  const petshops = ref<Petshop[]>([])
  const selectedPetshop = ref<Petshop | null>(null)
  const storeProducts = ref<StoreProduct[]>([])
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasPetshops = computed(() => petshops.value.length > 0)

  /**
   * Stores with plan === 'featured' — used to render the
   * "Tiendas Destacadas" section above the main grid.
   */
  const getPremiumPetshops = computed<Petshop[]>(() =>
    petshops.value.filter(p => p.plan === 'featured'),
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

  function setStoreProducts(items: StoreProduct[]): void {
    storeProducts.value = items
  }

  function clearStoreProducts(): void {
    storeProducts.value = []
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
    storeProducts.value = []
  }

  return {
    // State
    petshops,
    selectedPetshop,
    storeProducts,
    isLoading,
    // Getters
    hasPetshops,
    getPremiumPetshops,
    // Actions
    setPetshops,
    addPetshop,
    setSelectedPetshop,
    clearSelectedPetshop,
    setStoreProducts,
    clearStoreProducts,
    setLoading,
    clearPetshops,
  }
})
