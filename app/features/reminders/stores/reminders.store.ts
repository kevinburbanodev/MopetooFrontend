// ============================================================
// Reminders store — manages reminders list and selected reminder.
// ============================================================

import { defineStore } from 'pinia'
import type { Reminder } from '../types'

export const useRemindersStore = defineStore('reminders', () => {
  // ── State ──────────────────────────────────────────────────
  const reminders = ref<Reminder[]>([])
  const selectedReminder = ref<Reminder | null>(null)
  const isLoading = ref(false)

  // ── Getters ────────────────────────────────────────────────
  const hasReminders = computed(() => reminders.value.length > 0)

  function getReminderById(id: number): Reminder | undefined {
    return reminders.value.find(r => r.id === id)
  }

  // ── Actions ────────────────────────────────────────────────

  function setReminders(newReminders: Reminder[]): void {
    reminders.value = newReminders
  }

  function addReminder(reminder: Reminder): void {
    reminders.value.push(reminder)
  }

  /** Replace a reminder in the list by id. No-op if id not found. */
  function updateReminder(updated: Reminder): void {
    const idx = reminders.value.findIndex(r => r.id === updated.id)
    if (idx !== -1) {
      reminders.value[idx] = updated
    }
    // Keep selectedReminder in sync
    if (selectedReminder.value?.id === updated.id) {
      selectedReminder.value = updated
    }
  }

  function removeReminder(id: number): void {
    reminders.value = reminders.value.filter(r => r.id !== id)
    if (selectedReminder.value?.id === id) {
      selectedReminder.value = null
    }
  }

  function setSelectedReminder(reminder: Reminder | null): void {
    selectedReminder.value = reminder
  }

  function clearSelectedReminder(): void {
    selectedReminder.value = null
  }

  function setLoading(value: boolean): void {
    isLoading.value = value
  }

  /**
   * Reset all state. Called from auth.store.clearSession() to prevent
   * data leakage when a different user logs in on the same device.
   */
  function clearReminders(): void {
    reminders.value = []
    selectedReminder.value = null
  }

  return {
    // State
    reminders,
    selectedReminder,
    isLoading,
    // Getters
    hasReminders,
    getReminderById,
    // Actions
    setReminders,
    addReminder,
    updateReminder,
    removeReminder,
    setSelectedReminder,
    clearSelectedReminder,
    setLoading,
    clearReminders,
  }
})
