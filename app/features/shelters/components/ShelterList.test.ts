// ============================================================
// ShelterList.test.ts
// Tests for the ShelterList component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// calls useShelters() which internally calls useApi() and useSheltersStore().
// We mock useShelters at the composable boundary so we can control
// the store state and stub fetchShelters without making HTTP calls.
//
// Key design points:
//   - On mount, fetchShelters() is called to load the directory.
//   - While isLoading is true: skeleton cards are shown (SKELETON_COUNT = 6).
//   - When shelters array is empty (post-load): empty state is shown.
//   - When shelters are loaded: ShelterCard components are rendered.
//   - Client-side search (name/city/description) and species filters.
//   - "Limpiar filtros" button appears only when filters are active.
//   - Result count is shown when there are results.
//
// Mocking:
//   - useShelters is mocked via vi.mock because it is a project composable
//     (not a Nuxt auto-import that requires mockNuxtImport).
//   - The mock exposes a sheltersStore stub with reactive state we control.
//
// What this suite does NOT cover intentionally:
//   - CSS animations or SCSS styles.
//   - Error alert display — that state comes through the composable's
//     error ref which is covered in useShelters.test.ts.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref, computed } from 'vue'
import ShelterList from './ShelterList.vue'
import type { Shelter } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeShelter(overrides: Partial<Shelter> = {}): Shelter {
  return {
    id: '1',
    name: 'Refugio Esperanza',
    description: 'Un refugio para animales necesitados',
    location: 'Bogotá, Colombia',
    city: 'Bogotá',
    address: 'Calle 100 #20-30',
    phone: '+57 300 000 0000',
    email: 'info@refugio.com',
    website: 'https://refugio.com',
    photo_url: 'https://example.com/shelter.jpg',
    species: ['dogs', 'cats'],
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const shelterA = makeShelter({ id: '1', name: 'Refugio Esperanza', city: 'Bogotá', species: ['dogs', 'cats'], description: 'Refugio grande en Bogotá' })
const shelterB = makeShelter({ id: '2', name: 'Patitas Felices', city: 'Medellín', species: ['cats'], description: 'Solo gatos en Medellín', is_verified: false })
const shelterC = makeShelter({ id: '3', name: 'Amigos Peludos', city: 'Cali', species: ['dogs'], description: 'Perros en adopción en Cali', is_verified: false })

// ── useShelters mock ──────────────────────────────────────────
// We mock the composable so we can control the store state
// and stub fetchShelters without real HTTP calls.

const mockFetchShelters = vi.fn()
const mockError = ref<string | null>(null)
const mockShelters = ref<Shelter[]>([])
const mockIsLoading = ref(false)

vi.mock('../composables/useShelters', () => ({
  useShelters: () => ({
    fetchShelters: mockFetchShelters,
    error: mockError,
    sheltersStore: {
      // Expose reactive state that the component reads directly
      get shelters() { return mockShelters.value },
      get isLoading() { return mockIsLoading.value },
    },
  }),
}))

// ── Suite ─────────────────────────────────────────────────────

describe('ShelterList', () => {
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
      await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(mockFetchShelters).toHaveBeenCalledTimes(1)
    })

    it('calls fetchShelters with no arguments (no initial filters)', async () => {
      await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(mockFetchShelters).toHaveBeenCalledWith()
    })
  })

  // ── Loading skeleton ───────────────────────────────────────

  describe('loading state', () => {
    it('shows 6 skeleton cards while isLoading is true', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      // Skeleton cards are identified by the aria-hidden="true" on each skeleton article
      const skeletonCards = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonCards.length).toBeGreaterThanOrEqual(6)
    })

    it('renders the loading region with aria-busy="true"', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      const busyRegion = wrapper.find('[aria-busy="true"]')
      expect(busyRegion.exists()).toBe(true)
    })

    it('does not show the empty state while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.text()).not.toContain('No hay refugios disponibles')
    })
  })

  // ── Empty state ────────────────────────────────────────────

  describe('empty state (no shelters)', () => {
    it('shows the "No hay refugios disponibles" heading when shelters is empty', async () => {
      mockShelters.value = []
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.text()).toContain('No hay refugios disponibles')
    })

    it('does not render shelter cards in the empty state', async () => {
      mockShelters.value = []
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })
      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(0)
    })
  })

  // ── Shelter grid (data loaded) ─────────────────────────────

  describe('shelter grid', () => {
    it('renders a ShelterCard for each shelter', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })
      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(3)
    })

    it('does not show the empty state when shelters are loaded', async () => {
      mockShelters.value = [shelterA]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.text()).not.toContain('No hay refugios disponibles')
    })

    it('shows the result count when shelters are loaded', async () => {
      mockShelters.value = [shelterA, shelterB]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('refugios encontrados')
    })

    it('shows singular "refugio encontrado" when exactly 1 result', async () => {
      mockShelters.value = [shelterA]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      expect(wrapper.text()).toContain('1 refugio encontrado')
    })
  })

  // ── Search filter ──────────────────────────────────────────

  describe('search filter', () => {
    it('filters shelters by name (case-insensitive)', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      const searchInput = wrapper.find('input[type="search"]')
      await searchInput.setValue('esperanza')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(1)
    })

    it('filters shelters by city (case-insensitive)', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      const searchInput = wrapper.find('input[type="search"]')
      await searchInput.setValue('medellín')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(1)
    })

    it('filters shelters by description (case-insensitive)', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      const searchInput = wrapper.find('input[type="search"]')
      await searchInput.setValue('solo gatos')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(1)
    })

    it('shows no-results state when search term does not match any shelter', async () => {
      mockShelters.value = [shelterA, shelterB]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })

      await wrapper.find('input[type="search"]').setValue('xyz no existe')

      expect(wrapper.text()).toContain('Sin resultados')
    })

    it('shows the "Limpiar filtros" button when a search query is active', async () => {
      mockShelters.value = [shelterA]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })

      await wrapper.find('input[type="search"]').setValue('esperanza')

      expect(wrapper.text()).toContain('Limpiar filtros')
    })
  })

  // ── Species filter ─────────────────────────────────────────

  describe('species filter', () => {
    it('filters shelters to only those accepting the selected species', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC] // A has dogs+cats, B cats only, C dogs only
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      const select = wrapper.find('select')
      await select.setValue('cats')

      // shelterA (dogs+cats) and shelterB (cats only) match
      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(2)
    })

    it('filters shelters to only dogs when "dogs" is selected', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC] // A has dogs, B does not
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      await wrapper.find('select').setValue('dogs')

      // shelterA (dogs+cats) and shelterC (dogs only) match
      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(2)
    })

    it('shows "Limpiar filtros" when a species filter is active', async () => {
      mockShelters.value = [shelterA]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })

      await wrapper.find('select').setValue('dogs')

      expect(wrapper.text()).toContain('Limpiar filtros')
    })
  })

  // ── Combined filters ───────────────────────────────────────

  describe('combined search and species filters', () => {
    it('applies search and species filters simultaneously', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      // Species "dogs" matches A and C; search "Bogotá" narrows to A only
      await wrapper.find('select').setValue('dogs')
      await wrapper.find('input[type="search"]').setValue('Bogotá')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(1)
    })
  })

  // ── Clear filters ──────────────────────────────────────────

  describe('Limpiar filtros button', () => {
    it('does not show "Limpiar filtros" when no filters are active', async () => {
      mockShelters.value = [shelterA]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })
      // No input into filters — button should not be present
      const buttons = wrapper.findAll('button')
      const clearBtn = buttons.find(b => b.text() === 'Limpiar filtros')
      expect(clearBtn).toBeUndefined()
    })

    it('clicking "Limpiar filtros" resets the search query', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      await wrapper.find('input[type="search"]').setValue('esperanza')
      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(1)

      const clearBtn = wrapper.findAll('button').find(b => b.text() === 'Limpiar filtros')!
      await clearBtn.trigger('click')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(3)
    })

    it('clicking "Limpiar filtros" in the no-results panel also resets filters', async () => {
      mockShelters.value = [shelterA, shelterB]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: { template: '<div class="shelter-card-stub" />' } } },
      })

      await wrapper.find('input[type="search"]').setValue('xyz no existe')
      expect(wrapper.text()).toContain('Sin resultados')

      // The no-results panel has a "Limpiar filtros" button
      const clearBtns = wrapper.findAll('button').filter(b => b.text() === 'Limpiar filtros')
      await clearBtns[0].trigger('click')

      expect(wrapper.findAll('.shelter-card-stub')).toHaveLength(2)
      expect(wrapper.text()).not.toContain('Sin resultados')
    })
  })

  // ── Result count ───────────────────────────────────────────

  describe('result count display', () => {
    it('shows the correct count when filters narrow the result set', async () => {
      mockShelters.value = [shelterA, shelterB, shelterC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })

      await wrapper.find('select').setValue('cats') // matches A and B

      expect(wrapper.text()).toContain('2 refugios encontrados')
    })

    it('shows the result count with role="status" for screen readers', async () => {
      mockShelters.value = [shelterA]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, ShelterCard: true } },
      })

      const status = wrapper.find('[role="status"]')
      expect(status.exists()).toBe(true)
    })
  })
})
