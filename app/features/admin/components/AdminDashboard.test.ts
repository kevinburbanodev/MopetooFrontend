// ============================================================
// AdminDashboard.test.ts
// Tests for the AdminDashboard component.
//
// Strategy:
//   - useAdmin is mocked at module level with reactive refs so
//     component state is fully controlled without real HTTP calls.
//   - createTestingPinia provides auth state with an admin token.
//   - Tests verify: loading skeleton (8 cards), KPI card rendering,
//     revenue cards, quick nav links, empty/error states.
//
// What this suite does NOT cover intentionally:
//   - CSS animation or SCSS skeleton shimmer styles.
//   - Actual API calls (useAdmin is fully mocked).
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref, nextTick } from 'vue'
import AdminDashboard from './AdminDashboard.vue'
import type { AdminStats } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeStats(overrides: Partial<AdminStats> = {}): AdminStats {
  return {
    total_users: 100,
    total_pets: 250,
    total_shelters: 15,
    total_clinics: 20,
    total_stores: 30,
    total_adoptions: 45,
    total_pro_subscriptions: 60,
    total_donations: 80,
    revenue_total: 5000000,
    revenue_month: 300000,
    ...overrides,
  }
}

// ── useAdmin mock ─────────────────────────────────────────────

const mockFetchStats = vi.fn()
const mockError = ref<string | null>(null)
const mockStats = ref<AdminStats | null>(null)
const mockIsLoading = ref(false)

vi.mock('../composables/useAdmin', () => ({
  useAdmin: () => ({
    fetchStats: mockFetchStats,
    error: mockError,
    adminStore: {
      get stats() { return mockStats.value },
      get isLoading() { return mockIsLoading.value },
      get hasStats() { return mockStats.value !== null },
    },
  }),
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
    mockFetchStats.mockReset()
    mockError.value = null
    mockStats.value = null
    mockIsLoading.value = false
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
    it('calls fetchStats on mount', async () => {
      mockFetchStats.mockResolvedValue(undefined)
      await mountDashboard()
      expect(mockFetchStats).toHaveBeenCalledTimes(1)
    })
  })

  // ── Loading skeleton ────────────────────────────────────────

  describe('loading skeleton', () => {
    it('shows the skeleton container when isLoading is true and no stats', async () => {
      mockIsLoading.value = true
      const wrapper = await mountDashboard()
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('renders 8 skeleton cards', async () => {
      mockIsLoading.value = true
      const wrapper = await mountDashboard()
      const skeletonCards = wrapper.findAll('.admin-skeleton')
      expect(skeletonCards).toHaveLength(8)
    })

    it('has aria-label "Cargando estadísticas" on skeleton container', async () => {
      mockIsLoading.value = true
      const wrapper = await mountDashboard()
      expect(wrapper.find('[aria-label="Cargando estadísticas"]').exists()).toBe(true)
    })

    it('does not show KPI cards while loading and no stats', async () => {
      mockIsLoading.value = true
      const wrapper = await mountDashboard()
      expect(wrapper.text()).not.toContain('Usuarios')
    })
  })

  // ── KPI cards (stats loaded) ────────────────────────────────

  describe('KPI cards when stats are loaded', () => {
    beforeEach(() => {
      mockStats.value = makeStats({
        total_users: 42,
        total_pets: 120,
        total_shelters: 7,
        total_clinics: 9,
        total_stores: 15,
        total_adoptions: 30,
        total_pro_subscriptions: 55,
        total_donations: 70,
      })
    })

    it('does not show the loading skeleton when stats are present', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('shows the Usuarios KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Usuarios')
    })

    it('shows the Mascotas KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Mascotas')
    })

    it('shows the Refugios KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Refugios')
    })

    it('shows the Clínicas KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Clínicas')
    })

    it('shows the Tiendas KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Tiendas')
    })

    it('shows the Adopciones KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Adopciones')
    })

    it('shows the Suscripciones PRO KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Suscripciones PRO')
    })

    it('shows the Donaciones KPI label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Donaciones')
    })

    it('shows the revenue section with "Ingresos del mes" label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Ingresos del mes')
    })

    it('shows the revenue section with "Ingresos totales" label', async () => {
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('Ingresos totales')
    })
  })

  // ── Quick nav links ─────────────────────────────────────────

  describe('quick navigation links', () => {
    beforeEach(() => {
      mockStats.value = makeStats()
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
  })

  // ── Empty / error fallback state ────────────────────────────

  describe('empty state when no stats and not loading', () => {
    it('shows "No se pudieron cargar las estadísticas" heading', async () => {
      mockIsLoading.value = false
      mockStats.value = null
      const wrapper = await mountDashboard()
      expect(wrapper.text()).toContain('No se pudieron cargar las estadísticas')
    })

    it('shows a "Reintentar" button', async () => {
      mockIsLoading.value = false
      mockStats.value = null
      const wrapper = await mountDashboard()
      expect(wrapper.find('button').text()).toContain('Reintentar')
    })

    it('clicking Reintentar calls fetchStats again', async () => {
      mockIsLoading.value = false
      mockStats.value = null
      const wrapper = await mountDashboard()
      await wrapper.find('button').trigger('click')
      // fetchStats was called once on mount, then once more on click
      expect(mockFetchStats).toHaveBeenCalledTimes(2)
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
      mockStats.value = makeStats()
      mockError.value = null
      const wrapper = await mountDashboard()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })
})
