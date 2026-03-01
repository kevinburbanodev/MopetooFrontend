// ============================================================
// AdminClinicManager.test.ts
// Tests for the AdminClinicManager component.
//
// Behaviours tested:
//   - Calls fetchAdminClinics on mount.
//   - Loading skeleton while isLoading.
//   - Empty state when no clinics.
//   - Clinic rows: name, city.
//   - Verified / unverified badge.
//   - Plan column: Free / Pro badge.
//   - Active / inactive status badge.
//   - Verify button only appears when !is_verified.
//   - verifyClinic called when "Verificar" is clicked.
//   - Plan select dropdown calls setClinicPlan.
//   - Activate / deactivate calls activateClinic / deactivateClinic.
//   - Specialty chips: max 2 visible + "+N" overflow badge.
//   - Specialties optional — dash shown when missing or empty.
//   - Result count (singular / plural).
//   - Error alert.
//   - No delete or featured functionality.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createTestingPinia } from '@pinia/testing'
import { ref, reactive } from 'vue'
import AdminClinicManager from './AdminClinicManager.vue'
import type { AdminClinic } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeClinic(overrides: Partial<AdminClinic> = {}): AdminClinic {
  return {
    id: 1,
    name: 'Clínica Vet Norte',
    city: 'Cali',
    email: 'info@clinica.com',
    is_verified: false,
    is_active: true,
    plan: 'free',
    specialties: ['Cirugía', 'Dermatología'],
    created_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── useAdmin mock ─────────────────────────────────────────────

const mockFetchAdminClinics = vi.fn()
const mockVerifyClinic = vi.fn()
const mockActivateClinic = vi.fn()
const mockDeactivateClinic = vi.fn()
const mockSetClinicPlan = vi.fn()
const mockError = ref<string | null>(null)
const mockAdminStore = reactive({
  clinics: [] as AdminClinic[],
  isLoading: false,
  totalClinics: 0,
})

vi.mock('../composables/useAdmin', () => ({
  useAdmin: () => ({
    fetchAdminClinics: mockFetchAdminClinics,
    verifyClinic: mockVerifyClinic,
    activateClinic: mockActivateClinic,
    deactivateClinic: mockDeactivateClinic,
    setClinicPlan: mockSetClinicPlan,
    error: mockError,
    adminStore: mockAdminStore,
  }),
}))

// ── Shared mount helper ───────────────────────────────────────

async function mountManager() {
  return mountSuspended(AdminClinicManager, {
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

describe('AdminClinicManager', () => {
  beforeEach(() => {
    mockFetchAdminClinics.mockReset()
    mockVerifyClinic.mockReset()
    mockActivateClinic.mockReset()
    mockDeactivateClinic.mockReset()
    mockSetClinicPlan.mockReset()
    mockError.value = null
    mockAdminStore.clinics = []
    mockAdminStore.isLoading = false
    mockAdminStore.totalClinics = 0
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
      mockAdminStore.isLoading = true
      const wrapper = await mountManager()
      const skeletonRows = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonRows.length).toBeGreaterThanOrEqual(5)
    })

    it('does not show clinic data while loading', async () => {
      mockAdminStore.isLoading = true
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
      mockAdminStore.clinics = [
        makeClinic({ id: 1, name: 'Clínica Norte', city: 'Bogotá', is_verified: true, is_active: true }),
      ]
      mockAdminStore.totalClinics = 1
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
      mockAdminStore.clinics = [makeClinic({ id: 2, is_verified: false })]
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Clínica no verificada"]').exists()).toBe(true)
    })
  })

  // ── Plan column ─────────────────────────────────────────────

  describe('plan column', () => {
    it('shows "Free" badge for clinics with plan=free', async () => {
      mockAdminStore.clinics = [makeClinic({ id: 1, plan: 'free' })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Plan: Free"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Plan: Free"]').text()).toBe('Free')
    })

    it('shows "Pro" badge for clinics with plan=pro', async () => {
      mockAdminStore.clinics = [makeClinic({ id: 1, plan: 'pro' })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Plan: Pro"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Plan: Pro"]').text()).toBe('Pro')
    })
  })

  // ── Active status badge ─────────────────────────────────────

  describe('active status badge', () => {
    it('shows Activo badge for active clinics', async () => {
      mockAdminStore.clinics = [makeClinic({ id: 1, is_active: true })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Clínica activa"]').exists()).toBe(true)
    })

    it('shows Inactivo badge for inactive clinics', async () => {
      mockAdminStore.clinics = [makeClinic({ id: 1, is_active: false })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      expect(wrapper.find('[aria-label="Clínica inactiva"]').exists()).toBe(true)
    })
  })

  // ── Specialty chips ─────────────────────────────────────────

  describe('specialty chips', () => {
    it('shows up to 2 specialty chips for a clinic with 2 specialties', async () => {
      mockAdminStore.clinics = [makeClinic({ specialties: ['Cirugía', 'Dermatología'] })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('Cirugía')
      expect(wrapper.text()).toContain('Dermatología')
    })

    it('shows +1 overflow badge for a clinic with 3 specialties', async () => {
      mockAdminStore.clinics = [makeClinic({ specialties: ['Cirugía', 'Dermatología', 'Cardiología'] })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('+1')
    })

    it('shows a dash for clinics with no specialties (empty array)', async () => {
      mockAdminStore.clinics = [makeClinic({ specialties: [] })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('\u2014')
    })

    it('shows a dash for clinics with undefined specialties', async () => {
      mockAdminStore.clinics = [makeClinic({ specialties: undefined })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      expect(wrapper.text()).toContain('\u2014')
    })
  })

  // ── Verify ───────────────────────────────────────────────────

  describe('verify clinic', () => {
    it('shows "Verificar" button only for unverified clinics', async () => {
      mockAdminStore.clinics = [makeClinic({ id: 1, is_verified: false })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Verificar')
      expect(btn).toBeDefined()
    })

    it('does not show "Verificar" button for already verified clinics', async () => {
      mockAdminStore.clinics = [makeClinic({ id: 1, is_verified: true })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Verificar')
      expect(btn).toBeUndefined()
    })

    it('calls verifyClinic with clinic id when "Verificar" is clicked', async () => {
      mockVerifyClinic.mockResolvedValue(true)
      mockAdminStore.clinics = [makeClinic({ id: 5, is_verified: false })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text() === 'Verificar')
      await btn!.trigger('click')
      expect(mockVerifyClinic).toHaveBeenCalledWith(5)
    })
  })

  // ── Plan select dropdown ────────────────────────────────────

  describe('plan select dropdown', () => {
    it('renders a plan select dropdown for each clinic', async () => {
      mockAdminStore.clinics = [makeClinic({ id: 1, name: 'Clínica A' })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      const select = wrapper.find('select[aria-label="Cambiar plan de Clínica A"]')
      expect(select.exists()).toBe(true)
    })

    it('calls setClinicPlan when plan is changed', async () => {
      mockSetClinicPlan.mockResolvedValue(true)
      mockAdminStore.clinics = [makeClinic({ id: 8, name: 'Clínica B', plan: 'free' })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      const select = wrapper.find('select[aria-label="Cambiar plan de Clínica B"]')
      await select.setValue('pro')
      expect(mockSetClinicPlan).toHaveBeenCalledWith(8, 'pro')
    })
  })

  // ── Activate / Deactivate ───────────────────────────────────

  describe('activate / deactivate', () => {
    it('shows "Desactivar" button for active clinics', async () => {
      mockAdminStore.clinics = [makeClinic({ id: 1, is_active: true })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Desactivar'))
      expect(btn).toBeDefined()
    })

    it('calls deactivateClinic when "Desactivar" is clicked', async () => {
      mockDeactivateClinic.mockResolvedValue(true)
      mockAdminStore.clinics = [makeClinic({ id: 3, is_active: true })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Desactivar'))
      await btn!.trigger('click')
      expect(mockDeactivateClinic).toHaveBeenCalledWith(3)
    })

    it('shows "Activar" button for inactive clinics', async () => {
      mockAdminStore.clinics = [makeClinic({ id: 1, is_active: false })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Activar'))
      expect(btn).toBeDefined()
    })

    it('calls activateClinic when "Activar" is clicked', async () => {
      mockActivateClinic.mockResolvedValue(true)
      mockAdminStore.clinics = [makeClinic({ id: 6, is_active: false })]
      mockAdminStore.totalClinics = 1
      const wrapper = await mountManager()
      const btn = wrapper.findAll('button').find(b => b.text().includes('Activar'))
      await btn!.trigger('click')
      expect(mockActivateClinic).toHaveBeenCalledWith(6)
    })
  })

  // ── No delete or featured functionality ─────────────────────

  describe('no delete or featured functionality', () => {
    beforeEach(() => {
      mockAdminStore.clinics = [makeClinic()]
      mockAdminStore.totalClinics = 1
    })

    it('does not render any "Eliminar" button', async () => {
      const wrapper = await mountManager()
      expect(wrapper.findAll('button').some(b => b.text() === 'Eliminar')).toBe(false)
    })

    it('does not render any "Destacar" button', async () => {
      const wrapper = await mountManager()
      expect(wrapper.findAll('button').some(b => b.text() === 'Destacar')).toBe(false)
    })
  })

  // ── Result count ────────────────────────────────────────────

  describe('result count', () => {
    it('shows "0 clínicas" when totalClinics is 0', async () => {
      mockAdminStore.totalClinics = 0
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('0 clínicas')
    })

    it('shows "1 clínica" (singular) when totalClinics is 1', async () => {
      mockAdminStore.totalClinics = 1
      mockAdminStore.clinics = [makeClinic()]
      const wrapper = await mountManager()
      expect(wrapper.find('[role="status"]').text()).toContain('1 clínica')
      expect(wrapper.find('[role="status"]').text()).not.toContain('1 clínicas')
    })

    it('shows "4 clínicas" (plural)', async () => {
      mockAdminStore.totalClinics = 4
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
    mockAdminStore.totalClinics = 8
    const wrapper = await mountManager()
    expect(wrapper.find('.card-footer').exists()).toBe(false)
  })
})
