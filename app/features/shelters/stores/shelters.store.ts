// ============================================================
// Shelters store — manages the shelter directory list,
// the currently selected shelter, and the adoption pets for
// the selected shelter.
// clearShelters() is called from auth.store.clearSession()
// to prevent data leakage when a different user logs in on
// the same device.
// ============================================================

import { defineStore } from 'pinia'
import type { Shelter, AdoptionPet } from '../types'

export const useSheltersStore = defineStore('shelters', () => {
  // ── State ──────────────────────────────────────────────────
  const shelters = ref<Shelter[]>([])
  const selectedShelter = ref<Shelter | null>(null)
  const adoptionPets = ref<AdoptionPet[]>([])
  const selectedAdoptionPet = ref<AdoptionPet | null>(null)
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasShelters = computed(() => shelters.value.length > 0)
  const hasAdoptionPets = computed(() => adoptionPets.value.length > 0)

  /**
   * Pets whose status is 'available' — used in the adoption list CTA display.
   */
  const getAvailablePets = computed<AdoptionPet[]>(() =>
    adoptionPets.value.filter(p => p.status === 'available'),
  )

  // ── Actions ────────────────────────────────────────────────

  function setShelters(newShelters: Shelter[]): void {
    shelters.value = newShelters
  }

  function addShelter(shelter: Shelter): void {
    shelters.value.unshift(shelter)
  }

  function setSelectedShelter(shelter: Shelter | null): void {
    selectedShelter.value = shelter
  }

  function clearSelectedShelter(): void {
    selectedShelter.value = null
  }

  function setAdoptionPets(pets: AdoptionPet[]): void {
    adoptionPets.value = pets
  }

  function addAdoptionPet(pet: AdoptionPet): void {
    adoptionPets.value.unshift(pet)
  }

  function setSelectedAdoptionPet(pet: AdoptionPet | null): void {
    selectedAdoptionPet.value = pet
  }

  function clearSelectedAdoptionPet(): void {
    selectedAdoptionPet.value = null
  }

  function setLoading(value: boolean): void {
    isLoading.value = value
  }

  /**
   * Reset all state. Called from auth.store.clearSession() to prevent
   * data leakage when a different user logs in on the same device.
   * Shelters are public data but adoption requests are user-specific,
   * so we clear everything for a clean slate.
   */
  function clearShelters(): void {
    shelters.value = []
    selectedShelter.value = null
    adoptionPets.value = []
    selectedAdoptionPet.value = null
  }

  return {
    // State
    shelters,
    selectedShelter,
    adoptionPets,
    selectedAdoptionPet,
    isLoading,
    // Getters
    hasShelters,
    hasAdoptionPets,
    getAvailablePets,
    // Actions
    setShelters,
    addShelter,
    setSelectedShelter,
    clearSelectedShelter,
    setAdoptionPets,
    addAdoptionPet,
    setSelectedAdoptionPet,
    clearSelectedAdoptionPet,
    setLoading,
    clearShelters,
  }
})
