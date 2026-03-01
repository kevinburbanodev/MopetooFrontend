// ============================================================
// RevenueReport.test.ts
// Tests for the RevenueReport component.
//
// Strategy:
//   - Component is purely data-driven via props — no composable needed.
//   - Tests verify: skeleton rows, table headers, data rows,
//     grand totals tfoot row (from stats prop), empty state,
//     and date/COP formatting.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import RevenueReport from './RevenueReport.vue'
import type { RevenueSeriesPoint, RevenueStats } from '../types'

// ── Fixtures ──────────────────────────────────────────────────

function makePoint(overrides: Partial<RevenueSeriesPoint> = {}): RevenueSeriesPoint {
  return {
    date: '2025-01-01',
    revenue: 1_200_000,
    count: 15,
    ...overrides,
  }
}

function makeRevenueStats(overrides: Partial<RevenueStats> = {}): RevenueStats {
  return {
    generated_at: '2025-01-15T10:00:00Z',
    period: { from: '2025-01-01', to: '2025-01-31' },
    total_accumulated_cop: 5_000_000,
    in_period_cop: 300_000,
    by_plan: { pro_monthly: { revenue: 200_000, count: 10 } },
    approved_transactions: 50,
    arpu: 15_000,
    series: [],
    ...overrides,
  }
}

const sampleData: RevenueSeriesPoint[] = [
  makePoint({ date: '2025-01-01', revenue: 1_200_000, count: 10 }),
  makePoint({ date: '2025-02-01', revenue: 1_800_000, count: 15 }),
]

// ── Mount helper ──────────────────────────────────────────────

interface MountOptions {
  data?: RevenueSeriesPoint[]
  stats?: RevenueStats | null
  isLoading?: boolean
}

async function mountReport(options: MountOptions = {}) {
  return mountSuspended(RevenueReport, {
    props: {
      data: options.data ?? [],
      stats: options.stats ?? null,
      isLoading: options.isLoading ?? false,
    },
    global: {
      plugins: [createTestingPinia()],
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────

describe('RevenueReport', () => {
  // ── Section structure ────────────────────────────────────────

  describe('section structure', () => {
    it('renders a section with aria-label "Reporte de ingresos"', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.find('section[aria-label="Reporte de ingresos"]').exists()).toBe(true)
    })

    it('shows the "Reporte de Ingresos" heading', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.text()).toContain('Reporte de Ingresos')
    })
  })

  // ── Table headers ────────────────────────────────────────────

  describe('table headers', () => {
    it('renders "Fecha" column header', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.find('thead').text()).toContain('Fecha')
    })

    it('renders "Ingresos (COP)" column header', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.find('thead').text()).toContain('Ingresos (COP)')
    })

    it('renders "Transacciones" column header', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.find('thead').text()).toContain('Transacciones')
    })
  })

  // ── Loading skeleton ─────────────────────────────────────────

  describe('loading skeleton', () => {
    it('renders 6 skeleton rows when isLoading is true', async () => {
      const wrapper = await mountReport({ isLoading: true })
      const skeletonCells = wrapper.findAll('.revenue-skeleton__month')
      expect(skeletonCells).toHaveLength(6)
    })

    it('hides skeleton when isLoading is false', async () => {
      const wrapper = await mountReport({ data: sampleData, isLoading: false })
      expect(wrapper.findAll('.revenue-skeleton__month')).toHaveLength(0)
    })

    it('does not render tfoot while loading', async () => {
      const wrapper = await mountReport({ isLoading: true })
      expect(wrapper.find('tfoot').exists()).toBe(false)
    })
  })

  // ── Data rows ────────────────────────────────────────────────

  describe('data rows', () => {
    it('renders a row for each data point', async () => {
      const wrapper = await mountReport({ data: sampleData })
      const dataRows = wrapper.findAll('tbody tr')
      expect(dataRows).toHaveLength(sampleData.length)
    })

    it('shows the date in Spanish month format', async () => {
      const wrapper = await mountReport({ data: [makePoint({ date: '2025-01-01' })] })
      // Intl formats as "enero de 2025" or similar
      expect(wrapper.find('tbody').text()).toMatch(/enero/i)
    })

    it('renders revenue amount with bg-primary badge', async () => {
      const wrapper = await mountReport({ data: [makePoint({ revenue: 1_200_000 })] })
      const badge = wrapper.find('.badge.bg-primary')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('1.200.000')
    })

    it('renders the transaction count', async () => {
      const wrapper = await mountReport({ data: [makePoint({ count: 42 })] })
      const row = wrapper.find('tbody tr')
      expect(row.text()).toContain('42')
    })
  })

  // ── Totals footer ─────────────────────────────────────────────

  describe('grand totals tfoot', () => {
    it('renders a tfoot when data is present', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.find('tfoot').exists()).toBe(true)
    })

    it('shows "Total acumulado" label in tfoot', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.find('tfoot').text()).toContain('Total acumulado')
    })

    it('uses stats.total_accumulated_cop for totals when stats prop is provided', async () => {
      const wrapper = await mountReport({
        data: sampleData,
        stats: makeRevenueStats({ total_accumulated_cop: 9_999_999 }),
      })
      expect(wrapper.find('tfoot').text()).toContain('9.999.999')
    })

    it('uses stats.approved_transactions for count total when stats prop is provided', async () => {
      const wrapper = await mountReport({
        data: sampleData,
        stats: makeRevenueStats({ approved_transactions: 77 }),
      })
      expect(wrapper.find('tfoot').text()).toContain('77')
    })

    it('falls back to computed sum of revenue when no stats prop', async () => {
      const wrapper = await mountReport({ data: sampleData })
      // 1_200_000 + 1_800_000 = 3_000_000
      expect(wrapper.find('tfoot').text()).toContain('3.000.000')
    })

    it('falls back to computed sum of counts when no stats prop', async () => {
      const wrapper = await mountReport({ data: sampleData })
      // 10 + 15 = 25
      expect(wrapper.find('tfoot').text()).toContain('25')
    })

    it('does not render tfoot when data is empty', async () => {
      const wrapper = await mountReport({ data: [] })
      expect(wrapper.find('tfoot').exists()).toBe(false)
    })
  })

  // ── Empty state ──────────────────────────────────────────────

  describe('empty state', () => {
    it('shows empty state message when data is empty and not loading', async () => {
      const wrapper = await mountReport({ data: [], isLoading: false })
      expect(wrapper.text()).toContain('No hay datos de ingresos disponibles aún.')
    })

    it('hides empty state when data is present', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.text()).not.toContain('No hay datos de ingresos disponibles aún.')
    })
  })
})
