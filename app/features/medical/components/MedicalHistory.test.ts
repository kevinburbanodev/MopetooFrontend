// ============================================================
// MedicalHistory.test.ts
// Tests for the MedicalHistory component.
//
// Strategy: mountSuspended from @nuxt/test-utils. The component
// conditionally renders one of several states: loading skeleton,
// empty state, or the records grid. We also test the "Exportar PDF"
// button visibility and the "Agregar registro" link.
//
// Mocking strategy:
//   - useMedical is mocked via vi.mock because it is a project composable.
//     We control fetchMedicalHistory, deleteMedicalRecord, exportPDF, error,
//     and medicalStore state through controlled test doubles.
//   - The medicalStore is simulated via a plain reactive object — we do not
//     need a real Pinia store for these component-level tests since we only
//     care about how the component renders given store state.
//
// NuxtLink: stubbed via global.stubs to avoid real router dependency.
//
// What this suite does NOT cover intentionally:
//   - MedicalRecordCard internals — covered in MedicalRecordCard.test.ts.
//   - Skeleton CSS animation — visual concern only.
//   - exportPDF browser download behaviour — browser-API heavy; tested
//     at the composable level (useMedical.test.ts exportPDF section).
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MedicalHistory from './MedicalHistory.vue'
import type { MedicalRecord } from '../types'
import { ref } from 'vue'

// ── Fixtures ─────────────────────────────────────────────────

function makeRecord(overrides: Partial<MedicalRecord> = {}): MedicalRecord {
  return {
    id: '1',
    pet_id: '42',
    date: '2024-06-15T00:00:00Z',
    symptoms: 'Tos leve',
    diagnosis: 'Control rutinario',
    treatment: 'Vitaminas y desparasitante',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── useMedical mock ───────────────────────────────────────────
// We build a factory that allows each test to control the store state
// and mock functions independently.

const mockFetchMedicalHistory = vi.fn()
const mockDeleteMedicalRecord = vi.fn()
const mockExportPDF = vi.fn()
const mockError = ref<string | null>(null)

// medicalStore shape consumed by MedicalHistory
const mockMedicalStore = {
  records: [] as MedicalRecord[],
  isLoading: false,
  hasRecords: false,
}

vi.mock('../composables/useMedical', () => ({
  useMedical: () => ({
    fetchMedicalHistory: mockFetchMedicalHistory,
    deleteMedicalRecord: mockDeleteMedicalRecord,
    exportPDF: mockExportPDF,
    error: mockError,
    medicalStore: mockMedicalStore,
  }),
}))

// NuxtLink stub that renders its slot content so text assertions work.
// Using `{ template: '<a><slot /></a>' }` renders the inner text (e.g. "Agregar registro").
const nuxtLinkStub = { template: '<a><slot /></a>' }
const globalStubs = { NuxtLink: nuxtLinkStub }

// ── Suite ─────────────────────────────────────────────────────

describe('MedicalHistory', () => {
  beforeEach(() => {
    mockFetchMedicalHistory.mockReset()
    mockDeleteMedicalRecord.mockReset()
    mockExportPDF.mockReset()
    mockError.value = null
    mockMedicalStore.records = []
    mockMedicalStore.isLoading = false
    mockMedicalStore.hasRecords = false
    // Default: fetchMedicalHistory resolves immediately
    mockFetchMedicalHistory.mockResolvedValue(undefined)
    mockDeleteMedicalRecord.mockResolvedValue(true)
    mockExportPDF.mockResolvedValue(undefined)
  })

  // ── Header rendering ──────────────────────────────────────

  describe('header rendering', () => {
    it('renders the "Historial médico" heading', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Historial médico')
    })

    it('renders the pet name in the heading when petName prop is provided', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42', petName: 'Luna' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Luna')
    })

    it('does not render a pet name in the heading when petName is not provided', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      // The heading still renders "Historial médico" but without "— PetName"
      // We look for the <span class="text-primary"> that wraps the pet name
      expect(wrapper.find('.text-primary').exists()).toBe(false)
    })

    it('renders the subtitle description text', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Registra visitas al veterinario')
    })

    it('renders the "Agregar registro" link', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Agregar registro')
    })

    it('renders the "Volver a la mascota" back link', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Volver a la mascota')
    })
  })

  // ── Loading skeleton ──────────────────────────────────────

  describe('when isLoading is true', () => {
    beforeEach(() => {
      mockMedicalStore.isLoading = true
      mockMedicalStore.records = []
      mockMedicalStore.hasRecords = false
    })

    it('renders the loading skeleton grid with aria-busy="true"', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('skeleton grid has aria-label "Cargando historial médico"', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('[aria-busy="true"]').attributes('aria-label')).toBe('Cargando historial médico')
    })

    it('renders 3 skeleton cards', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      const skeletons = wrapper.findAll('.medical-skeleton')
      expect(skeletons).toHaveLength(3)
    })

    it('does not render the empty state while loading', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).not.toContain('Sin registros médicos')
    })

    it('does not render MedicalRecordCard (article elements) while loading', async () => {
      mockMedicalStore.records = [makeRecord()]
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.findAll('article')).toHaveLength(0)
    })
  })

  // ── Empty state ───────────────────────────────────────────

  describe('when records is empty and isLoading is false', () => {
    beforeEach(() => {
      mockMedicalStore.isLoading = false
      mockMedicalStore.records = []
      mockMedicalStore.hasRecords = false
    })

    it('renders the empty state heading "Sin registros médicos"', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Sin registros médicos')
    })

    it('renders the empty state CTA "Agregar primer registro"', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Agregar primer registro')
    })

    it('renders the empty state description text', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Lleva un registro de las visitas')
    })

    it('does not render the loading skeleton when empty', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('does not render MedicalRecordCard articles when empty', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.findAll('article')).toHaveLength(0)
    })

    it('does NOT show "Exportar PDF" button when there are no records', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).not.toContain('Exportar PDF')
    })
  })

  // ── Records grid ──────────────────────────────────────────

  describe('when records are loaded and isLoading is false', () => {
    const records = [
      makeRecord({ id: '1', diagnosis: 'Control rutinario' }),
      makeRecord({ id: '2', diagnosis: 'Vacunación triple' }),
      makeRecord({ id: '3', diagnosis: 'Infección leve' }),
    ]

    beforeEach(() => {
      mockMedicalStore.isLoading = false
      mockMedicalStore.records = records
      mockMedicalStore.hasRecords = true
    })

    it('renders one MedicalRecordCard (article) per record', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.findAll('article')).toHaveLength(3)
    })

    it('renders the correct diagnosis text for each record', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Control rutinario')
      expect(wrapper.text()).toContain('Vacunación triple')
      expect(wrapper.text()).toContain('Infección leve')
    })

    it('does not render the empty state', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).not.toContain('Sin registros médicos')
    })

    it('does not render the loading skeleton', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('shows "Exportar PDF" button when hasRecords is true', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Exportar PDF')
    })
  })

  // ── Exportar PDF button ───────────────────────────────────

  describe('"Exportar PDF" button', () => {
    beforeEach(() => {
      mockMedicalStore.isLoading = false
      mockMedicalStore.records = [makeRecord()]
      mockMedicalStore.hasRecords = true
    })

    it('the "Exportar PDF" button is not disabled when not exporting', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      const exportBtn = wrapper.findAll('button').find(b => b.text().includes('Exportar PDF'))!
      expect(exportBtn.attributes('disabled')).toBeUndefined()
    })

    it('calls exportPDF with the petId when the button is clicked', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      const exportBtn = wrapper.findAll('button').find(b => b.text().includes('Exportar PDF'))!
      await exportBtn.trigger('click')

      expect(mockExportPDF).toHaveBeenCalledWith('42', undefined)
    })

    it('calls exportPDF with petId and petName when petName prop is provided', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42', petName: 'Luna' },
        global: { stubs: globalStubs },
      })
      const exportBtn = wrapper.findAll('button').find(b => b.text().includes('Exportar PDF'))!
      await exportBtn.trigger('click')

      expect(mockExportPDF).toHaveBeenCalledWith('42', 'Luna')
    })

    it('does NOT show "Exportar PDF" button when hasRecords is false', async () => {
      mockMedicalStore.hasRecords = false
      mockMedicalStore.records = []
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).not.toContain('Exportar PDF')
    })
  })

  // ── fetchMedicalHistory on mount ──────────────────────────

  describe('fetchMedicalHistory on mount', () => {
    it('calls fetchMedicalHistory with the petId on mount', async () => {
      await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(mockFetchMedicalHistory).toHaveBeenCalledWith('42')
    })

    it('calls fetchMedicalHistory with the correct petId when different', async () => {
      await mountSuspended(MedicalHistory, {
        props: { petId: '99' },
        global: { stubs: globalStubs },
      })
      expect(mockFetchMedicalHistory).toHaveBeenCalledWith('99')
    })
  })

  // ── Error display ─────────────────────────────────────────

  describe('error alert', () => {
    it('shows the error alert when error ref has a value', async () => {
      mockError.value = 'Error al cargar los registros.'
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Error al cargar los registros.')
    })

    it('does not show the error alert when error is null', async () => {
      mockError.value = null
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      const alert = wrapper.find('[role="alert"].alert-danger')
      expect(alert.exists()).toBe(false)
    })
  })

  // ── Section accessibility ─────────────────────────────────

  describe('accessibility', () => {
    it('the root section has aria-label "Historial médico"', async () => {
      const wrapper = await mountSuspended(MedicalHistory, {
        props: { petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('section').attributes('aria-label')).toBe('Historial médico')
    })
  })
})
