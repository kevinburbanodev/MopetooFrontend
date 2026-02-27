// ============================================================
// StatsChart.test.ts
// Tests for the StatsChart component.
//
// Strategy:
//   - Component receives data and isLoading as props — no composable mocking needed.
//   - Tests verify: skeleton (6 rows), bar rendering, metric toggle buttons,
//     active metric class, COP formatting, month labels, empty state.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import StatsChart from './StatsChart.vue'
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
  makePoint({ month: '2025-03', subscriptions: 800_000, donations: 100_000, total: 900_000 }),
]

// ── Mount helper ──────────────────────────────────────────────

interface MountOptions {
  data?: RevenueDataPoint[]
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

  // ── Metric toggle buttons ────────────────────────────────────

  describe('metric toggle buttons', () => {
    it('renders three metric buttons: Total, Suscripciones, Donaciones', async () => {
      const wrapper = await mountChart({ data: sampleData })
      expect(wrapper.text()).toContain('Total')
      expect(wrapper.text()).toContain('Suscripciones')
      expect(wrapper.text()).toContain('Donaciones')
    })

    it('Total button has btn-primary class by default', async () => {
      const wrapper = await mountChart({ data: sampleData })
      const buttons = wrapper.findAll('[role="group"] button')
      expect(buttons[0].classes()).toContain('btn-primary')
    })

    it('Suscripciones button has btn-outline-secondary class by default', async () => {
      const wrapper = await mountChart({ data: sampleData })
      const buttons = wrapper.findAll('[role="group"] button')
      expect(buttons[1].classes()).toContain('btn-outline-secondary')
    })

    it('clicking Suscripciones activates it with btn-primary class', async () => {
      const wrapper = await mountChart({ data: sampleData })
      const buttons = wrapper.findAll('[role="group"] button')
      await buttons[1].trigger('click')
      expect(buttons[1].classes()).toContain('btn-primary')
    })

    it('clicking Donaciones activates it with btn-primary class', async () => {
      const wrapper = await mountChart({ data: sampleData })
      const buttons = wrapper.findAll('[role="group"] button')
      await buttons[2].trigger('click')
      expect(buttons[2].classes()).toContain('btn-primary')
    })

    it('after clicking Suscripciones, Total button loses btn-primary', async () => {
      const wrapper = await mountChart({ data: sampleData })
      const buttons = wrapper.findAll('[role="group"] button')
      await buttons[1].trigger('click')
      expect(buttons[0].classes()).not.toContain('btn-primary')
    })
  })

  // ── Bar rendering ────────────────────────────────────────────

  describe('bar chart rendering', () => {
    it('renders a progress bar for each data point', async () => {
      const wrapper = await mountChart({ data: sampleData })
      const progressBars = wrapper.findAll('[role="progressbar"]')
      expect(progressBars).toHaveLength(sampleData.length)
    })

    it('the bar with the maximum value has width 100%', async () => {
      const wrapper = await mountChart({ data: sampleData })
      const progressInners = wrapper.findAll('.progress-bar')
      // max total is 1_800_000 (index 1)
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

    it('shows COP-formatted amounts in the amount column', async () => {
      const wrapper = await mountChart({ data: [makePoint({ total: 1_200_000 })] })
      expect(wrapper.text()).toContain('1.200.000')
    })

    it('shows month label text', async () => {
      const wrapper = await mountChart({ data: [makePoint({ month: '2025-01' })] })
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
