// ============================================================
// Pets store — manages the pets list and the currently
// selected pet detail.
// ============================================================

import { defineStore } from 'pinia'
import type { Pet } from '../types'

export const usePetsStore = defineStore('pets', () => {
  // ── State ──────────────────────────────────────────────────
  const pets = ref<Pet[]>([])
  const selectedPet = ref<Pet | null>(null)
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasPets = computed(() => pets.value.length > 0)

  function getPetById(id: string): Pet | undefined {
    return pets.value.find(p => p.id === id)
  }

  // ── Actions ────────────────────────────────────────────────

  function setPets(newPets: Pet[]): void {
    pets.value = newPets
  }

  function addPet(pet: Pet): void {
    pets.value.push(pet)
  }

  /** Replace a pet in the list by id. No-op if id not found. */
  function updatePet(updated: Pet): void {
    const idx = pets.value.findIndex(p => p.id === updated.id)
    if (idx !== -1) {
      pets.value[idx] = updated
    }
    // Also keep selectedPet in sync
    if (selectedPet.value?.id === updated.id) {
      selectedPet.value = updated
    }
  }

  function removePet(id: string): void {
    pets.value = pets.value.filter(p => p.id !== id)
    if (selectedPet.value?.id === id) {
      selectedPet.value = null
    }
  }

  function setSelectedPet(pet: Pet | null): void {
    selectedPet.value = pet
  }

  function clearSelectedPet(): void {
    selectedPet.value = null
  }

  function setLoading(value: boolean): void {
    isLoading.value = value
  }

  return {
    // State
    pets,
    selectedPet,
    isLoading,
    // Getters
    hasPets,
    getPetById,
    // Actions
    setPets,
    addPet,
    updatePet,
    removePet,
    setSelectedPet,
    clearSelectedPet,
    setLoading,
  }
})
