// ============================================================
// AdminDashboard.test.ts
// Tests for the AdminDashboard component.
//
// Strategy:
//   - useStats is mocked at module level with reactive refs so
//     component state is fully controlled without real HTTP calls.
//   - createTestingPinia provides auth state with an admin token.
//   - Tests verify: loading skeleton (8 cards), KPI card rendering,
//     revenue cards, quick nav links, empty/error states.
//
// What this suite does NOT cover intentionally:
//   - CSS animation or SCSS skeleton shimmer styles.
//   - Actual API calls (useStats is fully mocked).
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref, reactive } from 'vue'
import AdminDashboard from './AdminDashboard.vue'
import type { StatsOverview } from '../../stats/types'

// ── Fixtures ─────────────────────────────────────────────────

function makeOverview(overrides: Partial<StatsOverview> = {}): StatsOverview {
  return {
    generated_at: '2025-01-01T00:00:00Z',
    period: { from: '2025-01-01', to: '2025-01-31' },
    users: { total: 100, active: 90, suspended: 5, new_in_period: 10, pro_active: 60, free: 40, conversion_rate_pct: 60 },
    shelters: { total: 15, active: 12, suspended: 1, verified: 10 },
    stores: { total: 30, active: 25, suspended: 2, featured: 5 },
    clinics: { total: 20, active: 18, suspended: 1, pro: 8 },
    revenue_cop: { total_accumulated: 5000000, in_period: 300000, monthly_subscriptions: 200000, annual_subscriptions: 100000, arpu: 5000 },
    donations_cop: { total_amount: 1000000, in_period: 80000, platform_fees_accumulated: 50000, net_to_shelters: 950000, total_count: 80, unique_donors: 40, avg_donation: 12500 },
    content: { total_pets: 250, total_reminders: 500, total_medical_records: 300, active_adoption_listings: 45, adopted_in_period: 15, blog_posts_published: 25 },
    ...overrides,
  }
}

// ── useStats mock ─────────────────────────────────────────────

const mockFetchOverview = vi.fn()
const mockError = ref<string | null>(null)
const mockStatsStore = reactive({
  overview: null as StatsOverview | null,
  isLoading: false,
  get hasOverview() { return this.overview !== null },
})

vi.mock('../../stats/composables/useStats', () => ({
  useStats: () => ({
    fetchOverview: mockFetchOverview,
    error: mockError,
    statsStore: mockStatsStore,
  }),
}))

// ── Stub MaintenanceToggle ───────────────────────────────────

vi.mock('../../maintenance/components/MaintenanceToggle.vue', () => ({
  default: { template: '<div data-stub="MaintenanceToggle" />' },
}))

// ── Shared mount helper ───────────────────────────────────────

async function mountDashboard() {
  return mountSuspended(AdminDashboard, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            auth: { token: 'admin.jwt', currentEntity: { id: 1, is_admin: true }, entityType: 'user' },
          },
        }),
      ],
      stubs: {
        NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
      },
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────

describe('AdminDashboard', () => {
  beforeEach(() => {
    mockFetchOverview.mockReset()
    mockError.value = null
    mockStatsStore.overview = null
    mockStatsStore.isLoading = false
  })

  // ── Section structure ───────────────────────────────────────

  describe('section structure', () => {
    it('renders a section with aria-label "Panel de administración"', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.find('section[aria-label="Panel de administración"]').exists()).toBe(true)
    })
  })

  // ── Lifecycle ───────────────────────────────────────────────

  describe('lifecycle', () => {
    it('calls fetchOverview on mount', async () => {
      mockFetchOverview.mockResolvedValue(undefined)
      await mountDashboard()
      expect(mockFetchOverview).toHaveBeenCalledTimes(1)
    })
  })

  // ── Loading skeleton ────────────────────────────────────────

  describe('loading skeleton', () => {
    it('shows the skeleton container when isLoading is true and no overview', async () => {
      mockStatsStore.isLoading = true
      const wrapper = await mountDashboard()
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('renders 8 skeleton cards', async () => {
      mockStatsStore.isLoading = true
      const wrapper = await mountDashboard()
      const skeletonCards = wrapper.findAll('.admin-skeleton')
      expect(skeletonCards).toHaveLength(8)
    })

    it('has aria-label "Cargando estadísticas" on skeleton container', async () => {
      mockStatsStore.isLoading = true
      const wrapper = await mountDashboard()
      expect(wrapper.find('[aria-label="Cargando estadísticas"]').exists()).toBe(true)
    })

    it('does not show KPI cards while loading and no overview', async () => {
      mockStatsStore.isLoading = true
      const wrapper = await mountDashboard()
      expect(wrapper.text()).not.toContain('Usuarios registrados')
    })
  })

  // ── KPI cards (overview loaded) ─────────────────────────────

  describe('KPI cards when overview is loaded', () => {
    beforeEach(() => {
      mockStatsStore.overview = makeOverview({
        users: { total: 42, active: 40, suspended: 1, new_in_period: 5, pro_active: 55, free: 30, conversion_rate_pct: 65 },
        content: { total_pets: 120, total_reminders: 200, total_medical_records: 100, active_adoption_listings: 30, adopted_in_period: 10, blog_posts_published: 15 },
        shelters: { total: 7, active: 7, suspended: 0, verified: 5 },
        clinics: { total: 9, active: 8, suspended: 0, pro: 3 },
        stores: { total: 15, active: 14, suspended: 0, featured: 2 },
        donations_cop: { total_amount: 500000, in_period: 50000, platform_fees_accumulated: 25000, net_to_shelters: 475000, total_count: 70, unique_donors: 30, avg_donation: 7000 },
      })
    })

    it('does not show the loading skeleton when overview is present', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('shows the "Usuarios registrados" KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Usuarios registrados')
    })

    it('shows the "Mascotas registradas" KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Mascotas registradas')
    })

    it('shows the "Refugios activos" KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Refugios activos')
    })

    it('shows the "Clínicas registradas" KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Clínicas registradas')
    })

    it('shows the "Tiendas pet-friendly" KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Tiendas pet-friendly')
    })

    it('shows the "Adopciones procesadas" KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Adopciones procesadas')
    })

    it('shows the "Suscripciones PRO" KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Suscripciones PRO')
    })

    it('shows the "Donaciones realizadas" KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Donaciones realizadas')
    })

    it('shows the revenue section with "Ingresos del periodo" label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Ingresos del periodo')
    })

    it('shows the revenue section with "Ingresos totales" label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Ingresos totales')
    })
  })

  // ── Quick nav links ─────────────────────────────────────────

  describe('quick navigation links', () => {
    beforeEach(() => {
      mockStatsStore.overview = makeOverview()
    })

    it('shows the "Gestión rápida" heading', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Gestión rápida')
    })

    it('renders the "Gestionar Usuarios" nav link', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Gestionar Usuarios')
    })

    it('renders the "Gestionar Refugios" nav link', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Gestionar Refugios')
    })

    it('renders the "Gestionar Tiendas" nav link', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Gestionar Tiendas')
    })

    it('renders the "Gestionar Clínicas" nav link', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Gestionar Clínicas')
    })

    it('renders the "Estadísticas del Sistema" nav link', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Estadísticas del Sistema')
    })
  })

  // ── Empty / error fallback state ────────────────────────────

  describe('empty state when no overview and not loading', () => {
    it('shows "No se pudieron cargar las estadísticas" heading', async () => {
      mockStatsStore.isLoading = false
      mockStatsStore.overview = null
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('No se pudieron cargar las estadísticas')
    })

    it('shows a "Reintentar" button', async () => {
      mockStatsStore.isLoading = false
      mockStatsStore.overview = null
      const wrapper = await mountDashboard()
      expect(wrapper.find('button').text()).toContain('Reintentar')
    })

    it('clicking Reintentar calls fetchOverview again', async () => {
      mockStatsStore.isLoading = false
      mockStatsStore.overview = null
      const wrapper = await mountDashboard()
      await wrapper.find('button').trigger('click')
      // fetchOverview was called once on mount, then once more on click
      expect(mockFetchOverview).toHaveBeenCalledTimes(2)
    })
  })

  // ── Error alert ─────────────────────────────────────────────

  describe('error alert', () => {
    it('shows the alert when error is set', async () => {
      mockError.value = 'Error de conexión'
      const wrapper = await mountDashboard()
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.find('[role="alert"]').text()).toContain('Error de conexión')
    })

    it('hides the alert when error is null', async () => {
      mockStatsStore.overview = makeOverview()
      mockError.value = null
      const wrapper = await mountDashboard()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })
})
