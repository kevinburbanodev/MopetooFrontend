// ============================================================
// useReminders — Reminders feature composable
// ============================================================

import type { Reminder, CreateReminderPayload, UpdateReminderPayload } from '../types'

export function useReminders() {
  const { get, post, put, del } = useApi()

  const reminders = ref<Reminder[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchRemindersByPet(petId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await get<{ reminders: Reminder[], message?: string }>(
        `/api/pets/${petId}/reminders`,
      )
      reminders.value = response.reminders ?? []
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      loading.value = false
    }
  }

  async function createReminder(payload: CreateReminderPayload): Promise<Reminder | null> {
    loading.value = true
    error.value = null
    try {
      const reminder = await post<Reminder>('/api/reminders', payload)
      reminders.value.push(reminder)
      return reminder
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  async function updateReminder(id: number, payload: UpdateReminderPayload): Promise<Reminder | null> {
    loading.value = true
    error.value = null
    try {
      const reminder = await put<Reminder>(`/api/reminders/${id}`, payload)
      const idx = reminders.value.findIndex(r => r.id === id)
      if (idx !== -1) reminders.value[idx] = reminder
      return reminder
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      loading.value = false
    }
  }

  async function deleteReminder(id: number): Promise<boolean> {
    loading.value = true
    error.value = null
    try {
      await del<void>(`/api/reminders/${id}`)
      reminders.value = reminders.value.filter(r => r.id !== id)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
    finally {
      loading.value = false
    }
  }

  return {
    reminders,
    loading,
    error,
    fetchRemindersByPet,
    createReminder,
    updateReminder,
    deleteReminder,
  }
}

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'data' in err) {
    const data = (err as { data: unknown }).data
    if (typeof data === 'object' && data !== null && 'error' in data) {
      return String((data as { error: unknown }).error)
    }
  }
  return 'Ocurrió un error inesperado.'
}
