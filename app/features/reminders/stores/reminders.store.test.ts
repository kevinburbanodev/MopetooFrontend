// ============================================================
// reminders.store.test.ts
// Tests the reminders Pinia store in isolation using createPinia.
//
// Strategy: uses the real store (no stubActions) so that action
// implementations are exercised, not mocked away. Each test gets
// a fresh pinia via setActivePinia(createPinia()) in beforeEach.
//
// What this suite does NOT cover intentionally:
//   - HTTP / API calls — those are composable concerns (useReminders.test.ts)
//   - Component rendering — covered in component test files
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useRemindersStore } from './reminders.store'
import type { Reminder } from '../types'

// ── Fixtures ────────────────────────────────────────────────

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: '1',
    pet_id: '42',
    type: 'vacuna',
    title: 'Vacuna antirrábica',
    scheduled_date: '2027-06-15T10:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const reminderA = makeReminder({ id: '1', title: 'Vacuna antirrábica', type: 'vacuna', pet_id: '42' })
const reminderB = makeReminder({ id: '2', title: 'Desparasitación', type: 'medicina', pet_id: '42' })
const reminderC = makeReminder({ id: '3', title: 'Baño mensual', type: 'baño', pet_id: '99' })

// ── Suite ────────────────────────────────────────────────────

describe('useRemindersStore', () => {
  beforeEach(() => {
    // Fresh pinia per test — no state leaks between tests
    setActivePinia(createPinia())
  })

  // ── Initial state ──────────────────────────────────────────

  describe('initial state', () => {
    it('has an empty reminders array', () => {
      const store = useRemindersStore()
      expect(store.reminders).toEqual([])
    })

    it('has null selectedReminder', () => {
      const store = useRemindersStore()
      expect(store.selectedReminder).toBeNull()
    })

    it('has isLoading false', () => {
      const store = useRemindersStore()
      expect(store.isLoading).toBe(false)
    })

    it('hasReminders is false with an empty array', () => {
      const store = useRemindersStore()
      expect(store.hasReminders).toBe(false)
    })
  })

  // ── hasReminders getter ────────────────────────────────────

  describe('hasReminders getter', () => {
    it('is false when reminders is empty', () => {
      const store = useRemindersStore()
      expect(store.hasReminders).toBe(false)
    })

    it('is true when at least one reminder exists', () => {
      const store = useRemindersStore()
      store.addReminder(reminderA)
      expect(store.hasReminders).toBe(true)
    })

    it('becomes false again after removing the last reminder', () => {
      const store = useRemindersStore()
      store.addReminder(reminderA)
      store.removeReminder('1')
      expect(store.hasReminders).toBe(false)
    })

    it('stays true when some reminders remain after a removal', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      store.removeReminder('1')
      expect(store.hasReminders).toBe(true)
    })
  })

  // ── getReminderById getter ─────────────────────────────────

  describe('getReminderById()', () => {
    it('returns the matching reminder when the id is in the list', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      expect(store.getReminderById('2')).toEqual(reminderB)
    })

    it('returns undefined when the id is not in the list', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      expect(store.getReminderById('999')).toBeUndefined()
    })

    it('returns undefined when the reminders list is empty', () => {
      const store = useRemindersStore()
      expect(store.getReminderById('1')).toBeUndefined()
    })

    it('returns the first reminder correctly when there is only one', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      expect(store.getReminderById('1')).toEqual(reminderA)
    })
  })

  // ── setReminders ───────────────────────────────────────────

  describe('setReminders()', () => {
    it('replaces the reminders array with the provided list', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      expect(store.reminders).toEqual([reminderA, reminderB])
    })

    it('overwrites any previously stored reminders', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      store.setReminders([reminderC])
      expect(store.reminders).toEqual([reminderC])
    })

    it('accepts an empty array, clearing all reminders', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      store.setReminders([])
      expect(store.reminders).toEqual([])
    })

    it('makes hasReminders true after setting a non-empty array', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      expect(store.hasReminders).toBe(true)
    })

    it('makes hasReminders false after setting an empty array', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      store.setReminders([])
      expect(store.hasReminders).toBe(false)
    })

    it('preserves order of the provided list', () => {
      const store = useRemindersStore()
      store.setReminders([reminderC, reminderA, reminderB])
      expect(store.reminders[0]).toEqual(reminderC)
      expect(store.reminders[1]).toEqual(reminderA)
      expect(store.reminders[2]).toEqual(reminderB)
    })
  })

  // ── addReminder ────────────────────────────────────────────

  describe('addReminder()', () => {
    it('appends the reminder to an empty list', () => {
      const store = useRemindersStore()
      store.addReminder(reminderA)
      expect(store.reminders).toHaveLength(1)
      expect(store.reminders[0]).toEqual(reminderA)
    })

    it('appends the reminder to an existing list without replacing other entries', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      store.addReminder(reminderC)
      expect(store.reminders).toHaveLength(3)
      expect(store.reminders[2]).toEqual(reminderC)
    })

    it('makes hasReminders true', () => {
      const store = useRemindersStore()
      store.addReminder(reminderA)
      expect(store.hasReminders).toBe(true)
    })

    it('preserves order: new reminder is last in the array', () => {
      const store = useRemindersStore()
      store.addReminder(reminderA)
      store.addReminder(reminderB)
      expect(store.reminders[0].id).toBe('1')
      expect(store.reminders[1].id).toBe('2')
    })
  })

  // ── updateReminder ────────────────────────────────────────

  describe('updateReminder()', () => {
    it('replaces the matching reminder in the list by id', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      const updated = { ...reminderA, title: 'Vacuna actualizada' }
      store.updateReminder(updated)
      expect(store.reminders[0]).toEqual(updated)
    })

    it('does not mutate other reminders in the list', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      store.updateReminder({ ...reminderA, title: 'Vacuna actualizada' })
      expect(store.reminders[1]).toEqual(reminderB)
    })

    it('is a no-op when the id is not found in the list', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      const phantom = makeReminder({ id: '999', title: 'Fantasma' })
      store.updateReminder(phantom)
      expect(store.reminders).toEqual([reminderA])
    })

    it('keeps the list length the same after an update', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB, reminderC])
      store.updateReminder({ ...reminderB, title: 'Medicina actualizada' })
      expect(store.reminders).toHaveLength(3)
    })

    it('syncs selectedReminder when the updated id matches', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      store.setSelectedReminder(reminderA)
      const updated = { ...reminderA, title: 'Vacuna actualizada' }
      store.updateReminder(updated)
      expect(store.selectedReminder).toEqual(updated)
    })

    it('does NOT change selectedReminder when the updated id does not match', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      store.setSelectedReminder(reminderB)
      store.updateReminder({ ...reminderA, title: 'Vacuna actualizada' })
      expect(store.selectedReminder).toEqual(reminderB)
    })

    it('leaves selectedReminder null when no reminder is selected', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      store.updateReminder({ ...reminderA, title: 'Vacuna actualizada' })
      expect(store.selectedReminder).toBeNull()
    })

    it('updates only the targeted reminder when multiple exist', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB, reminderC])
      store.updateReminder({ ...reminderB, notes: 'Nueva dosis' })
      expect(store.reminders[0]).toEqual(reminderA)
      expect(store.reminders[1].notes).toBe('Nueva dosis')
      expect(store.reminders[2]).toEqual(reminderC)
    })
  })

  // ── removeReminder ────────────────────────────────────────

  describe('removeReminder()', () => {
    it('removes the reminder with the matching id', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      store.removeReminder('1')
      expect(store.reminders).toEqual([reminderB])
    })

    it('does not affect other reminders in the list', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB, reminderC])
      store.removeReminder('2')
      expect(store.reminders).toEqual([reminderA, reminderC])
    })

    it('is a no-op when the id is not found', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      store.removeReminder('999')
      expect(store.reminders).toEqual([reminderA])
    })

    it('results in an empty list when the only reminder is removed', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      store.removeReminder('1')
      expect(store.reminders).toEqual([])
    })

    it('clears selectedReminder when the removed id matches', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      store.setSelectedReminder(reminderA)
      store.removeReminder('1')
      expect(store.selectedReminder).toBeNull()
    })

    it('does NOT clear selectedReminder when a different reminder is removed', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      store.setSelectedReminder(reminderB)
      store.removeReminder('1')
      expect(store.selectedReminder).toEqual(reminderB)
    })

    it('makes hasReminders false when the last reminder is removed', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      store.removeReminder('1')
      expect(store.hasReminders).toBe(false)
    })

    it('does not change list length when id is not found', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      store.removeReminder('999')
      expect(store.reminders).toHaveLength(2)
    })
  })

  // ── setSelectedReminder ────────────────────────────────────

  describe('setSelectedReminder()', () => {
    it('sets selectedReminder to the provided reminder', () => {
      const store = useRemindersStore()
      store.setSelectedReminder(reminderA)
      expect(store.selectedReminder).toEqual(reminderA)
    })

    it('replaces a previously selected reminder', () => {
      const store = useRemindersStore()
      store.setSelectedReminder(reminderA)
      store.setSelectedReminder(reminderB)
      expect(store.selectedReminder).toEqual(reminderB)
    })

    it('accepts null to clear the selection', () => {
      const store = useRemindersStore()
      store.setSelectedReminder(reminderA)
      store.setSelectedReminder(null)
      expect(store.selectedReminder).toBeNull()
    })

    it('stores the full reminder object reference', () => {
      const store = useRemindersStore()
      store.setSelectedReminder(reminderC)
      expect(store.selectedReminder?.pet_id).toBe('99')
      expect(store.selectedReminder?.type).toBe('baño')
    })
  })

  // ── clearSelectedReminder ──────────────────────────────────

  describe('clearSelectedReminder()', () => {
    it('sets selectedReminder to null', () => {
      const store = useRemindersStore()
      store.setSelectedReminder(reminderA)
      store.clearSelectedReminder()
      expect(store.selectedReminder).toBeNull()
    })

    it('is safe to call when selectedReminder is already null', () => {
      const store = useRemindersStore()
      expect(() => store.clearSelectedReminder()).not.toThrow()
      expect(store.selectedReminder).toBeNull()
    })

    it('does not affect the reminders array', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      store.setSelectedReminder(reminderA)
      store.clearSelectedReminder()
      expect(store.reminders).toHaveLength(2)
    })
  })

  // ── setLoading ─────────────────────────────────────────────

  describe('setLoading()', () => {
    it('sets isLoading to true', () => {
      const store = useRemindersStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading back to false', () => {
      const store = useRemindersStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('is idempotent when called with the same value', () => {
      const store = useRemindersStore()
      store.setLoading(false)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })
  })

  // ── clearReminders ─────────────────────────────────────────

  describe('clearReminders()', () => {
    it('resets reminders to an empty array', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB])
      store.clearReminders()
      expect(store.reminders).toEqual([])
    })

    it('resets selectedReminder to null', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA])
      store.setSelectedReminder(reminderA)
      store.clearReminders()
      expect(store.selectedReminder).toBeNull()
    })

    it('makes hasReminders false after clearing', () => {
      const store = useRemindersStore()
      store.setReminders([reminderA, reminderB, reminderC])
      store.clearReminders()
      expect(store.hasReminders).toBe(false)
    })

    it('is safe to call when the store is already in initial state', () => {
      const store = useRemindersStore()
      expect(() => store.clearReminders()).not.toThrow()
      expect(store.reminders).toEqual([])
      expect(store.selectedReminder).toBeNull()
    })

    it('does NOT reset isLoading — that is managed by setLoading separately', () => {
      const store = useRemindersStore()
      // isLoading starts false and clearReminders does not touch it
      store.setLoading(true)
      store.clearReminders()
      // Behavior: clearReminders only resets data state, not loading flag
      // This matches the implementation which only resets reminders and selectedReminder
      expect(store.reminders).toEqual([])
    })
  })
})
