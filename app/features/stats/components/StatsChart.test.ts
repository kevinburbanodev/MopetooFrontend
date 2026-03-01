// ============================================================
// StatsChart.test.ts
// Tests for the StatsChart component.
//
// Strategy:
//   - Component receives data and isLoading as props — no composable mocking needed.
//   - Tests verify: skeleton (6 rows), bar rendering, COP formatting,
//     date labels, and empty state.
//   - Uses RevenueSeriesPoint with `revenue` as the single metric.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import StatsChart from './StatsChart.vue'
import type { RevenueSeriesPoint } from '../types'

// ── Fixtures ──────────────────────────────────────────────────

function makePoint(overrides: Partial<RevenueSeriesPoint> = {}): RevenueSeriesPoint {
  return {
    date: '2025-01-01',
    revenue: 1_200_000,
    count: 15,
    ...overrides,
  }
}

const sampleData: RevenueSeriesPoint[] = [
  makePoint({ date: '2025-01-01', revenue: 1_200_000, count: 10 }),
  makePoint({ date: '2025-02-01', revenue: 1_800_000, count: 15 }),
  makePoint({ date: '2025-03-01', revenue: 900_000, count: 8 }),
]

// ── Mount helper ──────────────────────────────────────────────

interface MountOptions {
  data?: RevenueSeriesPoint[]
  isLoading?: boolean
}

async function mountChart(options: MountOptions = {}) {
  return mountSuspended(StatsChart, {
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

describe('StatsChart', () => {
  // ── Section structure ────────────────────────────────────────

  describe('section structure', () => {
    it('renders a section with aria-label "Gráfico de ingresos por mes"', async () => {
      const wrapper = await mountChart({ data: sampleData })
      expect(wrapper.find('section[aria-label="Gráfico de ingresos por mes"]').exists()).toBe(true)
    })

    it('shows the "Ingresos por Mes" heading', async () => {
      const wrapper = await mountChart({ data: sampleData })
      expect(wrapper.text()).toContain('Ingresos por Mes')
    })
  })

  // ── Loading skeleton ─────────────────────────────────────────

  describe('loading skeleton', () => {
    it('shows skeleton container when isLoading is true', async () => {
      const wrapper = await mountChart({ isLoading: true })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('has aria-label "Cargando gráfico"', async () => {
      const wrapper = await mountChart({ isLoading: true })
      expect(wrapper.find('[aria-label="Cargando gráfico"]').exists()).toBe(true)
    })

    it('renders 6 skeleton rows', async () => {
      const wrapper = await mountChart({ isLoading: true })
      const skeletonBars = wrapper.findAll('.chart-skeleton__bar')
      expect(skeletonBars).toHaveLength(6)
    })

    it('hides skeleton when isLoading is false', async () => {
      const wrapper = await mountChart({ data: sampleData, isLoading: false })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })
  })

  // ── Bar rendering ────────────────────────────────────────────

  describe('bar chart rendering', () => {
    it('renders a progress bar for each data point', async () => {
      const wrapper = await mountChart({ data: sampleData })
      const progressBars = wrapper.findAll('[role="progressbar"]')
      expect(progressBars).toHaveLength(sampleData.length)
    })

    it('the bar with the maximum revenue has width 100%', async () => {
      const wrapper = await mountChart({ data: sampleData })
      const progressInners = wrapper.findAll('.progress-bar')
      // max revenue is 1_800_000 (index 1)
      expect(progressInners[1].attributes('style')).toContain('width: 100%')
    })

    it('bar widths are proportional to max value', async () => {
      const wrapper = await mountChart({ data: sampleData })
      const progressInners = wrapper.findAll('.progress-bar')
      // 1_200_000 / 1_800_000 * 100 ≈ 67
      const firstWidthStyle = progressInners[0].attributes('style') ?? ''
      const match = firstWidthStyle.match(/width:\s*(\d+)%/)
      const percent = match ? Number(match[1]) : 0
      expect(percent).toBeGreaterThan(50)
      expect(percent).toBeLessThan(100)
    })

    it('all bars use bg-primary class', async () => {
      const wrapper = await mountChart({ data: sampleData })
      const progressInners = wrapper.findAll('.progress-bar')
      progressInners.forEach((bar) => {
        expect(bar.classes()).toContain('bg-primary')
      })
    })

    it('shows COP-formatted revenue amounts', async () => {
      const wrapper = await mountChart({ data: [makePoint({ revenue: 1_200_000 })] })
      expect(wrapper.text()).toContain('1.200.000')
    })

    it('shows date label text', async () => {
      const wrapper = await mountChart({ data: [makePoint({ date: '2025-01-01' })] })
      // Intl.DateTimeFormat 'es-ES' short month: "ene." or similar
      expect(wrapper.text()).toMatch(/ene|jan/i)
    })
  })

  // ── Empty state ──────────────────────────────────────────────

  describe('empty state', () => {
    it('shows empty state when data is empty and not loading', async () => {
      const wrapper = await mountChart({ data: [], isLoading: false })
      expect(wrapper.text()).toContain('No hay datos de ingresos disponibles aún.')
    })

    it('hides empty state when data is present', async () => {
      const wrapper = await mountChart({ data: sampleData })
      expect(wrapper.text()).not.toContain('No hay datos de ingresos disponibles aún.')
    })
  })
})
