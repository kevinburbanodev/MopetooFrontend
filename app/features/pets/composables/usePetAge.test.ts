// ============================================================
// usePetAge.test.ts
// Unit tests for the usePetAge composable.
//
// Strategy: usePetAge has zero Nuxt or Pinia dependencies — it is a
// pure formatting utility. No mounting, no mocking needed.
// We call usePetAge() directly and exercise formatAge() with every
// meaningful input: null, undefined, zero, singular, plural, and
// negative edge case.
//
// What this suite does NOT cover intentionally:
//   - Reactivity — formatAge is a plain function, not a ref/computed.
//   - The Vue composable wrapper itself (just a thin factory).
// ============================================================

import { describe, it, expect } from 'vitest'
import { usePetAge } from './usePetAge'

describe('usePetAge — formatAge()', () => {
  const { formatAge } = usePetAge()

  // ── Unknown age ───────────────────────────────────────────

  describe('when age is null', () => {
    it('returns "Desconocida"', () => {
      expect(formatAge(null)).toBe('Desconocida')
    })
  })

  describe('when age is undefined', () => {
    it('returns "Desconocida"', () => {
      expect(formatAge(undefined)).toBe('Desconocida')
    })
  })

  // ── Less than one year ────────────────────────────────────

  describe('when age is 0', () => {
    it('returns "Menos de 1 año"', () => {
      expect(formatAge(0)).toBe('Menos de 1 año')
    })
  })

  // ── Singular year ─────────────────────────────────────────

  describe('when age is 1', () => {
    it('returns "1 año" (singular)', () => {
      expect(formatAge(1)).toBe('1 año')
    })
  })

  // ── Plural years ──────────────────────────────────────────

  describe('when age is 2', () => {
    it('returns "2 años" (plural)', () => {
      expect(formatAge(2)).toBe('2 años')
    })
  })

  describe('when age is 5', () => {
    it('returns "5 años"', () => {
      expect(formatAge(5)).toBe('5 años')
    })
  })

  describe('when age is 15', () => {
    it('returns "15 años"', () => {
      expect(formatAge(15)).toBe('15 años')
    })
  })

  // ── Negative edge case ────────────────────────────────────

  describe('when age is negative (-1)', () => {
    it('returns "-1 años" with no special handling', () => {
      expect(formatAge(-1)).toBe('-1 años')
    })
  })
})
