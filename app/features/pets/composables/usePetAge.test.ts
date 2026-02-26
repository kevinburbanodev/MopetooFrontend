// ============================================================
// usePetAge.test.ts
// Unit tests for the usePetAge composable.
//
// Strategy: usePetAge has zero Nuxt or Pinia dependencies — it is a
// pure date-calculation utility. No mounting, no mocking needed.
// We call usePetAge() directly in each test.
//
// Date arithmetic caveat: tests use dates computed relative to the
// current date via Date to remain green over time, rather than
// hardcoding absolute dates that would fail in future years.
//
// What this suite does NOT cover intentionally:
//   - Reactivity — formatAge is a plain function, not a ref/computed.
//   - The Vue composable wrapper itself (just a thin factory).
// ============================================================

import { describe, it, expect } from 'vitest'
import { usePetAge } from './usePetAge'

// ── Helpers ──────────────────────────────────────────────────

/**
 * Returns an ISO date string (YYYY-MM-DD) for a date offset from today.
 * Positive values are in the past, negative in the future.
 */
function dateOffsetDays(daysAgo: number): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

/**
 * Returns an ISO date string exactly N whole months before today,
 * anchored to the 1st of the month to avoid day-boundary edge cases.
 */
function dateOffsetMonths(monthsAgo: number): string {
  const d = new Date()
  d.setDate(1) // anchor to 1st to avoid month boundary issues
  d.setMonth(d.getMonth() - monthsAgo)
  return d.toISOString().split('T')[0]
}

/**
 * Returns an ISO date string exactly N whole years before today,
 * anchored to the 1st of the month.
 */
function dateOffsetYears(yearsAgo: number): string {
  const d = new Date()
  d.setDate(1)
  d.setFullYear(d.getFullYear() - yearsAgo)
  return d.toISOString().split('T')[0]
}

// ── Suite ────────────────────────────────────────────────────

describe('usePetAge — formatAge()', () => {
  const { formatAge } = usePetAge()

  // ── Edge: no date ─────────────────────────────────────────

  describe('with an empty string', () => {
    it('returns "Desconocida"', () => {
      expect(formatAge('')).toBe('Desconocida')
    })
  })

  describe('with an invalid date string', () => {
    it('returns "Desconocida" for a nonsense value', () => {
      expect(formatAge('not-a-date')).toBe('Desconocida')
    })

    it('returns "Desconocida" for a partial date', () => {
      expect(formatAge('2021-13-45')).toBe('Desconocida')
    })
  })

  // ── Newborn ───────────────────────────────────────────────

  describe('pet born today', () => {
    it('returns "Recién nacido"', () => {
      expect(formatAge(dateOffsetDays(0))).toBe('Recién nacido')
    })
  })

  // ── Months only ───────────────────────────────────────────

  describe('pet born 1 month ago', () => {
    it('returns "1 mes"', () => {
      expect(formatAge(dateOffsetMonths(1))).toBe('1 mes')
    })
  })

  describe('pet born 3 months ago', () => {
    it('returns "3 meses"', () => {
      expect(formatAge(dateOffsetMonths(3))).toBe('3 meses')
    })
  })

  describe('pet born 11 months ago', () => {
    it('returns "11 meses"', () => {
      expect(formatAge(dateOffsetMonths(11))).toBe('11 meses')
    })
  })

  // ── Years only ────────────────────────────────────────────

  describe('pet born exactly 1 year ago', () => {
    it('returns "1 año"', () => {
      expect(formatAge(dateOffsetYears(1))).toBe('1 año')
    })
  })

  describe('pet born exactly 2 years ago', () => {
    it('returns "2 años"', () => {
      expect(formatAge(dateOffsetYears(2))).toBe('2 años')
    })
  })

  describe('pet born exactly 10 years ago', () => {
    it('returns "10 años"', () => {
      expect(formatAge(dateOffsetYears(10))).toBe('10 años')
    })
  })

  // ── Years + months ────────────────────────────────────────

  describe('pet born 2 years and 1 month ago', () => {
    it('returns "2 años y 1 mes"', () => {
      // 25 months = 2 years + 1 month (anchored to 1st to avoid boundary issues)
      expect(formatAge(dateOffsetMonths(25))).toBe('2 años y 1 mes')
    })
  })

  describe('pet born 2 years and 5 months ago', () => {
    it('returns "2 años y 5 meses"', () => {
      expect(formatAge(dateOffsetMonths(29))).toBe('2 años y 5 meses')
    })
  })

  describe('pet born 1 year and 3 months ago', () => {
    it('returns "1 año y 3 meses"', () => {
      expect(formatAge(dateOffsetMonths(15))).toBe('1 año y 3 meses')
    })
  })

  describe('pet born 1 year and 1 month ago', () => {
    it('returns "1 año y 1 mes"', () => {
      expect(formatAge(dateOffsetMonths(13))).toBe('1 año y 1 mes')
    })
  })

  // ── Singular / plural boundary ────────────────────────────

  describe('singular / plural forms', () => {
    it('uses "meses" plural for 2+ months', () => {
      expect(formatAge(dateOffsetMonths(2))).toBe('2 meses')
    })

    it('uses "años" plural for 2+ years', () => {
      expect(formatAge(dateOffsetYears(3))).toBe('3 años')
    })

    it('uses "año" singular for exactly 1 year with no remaining months', () => {
      expect(formatAge(dateOffsetYears(1))).toBe('1 año')
    })
  })
})
