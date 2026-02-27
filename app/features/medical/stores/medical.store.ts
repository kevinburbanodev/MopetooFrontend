// ============================================================
// Medical History store — manages medical records list and
// the currently selected record.
// clearMedicalRecords() is called from auth.store.clearSession()
// to prevent data leakage when a different user logs in on the same device.
// ============================================================

import { defineStore } from 'pinia'
import type { MedicalRecord } from '../types'

export const useMedicalStore = defineStore('medical', () => {
  // ── State ──────────────────────────────────────────────────
  const records = ref<MedicalRecord[]>([])
  const selectedRecord = ref<MedicalRecord | null>(null)
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasRecords = computed(() => records.value.length > 0)

  function getRecordById(id: string): MedicalRecord | undefined {
    return records.value.find(r => r.id === id)
  }

  // ── Actions ────────────────────────────────────────────────

  function setRecords(newRecords: MedicalRecord[]): void {
    records.value = newRecords
  }

  function addRecord(record: MedicalRecord): void {
    // Prepend so the list stays sorted newest-first (matches backend sort)
    records.value.unshift(record)
  }

  /** Replace a record in the list by id. No-op if id not found. */
  function updateRecord(updated: MedicalRecord): void {
    const idx = records.value.findIndex(r => r.id === updated.id)
    if (idx !== -1) {
      records.value[idx] = updated
    }
    // Keep selectedRecord in sync
    if (selectedRecord.value?.id === updated.id) {
      selectedRecord.value = updated
    }
  }

  function removeRecord(id: string): void {
    records.value = records.value.filter(r => r.id !== id)
    if (selectedRecord.value?.id === id) {
      selectedRecord.value = null
    }
  }

  function setSelectedRecord(record: MedicalRecord | null): void {
    selectedRecord.value = record
  }

  function clearSelectedRecord(): void {
    selectedRecord.value = null
  }

  function setLoading(value: boolean): void {
    isLoading.value = value
  }

  /**
   * Reset all state. Called from auth.store.clearSession() to prevent
   * data leakage when a different user logs in on the same device.
   */
  function clearMedicalRecords(): void {
    records.value = []
    selectedRecord.value = null
  }

  return {
    // State
    records,
    selectedRecord,
    isLoading,
    // Getters
    hasRecords,
    getRecordById,
    // Actions
    setRecords,
    addRecord,
    updateRecord,
    removeRecord,
    setSelectedRecord,
    clearSelectedRecord,
    setLoading,
    clearMedicalRecords,
  }
})
