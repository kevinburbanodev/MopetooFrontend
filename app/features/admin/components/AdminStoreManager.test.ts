// ============================================================
// AdminStoreManager.test.ts
// Tests for the AdminStoreManager component (petshop management).
//
// Behaviours tested:
//   - Calls fetchPetshops on mount.
//   - Loading skeleton while isLoading.
//   - Empty state when no petshops.
//   - Petshop rows: name, city, contact info.
//   - Verificado / no-verificado badge.
//   - Destacado / no-destacado badge.
//   - Toggle Verificado calls updatePetshop with toggled boolean.
//   - Toggle Destacado calls updatePetshop with toggled boolean.
//   - 2-step delete: Eliminar → ¿Confirmar? / Cancelar → deletePetshop.
//   - Result count (singular / plural).
//   - Error alert.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
import AdminStoreManager from './AdminStoreManager.vue'
import type { AdminPetshop } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makePetshop(overrides: Partial<AdminPetshop> = {}): AdminPetshop {
  return {
    id: 'shop-1',
    name: 'Tienda Mascota Feliz',
    city: 'Medellín',
    email: 'info@tienda.com',
    is_verified: false,
    is_featured: false,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── useAdmin mock ─────────────────────────────────────────────

const mockFetchPetshops = vi.fn()
const mockUpdatePetshop = vi.fn()
const mockDeletePetshop = vi.fn()
const mockError = ref<string | null>(null)
const mockPetshops = ref<AdminPetshop[]>([])
const mockIsLoading = ref(false)
const mockTotalPetshops = ref(0)

vi.mock('../composables/useAdmin', () => ({
  useAdmin: () => ({
    fetchPetshops: mockFetchPetshops,
    updatePetshop: mockUpdatePetshop,
    deletePetshop: mockDeletePetshop,
    error: mockError,
    adminStore: {
      get petshops() { return mockPetshops.value },
      get isLoading() { return mockIsLoading.value },
      get totalPetshops() { return mockTotalPetshops.value },
    },
  }),
}))

// ── Shared mount helper ───────────────────────────────────────

async function mountManager() {
  return mountSuspended(AdminStoreManager, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            auth: { token: 'admin.jwt', currentUser: { id: 99, is_admin: true } },
          },
        }),
      ],
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────

describe('AdminStoreManager', () => {
  beforeEach(() => {
    mockFetchPetshops.mockReset()
    mockUpdatePetshop.mockReset()
    mockDeletePetshop.mockReset()
    mockError.value = null
    mockPetshops.value = []
    mockIsLoading.value = false
    mockTotalPetshops.value = 0
  })

  // ── Section structure ───────────────────────────────────────

  it('renders a section with aria-label "Gestión de tiendas"', async () => {
    const wrapper = await mountManager()
    expect(wrapper.find('section[aria-label="Gestión de tiendas"]').exists()).toBe(true)
  })

  // ── Lifecycle ───────────────────────────────────────────────

  it('calls fetchPetshops on mount', async () => {
    await mountManager()
    expect(mockFetchPetshops).toHaveBeenCalledTimes(1)
  })

  // ── Loading skeleton ────────────────────────────────────────

  describe('loading skeleton', () => {
    it('renders skeleton rows while isLoading is true', async () => {
      mockIsLoading.value = true
      const wrapper = await mountManager()
      const skeletonRows = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonRows.length).toBeGreaterThanOrEqual(5)
    })

    it('does not show petshop data while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountManager()
      expect(wrapper.text()).not.toContain('info@tienda.com')
    })
  })

  // ── Empty state ─────────────────────────────────────────────

  it('shows empty state message when no petshops exist', async () => {
    const wrapper = await mountManager()
    expect(wrapper.text()).toContain('No se encontraron tiendas con los filtros actuales.')
  })

  // ── Petshop rows ────────────────────────────────────────────

  describe('petshop rows', () => {
    beforeEach(() => {
      mockPetshops.value = [
        makePetshop({ id: 'shop-1', name: 'Tienda Norte', city: 'Bogotá', is_verified: true, is_featured: false }),
      ]
      mockTotalPetshops.value = 1
    })

    it('renders petshop name', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('Tienda Norte')
    })

    it('renders petshop city', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('Bogotá')
    })

    it('shows Verificado badge for verified petshops', async () => {
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Tienda verificada"]').exists()).toBe(true)
    })

    it('shows "No" for unverified petshops', async () => {
      mockPetshops.value = [makePetshop({ id: 'shop-2', is_verified: false })]
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Tienda no verificada"]').exists()).toBe(true)
    })

    it('shows Destacado badge for featured petshops', async () => {
      mockPetshops.value = [makePetshop({ id: 'shop-3', is_featured: true })]
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Tienda destacada"]').exists()).toBe(true)
    })

    it('shows petshop email in contact column', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('info@tienda.com')
    })
  })

  // ── Toggle Verificado ───────────────────────────────────────

  describe('toggle Verificado', () => {
    it('calls updatePetshop with { is_verified: true } when "Verificar" is clicked', async () => {
      mockUpdatePetshop.mockResolvedValue(true)
      mockPetshops.value = [makePetshop({ id: 'shop-1', is_verified: false })]
      mockTotalPetshops.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Verificar')
      await btn!.trigger('click')
      expect(mockUpdatePetshop).toHaveBeenCalledWith('shop-1', { is_verified: true })
    })

    it('calls updatePetshop with { is_verified: false } when "Desverificar" is clicked', async () => {
      mockUpdatePetshop.mockResolvedValue(true)
      mockPetshops.value = [makePetshop({ id: 'shop-1', is_verified: true })]
      mockTotalPetshops.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Desverificar')
      await btn!.trigger('click')
      expect(mockUpdatePetshop).toHaveBeenCalledWith('shop-1', { is_verified: false })
    })
  })

  // ── Toggle Destacado ────────────────────────────────────────

  describe('toggle Destacado', () => {
    it('calls updatePetshop with { is_featured: true } when "Destacar" is clicked', async () => {
      mockUpdatePetshop.mockResolvedValue(true)
      mockPetshops.value = [makePetshop({ id: 'shop-1', is_featured: false })]
      mockTotalPetshops.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Destacar')
      await btn!.trigger('click')
      expect(mockUpdatePetshop).toHaveBeenCalledWith('shop-1', { is_featured: true })
    })

    it('calls updatePetshop with { is_featured: false } when "Quitar dest." is clicked', async () => {
      mockUpdatePetshop.mockResolvedValue(true)
      mockPetshops.value = [makePetshop({ id: 'shop-1', is_featured: true })]
      mockTotalPetshops.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Quitar dest.')
      await btn!.trigger('click')
      expect(mockUpdatePetshop).toHaveBeenCalledWith('shop-1', { is_featured: false })
    })
  })

  // ── 2-step delete ───────────────────────────────────────────

  describe('2-step delete confirmation', () => {
    beforeEach(() => {
      mockPetshops.value = [makePetshop({ id: 'shop-1', name: 'Tienda A' })]
      mockTotalPetshops.value = 1
    })

    it('shows Eliminar button initially', async () => {
      const wrapper = await mountManager()
      expect(wrapper.findAll('button').some(b => b.text() === 'Eliminar')).toBe(true)
    })

    it('shows ¿Confirmar? after clicking Eliminar', async () => {
      const wrapper = await mountManager()
      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Eliminar')
      await deleteBtn!.trigger('click')
      expect(wrapper.text()).toContain('¿Confirmar?')
    })

    it('does not call deletePetshop on first click', async () => {
      const wrapper = await mountManager()
      await wrapper.findAll('button').find(b => b.text() === 'Eliminar')!.trigger('click')
      expect(mockDeletePetshop).not.toHaveBeenCalled()
    })

    it('calls deletePetshop with petshopId when ¿Confirmar? is clicked', async () => {
      mockDeletePetshop.mockResolvedValue(true)
      const wrapper = await mountManager()
      await wrapper.findAll('button').find(b => b.text() === 'Eliminar')!.trigger('click')
      await wrapper.findAll('button').find(b => b.text() === '¿Confirmar?')!.trigger('click')
      expect(mockDeletePetshop).toHaveBeenCalledWith('shop-1')
    })

    it('hides ¿Confirmar? after clicking Cancelar', async () => {
      const wrapper = await mountManager()
      await wrapper.findAll('button').find(b => b.text() === 'Eliminar')!.trigger('click')
      await wrapper.findAll('button').find(b => b.text() === 'Cancelar')!.trigger('click')
      expect(wrapper.text()).not.toContain('¿Confirmar?')
    })

    it('does not call deletePetshop when Cancelar is clicked', async () => {
      const wrapper = await mountManager()
      await wrapper.findAll('button').find(b => b.text() === 'Eliminar')!.trigger('click')
      await wrapper.findAll('button').find(b => b.text() === 'Cancelar')!.trigger('click')
      expect(mockDeletePetshop).not.toHaveBeenCalled()
    })
  })

  // ── Result count ────────────────────────────────────────────

  describe('result count', () => {
    it('shows "0 tiendas" when totalPetshops is 0', async () => {
      mockTotalPetshops.value = 0
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('0 tiendas')
    })

    it('shows "1 tienda" (singular) when totalPetshops is 1', async () => {
      mockTotalPetshops.value = 1
      mockPetshops.value = [makePetshop()]
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('1 tienda')
      expect(wrapper.find('[role="status"]').text()).not.toContain('1 tiendas')
    })

    it('shows "5 tiendas" (plural)', async () => {
      mockTotalPetshops.value = 5
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('5 tiendas')
    })
  })

  // ── Error alert ─────────────────────────────────────────────

  describe('error alert', () => {
    it('shows the error alert when error is set', async () => {
      mockError.value = 'Error de carga'
      const wrapper = await mountManager()
      expect(wrapper.find('[role="alert"]').text()).toContain('Error de carga')
    })

    it('hides the error alert when error is null', async () => {
      const wrapper = await mountManager()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Pagination footer ───────────────────────────────────────

  it('does not show pagination footer when totalPetshops <= 20', async () => {
    mockTotalPetshops.value = 5
    const wrapper = await mountManager()
    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })
})
