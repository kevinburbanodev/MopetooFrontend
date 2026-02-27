// ============================================================
// StatsOverview.test.ts
// Tests for the StatsOverview component.
//
// Strategy:
//   - useStats is mocked at module level with reactive refs so
//     component state is fully controlled without real HTTP calls.
//   - Tests verify: loading skeleton (8+2), KPI card labels, revenue
//     labels, error alert, empty state, and retry behaviour.
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
    total_users: 100,
    total_pets: 250,
    total_shelters: 15,
    total_clinics: 20,
    total_stores: 30,
    total_adoptions: 45,
    total_pro_subscriptions: 60,
    total_donations: 80,
    revenue_total: 5_000_000,
    revenue_month: 300_000,
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
            auth: { token: 'admin.jwt', currentUser: { id: 1, is_admin: true } },
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

    it('shows "Ingresos del mes" revenue label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Ingresos del mes')
    })

    it('shows "Ingresos totales" revenue label', async () => {
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('Ingresos totales')
    })

    it('renders the correct user count', async () => {
      mockOverview.value = makeOverview({ total_users: 42 })
      const wrapper = await mountOverview()
      expect(wrapper.text()).toContain('42')
    })

    it('renders the correct pet count', async () => {
      mockOverview.value = makeOverview({ total_pets: 999 })
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
