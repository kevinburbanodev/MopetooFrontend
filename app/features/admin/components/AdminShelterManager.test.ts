// ============================================================
// AdminShelterManager.test.ts
// Tests for the AdminShelterManager component.
//
// Behaviours tested:
//   - Calls fetchShelters on mount.
//   - Loading skeleton (5 rows) while isLoading is true.
//   - Empty state shown when no shelters.
//   - Shelter rows with name, city, contact info.
//   - Verified / unverified badge rendering.
//   - Active / inactive status badge.
//   - Verify button only appears when !is_verified.
//   - verifyShelter called when "Verificar" is clicked.
//   - activateShelter / deactivateShelter called on toggle.
//   - Result count (singular / plural).
//   - Error alert shown / hidden.
//   - No delete or featured functionality.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref, reactive } from 'vue'
import AdminShelterManager from './AdminShelterManager.vue'
import type { AdminShelter } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeShelter(overrides: Partial<AdminShelter> = {}): AdminShelter {
  return {
    id: 1,
    name: 'Refugio Los Amigos',
    city: 'Bogotá',
    email: 'info@refugio.com',
    is_verified: false,
    is_active: true,
    pets_count: 8,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── useAdmin mock ─────────────────────────────────────────────

const mockFetchShelters = vi.fn()
const mockVerifyShelter = vi.fn()
const mockActivateShelter = vi.fn()
const mockDeactivateShelter = vi.fn()
const mockError = ref<string | null>(null)
const mockAdminStore = reactive({
  shelters: [] as AdminShelter[],
  isLoading: false,
  totalShelters: 0,
})

vi.mock('../composables/useAdmin', () => ({
  useAdmin: () => ({
    fetchShelters: mockFetchShelters,
    verifyShelter: mockVerifyShelter,
    activateShelter: mockActivateShelter,
    deactivateShelter: mockDeactivateShelter,
    error: mockError,
    adminStore: mockAdminStore,
  }),
}))

// ── Shared mount helper ───────────────────────────────────────

async function mountManager() {
  return mountSuspended(AdminShelterManager, {
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

describe('AdminShelterManager', () => {
  beforeEach(() => {
    mockFetchShelters.mockReset()
    mockVerifyShelter.mockReset()
    mockActivateShelter.mockReset()
    mockDeactivateShelter.mockReset()
    mockError.value = null
    mockAdminStore.shelters = []
    mockAdminStore.isLoading = false
    mockAdminStore.totalShelters = 0
  })

  // ── Section structure ───────────────────────────────────────

  it('renders a section with aria-label "Gestión de refugios"', async () => {
    const wrapper = await mountManager()
    expect(wrapper.find('section[aria-label="Gestión de refugios"]').exists()).toBe(true)
  })

  // ── Lifecycle ───────────────────────────────────────────────

  it('calls fetchShelters on mount', async () => {
    await mountManager()
    expect(mockFetchShelters).toHaveBeenCalledTimes(1)
  })

  // ── Loading skeleton ────────────────────────────────────────

  describe('loading skeleton', () => {
    it('renders skeleton rows while isLoading is true', async () => {
      mockAdminStore.isLoading = true
      const wrapper = await mountManager()
      const skeletonRows = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonRows.length).toBeGreaterThanOrEqual(5)
    })

    it('does not show data rows while loading', async () => {
      mockAdminStore.isLoading = true
      const wrapper = await mountManager()
      expect(wrapper.text()).not.toContain('info@refugio.com')
    })
  })

  // ── Empty state ─────────────────────────────────────────────

  it('shows empty state message when no shelters exist', async () => {
    const wrapper = await mountManager()
    expect(wrapper.text()).toContain('No se encontraron refugios con los filtros actuales.')
  })

  // ── Shelter rows ────────────────────────────────────────────

  describe('shelter rows', () => {
    beforeEach(() => {
      mockAdminStore.shelters = [
        makeShelter({ id: 1, name: 'Refugio Norte', city: 'Medellín', is_verified: true, is_active: true }),
      ]
      mockAdminStore.totalShelters = 1
    })

    it('renders shelter name', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('Refugio Norte')
    })

    it('renders shelter city', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('Medellín')
    })

    it('shows Verificado badge for verified shelters', async () => {
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Refugio verificado"]').exists()).toBe(true)
    })

    it('shows "No" for unverified shelters', async () => {
      mockAdminStore.shelters = [makeShelter({ id: 2, is_verified: false })]
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Refugio no verificado"]').exists()).toBe(true)
    })

    it('shows shelter email in contact column', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('info@refugio.com')
    })
  })

  // ── Active status badge ─────────────────────────────────────

  describe('active status badge', () => {
    it('shows Activo badge for active shelters', async () => {
      mockAdminStore.shelters = [makeShelter({ id: 1, is_active: true })]
      mockAdminStore.totalShelters = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Refugio activo"]').exists()).toBe(true)
    })

    it('shows Inactivo badge for inactive shelters', async () => {
      mockAdminStore.shelters = [makeShelter({ id: 1, is_active: false })]
      mockAdminStore.totalShelters = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Refugio inactivo"]').exists()).toBe(true)
    })
  })

  // ── Verify ───────────────────────────────────────────────────

  describe('verify shelter', () => {
    it('shows "Verificar" button only for unverified shelters', async () => {
      mockAdminStore.shelters = [makeShelter({ id: 1, is_verified: false })]
      mockAdminStore.totalShelters = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Verificar')
      expect(btn).toBeDefined()
    })

    it('does not show "Verificar" button for already verified shelters', async () => {
      mockAdminStore.shelters = [makeShelter({ id: 1, is_verified: true })]
      mockAdminStore.totalShelters = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Verificar')
      expect(btn).toBeUndefined()
    })

    it('calls verifyShelter with shelter id when "Verificar" is clicked', async () => {
      mockVerifyShelter.mockResolvedValue(true)
      mockAdminStore.shelters = [makeShelter({ id: 5, is_verified: false })]
      mockAdminStore.totalShelters = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Verificar')
      await btn!.trigger('click')
      expect(mockVerifyShelter).toHaveBeenCalledWith(5)
    })
  })

  // ── Activate / Deactivate ───────────────────────────────────

  describe('activate / deactivate', () => {
    it('shows "Desactivar" button for active shelters', async () => {
      mockAdminStore.shelters = [makeShelter({ id: 1, is_active: true })]
      mockAdminStore.totalShelters = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Desactivar'))
      expect(btn).toBeDefined()
    })

    it('calls deactivateShelter when "Desactivar" is clicked', async () => {
      mockDeactivateShelter.mockResolvedValue(true)
      mockAdminStore.shelters = [makeShelter({ id: 3, is_active: true })]
      mockAdminStore.totalShelters = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Desactivar'))
      await btn!.trigger('click')
      expect(mockDeactivateShelter).toHaveBeenCalledWith(3)
    })

    it('shows "Activar" button for inactive shelters', async () => {
      mockAdminStore.shelters = [makeShelter({ id: 1, is_active: false })]
      mockAdminStore.totalShelters = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Activar'))
      expect(btn).toBeDefined()
    })

    it('calls activateShelter when "Activar" is clicked', async () => {
      mockActivateShelter.mockResolvedValue(true)
      mockAdminStore.shelters = [makeShelter({ id: 4, is_active: false })]
      mockAdminStore.totalShelters = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Activar'))
      await btn!.trigger('click')
      expect(mockActivateShelter).toHaveBeenCalledWith(4)
    })
  })

  // ── No delete or featured buttons ───────────────────────────

  describe('no delete or featured functionality', () => {
    it('does not render any "Eliminar" button', async () => {
      mockAdminStore.shelters = [makeShelter()]
      mockAdminStore.totalShelters = 1
      const wrapper = await mountManager()
      expect(wrapper.findAll('button').some(b => b.text() === 'Eliminar')).toBe(false)
    })

    it('does not render any "Destacar" button', async () => {
      mockAdminStore.shelters = [makeShelter()]
      mockAdminStore.totalShelters = 1
      const wrapper = await mountManager()
      expect(wrapper.findAll('button').some(b => b.text() === 'Destacar')).toBe(false)
    })
  })

  // ── Result count ────────────────────────────────────────────

  describe('result count', () => {
    it('shows "0 refugios" when totalShelters is 0', async () => {
      mockAdminStore.totalShelters = 0
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('0 refugios')
    })

    it('shows "1 refugio" (singular) when totalShelters is 1', async () => {
      mockAdminStore.totalShelters = 1
      mockAdminStore.shelters = [makeShelter()]
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('1 refugio')
      expect(wrapper.find('[role="status"]').text()).not.toContain('1 refugios')
    })

    it('shows "3 refugios" (plural)', async () => {
      mockAdminStore.totalShelters = 3
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('3 refugios')
    })
  })

  // ── Error alert ─────────────────────────────────────────────

  describe('error alert', () => {
    it('shows the error alert when error is set', async () => {
      mockError.value = 'Error al cargar refugios'
      const wrapper = await mountManager()
      expect(wrapper.find('[role="alert"]').text()).toContain('Error al cargar refugios')
    })

    it('hides the error alert when error is null', async () => {
      const wrapper = await mountManager()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Pagination footer ───────────────────────────────────────

  it('does not show pagination footer when totalShelters <= 20', async () => {
    mockAdminStore.totalShelters = 10
    const wrapper = await mountManager()
    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })
})
