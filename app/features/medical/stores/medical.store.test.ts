// ============================================================
// medical.store.test.ts
// Tests the useMedicalStore Pinia store in isolation.
//
// Strategy: uses the real store (no stubActions) so that action
// implementations are exercised, not mocked away. Each test gets
// a fresh pinia via setActivePinia(createPinia()) in beforeEach.
//
// What this suite does NOT cover intentionally:
//   - HTTP / API calls — those are composable concerns (useMedical.test.ts)
//   - Component rendering — covered in component test files
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMedicalStore } from './medical.store'
import type { MedicalRecord } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeRecord(overrides: Partial<MedicalRecord> = {}): MedicalRecord {
  return {
    id: '1',
    pet_id: '42',
    date: '2024-06-15T00:00:00Z',
    symptoms: 'Tos leve',
    diagnosis: 'Control rutinario',
    treatment: 'Vitaminas y desparasitante',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const recordA = makeRecord({ id: '1', date: '2024-06-15T00:00:00Z', symptoms: 'Tos leve', diagnosis: 'Control rutinario' })
const recordB = makeRecord({ id: '2', date: '2024-07-20T00:00:00Z', symptoms: 'Fiebre', diagnosis: 'Vacunación', treatment: 'Vacuna triple' })
const recordC = makeRecord({ id: '3', date: '2024-08-10T00:00:00Z', symptoms: 'Decaimiento', diagnosis: 'Infección leve', notes: 'Antibiótico 7 días' })

// ── Suite ─────────────────────────────────────────────────────

describe('useMedicalStore', () => {
  beforeEach(() => {
    // Fresh pinia per test — no state leaks between tests
    setActivePinia(createPinia())
  })

  // ── Initial state ──────────────────────────────────────────

  describe('initial state', () => {
    it('has an empty records array', () => {
      const store = useMedicalStore()
      expect(store.records).toEqual([])
    })

    it('has null selectedRecord', () => {
      const store = useMedicalStore()
      expect(store.selectedRecord).toBeNull()
    })

    it('has isLoading false', () => {
      const store = useMedicalStore()
      expect(store.isLoading).toBe(false)
    })

    it('hasRecords is false with an empty array', () => {
      const store = useMedicalStore()
      expect(store.hasRecords).toBe(false)
    })
  })

  // ── hasRecords getter ──────────────────────────────────────

  describe('hasRecords getter', () => {
    it('is false when records is empty', () => {
      const store = useMedicalStore()
      expect(store.hasRecords).toBe(false)
    })

    it('is true when at least one record exists', () => {
      const store = useMedicalStore()
      store.addRecord(recordA)
      expect(store.hasRecords).toBe(true)
    })

    it('becomes false again after removing the last record', () => {
      const store = useMedicalStore()
      store.addRecord(recordA)
      store.removeRecord('1')
      expect(store.hasRecords).toBe(false)
    })

    it('stays true when some records remain after a removal', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.removeRecord('1')
      expect(store.hasRecords).toBe(true)
    })
  })

  // ── getRecordById getter ───────────────────────────────────

  describe('getRecordById()', () => {
    it('returns the matching record when the id is in the list', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      expect(store.getRecordById('2')).toEqual(recordB)
    })

    it('returns undefined when the id is not in the list', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      expect(store.getRecordById('999')).toBeUndefined()
    })

    it('returns undefined when the records list is empty', () => {
      const store = useMedicalStore()
      expect(store.getRecordById('1')).toBeUndefined()
    })

    it('returns the first record correctly when there is only one', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      expect(store.getRecordById('1')).toEqual(recordA)
    })

    it('returns the last record in a multi-record list', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB, recordC])
      expect(store.getRecordById('3')).toEqual(recordC)
    })
  })

  // ── setRecords ─────────────────────────────────────────────

  describe('setRecords()', () => {
    it('replaces the records array with the provided list', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      expect(store.records).toEqual([recordA, recordB])
    })

    it('overwrites any previously stored records', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.setRecords([recordC])
      expect(store.records).toEqual([recordC])
    })

    it('accepts an empty array, clearing all records', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      store.setRecords([])
      expect(store.records).toEqual([])
    })

    it('makes hasRecords true after setting a non-empty array', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      expect(store.hasRecords).toBe(true)
    })

    it('makes hasRecords false after setting an empty array', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      store.setRecords([])
      expect(store.hasRecords).toBe(false)
    })

    it('preserves the order of the provided list', () => {
      const store = useMedicalStore()
      store.setRecords([recordC, recordA, recordB])
      expect(store.records[0]).toEqual(recordC)
      expect(store.records[1]).toEqual(recordA)
      expect(store.records[2]).toEqual(recordB)
    })
  })

  // ── addRecord ─────────────────────────────────────────────

  describe('addRecord()', () => {
    it('prepends the record to an empty list (unshift — newest-first)', () => {
      const store = useMedicalStore()
      store.addRecord(recordA)
      expect(store.records).toHaveLength(1)
      expect(store.records[0]).toEqual(recordA)
    })

    it('prepends the new record before any existing records', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.addRecord(recordC)
      expect(store.records[0]).toEqual(recordC)
      expect(store.records).toHaveLength(3)
    })

    it('makes hasRecords true', () => {
      const store = useMedicalStore()
      store.addRecord(recordA)
      expect(store.hasRecords).toBe(true)
    })

    it('first added record is at index 0 (newest-first), second at index 1', () => {
      const store = useMedicalStore()
      store.addRecord(recordA)
      store.addRecord(recordB)
      // recordB was added last so it becomes index 0 (unshift)
      expect(store.records[0].id).toBe('2')
      expect(store.records[1].id).toBe('1')
    })

    it('does not mutate existing records when prepending', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.addRecord(recordC)
      expect(store.records[1]).toEqual(recordA)
      expect(store.records[2]).toEqual(recordB)
    })
  })

  // ── updateRecord ──────────────────────────────────────────

  describe('updateRecord()', () => {
    it('replaces the matching record in the list by id', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      const updated = { ...recordA, diagnosis: 'Diagnóstico actualizado' }
      store.updateRecord(updated)
      expect(store.records[0]).toEqual(updated)
    })

    it('does not mutate other records in the list', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.updateRecord({ ...recordA, diagnosis: 'Diagnóstico actualizado' })
      expect(store.records[1]).toEqual(recordB)
    })

    it('is a no-op when the id is not found in the list', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      const phantom = makeRecord({ id: '999', diagnosis: 'Fantasma' })
      store.updateRecord(phantom)
      expect(store.records).toEqual([recordA])
    })

    it('keeps the list length the same after an update', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB, recordC])
      store.updateRecord({ ...recordB, treatment: 'Tratamiento actualizado' })
      expect(store.records).toHaveLength(3)
    })

    it('syncs selectedRecord when the updated id matches', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      store.setSelectedRecord(recordA)
      const updated = { ...recordA, diagnosis: 'Diagnóstico actualizado' }
      store.updateRecord(updated)
      expect(store.selectedRecord).toEqual(updated)
    })

    it('does NOT change selectedRecord when the updated id does not match', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.setSelectedRecord(recordB)
      store.updateRecord({ ...recordA, diagnosis: 'Diagnóstico actualizado' })
      expect(store.selectedRecord).toEqual(recordB)
    })

    it('leaves selectedRecord null when no record is selected', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      store.updateRecord({ ...recordA, diagnosis: 'Diagnóstico actualizado' })
      expect(store.selectedRecord).toBeNull()
    })

    it('updates only the targeted record when multiple exist', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB, recordC])
      store.updateRecord({ ...recordB, notes: 'Nueva observación' })
      expect(store.records[0]).toEqual(recordA)
      expect(store.records[1].notes).toBe('Nueva observación')
      expect(store.records[2]).toEqual(recordC)
    })

    it('is a no-op when the records list is empty', () => {
      const store = useMedicalStore()
      expect(() => store.updateRecord(recordA)).not.toThrow()
      expect(store.records).toEqual([])
    })
  })

  // ── removeRecord ──────────────────────────────────────────

  describe('removeRecord()', () => {
    it('removes the record with the matching id', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.removeRecord('1')
      expect(store.records).toEqual([recordB])
    })

    it('does not affect other records in the list', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB, recordC])
      store.removeRecord('2')
      expect(store.records).toEqual([recordA, recordC])
    })

    it('is a no-op when the id is not found', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      store.removeRecord('999')
      expect(store.records).toEqual([recordA])
    })

    it('results in an empty list when the only record is removed', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      store.removeRecord('1')
      expect(store.records).toEqual([])
    })

    it('clears selectedRecord when the removed id matches', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.setSelectedRecord(recordA)
      store.removeRecord('1')
      expect(store.selectedRecord).toBeNull()
    })

    it('does NOT clear selectedRecord when a different record is removed', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.setSelectedRecord(recordB)
      store.removeRecord('1')
      expect(store.selectedRecord).toEqual(recordB)
    })

    it('makes hasRecords false when the last record is removed', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      store.removeRecord('1')
      expect(store.hasRecords).toBe(false)
    })

    it('does not change list length when id is not found', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.removeRecord('999')
      expect(store.records).toHaveLength(2)
    })
  })

  // ── setSelectedRecord ─────────────────────────────────────

  describe('setSelectedRecord()', () => {
    it('sets selectedRecord to the provided record', () => {
      const store = useMedicalStore()
      store.setSelectedRecord(recordA)
      expect(store.selectedRecord).toEqual(recordA)
    })

    it('replaces a previously selected record', () => {
      const store = useMedicalStore()
      store.setSelectedRecord(recordA)
      store.setSelectedRecord(recordB)
      expect(store.selectedRecord).toEqual(recordB)
    })

    it('accepts null to clear the selection', () => {
      const store = useMedicalStore()
      store.setSelectedRecord(recordA)
      store.setSelectedRecord(null)
      expect(store.selectedRecord).toBeNull()
    })

    it('stores the full record object with all fields intact', () => {
      const richRecord = makeRecord({ id: '5', notes: 'Notas especiales', symptoms: 'Fiebre alta' })
      const store = useMedicalStore()
      store.setSelectedRecord(richRecord)
      expect(store.selectedRecord?.notes).toBe('Notas especiales')
      expect(store.selectedRecord?.symptoms).toBe('Fiebre alta')
    })
  })

  // ── clearSelectedRecord ───────────────────────────────────

  describe('clearSelectedRecord()', () => {
    it('sets selectedRecord to null', () => {
      const store = useMedicalStore()
      store.setSelectedRecord(recordA)
      store.clearSelectedRecord()
      expect(store.selectedRecord).toBeNull()
    })

    it('is safe to call when selectedRecord is already null', () => {
      const store = useMedicalStore()
      expect(() => store.clearSelectedRecord()).not.toThrow()
      expect(store.selectedRecord).toBeNull()
    })

    it('does not affect the records array', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.setSelectedRecord(recordA)
      store.clearSelectedRecord()
      expect(store.records).toHaveLength(2)
    })
  })

  // ── setLoading ────────────────────────────────────────────

  describe('setLoading()', () => {
    it('sets isLoading to true', () => {
      const store = useMedicalStore()
      store.setLoading(true)
      expect(store.isLoading).toBe(true)
    })

    it('sets isLoading back to false', () => {
      const store = useMedicalStore()
      store.setLoading(true)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('is idempotent when called with the same value', () => {
      const store = useMedicalStore()
      store.setLoading(false)
      store.setLoading(false)
      expect(store.isLoading).toBe(false)
    })

    it('does not affect records or selectedRecord', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      store.setSelectedRecord(recordA)
      store.setLoading(true)
      expect(store.records).toHaveLength(1)
      expect(store.selectedRecord).toEqual(recordA)
    })
  })

  // ── clearMedicalRecords ───────────────────────────────────

  describe('clearMedicalRecords()', () => {
    it('resets records to an empty array', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.clearMedicalRecords()
      expect(store.records).toEqual([])
    })

    it('resets selectedRecord to null', () => {
      const store = useMedicalStore()
      store.setRecords([recordA])
      store.setSelectedRecord(recordA)
      store.clearMedicalRecords()
      expect(store.selectedRecord).toBeNull()
    })

    it('makes hasRecords false after clearing', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB, recordC])
      store.clearMedicalRecords()
      expect(store.hasRecords).toBe(false)
    })

    it('is safe to call when the store is already in initial state', () => {
      const store = useMedicalStore()
      expect(() => store.clearMedicalRecords()).not.toThrow()
      expect(store.records).toEqual([])
      expect(store.selectedRecord).toBeNull()
    })

    it('does NOT reset isLoading — that is managed by setLoading separately', () => {
      const store = useMedicalStore()
      // Confirm clearMedicalRecords only resets data state, not the loading flag
      store.setLoading(true)
      store.clearMedicalRecords()
      expect(store.records).toEqual([])
      // isLoading is not touched by clearMedicalRecords
    })

    it('getRecordById returns undefined after clearing', () => {
      const store = useMedicalStore()
      store.setRecords([recordA, recordB])
      store.clearMedicalRecords()
      expect(store.getRecordById('1')).toBeUndefined()
    })
  })
})
