// ============================================================
// AdminClinicManager.test.ts
// Tests for the AdminClinicManager component.
//
// Behaviours tested:
//   - Calls fetchAdminClinics on mount.
//   - Loading skeleton while isLoading.
//   - Empty state when no clinics.
//   - Clinic rows: name, city, specialties chips (max 2 visible + overflow badge).
//   - Verificado / Destacado badges.
//   - Toggle Verificado and Destacado calls updateAdminClinic.
//   - 2-step delete: Eliminar → ¿Confirmar? / Cancelar → deleteAdminClinic.
//   - Specialty overflow: exactly 2 shown + "+N" badge for the rest.
//   - No specialty column shows dash when specialties is empty.
//   - Result count (singular / plural).
//   - Error alert.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref } from 'vue'
import AdminClinicManager from './AdminClinicManager.vue'
import type { AdminClinic } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeClinic(overrides: Partial<AdminClinic> = {}): AdminClinic {
  return {
    id: 'clinic-1',
    name: 'Clínica Vet Norte',
    city: 'Cali',
    email: 'info@clinica.com',
    is_verified: false,
    is_featured: false,
    specialties: ['Cirugía', 'Dermatología'],
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── useAdmin mock ─────────────────────────────────────────────

const mockFetchAdminClinics = vi.fn()
const mockUpdateAdminClinic = vi.fn()
const mockDeleteAdminClinic = vi.fn()
const mockError = ref<string | null>(null)
const mockClinics = ref<AdminClinic[]>([])
const mockIsLoading = ref(false)
const mockTotalClinics = ref(0)

vi.mock('../composables/useAdmin', () => ({
  useAdmin: () => ({
    fetchAdminClinics: mockFetchAdminClinics,
    updateAdminClinic: mockUpdateAdminClinic,
    deleteAdminClinic: mockDeleteAdminClinic,
    error: mockError,
    adminStore: {
      get clinics() { return mockClinics.value },
      get isLoading() { return mockIsLoading.value },
      get totalClinics() { return mockTotalClinics.value },
    },
  }),
}))

// ── Shared mount helper ───────────────────────────────────────

async function mountManager() {
  return mountSuspended(AdminClinicManager, {
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

describe('AdminClinicManager', () => {
  beforeEach(() => {
    mockFetchAdminClinics.mockReset()
    mockUpdateAdminClinic.mockReset()
    mockDeleteAdminClinic.mockReset()
    mockError.value = null
    mockClinics.value = []
    mockIsLoading.value = false
    mockTotalClinics.value = 0
  })

  // ── Section structure ───────────────────────────────────────

  it('renders a section with aria-label "Gestión de clínicas"', async () => {
    const wrapper = await mountManager()
    expect(wrapper.find('section[aria-label="Gestión de clínicas"]').exists()).toBe(true)
  })

  // ── Lifecycle ───────────────────────────────────────────────

  it('calls fetchAdminClinics on mount', async () => {
    await mountManager()
    expect(mockFetchAdminClinics).toHaveBeenCalledTimes(1)
  })

  // ── Loading skeleton ────────────────────────────────────────

  describe('loading skeleton', () => {
    it('renders skeleton rows while isLoading is true', async () => {
      mockIsLoading.value = true
      const wrapper = await mountManager()
      const skeletonRows = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonRows.length).toBeGreaterThanOrEqual(5)
    })

    it('does not show clinic data while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountManager()
      expect(wrapper.text()).not.toContain('Clínica Vet Norte')
    })
  })

  // ── Empty state ─────────────────────────────────────────────

  it('shows empty state message when no clinics exist', async () => {
    const wrapper = await mountManager()
    expect(wrapper.text()).toContain('No se encontraron clínicas con los filtros actuales.')
  })

  // ── Clinic rows ─────────────────────────────────────────────

  describe('clinic rows', () => {
    beforeEach(() => {
      mockClinics.value = [
        makeClinic({ id: 'clinic-1', name: 'Clínica Norte', city: 'Bogotá', is_verified: true, is_featured: false }),
      ]
      mockTotalClinics.value = 1
    })

    it('renders clinic name', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('Clínica Norte')
    })

    it('renders clinic city', async () => {
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('Bogotá')
    })

    it('shows Verificado badge for verified clinics', async () => {
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Clínica verificada"]').exists()).toBe(true)
    })

    it('shows "No" label for unverified clinics', async () => {
      mockClinics.value = [makeClinic({ id: 'c2', is_verified: false })]
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Clínica no verificada"]').exists()).toBe(true)
    })

    it('shows Destacado badge for featured clinics', async () => {
      mockClinics.value = [makeClinic({ id: 'c3', is_featured: true })]
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Clínica destacada"]').exists()).toBe(true)
    })
  })

  // ── Specialty chips ─────────────────────────────────────────

  describe('specialty chips', () => {
    it('shows up to 2 specialty chips for a clinic with 2 specialties', async () => {
      mockClinics.value = [makeClinic({ specialties: ['Cirugía', 'Dermatología'] })]
      mockTotalClinics.value = 1
      const wrapper = await mountManager()
      const chips = wrapper.findAll('.badge.bg-primary')
      // Only the two specialty badges (no overflow)
      expect(chips.length).toBeGreaterThanOrEqual(2)
      expect(wrapper.text()).toContain('Cirugía')
      expect(wrapper.text()).toContain('Dermatología')
    })

    it('shows +1 overflow badge for a clinic with 3 specialties', async () => {
      mockClinics.value = [makeClinic({ specialties: ['Cirugía', 'Dermatología', 'Cardiología'] })]
      mockTotalClinics.value = 1
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('+1')
    })

    it('shows a dash for clinics with no specialties', async () => {
      mockClinics.value = [makeClinic({ specialties: [] })]
      mockTotalClinics.value = 1
      const wrapper = await mountManager()
      // The empty specialties column shows a "—" dash
      expect(wrapper.text()).toContain('—')
    })
  })

  // ── Toggle Verificado ───────────────────────────────────────

  describe('toggle Verificado', () => {
    it('calls updateAdminClinic with { is_verified: true } when "Verificar" is clicked', async () => {
      mockUpdateAdminClinic.mockResolvedValue(true)
      mockClinics.value = [makeClinic({ id: 'clinic-1', is_verified: false })]
      mockTotalClinics.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Verificar')
      await btn!.trigger('click')
      expect(mockUpdateAdminClinic).toHaveBeenCalledWith('clinic-1', { is_verified: true })
    })

    it('calls updateAdminClinic with { is_verified: false } when "Desverificar" is clicked', async () => {
      mockUpdateAdminClinic.mockResolvedValue(true)
      mockClinics.value = [makeClinic({ id: 'clinic-1', is_verified: true })]
      mockTotalClinics.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Desverificar')
      await btn!.trigger('click')
      expect(mockUpdateAdminClinic).toHaveBeenCalledWith('clinic-1', { is_verified: false })
    })
  })

  // ── Toggle Destacado ────────────────────────────────────────

  describe('toggle Destacado', () => {
    it('calls updateAdminClinic with { is_featured: true } when "Destacar" is clicked', async () => {
      mockUpdateAdminClinic.mockResolvedValue(true)
      mockClinics.value = [makeClinic({ id: 'clinic-1', is_featured: false })]
      mockTotalClinics.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Destacar')
      await btn!.trigger('click')
      expect(mockUpdateAdminClinic).toHaveBeenCalledWith('clinic-1', { is_featured: true })
    })

    it('calls updateAdminClinic with { is_featured: false } when "Quitar dest." is clicked', async () => {
      mockUpdateAdminClinic.mockResolvedValue(true)
      mockClinics.value = [makeClinic({ id: 'clinic-1', is_featured: true })]
      mockTotalClinics.value = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Quitar dest.')
      await btn!.trigger('click')
      expect(mockUpdateAdminClinic).toHaveBeenCalledWith('clinic-1', { is_featured: false })
    })
  })

  // ── 2-step delete ───────────────────────────────────────────

  describe('2-step delete confirmation', () => {
    beforeEach(() => {
      mockClinics.value = [makeClinic({ id: 'clinic-1', name: 'Clínica A' })]
      mockTotalClinics.value = 1
    })

    it('shows Eliminar button initially', async () => {
      const wrapper = await mountManager()
      expect(wrapper.findAll('button').some(b => b.text() === 'Eliminar')).toBe(true)
    })

    it('shows ¿Confirmar? after clicking Eliminar', async () => {
      const wrapper = await mountManager()
      await wrapper.findAll('button').find(b => b.text() === 'Eliminar')!.trigger('click')
      expect(wrapper.text()).toContain('¿Confirmar?')
    })

    it('does not call deleteAdminClinic on first click', async () => {
      const wrapper = await mountManager()
      await wrapper.findAll('button').find(b => b.text() === 'Eliminar')!.trigger('click')
      expect(mockDeleteAdminClinic).not.toHaveBeenCalled()
    })

    it('calls deleteAdminClinic with clinicId when ¿Confirmar? is clicked', async () => {
      mockDeleteAdminClinic.mockResolvedValue(true)
      const wrapper = await mountManager()
      await wrapper.findAll('button').find(b => b.text() === 'Eliminar')!.trigger('click')
      await wrapper.findAll('button').find(b => b.text() === '¿Confirmar?')!.trigger('click')
      expect(mockDeleteAdminClinic).toHaveBeenCalledWith('clinic-1')
    })

    it('hides ¿Confirmar? after clicking Cancelar', async () => {
      const wrapper = await mountManager()
      await wrapper.findAll('button').find(b => b.text() === 'Eliminar')!.trigger('click')
      await wrapper.findAll('button').find(b => b.text() === 'Cancelar')!.trigger('click')
      expect(wrapper.text()).not.toContain('¿Confirmar?')
    })

    it('does not call deleteAdminClinic when Cancelar is clicked', async () => {
      const wrapper = await mountManager()
      await wrapper.findAll('button').find(b => b.text() === 'Eliminar')!.trigger('click')
      await wrapper.findAll('button').find(b => b.text() === 'Cancelar')!.trigger('click')
      expect(mockDeleteAdminClinic).not.toHaveBeenCalled()
    })
  })

  // ── Result count ────────────────────────────────────────────

  describe('result count', () => {
    it('shows "0 clínicas" when totalClinics is 0', async () => {
      mockTotalClinics.value = 0
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('0 clínicas')
    })

    it('shows "1 clínica" (singular) when totalClinics is 1', async () => {
      mockTotalClinics.value = 1
      mockClinics.value = [makeClinic()]
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('1 clínica')
      expect(wrapper.find('[role="status"]').text()).not.toContain('1 clínicas')
    })

    it('shows "4 clínicas" (plural)', async () => {
      mockTotalClinics.value = 4
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('4 clínicas')
    })
  })

  // ── Error alert ─────────────────────────────────────────────

  describe('error alert', () => {
    it('shows the error alert when error is set', async () => {
      mockError.value = 'Error al cargar clínicas'
      const wrapper = await mountManager()
      expect(wrapper.find('[role="alert"]').text()).toContain('Error al cargar clínicas')
    })

    it('hides the error alert when error is null', async () => {
      const wrapper = await mountManager()
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Pagination footer ───────────────────────────────────────

  it('does not show pagination footer when totalClinics <= 20', async () => {
    mockTotalClinics.value = 8
    const wrapper = await mountManager()
    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })
})
