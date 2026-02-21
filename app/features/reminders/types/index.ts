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

export interface UpdateReminderPayload {
  type?: ReminderType
  title?: string
  scheduled_date?: string
  notes?: string
}
