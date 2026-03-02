// ============================================================
// AdminStoreManager.test.ts
// Tests for the AdminStoreManager component (petshop management).
//
// Behaviours tested:
//   - Calls fetchPetshops on mount.
//   - Loading skeleton while isLoading.
//   - Empty state when no petshops.
//   - Petshop rows: name, city, contact info.
//   - Plan column: shows Free / Featured badge.
//   - Active / inactive status badge.
//   - Plan select dropdown calls setStorePlan.
//   - Activate / deactivate calls activateStore / deactivateStore.
//   - Result count (singular / plural).
//   - Error alert.
//   - No delete, verify, or featured toggle buttons.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref, reactive } from 'vue'
import AdminStoreManager from './AdminStoreManager.vue'
import type { AdminPetshop } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makePetshop(overrides: Partial<AdminPetshop> = {}): AdminPetshop {
  return {
    id: 1,
    name: 'Tienda Mascota Feliz',
    city: 'Medellín',
    email: 'info@tienda.com',
    is_active: true,
    plan: 'free',
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── useAdmin mock ─────────────────────────────────────────────

const mockFetchPetshops = vi.fn()
const mockActivateStore = vi.fn()
const mockDeactivateStore = vi.fn()
const mockSetStorePlan = vi.fn()
const mockError = ref<string | null>(null)
const mockAdminStore = reactive({
  petshops: [] as AdminPetshop[],
  isLoading: false,
  totalPetshops: 0,
})

vi.mock('../composables/useAdmin', () => ({
  useAdmin: () => ({
    fetchPetshops: mockFetchPetshops,
    activateStore: mockActivateStore,
    deactivateStore: mockDeactivateStore,
    setStorePlan: mockSetStorePlan,
    error: mockError,
    adminStore: mockAdminStore,
  }),
}))

// ── Shared mount helper ───────────────────────────────────────

async function mountManager() {
  return mountSuspended(AdminStoreManager, {
    global: {
      plugins: [
        createTestingPinia({
          initialState: {
            auth: { token: 'admin.jwt', currentEntity: { id: 99, is_admin: true }, entityType: 'user' },
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
    mockActivateStore.mockReset()
    mockDeactivateStore.mockReset()
    mockSetStorePlan.mockReset()
    mockError.value = null
    mockAdminStore.petshops = []
    mockAdminStore.isLoading = false
    mockAdminStore.totalPetshops = 0
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
      mockAdminStore.isLoading = true
      const wrapper = await mountManager()
      const skeletonRows = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonRows.length).toBeGreaterThanOrEqual(5)
    })

    it('does not show petshop data while loading', async () => {
      mockAdminStore.isLoading = true
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
      mockAdminStore.petshops = [
        makePetshop({ id: 1, name: 'Tienda Norte', city: 'Bogotá', plan: 'free', is_active: true }),
      ]
      mockAdminStore.totalPetshops = 1
    })

    it('renders petshop name', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('Tienda Norte')
    })

    it('renders petshop city', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('Bogotá')
    })

    it('shows petshop email in contact column', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('info@tienda.com')
    })
  })

  // ── Plan column ─────────────────────────────────────────────

  describe('plan column', () => {
    it('shows "Free" badge for stores with plan=free', async () => {
      mockAdminStore.petshops = [makePetshop({ id: 1, plan: 'free' })]
      mockAdminStore.totalPetshops = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Plan: Free"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Plan: Free"]').text()).toBe('Free')
    })

    it('shows "Featured" badge for stores with plan=featured', async () => {
      mockAdminStore.petshops = [makePetshop({ id: 1, plan: 'featured' })]
      mockAdminStore.totalPetshops = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Plan: Featured"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Plan: Featured"]').text()).toBe('Featured')
    })
  })

  // ── Active status badge ─────────────────────────────────────

  describe('active status badge', () => {
    it('shows Activo badge for active stores', async () => {
      mockAdminStore.petshops = [makePetshop({ id: 1, is_active: true })]
      mockAdminStore.totalPetshops = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Tienda activa"]').exists()).toBe(true)
    })

    it('shows Inactivo badge for inactive stores', async () => {
      mockAdminStore.petshops = [makePetshop({ id: 1, is_active: false })]
      mockAdminStore.totalPetshops = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Tienda inactiva"]').exists()).toBe(true)
    })
  })

  // ── Plan select dropdown ────────────────────────────────────

  describe('plan select dropdown', () => {
    it('renders a plan select dropdown for each store', async () => {
      mockAdminStore.petshops = [makePetshop({ id: 1, name: 'Tienda A' })]
      mockAdminStore.totalPetshops = 1
      const wrapper = await mountManager()
      const select = wrapper.find('select[aria-label="Cambiar plan de Tienda A"]')
      expect(select.exists()).toBe(true)
    })

    it('calls setStorePlan when plan is changed', async () => {
      mockSetStorePlan.mockResolvedValue(true)
      mockAdminStore.petshops = [makePetshop({ id: 7, name: 'Tienda B', plan: 'free' })]
      mockAdminStore.totalPetshops = 1
      const wrapper = await mountManager()
      const select = wrapper.find('select[aria-label="Cambiar plan de Tienda B"]')
      await select.setValue('featured')
      expect(mockSetStorePlan).toHaveBeenCalledWith(7, 'featured')
    })
  })

  // ── Activate / Deactivate ───────────────────────────────────

  describe('activate / deactivate', () => {
    it('shows "Desactivar" button for active stores', async () => {
      mockAdminStore.petshops = [makePetshop({ id: 1, is_active: true })]
      mockAdminStore.totalPetshops = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Desactivar'))
      expect(btn).toBeDefined()
    })

    it('calls deactivateStore when "Desactivar" is clicked', async () => {
      mockDeactivateStore.mockResolvedValue(true)
      mockAdminStore.petshops = [makePetshop({ id: 3, is_active: true })]
      mockAdminStore.totalPetshops = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Desactivar'))
      await btn!.trigger('click')
      expect(mockDeactivateStore).toHaveBeenCalledWith(3)
    })

    it('shows "Activar" button for inactive stores', async () => {
      mockAdminStore.petshops = [makePetshop({ id: 1, is_active: false })]
      mockAdminStore.totalPetshops = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Activar'))
      expect(btn).toBeDefined()
    })

    it('calls activateStore when "Activar" is clicked', async () => {
      mockActivateStore.mockResolvedValue(true)
      mockAdminStore.petshops = [makePetshop({ id: 4, is_active: false })]
      mockAdminStore.totalPetshops = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Activar'))
      await btn!.trigger('click')
      expect(mockActivateStore).toHaveBeenCalledWith(4)
    })
  })

  // ── No delete, verify, or featured toggle ───────────────────

  describe('no delete, verify, or featured toggle', () => {
    beforeEach(() => {
      mockAdminStore.petshops = [makePetshop()]
      mockAdminStore.totalPetshops = 1
    })

    it('does not render any "Eliminar" button', async () => {
      const wrapper = await mountManager()
      expect(wrapper.findAll('button').some(b => b.text() === 'Eliminar')).toBe(false)
    })

    it('does not render any "Verificar" button', async () => {
      const wrapper = await mountManager()
      expect(wrapper.findAll('button').some(b => b.text() === 'Verificar')).toBe(false)
    })

    it('does not render any "Destacar" button', async () => {
      const wrapper = await mountManager()
      expect(wrapper.findAll('button').some(b => b.text() === 'Destacar')).toBe(false)
    })
  })

  // ── Result count ────────────────────────────────────────────

  describe('result count', () => {
    it('shows "0 tiendas" when totalPetshops is 0', async () => {
      mockAdminStore.totalPetshops = 0
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('0 tiendas')
    })

    it('shows "1 tienda" (singular) when totalPetshops is 1', async () => {
      mockAdminStore.totalPetshops = 1
      mockAdminStore.petshops = [makePetshop()]
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('1 tienda')
      expect(wrapper.find('[role="status"]').text()).not.toContain('1 tiendas')
    })

    it('shows "5 tiendas" (plural)', async () => {
      mockAdminStore.totalPetshops = 5
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
    mockAdminStore.totalPetshops = 5
    const wrapper = await mountManager()
    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })
})
