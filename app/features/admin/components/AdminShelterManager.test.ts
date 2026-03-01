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
//   - Featured / unfeatured badge rendering.
//   - Toggle Verificado calls updateShelter with toggled boolean.
//   - Toggle Destacado calls updateShelter with toggled boolean.
//   - 2-step delete: first click shows ¿Confirmar? / Cancelar;
//     confirm calls deleteShelter; cancel resets confirmation.
//   - Result count (singular / plural).
//   - Error alert shown / hidden.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
import AdminShelterManager from './AdminShelterManager.vue'
import type { AdminShelter } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeShelter(overrides: Partial<AdminShelter> = {}): AdminShelter {
  return {
    id: 'shelter-1',
    name: 'Refugio Los Amigos',
    city: 'Bogotá',
    email: 'info@refugio.com',
    is_verified: false,
    is_featured: false,
    pets_count: 8,
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── useAdmin mock ─────────────────────────────────────────────

const mockFetchShelters = vi.fn()
const mockUpdateShelter = vi.fn()
const mockDeleteShelter = vi.fn()
const mockError = ref<string | null>(null)
const mockShelters = ref<AdminShelter[]>([])
const mockIsLoading = ref(false)
const mockTotalShelters = ref(0)

vi.mock('../composables/useAdmin', () => ({
  useAdmin: () => ({
    fetchShelters: mockFetchShelters,
    updateShelter: mockUpdateShelter,
    deleteShelter: mockDeleteShelter,
    error: mockError,
    adminStore: {
      get shelters() { return mockShelters.value },
      get isLoading() { return mockIsLoading.value },
      get totalShelters() { return mockTotalShelters.value },
    },
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
    mockUpdateShelter.mockReset()
    mockDeleteShelter.mockReset()
    mockError.value = null
    mockShelters.value = []
    mockIsLoading.value = false
    mockTotalShelters.value = 0
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
      mockIsLoading.value = true
      const wrapper = await mountManager()
      const skeletonRows = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonRows.length).toBeGreaterThanOrEqual(5)
    })

    it('does not show data rows while loading', async () => {
      mockIsLoading.value = true
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
      mockShelters.value = [
        makeShelter({ id: 'shelter-1', name: 'Refugio Norte', city: 'Medellín', is_verified: true, is_featured: false }),
      ]
      mockTotalShelters.value = 1
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
      mockShelters.value = [makeShelter({ id: 's2', is_verified: false })]
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Refugio no verificado"]').exists()).toBe(true)
    })

    it('shows Destacado badge for featured shelters', async () => {
      mockShelters.value = [makeShelter({ id: 's3', is_featured: true })]
      mockTotalShelters.value = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Refugio destacado"]').exists()).toBe(true)
    })

    it('shows shelter email in contact column', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('info@refugio.com')
    })
  })

  // ── Toggle Verificado ───────────────────────────────────────

  describe('toggle Verificado', () => {
    it('calls updateShelter with { is_verified: true } when "Verificar" is clicked', async () => {
      mockUpdateShelter.mockResolvedValue(true)
      mockShelters.value = [makeShelter({ id: 'shelter-1', is_verified: false })]
      mockTotalShelters.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Verificar')
      await btn!.trigger('click')
      expect(mockUpdateShelter).toHaveBeenCalledWith('shelter-1', { is_verified: true })
    })

    it('calls updateShelter with { is_verified: false } when "Desverificar" is clicked', async () => {
      mockUpdateShelter.mockResolvedValue(true)
      mockShelters.value = [makeShelter({ id: 'shelter-1', is_verified: true })]
      mockTotalShelters.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Desverificar')
      await btn!.trigger('click')
      expect(mockUpdateShelter).toHaveBeenCalledWith('shelter-1', { is_verified: false })
    })
  })

  // ── Toggle Destacado ────────────────────────────────────────

  describe('toggle Destacado', () => {
    it('calls updateShelter with { is_featured: true } when "Destacar" is clicked', async () => {
      mockUpdateShelter.mockResolvedValue(true)
      mockShelters.value = [makeShelter({ id: 'shelter-1', is_featured: false })]
      mockTotalShelters.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Destacar')
      await btn!.trigger('click')
      expect(mockUpdateShelter).toHaveBeenCalledWith('shelter-1', { is_featured: true })
    })

    it('calls updateShelter with { is_featured: false } when "Quitar dest." is clicked', async () => {
      mockUpdateShelter.mockResolvedValue(true)
      mockShelters.value = [makeShelter({ id: 'shelter-1', is_featured: true })]
      mockTotalShelters.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Quitar dest.')
      await btn!.trigger('click')
      expect(mockUpdateShelter).toHaveBeenCalledWith('shelter-1', { is_featured: false })
    })
  })

  // ── 2-step delete ───────────────────────────────────────────

  describe('2-step delete confirmation', () => {
    beforeEach(() => {
      mockShelters.value = [makeShelter({ id: 'shelter-1', name: 'Refugio Norte' })]
      mockTotalShelters.value = 1
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

    it('does not call deleteShelter on first click', async () => {
      const wrapper = await mountManager()
      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Eliminar')
      await deleteBtn!.trigger('click')
      expect(mockDeleteShelter).not.toHaveBeenCalled()
    })

    it('calls deleteShelter with shelterId when ¿Confirmar? is clicked', async () => {
      mockDeleteShelter.mockResolvedValue(true)
      const wrapper = await mountManager()
      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Eliminar')
      await deleteBtn!.trigger('click')
      const confirmBtn = wrapper.findAll('button').find(b => b.text() === '¿Confirmar?')
      await confirmBtn!.trigger('click')
      expect(mockDeleteShelter).toHaveBeenCalledWith('shelter-1')
    })

    it('hides ¿Confirmar? after clicking Cancelar', async () => {
      const wrapper = await mountManager()
      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Eliminar')
      await deleteBtn!.trigger('click')
      const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancelar')
      await cancelBtn!.trigger('click')
      expect(wrapper.text()).not.toContain('¿Confirmar?')
    })

    it('does not call deleteShelter when Cancelar is clicked', async () => {
      const wrapper = await mountManager()
      const deleteBtn = wrapper.findAll('button').find(b => b.text() === 'Eliminar')
      await deleteBtn!.trigger('click')
      const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancelar')
      await cancelBtn!.trigger('click')
      expect(mockDeleteShelter).not.toHaveBeenCalled()
    })
  })

  // ── Result count ────────────────────────────────────────────

  describe('result count', () => {
    it('shows "0 refugios" when totalShelters is 0', async () => {
      mockTotalShelters.value = 0
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('0 refugios')
    })

    it('shows "1 refugio" (singular) when totalShelters is 1', async () => {
      mockTotalShelters.value = 1
      mockShelters.value = [makeShelter()]
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('1 refugio')
      expect(wrapper.find('[role="status"]').text()).not.toContain('1 refugios')
    })

    it('shows "3 refugios" (plural)', async () => {
      mockTotalShelters.value = 3
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
    mockTotalShelters.value = 10
    const wrapper = await mountManager()
    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })
})
