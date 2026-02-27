// ============================================================
// Clinics store — manages the clinic directory list and
// the currently selected clinic.
// clearClinics() exists for API symmetry; clinic data is
// public so it is NOT called from auth.store.clearSession().
// ============================================================

import { defineStore } from 'pinia'
import type { Clinic } from '../types'

export const useClinicsStore = defineStore('clinics', () => {
  // ── State ──────────────────────────────────────────────────
  const clinics = ref<Clinic[]>([])
  const selectedClinic = ref<Clinic | null>(null)
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasClinics = computed(() => clinics.value.length > 0)

  /**
   * Clinics where is_featured === true — used to render the
   * "Clínicas Destacadas" section above the main grid.
   */
  const getFeaturedClinics = computed<Clinic[]>(() =>
    clinics.value.filter(c => c.is_featured),
  )

  // ── Actions ────────────────────────────────────────────────

  function setClinics(items: Clinic[]): void {
    clinics.value = items
  }

  function addClinic(item: Clinic): void {
    clinics.value.unshift(item)
  }

  function setSelectedClinic(item: Clinic): void {
    selectedClinic.value = item
  }

  function clearSelectedClinic(): void {
    selectedClinic.value = null
  }

  function setLoading(val: boolean): void {
    isLoading.value = val
  }

  /**
   * Reset all clinic state. Not called from clearSession()
   * because clinic data is public (no user-specific content).
   */
  function clearClinics(): void {
    clinics.value = []
    selectedClinic.value = null
  }

  return {
    // State
    clinics,
    selectedClinic,
    isLoading,
    // Getters
    hasClinics,
    getFeaturedClinics,
    // Actions
    setClinics,
    addClinic,
    setSelectedClinic,
    clearSelectedClinic,
    setLoading,
    clearClinics,
  }
})
