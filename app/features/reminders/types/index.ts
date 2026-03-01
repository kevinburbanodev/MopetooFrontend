// ============================================================
// Reminders feature — domain types
// ============================================================

export type ReminderType = 'vacuna' | 'medicina' | 'baño' | 'visita' | 'otro'

export interface Reminder {
  id: number
  pet_id: number
  type: ReminderType
  title: string
  scheduled_date: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateReminderPayload {
  pet_id: number
  type: ReminderType
  title: string
  scheduled_date: string
  notes?: string
}

// Backend requires type, title, scheduled_date (binding:"required"). notes is optional.
export type UpdateReminderPayload = Omit<CreateReminderPayload, 'pet_id'>

/** Payload emitted by ReminderForm on submit */
export interface ReminderFormSubmitPayload {
  data: CreateReminderPayload
}
