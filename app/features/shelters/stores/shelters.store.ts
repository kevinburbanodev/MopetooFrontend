// ============================================================
// Shelters store — manages adoption listings state.
// Backend model is flat "Adoption Listings" — no shelter
// directory. State holds the listings and the currently
// selected listing for the detail view.
//
// clearShelters() is called from auth.store.clearSession()
// to prevent data leakage when a different user logs in on
// the same device.
// ============================================================

import { defineStore } from 'pinia'
import type { AdoptionListing } from '../types'

export const useSheltersStore = defineStore('shelters', () => {
  // ── State ──────────────────────────────────────────────────
  const adoptionListings = ref<AdoptionListing[]>([])
  const selectedListing = ref<AdoptionListing | null>(null)
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasAdoptionListings = computed(() => adoptionListings.value.length > 0)

  const getAvailableListings = computed<AdoptionListing[]>(() =>
    adoptionListings.value.filter(l => l.status === 'available'),
  )

  // ── Actions ────────────────────────────────────────────────

  function setAdoptionListings(listings: AdoptionListing[]): void {
    adoptionListings.value = listings
  }

  function addAdoptionListing(listing: AdoptionListing): void {
    adoptionListings.value.unshift(listing)
  }

  function setSelectedListing(listing: AdoptionListing | null): void {
    selectedListing.value = listing
  }

  function clearSelectedListing(): void {
    selectedListing.value = null
  }

  function setLoading(value: boolean): void {
    isLoading.value = value
  }

  /**
   * Reset all state. Called from auth.store.clearSession() to prevent
   * data leakage when a different user logs in on the same device.
   */
  function clearShelters(): void {
    adoptionListings.value = []
    selectedListing.value = null
  }

  return {
    // State
    adoptionListings,
    selectedListing,
    isLoading,
    // Getters
    hasAdoptionListings,
    getAvailableListings,
    // Actions
    setAdoptionListings,
    addAdoptionListing,
    setSelectedListing,
    clearSelectedListing,
    setLoading,
    clearShelters,
  }
})
