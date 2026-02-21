import { defineStore } from 'pinia'
import type { Pet } from '../types'

export const usePetsStore = defineStore('pets', () => {
  // ── State ──────────────────────────────────────────────────
  const pets = ref<Pet[]>([])
  const selectedPet = ref<Pet | null>(null)
  const loading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasPets = computed(() => pets.value.length > 0)

  function getPetById(id: number): Pet | undefined {
    return pets.value.find(p => p.id === id)
  }

  // ── Actions ────────────────────────────────────────────────
  function setPets(newPets: Pet[]): void {
    pets.value = newPets
  }

  function addPet(pet: Pet): void {
    pets.value.push(pet)
  }

  function updatePet(updated: Pet): void {
    const idx = pets.value.findIndex(p => p.id === updated.id)
    if (idx !== -1) pets.value[idx] = updated
  }

  function removePet(id: number): void {
    pets.value = pets.value.filter(p => p.id !== id)
  }

  function selectPet(pet: Pet | null): void {
    selectedPet.value = pet
  }

  return {
    pets,
    selectedPet,
    loading,
    hasPets,
    getPetById,
    setPets,
    addPet,
    updatePet,
    removePet,
    selectPet,
  }
})
