// ============================================================
// useReminders — Reminders feature composable
// Central API surface for all reminder CRUD operations.
// State is owned by useRemindersStore; this composable is the
// API layer that keeps the store in sync.
// ============================================================

import type { Reminder, CreateReminderPayload, UpdateReminderPayload } from '../types'

export function useReminders() {
  const { get, post, put, del } = useApi()
  const remindersStore = useRemindersStore()

  const error = ref<string | null>(null)

  // ── Public API ──────────────────────────────────────────────

  /**
   * Fetch all reminders for the authenticated user.
   * When petId is provided, fetches reminders for that pet only.
   * When petId is omitted, iterates over all pets in petsStore
   * and fetches reminders for each one in parallel.
   */
  async function fetchReminders(petId?: number): Promise<void> {
    remindersStore.setLoading(true)
    error.value = null
    try {
      if (petId != null) {
        const response = await get<{ reminders?: Reminder[] } | Reminder[]>(`/api/pets/${petId}/reminders`)
        if (Array.isArray(response)) {
          remindersStore.setReminders(response)
        }
        else {
          remindersStore.setReminders(response.reminders ?? [])
        }
      }
      else {
        const petsStore = usePetsStore()
        const pets = petsStore.pets
        const results = await Promise.all(
          pets.map(pet => get<{ reminders?: Reminder[] } | Reminder[]>(`/api/pets/${pet.id}/reminders`)),
        )
        const allReminders: Reminder[] = []
        for (const response of results) {
          if (Array.isArray(response)) {
            allReminders.push(...response)
          }
          else {
            allReminders.push(...(response.reminders ?? []))
          }
        }
        remindersStore.setReminders(allReminders)
      }
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
    }
    finally {
      remindersStore.setLoading(false)
    }
  }

  /**
   * Fetch a single reminder by id and store it as selectedReminder.
   * Returns the reminder or null on failure.
   */
  async function fetchReminderById(id: number): Promise<Reminder | null> {
    remindersStore.setLoading(true)
    error.value = null
    try {
      const reminder = await get<Reminder>(`/api/reminders/${id}`)
      remindersStore.setSelectedReminder(reminder)
      return reminder
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      remindersStore.setLoading(false)
    }
  }

  /**
   * Create a new reminder and add it to the store.
   * Returns the created reminder or null on failure.
   */
  async function createReminder(payload: CreateReminderPayload): Promise<Reminder | null> {
    remindersStore.setLoading(true)
    error.value = null
    try {
      const reminder = await post<Reminder>('/api/reminders', payload)
      remindersStore.addReminder(reminder)
      return reminder
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      remindersStore.setLoading(false)
    }
  }

  /**
   * Update a reminder by id and sync the store.
   * Returns the updated reminder or null on failure.
   */
  async function updateReminder(id: number, payload: UpdateReminderPayload): Promise<Reminder | null> {
    remindersStore.setLoading(true)
    error.value = null
    try {
      const reminder = await put<Reminder>(`/api/reminders/${id}`, payload)
      remindersStore.updateReminder(reminder)
      return reminder
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return null
    }
    finally {
      remindersStore.setLoading(false)
    }
  }

  /**
   * Delete a reminder by id and remove it from the store.
   * Returns true on success, false on failure.
   */
  async function deleteReminder(id: number): Promise<boolean> {
    remindersStore.setLoading(true)
    error.value = null
    try {
      await del<void>(`/api/reminders/${id}`)
      remindersStore.removeReminder(id)
      return true
    }
    catch (err: unknown) {
      error.value = extractErrorMessage(err)
      return false
    }
    finally {
      remindersStore.setLoading(false)
    }
  }

  return {
    error,
    remindersStore,
    fetchReminders,
    fetchReminderById,
    createReminder,
    updateReminder,
    deleteReminder,
  }
}

// ── Helpers ─────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    if ('data' in err) {
      const data = (err as { data: unknown }).data
      if (typeof data === 'object' && data !== null && 'error' in data) {
        return String((data as { error: unknown }).error)
      }
      if (typeof data === 'string' && data.length > 0) return data
    }
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message
    }
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.'
}
