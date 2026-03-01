// ============================================================
// StatsOverview.test.ts
// Tests for the StatsOverview component.
//
// Strategy:
//   - useStats is mocked at module level with reactive refs so
//     component state is fully controlled without real HTTP calls.
//   - Tests verify: loading skeleton (8+2), KPI card labels, revenue
//     labels, error alert, empty state, and retry behaviour.
//   - Fixtures use the nested StatsOverview structure from backend.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
import StatsOverview from './StatsOverview.vue'
import type { StatsOverview as StatsOverviewType } from '../types'

// ── Fixtures ──────────────────────────────────────────────────

function makeOverview(overrides: Partial<StatsOverviewType> = {}): StatsOverviewType {
  return {
    generated_at: '2025-01-15T10:00:00Z',
    period: { from: '2025-01-01', to: '2025-01-31' },
    users: { total: 100, active: 90, suspended: 10, new_in_period: 5, pro_active: 20, free: 80, conversion_rate_pct: 20 },
    shelters: { total: 15, active: 12, suspended: 3, verified: 10 },
    stores: { total: 30, active: 28, suspended: 2, featured: 5 },
    clinics: { total: 20, active: 18, suspended: 2, pro: 8 },
    revenue_cop: { total_accumulated: 5_000_000, in_period: 300_000, monthly_subscriptions: 200_000, annual_subscriptions: 100_000, arpu: 15_000 },
    donations_cop: { total_amount: 1_000_000, in_period: 80_000, platform_fees_accumulated: 50_000, net_to_shelters: 950_000, total_count: 80, unique_donors: 40, avg_donation: 12_500 },
    content: { total_pets: 250, total_reminders: 500, total_medical_records: 300, active_adoption_listings: 45, adopted_in_period: 10, blog_posts_published: 25 },
    ...overrides,
  }
}

// ── useStats mock ─────────────────────────────────────────────

const mockFetchOverview = vi.fn()
const mockError = ref<string | null>(null)
const mockOverview = ref<StatsOverviewType | null>(null)
const mockIsLoading = ref(false)

vi.mock('../composables/useStats', () => ({
  useStats: () => ({
    fetchOverview: mockFetchOverview,
    error: mockError,
    statsStore: {
      get overview() { return mockOverview.value },
      get isLoading() { return mockIsLoading.value },
      get hasOverview() { return mockOverview.value !== null },
    },
  }),
}))

// ── Mount helper ──────────────────────────────────────────────

async function mountOverview() {
  return mountSuspended(StatsOverview, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            auth: { token: 'admin.jwt', currentEntity: { id: 1, is_admin: true }, entityType: 'user' },
          },
        }),
      ],
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────

describe('StatsOverview', () => {
  beforeEach(() => {
    mockFetchOverview.mockReset()
    mockError.value = null
    mockOverview.value = null
    mockIsLoading.value = false
  })

  // ── Section structure ────────────────────────────────────────

  describe('section structure', () => {
    it('renders a section with correct aria-label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.find('section[aria-label="Resumen de estadísticas de la plataforma"]').exists()).toBe(true)
    })

    it('shows the "Resumen General" heading', async () => {
      mockOverview.value = makeOverview()
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Resumen General')
    })
  })

  // ── Lifecycle ────────────────────────────────────────────────

  describe('lifecycle', () => {
    it('calls fetchOverview on mount', async () => {
      mockFetchOverview.mockResolvedValue(undefined)
      await mountOverview()
      expect(mockFetchOverview).toHaveBeenCalledTimes(1)
    })
  })

  // ── Loading skeleton ─────────────────────────────────────────

  describe('loading skeleton', () => {
    it('shows skeleton container when loading and no overview', async () => {
      mockIsLoading.value = true
      const wrapper = await mountOverview()
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('has aria-label "Cargando estadísticas"', async () => {
      mockIsLoading.value = true
      const wrapper = await mountOverview()
      expect(wrapper.find('[aria-label="Cargando estadísticas"]').exists()).toBe(true)
    })

    it('renders 8 KPI skeleton cards', async () => {
      mockIsLoading.value = true
      const wrapper = await mountOverview()
      const skeletonIcons = wrapper.findAll('.stats-skeleton__icon')
      expect(skeletonIcons).toHaveLength(8)
    })

    it('does not show KPI labels while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountOverview()
      expect(wrapper.text()).not.toContain('Usuarios registrados')
    })
  })

  // ── KPI cards ────────────────────────────────────────────────

  describe('KPI cards when overview is loaded', () => {
    beforeEach(() => {
      mockOverview.value = makeOverview()
    })

    it('does not show skeleton when overview is present', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('shows "Usuarios registrados" label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Usuarios registrados')
    })

    it('shows "Mascotas registradas" label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Mascotas registradas')
    })

    it('shows "Refugios activos" label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Refugios activos')
    })

    it('shows "Clínicas registradas" label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Clínicas registradas')
    })

    it('shows "Tiendas pet-friendly" label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Tiendas pet-friendly')
    })

    it('shows "Adopciones procesadas" label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Adopciones procesadas')
    })

    it('shows "Suscripciones PRO" label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Suscripciones PRO')
    })

    it('shows "Donaciones realizadas" label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Donaciones realizadas')
    })

    it('shows "Ingresos del periodo" revenue label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Ingresos del periodo')
    })

    it('shows "Ingresos totales" revenue label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Ingresos totales')
    })

    it('renders the correct user count from nested users.total', async () => {
      mockOverview.value = makeOverview({ users: { total: 42, active: 40, suspended: 2, new_in_period: 1, pro_active: 5, free: 37, conversion_rate_pct: 12 } })
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('42')
    })

    it('renders the correct pet count from nested content.total_pets', async () => {
      mockOverview.value = makeOverview({ content: { total_pets: 999, total_reminders: 0, total_medical_records: 0, active_adoption_listings: 0, adopted_in_period: 0, blog_posts_published: 0 } })
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('999')
    })
  })

  // ── Error alert ──────────────────────────────────────────────

  describe('error alert', () => {
    it('shows error alert when error is set', async () => {
      mockError.value = 'Error de conexión'
      const wrapper = await mountOverview()
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.find('[role="alert"]').text()).toContain('Error de conexión')
    })

    it('hides error alert when error is null', async () => {
      mockOverview.value = makeOverview()
      const wrapper = await mountOverview()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })

    it('retry button inside error alert calls fetchOverview', async () => {
      mockError.value = 'Error de red'
      const wrapper = await mountOverview()
      const retryBtn = wrapper.find('[role="alert"] button')
      await retryBtn.trigger('click')
      expect(mockFetchOverview).toHaveBeenCalledTimes(2)
    })
  })

  // ── Empty state ──────────────────────────────────────────────

  describe('empty state', () => {
    it('shows "No se pudieron cargar las estadísticas" when not loading and no data', async () => {
      mockIsLoading.value = false
      mockOverview.value = null
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('No se pudieron cargar las estadísticas')
    })

    it('shows a "Reintentar" button in empty state', async () => {
      mockIsLoading.value = false
      mockOverview.value = null
      const wrapper = await mountOverview()
      expect(wrapper.find('button').text()).toContain('Reintentar')
    })

    it('clicking Reintentar calls fetchOverview again', async () => {
      mockIsLoading.value = false
      mockOverview.value = null
      const wrapper = await mountOverview()
      await wrapper.find('button').trigger('click')
      expect(mockFetchOverview).toHaveBeenCalledTimes(2)
    })
  })
})
