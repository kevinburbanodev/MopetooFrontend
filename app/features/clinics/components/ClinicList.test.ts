// ============================================================
// ClinicList.test.ts
// Tests for the ClinicList component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// calls useClinics() which internally calls useApi() and useClinicsStore().
// We mock useClinics at the composable boundary so we can control the
// store state and stub fetchClinics without making HTTP calls.
//
// Mocking:
//   - useClinics: vi.mock('../composables/useClinics', ...) — project
//     composable, NOT mockNuxtImport.
//   - The mock exposes a clinicsStore stub with reactive state we control
//     via module-level refs (same pattern as PetshopList.test.ts).
//   - ClinicCard is stubbed with a custom template so findAll('.clinic-card-stub')
//     gives a reliable count.
//
// Key behaviours tested:
//   - Loading skeleton rendered while isLoading is true.
//   - Empty state (no clinics, no filters) shows "No hay clínicas disponibles".
//   - Results grid renders ClinicCard per clinic.
//   - Client-side search filter: name, city, description.
//   - Specialty filter triggers re-fetch.
//   - City filter triggers re-fetch.
//   - Premium section visible/hidden logic.
//   - Filtered no-results state.
//   - fetchClinics called on mount.
//   - Result counter.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ClinicList from './ClinicList.vue'
import type { Clinic } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeClinic(overrides: Partial<Clinic> = {}): Clinic {
  return {
    id: 1,
    name: 'Los Andes Vet',
    email: 'info@clinicaandes.com',
    phone: '+57 300 987 6543',
    city_id: 1,
    city: { id: 1, name: 'Bogotá', country_id: 1 },
    country_id: 1,
    country: { id: 1, name: 'Colombia', code: 'CO', phone_code: '+57' },
    description: 'Atención veterinaria integral para toda tu familia',
    specialties: ['Cirugía', 'Dermatología'],
    services: ['Consulta general'],
    plan: 'free',
    verified: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const clinicA = makeClinic({ id: 1, name: 'Los Andes Vet', city_id: 1, city: { id: 1, name: 'Bogotá', country_id: 1 }, specialties: ['Cirugía'], plan: 'free' })
const clinicB = makeClinic({ id: 2, name: 'Clínica Animal Sur', city_id: 2, city: { id: 2, name: 'Medellín', country_id: 1 }, specialties: ['Dermatología'], plan: 'pro', description: 'Especialistas en piel' })
const clinicC = makeClinic({ id: 3, name: 'VetSalud', city_id: 3, city: { id: 3, name: 'Cali', country_id: 1 }, specialties: ['Cirugía', 'Cardiología'], plan: 'premium' })

// ── useClinics mock ────────────────────────────────────────────

const mockFetchClinics = vi.fn()
const mockError = ref<string | null>(null)
const mockClinics = ref<Clinic[]>([])
const mockIsLoading = ref(false)

vi.mock('../composables/useClinics', () => ({
  useClinics: () => ({
    fetchClinics: mockFetchClinics,
    error: mockError,
    clinicsStore: {
      get clinics() { return mockClinics.value },
      get isLoading() { return mockIsLoading.value },
      get getPremiumClinics() {
        return mockClinics.value.filter(c => c.plan !== '' && c.plan !== 'free')
      },
    },
  }),
}))

const ClinicCardStub = { template: '<div class="clinic-card-stub" />' }

// ── Suite ─────────────────────────────────────────────────────

describe('ClinicList', () => {
  beforeEach(() => {
    mockFetchClinics.mockReset()
    mockFetchClinics.mockResolvedValue(undefined)
    mockError.value = null
    mockClinics.value = []
    mockIsLoading.value = false
  })

  // ── onMounted ──────────────────────────────────────────────

  describe('lifecycle', () => {
    it('calls fetchClinics on mount', async () => {
      await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(mockFetchClinics).toHaveBeenCalledTimes(1)
    })

    it('calls fetchClinics with no arguments (no initial filters)', async () => {
      await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(mockFetchClinics).toHaveBeenCalledWith()
    })
  })

  // ── Loading state ──────────────────────────────────────────

  describe('loading skeleton', () => {
    it('renders the loading skeleton when isLoading is true', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('renders 6 skeleton cards while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const skeletons = wrapper.findAll('.clinic-skeleton')
      expect(skeletons).toHaveLength(6)
    })

    it('hides the skeleton once loading completes', async () => {
      mockIsLoading.value = false
      mockClinics.value = [clinicA]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })
  })

  // ── Empty state ────────────────────────────────────────────

  describe('empty state', () => {
    it('shows the "No hay clínicas disponibles" state when clinics array is empty and not loading', async () => {
      mockClinics.value = []
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(wrapper.text()).toContain('No hay clínicas disponibles')
    })

    it('shows the 🏥 illustration in the empty state', async () => {
      mockClinics.value = []
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(wrapper.text()).toContain('🏥')
    })
  })

  // ── Results grid ───────────────────────────────────────────

  describe('results grid', () => {
    it('renders a ClinicCard for each non-premium clinic when no filters are active', async () => {
      mockClinics.value = [clinicA, clinicB, clinicC]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const cards = wrapper.findAll('.clinic-card-stub')
      expect(cards.length).toBeGreaterThanOrEqual(1)
    })

    it('renders a result counter with the total matching clinics', async () => {
      mockClinics.value = [clinicA, clinicB]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(wrapper.find('[role="status"]').text()).toContain('2')
    })

    it('shows singular "clínica" when exactly 1 result', async () => {
      mockClinics.value = [clinicA]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const counter = wrapper.find('[role="status"]')
      expect(counter.text()).toMatch(/1\s+clínica/)
    })

    it('shows plural "clínicas" when multiple results', async () => {
      mockClinics.value = [clinicA, clinicB]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const counter = wrapper.find('[role="status"]')
      expect(counter.text()).toMatch(/2\s+clínicas/)
    })
  })

  // ── Search filter ──────────────────────────────────────────

  describe('search filter', () => {
    it('filters by clinic name (case-insensitive)', async () => {
      mockClinics.value = [clinicA, clinicB, clinicC]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const input = wrapper.find('#clinic-search')
      await input.setValue('andes')
      await wrapper.vm.$nextTick()
      const counter = wrapper.find('[role="status"]')
      expect(counter.text()).toContain('1')
    })

    it('filters by city (case-insensitive)', async () => {
      mockClinics.value = [clinicA, clinicB, clinicC]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const input = wrapper.find('#clinic-search')
      await input.setValue('medellín')
      await wrapper.vm.$nextTick()
      const counter = wrapper.find('[role="status"]')
      expect(counter.text()).toContain('1')
    })

    it('filters by description (case-insensitive)', async () => {
      mockClinics.value = [clinicA, clinicB, clinicC]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const input = wrapper.find('#clinic-search')
      await input.setValue('especialistas en piel')
      await wrapper.vm.$nextTick()
      const counter = wrapper.find('[role="status"]')
      expect(counter.text()).toContain('1')
    })

    it('shows the "Sin resultados" state when search returns no matches', async () => {
      mockClinics.value = [clinicA]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const input = wrapper.find('#clinic-search')
      await input.setValue('xyznotfound')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Sin resultados')
    })
  })

  // ── Specialty filter ───────────────────────────────────────

  describe('specialty filter', () => {
    it('populates the specialty select from loaded clinic specialties', async () => {
      mockClinics.value = [clinicA, clinicB, clinicC]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const select = wrapper.find('#clinic-specialty')
      expect(select.text()).toContain('Cirugía')
      expect(select.text()).toContain('Dermatología')
    })

    it('triggers a re-fetch when specialty filter changes', async () => {
      mockClinics.value = [clinicA, clinicB, clinicC]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const initialCalls = mockFetchClinics.mock.calls.length

      const select = wrapper.find('#clinic-specialty')
      await select.setValue('Cirugía')
      await wrapper.vm.$nextTick()

      expect(mockFetchClinics.mock.calls.length).toBeGreaterThan(initialCalls)
    })
  })

  // ── City filter ────────────────────────────────────────────

  describe('city filter', () => {
    it('populates the city select from loaded clinic cities', async () => {
      mockClinics.value = [clinicA, clinicB, clinicC]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const select = wrapper.find('#clinic-city')
      expect(select.text()).toContain('Bogotá')
      expect(select.text()).toContain('Medellín')
      expect(select.text()).toContain('Cali')
    })

    it('triggers a re-fetch when city filter changes', async () => {
      mockClinics.value = [clinicA, clinicB, clinicC]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const initialCalls = mockFetchClinics.mock.calls.length

      const select = wrapper.find('#clinic-city')
      await select.setValue('Medellín')
      await wrapper.vm.$nextTick()

      expect(mockFetchClinics.mock.calls.length).toBeGreaterThan(initialCalls)
    })
  })

  // ── Clear filters ──────────────────────────────────────────

  describe('clear filters button', () => {
    it('is hidden when no filters are active', async () => {
      mockClinics.value = [clinicA]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(wrapper.text()).not.toContain('Limpiar filtros')
    })

    it('appears when search query is non-empty', async () => {
      mockClinics.value = [clinicA]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      await wrapper.find('#clinic-search').setValue('algo')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).toContain('Limpiar filtros')
    })

    it('clears all active filters when clicked', async () => {
      mockClinics.value = [clinicA, clinicB]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      await wrapper.find('#clinic-search').setValue('andes')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[role="status"]').text()).toContain('1')

      const clearBtn = wrapper.find('button.btn-outline-secondary')
      await clearBtn.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('[role="status"]').text()).toContain('2')
    })
  })

  // ── Premium section ────────────────────────────────────────

  describe('premium section', () => {
    it('shows the "Clínicas Destacadas" section when premium clinics exist and no filters are active', async () => {
      mockClinics.value = [clinicA, clinicB, clinicC]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(wrapper.text()).toContain('Clínicas Destacadas')
    })

    it('hides the "Clínicas Destacadas" section when no clinics have paid plans', async () => {
      mockClinics.value = [clinicA] // free only
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(wrapper.text()).not.toContain('Clínicas Destacadas')
    })

    it('hides the "Clínicas Destacadas" section when search filter is active', async () => {
      mockClinics.value = [clinicA, clinicB, clinicC]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      await wrapper.find('#clinic-search').setValue('clinica')
      await wrapper.vm.$nextTick()
      expect(wrapper.text()).not.toContain('Clínicas Destacadas')
    })

    it('shows the premium count badge', async () => {
      mockClinics.value = [clinicA, clinicB, clinicC]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const section = wrapper.find('[aria-label="Clínicas destacadas"]')
      expect(section.text()).toContain('2')
    })
  })

  // ── Error state ────────────────────────────────────────────

  describe('error state', () => {
    it('shows an error alert when error ref is set', async () => {
      mockError.value = 'Error al cargar las clínicas'
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      const alert = wrapper.find('[role="alert"]')
      expect(alert.exists()).toBe(true)
      expect(alert.text()).toContain('Error al cargar las clínicas')
    })

    it('hides the error alert when error is null', async () => {
      mockError.value = null
      mockClinics.value = [clinicA]
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Page header ────────────────────────────────────────────

  describe('page header', () => {
    it('renders the "Clínicas Veterinarias" heading', async () => {
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(wrapper.find('h1').text()).toContain('Clínicas Veterinarias')
    })

    it('renders a descriptive subtitle', async () => {
      const wrapper = await mountSuspended(ClinicList, {
        global: { stubs: { NuxtLink: true, ClinicCard: ClinicCardStub } },
      })
      expect(wrapper.text()).toContain('cuidado de tu mascota')
    })
  })
})
