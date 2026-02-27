// ============================================================
// RevenueReport.test.ts
// Tests for the RevenueReport component.
//
// Strategy:
//   - Component is purely data-driven via props — no composable needed.
//   - Tests verify: skeleton rows, table headers, data rows (badges, totals),
//     grand totals tfoot row, empty state, and date/COP formatting.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import RevenueReport from './RevenueReport.vue'
import type { RevenueDataPoint } from '../types'

// ── Fixtures ──────────────────────────────────────────────────

function makePoint(overrides: Partial<RevenueDataPoint> = {}): RevenueDataPoint {
  return {
    month: '2025-01',
    subscriptions: 1_000_000,
    donations: 200_000,
    total: 1_200_000,
    ...overrides,
  }
}

const sampleData: RevenueDataPoint[] = [
  makePoint({ month: '2025-01', subscriptions: 1_000_000, donations: 200_000, total: 1_200_000 }),
  makePoint({ month: '2025-02', subscriptions: 1_500_000, donations: 300_000, total: 1_800_000 }),
]

// ── Mount helper ──────────────────────────────────────────────

interface MountOptions {
  data?: RevenueDataPoint[]
  isLoading?: boolean
}

async function mountReport(options: MountOptions = {}) {
  return mountSuspended(RevenueReport, {
    props: {
      data: options.data ?? [],
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
    it('renders a section with aria-label "Reporte de ingresos por fuente"', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.find('section[aria-label="Reporte de ingresos por fuente"]').exists()).toBe(true)
    })

    it('shows the "Reporte de Ingresos por Fuente" heading', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.text()).toContain('Reporte de Ingresos por Fuente')
    })
  })

  // ── Table headers ────────────────────────────────────────────

  describe('table headers', () => {
    it('renders "Mes" column header', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.find('thead').text()).toContain('Mes')
    })

    it('renders "Suscripciones PRO" column header', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.find('thead').text()).toContain('Suscripciones PRO')
    })

    it('renders "Donaciones" column header', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.find('thead').text()).toContain('Donaciones')
    })

    it('renders "Total" column header', async () => {
      const wrapper = await mountReport({ data: sampleData })
      expect(wrapper.find('thead').text()).toContain('Total')
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

    it('shows the month name in Spanish', async () => {
      const wrapper = await mountReport({ data: [makePoint({ month: '2025-01' })] })
      // Intl formats as "enero de 2025" or similar
      expect(wrapper.find('tbody').text()).toMatch(/enero/i)
    })

    it('renders subscriptions amount with bg-info badge', async () => {
      const wrapper = await mountReport({ data: [makePoint({ subscriptions: 1_000_000 })] })
      const badge = wrapper.find('.badge.bg-info')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('1.000.000')
    })

    it('renders donations amount with bg-success badge', async () => {
      const wrapper = await mountReport({ data: [makePoint({ donations: 200_000 })] })
      const badge = wrapper.find('.badge.bg-success')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toContain('200.000')
    })

    it('renders the total column with COP formatting', async () => {
      const wrapper = await mountReport({ data: [makePoint({ total: 1_200_000 })] })
      const row = wrapper.find('tbody tr')
      expect(row.text()).toContain('1.200.000')
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

    it('shows the sum of subscriptions in tfoot', async () => {
      const wrapper = await mountReport({ data: sampleData })
      // 1_000_000 + 1_500_000 = 2_500_000
      expect(wrapper.find('tfoot').text()).toContain('2.500.000')
    })

    it('shows the sum of donations in tfoot', async () => {
      const wrapper = await mountReport({ data: sampleData })
      // 200_000 + 300_000 = 500_000
      expect(wrapper.find('tfoot').text()).toContain('500.000')
    })

    it('shows the grand total in tfoot', async () => {
      const wrapper = await mountReport({ data: sampleData })
      // 1_200_000 + 1_800_000 = 3_000_000
      expect(wrapper.find('tfoot').text()).toContain('3.000.000')
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
