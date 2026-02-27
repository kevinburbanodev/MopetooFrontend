// ============================================================
// Reminders feature — domain types
// ============================================================

export type ReminderType = 'vacuna' | 'medicina' | 'baño' | 'visita' | 'otro'

/** How often the reminder repeats. Undefined = one-time reminder. */
export type RecurrenceType = 'once' | 'weekly' | 'monthly' | 'yearly'

export interface Reminder {
  id: number
  pet_id: number
  type: ReminderType
  title: string
  scheduled_date: string
  recurrence?: RecurrenceType
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateReminderPayload {
  pet_id: number
  type: ReminderType
  title: string
  scheduled_date: string
  recurrence?: RecurrenceType
  notes?: string
}

export interface UpdateReminderPayload {
  type?: ReminderType
  title?: string
  scheduled_date?: string
  recurrence?: RecurrenceType
  notes?: string
}

/** Payload emitted by ReminderForm on submit */
export interface ReminderFormSubmitPayload {
  data: CreateReminderPayload
}
