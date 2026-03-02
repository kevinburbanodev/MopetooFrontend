// ============================================================
// ShelterDirectory.test.ts
// Tests for the ShelterDirectory component (public shelter directory).
//
// Strategy: mountSuspended resolves Nuxt auto-imports. We mock
// useShelters at the composable boundary to control store state
// and stub fetchShelters without making HTTP calls.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ShelterDirectory from './ShelterDirectory.vue'
import type { Shelter } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeShelter(overrides: Partial<Shelter> = {}): Shelter {
  return {
    id: 1,
    organization_name: 'Refugio Esperanza',
    email: 'contacto@refugio.com',
    description: 'Un refugio dedicado a rescatar animales.',
    country: 'Colombia',
    city: 'Bogotá',
    phone_country_code: '+57',
    phone: '3001234567',
    logo_url: 'https://example.com/logo.jpg',
    verified: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const shelterA = makeShelter({ id: 1, organization_name: 'Refugio Esperanza', city: 'Bogotá' })
const shelterB = makeShelter({ id: 2, organization_name: 'Patitas Felices', city: 'Medellín', description: 'Salvamos gatitos' })
const shelterC = makeShelter({ id: 3, organization_name: 'Hogar Animal', city: 'Cali' })

// ── useShelters mock ──────────────────────────────────────────

const mockFetchShelters = vi.fn()
const mockError = ref<string | null>(null)
const mockShelters = ref<Shelter[]>([])
const mockIsLoading = ref(false)

vi.mock('../composables/useShelters', () => ({
  useShelters: () => ({
    fetchShelters: mockFetchShelters,
    error: mockError,
    sheltersStore: {
      get shelters() { return mockShelters.value },
      get isLoading() { return mockIsLoading.value },
    },
  }),
}))

// ── Suite ─────────────────────────────────────────────────────

describe('ShelterDirectory', () => {
  beforeEach(() => {
    mockFetchShelters.mockReset()
    mockFetchShelters.mockResolvedValue(undefined)
    mockError.value = null
    mockShelters.value = []
    mockIsLoading.value = false
  })

  // ── On mount ───────────────────────────────────────────────

  describe('on mount', () => {
    it('calls fetchShelters on mount', async () => {
      await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(mockFetchShelters).toHaveBeenCalledTimes(1)
    })

    it('calls fetchShelters with no arguments', async () => {
      await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(mockFetchShelters).toHaveBeenCalledWith()
    })
  })

  // ── Loading skeleton ───────────────────────────────────────

  describe('loading state', () => {
    it('shows skeleton cards while isLoading is true', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      const busyRegion = wrapper.find('[aria-busy="true"]')
      expect(busyRegion.exists()).toBe(true)
    })

    it('renders the loading region with aria-label "Cargando refugios"', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.find('[aria-label="Cargando refugios"]').exists()).toBe(true)
    })

    it('does not show the empty state while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.text()).not.toContain('No hay refugios disponibles')
    })
  })

  // ── Empty state ────────────────────────────────────────────

  describe('empty state (no shelters)', () => {
    it('shows "No hay refugios disponibles" when shelters list is empty', async () => {
      mockShelters.value = []
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.text()).toContain('No hay refugios disponibles')
    })

    it('does not render shelter cards in the empty state', async () => {
      mockShelters.value = []
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })
      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(0)
    })
  })

  // ── Shelter grid (data loaded) ─────────────────────────────

  describe('shelter grid', () => {
    it('renders a ShelterCard for each shelter', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })
      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(3)
    })

    it('does not show the empty state when shelters are loaded', async () => {
      mockShelters.value = [shelterA]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.text()).not.toContain('No hay refugios disponibles')
    })

    it('shows the result count when shelters are loaded', async () => {
      mockShelters.value = [shelterA, shelterB]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('refugios encontrados')
    })

    it('shows singular "refugio encontrado" when exactly 1 result', async () => {
      mockShelters.value = [shelterA]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.text()).toContain('1 refugio encontrado')
    })
  })

  // ── Search filter ──────────────────────────────────────────

  describe('search filter', () => {
    it('filters shelters by organization_name (case-insensitive)', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      await wrapper.find('input[type="search"]').setValue('patitas')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(1)
    })

    it('filters shelters by city (case-insensitive)', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      await wrapper.find('input[type="search"]').setValue('medellín')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(1)
    })

    it('filters shelters by description (case-insensitive)', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      await wrapper.find('input[type="search"]').setValue('gatitos')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(1)
    })

    it('shows no-results state when search term does not match', async () => {
      mockShelters.value = [shelterA, shelterB]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })

      await wrapper.find('input[type="search"]').setValue('xyz no existe')

      expect(wrapper.text()).toContain('Sin resultados')
    })

    it('shows the "Limpiar filtros" button when a search query is active', async () => {
      mockShelters.value = [shelterA]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })

      await wrapper.find('input[type="search"]').setValue('refugio')

      expect(wrapper.text()).toContain('Limpiar filtros')
    })
  })

  // ── City filter ────────────────────────────────────────────

  describe('city filter', () => {
    it('filters shelters by selected city', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      await wrapper.find('#shelter-city').setValue('Bogotá')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(1)
    })

    it('populates city dropdown from unique shelter cities', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })

      const options = wrapper.findAll('#shelter-city option')
      // "Todas las ciudades" + 3 unique cities
      expect(options).toHaveLength(4)
    })
  })

  // ── Clear filters ──────────────────────────────────────────

  describe('Limpiar filtros button', () => {
    it('does not show "Limpiar filtros" when no filters are active', async () => {
      mockShelters.value = [shelterA]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      const buttons = wrapper.findAll('button')
      const clearBtn = buttons.find(b => b.text() === 'Limpiar filtros')
      expect(clearBtn).toBeUndefined()
    })

    it('clicking "Limpiar filtros" resets the search query', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      await wrapper.find('input[type="search"]').setValue('patitas')
      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(1)

      const clearBtn = wrapper.findAll('button').find(b => b.text() === 'Limpiar filtros')!
      await clearBtn.trigger('click')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(3)
    })

    it('clicking "Limpiar filtros" in the no-results panel resets filters', async () => {
      mockShelters.value = [shelterA, shelterB]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      await wrapper.find('input[type="search"]').setValue('xyz no existe')
      expect(wrapper.text()).toContain('Sin resultados')

      const clearBtns = wrapper.findAll('button').filter(b => b.text() === 'Limpiar filtros')
      await clearBtns[0].trigger('click')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(2)
      expect(wrapper.text()).not.toContain('Sin resultados')
    })
  })

  // ── Error state ────────────────────────────────────────────

  describe('error state', () => {
    it('shows the error alert when error is set', async () => {
      mockError.value = 'No se pudieron cargar los refugios'
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.find('.alert-danger').exists()).toBe(true)
      expect(wrapper.text()).toContain('No se pudieron cargar los refugios')
    })
  })

  // ── Result count ───────────────────────────────────────────

  describe('result count display', () => {
    it('shows the correct count when filters narrow the result set', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })

      await wrapper.find('#shelter-city').setValue('Cali')

      expect(wrapper.text()).toContain('1 refugio encontrado')
    })

    it('shows the result count with role="status" for screen readers', async () => {
      mockShelters.value = [shelterA]
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })

      const status = wrapper.find('[role="status"]')
      expect(status.exists()).toBe(true)
    })
  })

  // ── Accessibility ──────────────────────────────────────────

  describe('accessibility', () => {
    it('section has aria-label "Directorio de refugios"', async () => {
      const wrapper = await mountSuspended(ShelterDirectory, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.find('section[aria-label="Directorio de refugios"]').exists()).toBe(true)
    })
  })
})
