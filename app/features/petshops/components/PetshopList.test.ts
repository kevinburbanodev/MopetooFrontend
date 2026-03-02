// ============================================================
// PetshopList.test.ts
// Tests for the PetshopList component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// calls usePetshops() which internally calls useApi() and usePetshopsStore().
// We mock usePetshops at the composable boundary so we can control the
// store state and stub fetchPetshops without making HTTP calls.
//
// Mocking:
//   - usePetshops: vi.mock('../composables/usePetshops', ...) — project
//     composable, NOT mockNuxtImport.
//   - The mock exposes a petshopsStore stub with reactive state we control
//     via module-level refs (same pattern as ShelterList.test.ts).
//   - PetshopCard is stubbed with a custom template so findAll('.petshop-card-stub')
//     gives a reliable count.
//
// Key behaviours tested:
//   - Loading skeleton rendered while isLoading is true.
//   - Empty state (no petshops, no filters) shows "No hay tiendas disponibles".
//   - Results grid renders PetshopCard per petshop.
//   - Client-side search filter: name, city, description.
//   - City filter.
//   - Premium section visible/hidden logic (plan-based).
//   - Filtered no-results state.
//   - fetchPetshops called on mount.
//   - Result counter.
//   - Re-fetch on category/city filter change.
//
// What this suite does NOT cover intentionally:
//   - CSS transitions / SCSS visual styles.
//   - Actual HTTP calls (usePetshops is fully mocked).
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import PetshopList from './PetshopList.vue'
import type { Petshop } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makePetshop(overrides: Partial<Petshop> = {}): Petshop {
  return {
    id: 1,
    name: 'Mascotas Felices',
    email: 'info@mascotasfelices.com',
    description: 'Una tienda completa para mascotas',
    logo_url: 'https://example.com/tienda.jpg',
    country: 'Colombia',
    city: 'Bogotá',
    phone_country_code: '+57',
    phone: '300 123 4567',
    verified: true,
    is_active: true,
    plan: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const shopA = makePetshop({ id: 1, name: 'Mascotas Felices', city: 'Bogotá', plan: '' })
const shopB = makePetshop({ id: 2, name: 'PetWorld', city: 'Medellín', plan: 'premium', description: 'Tienda de accesorios premium' })
const shopC = makePetshop({ id: 3, name: 'Mundo Animal', city: 'Cali', plan: 'basic' })

// ── usePetshops mock ──────────────────────────────────────────
// Module-level reactive refs control the mock state per test.
// The component reads these via the composable return value.

const mockFetchPetshops = vi.fn()
const mockError = ref<string | null>(null)
const mockPetshops = ref<Petshop[]>([])
const mockIsLoading = ref(false)

vi.mock('../composables/usePetshops', () => ({
  usePetshops: () => ({
    fetchPetshops: mockFetchPetshops,
    error: mockError,
    petshopsStore: {
      // Expose reactive state that the component reads directly
      get petshops() { return mockPetshops.value },
      get isLoading() { return mockIsLoading.value },
      // getPremiumPetshops — replicate the plan-based getter
      get getPremiumPetshops() {
        return mockPetshops.value.filter(p => p.plan !== '')
      },
    },
  }),
}))

// Custom stub so findAll('.petshop-card-stub') gives a reliable count.
const PetshopCardStub = { template: '<div class="petshop-card-stub" />' }

// ── Suite ─────────────────────────────────────────────────────

describe('PetshopList', () => {
  beforeEach(() => {
    mockFetchPetshops.mockReset()
    mockFetchPetshops.mockResolvedValue(undefined)
    mockError.value = null
    mockPetshops.value = []
    mockIsLoading.value = false
  })

  // ── onMounted ──────────────────────────────────────────────

  describe('lifecycle', () => {
    it('calls fetchPetshops on mount', async () => {
      await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(mockFetchPetshops).toHaveBeenCalledTimes(1)
    })

    it('calls fetchPetshops with no arguments (no initial filters)', async () => {
      await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(mockFetchPetshops).toHaveBeenCalledWith()
    })
  })

  // ── Loading skeleton ───────────────────────────────────────

  describe('loading state', () => {
    it('renders the loading skeleton while isLoading is true', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('sets aria-label "Cargando tiendas" on the skeleton container', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.find('[aria-label="Cargando tiendas"]').exists()).toBe(true)
    })

    it('renders 6 skeleton cards while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      const skeletonCards = wrapper.findAll('.petshop-skeleton')
      expect(skeletonCards).toHaveLength(6)
    })

    it('does not render PetshopCard while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.findAll('.petshop-card-stub')).toHaveLength(0)
    })

    it('does not render the empty state while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.text()).not.toContain('No hay tiendas disponibles')
    })
  })

  // ── Empty state ────────────────────────────────────────────

  describe('empty state (no petshops, no filters)', () => {
    it('shows "No hay tiendas disponibles" when petshops is empty and not loading', async () => {
      mockPetshops.value = []
      mockIsLoading.value = false
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.text()).toContain('No hay tiendas disponibles')
    })

    it('does not render the loading skeleton in empty state', async () => {
      mockPetshops.value = []
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('does not render any PetshopCard in empty state', async () => {
      mockPetshops.value = []
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.findAll('.petshop-card-stub')).toHaveLength(0)
    })
  })

  // ── Results grid ───────────────────────────────────────────

  describe('results grid', () => {
    it('renders PetshopCards when petshops are loaded (non-premium in main grid)', async () => {
      mockPetshops.value = [shopA] // non-premium
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.findAll('.petshop-card-stub').length).toBeGreaterThanOrEqual(1)
    })

    it('does not show empty state when petshops are loaded', async () => {
      mockPetshops.value = [shopA]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.text()).not.toContain('No hay tiendas disponibles')
    })

    it('shows the plural result counter "tiendas" for multiple results', async () => {
      mockPetshops.value = [shopA, shopB, shopC]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.find('[role="status"]').text()).toContain('tiendas')
    })

    it('shows the singular result counter "tienda" for exactly one result', async () => {
      mockPetshops.value = [shopA]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.find('[role="status"]').text()).toContain('tienda')
    })

    it('the result counter shows the correct count', async () => {
      mockPetshops.value = [shopA, shopB, shopC]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.find('[role="status"]').text()).toContain('3')
    })
  })

  // ── Premium section ────────────────────────────────────────

  describe('"Tiendas Destacadas" section', () => {
    it('shows the premium section when there are petshops with plan and no filters are active', async () => {
      mockPetshops.value = [shopA, shopB] // shopB has plan
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.find('[aria-label="Tiendas destacadas"]').exists()).toBe(true)
    })

    it('shows the "Tiendas Destacadas" heading', async () => {
      mockPetshops.value = [shopA, shopB] // shopB has plan
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.text()).toContain('Tiendas Destacadas')
    })

    it('hides the premium section when no petshops have a plan', async () => {
      mockPetshops.value = [shopA] // shopA has plan === ''
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.find('[aria-label="Tiendas destacadas"]').exists()).toBe(false)
    })

    it('hides the premium section when a search filter is active', async () => {
      mockPetshops.value = [shopA, shopB, shopC]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-search').setValue('mascotas')
      expect(wrapper.find('[aria-label="Tiendas destacadas"]').exists()).toBe(false)
    })

    it('hides the premium section when a category filter is active', async () => {
      mockPetshops.value = [shopA, shopB, shopC]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-category').setValue('alimento')
      expect(wrapper.find('[aria-label="Tiendas destacadas"]').exists()).toBe(false)
    })

    it('hides the premium section when a city filter is active', async () => {
      mockPetshops.value = [shopA, shopB, shopC]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-city').setValue('Bogotá')
      expect(wrapper.find('[aria-label="Tiendas destacadas"]').exists()).toBe(false)
    })
  })

  // ── Search filter ──────────────────────────────────────────

  describe('search filter', () => {
    it('filters petshops by name (case-insensitive)', async () => {
      mockPetshops.value = [shopA, shopB, shopC]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-search').setValue('petworld')
      expect(wrapper.find('[role="status"]').text()).toContain('1')
    })

    it('filters petshops by city (case-insensitive)', async () => {
      mockPetshops.value = [shopA, shopB, shopC]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-search').setValue('cali')
      expect(wrapper.find('[role="status"]').text()).toContain('1')
    })

    it('filters petshops by description (case-insensitive)', async () => {
      mockPetshops.value = [shopA, shopB, shopC]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-search').setValue('accesorios premium')
      expect(wrapper.find('[role="status"]').text()).toContain('1')
    })

    it('shows "Limpiar filtros" button when search is active', async () => {
      mockPetshops.value = [shopA, shopB]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-search').setValue('something')
      const buttons = wrapper.findAll('button')
      const limpiarBtn = buttons.find(b => b.text().includes('Limpiar filtros'))
      expect(limpiarBtn).toBeDefined()
    })

    it('hides "Limpiar filtros" button when no filters are active', async () => {
      mockPetshops.value = [shopA, shopB]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      const buttons = wrapper.findAll('button')
      const limpiarBtn = buttons.find(b => b.text().includes('Limpiar filtros'))
      expect(limpiarBtn).toBeUndefined()
    })
  })

  // ── City filter ────────────────────────────────────────────

  describe('city filter', () => {
    it('re-fetches when city select changes', async () => {
      mockPetshops.value = [shopA, shopB, shopC]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      mockFetchPetshops.mockClear()
      await wrapper.find('#petshop-city').setValue('Medellín')
      expect(mockFetchPetshops).toHaveBeenCalled()
    })
  })

  // ── Category filter ────────────────────────────────────────

  describe('category filter', () => {
    it('re-fetches when category select changes', async () => {
      mockPetshops.value = [shopA, shopB, shopC]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      mockFetchPetshops.mockClear()
      await wrapper.find('#petshop-category').setValue('alimento')
      expect(mockFetchPetshops).toHaveBeenCalled()
    })

    it('uses static product categories (not derived from data)', async () => {
      mockPetshops.value = [shopA]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      const options = wrapper.find('#petshop-category').findAll('option')
      // "Todas las categorías" + 6 PRODUCT_CATEGORIES
      expect(options.length).toBe(7)
    })

    it('clears category filter when "Limpiar filtros" is clicked', async () => {
      mockPetshops.value = [shopA, shopB, shopC]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-category').setValue('alimento')
      const clearBtn = wrapper.findAll('button').find(b => b.text().includes('Limpiar filtros'))!
      await clearBtn.trigger('click')
      // All 3 petshops should be visible again
      expect(wrapper.find('[role="status"]').text()).toContain('3')
    })
  })

  // ── Filtered no-results state ──────────────────────────────

  describe('filtered no-results state', () => {
    it('shows "Sin resultados" when filters are active but no petshops match', async () => {
      mockPetshops.value = [shopA, shopB]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-search').setValue('nonexistent xyz store')
      expect(wrapper.text()).toContain('Sin resultados')
    })

    it('shows a "Limpiar filtros" button inside the no-results state', async () => {
      mockPetshops.value = [shopA, shopB]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-search').setValue('nonexistent xyz store')
      expect(wrapper.text()).toContain('Limpiar filtros')
    })

    it('clears filters when the no-results "Limpiar filtros" button is clicked', async () => {
      mockPetshops.value = [shopA, shopB]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-search').setValue('nonexistent xyz store')
      expect(wrapper.text()).toContain('Sin resultados')
      const clearBtn = wrapper.find('button.btn-outline-primary')
      expect(clearBtn.exists()).toBe(true)
      await clearBtn.trigger('click')
      expect(wrapper.text()).not.toContain('Sin resultados')
    })

    it('does not render any PetshopCard when filtered results are empty', async () => {
      mockPetshops.value = [shopA, shopB]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      await wrapper.find('#petshop-search').setValue('nonexistent xyz store')
      expect(wrapper.findAll('.petshop-card-stub')).toHaveLength(0)
    })
  })

  // ── Error alert ────────────────────────────────────────────

  describe('error alert', () => {
    it('shows the error alert when error is set', async () => {
      mockError.value = 'Error de conexión'
      mockPetshops.value = []
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Error de conexión')
    })

    it('does not show the error alert when error is null', async () => {
      mockError.value = null
      mockPetshops.value = [shopA]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Accessibility ──────────────────────────────────────────

  describe('accessibility', () => {
    it('has aria-label "Directorio de tiendas pet-friendly" on the section', async () => {
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      expect(wrapper.find('[aria-label="Directorio de tiendas pet-friendly"]').exists()).toBe(true)
    })

    it('result counter has role="status" and aria-live="polite"', async () => {
      mockPetshops.value = [shopA]
      const wrapper = await mountSuspended(PetshopList, {
        global: { stubs: { NuxtLink: true, PetshopCard: PetshopCardStub } },
      })
      const counter = wrapper.find('[role="status"]')
      expect(counter.exists()).toBe(true)
      expect(counter.attributes('aria-live')).toBe('polite')
    })
  })
})
