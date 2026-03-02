// ============================================================
// ShelterList.test.ts
// Tests for the ShelterList component (adoption listings directory).
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// calls useShelters() which internally calls useApi() and useSheltersStore().
// We mock useShelters at the composable boundary so we can control
// the store state and stub fetchAdoptionListings without making HTTP calls.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ShelterList from './ShelterList.vue'
import type { AdoptionListing } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeAdoptionListing(overrides: Partial<AdoptionListing> = {}): AdoptionListing {
  return {
    id: 1,
    shelter_id: 1,
    name: 'Max',
    species: 'dog',
    breed: 'Labrador',
    age: 2,
    weight: 25.5,
    gender: 'male',
    photo_url: 'https://example.com/max.jpg',
    story: 'Un perro muy cariñoso',
    city: 'Bogotá',
    country: 'Colombia',
    status: 'available',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const listingA = makeAdoptionListing({ id: 1, name: 'Max', species: 'dog', city: 'Bogotá' })
const listingB = makeAdoptionListing({ id: 2, name: 'Luna', species: 'cat', city: 'Medellín' })
const listingC = makeAdoptionListing({ id: 3, name: 'Toby', species: 'dog', city: 'Cali' })

// ── useShelters mock ──────────────────────────────────────────

const mockFetchAdoptionListings = vi.fn()
const mockError = ref<string | null>(null)
const mockAdoptionListings = ref<AdoptionListing[]>([])
const mockIsLoading = ref(false)

vi.mock('../composables/useShelters', () => ({
  useShelters: () => ({
    fetchAdoptionListings: mockFetchAdoptionListings,
    error: mockError,
    sheltersStore: {
      get adoptionListings() { return mockAdoptionListings.value },
      get isLoading() { return mockIsLoading.value },
    },
  }),
}))

// ── Suite ─────────────────────────────────────────────────────

describe('ShelterList', () => {
  beforeEach(() => {
    mockFetchAdoptionListings.mockReset()
    mockFetchAdoptionListings.mockResolvedValue(undefined)
    mockError.value = null
    mockAdoptionListings.value = []
    mockIsLoading.value = false
  })

  // ── On mount ───────────────────────────────────────────────

  describe('on mount', () => {
    it('calls fetchAdoptionListings on mount', async () => {
      await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(mockFetchAdoptionListings).toHaveBeenCalledTimes(1)
    })

    it('calls fetchAdoptionListings with no arguments', async () => {
      await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(mockFetchAdoptionListings).toHaveBeenCalledWith()
    })
  })

  // ── Loading skeleton ───────────────────────────────────────

  describe('loading state', () => {
    it('shows 6 skeleton cards while isLoading is true', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      const skeletonCards = wrapper.findAll('[aria-hidden="true"]')
      expect(skeletonCards.length).toBeGreaterThanOrEqual(6)
    })

    it('renders the loading region with aria-busy="true"', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      const busyRegion = wrapper.find('[aria-busy="true"]')
      expect(busyRegion.exists()).toBe(true)
    })

    it('does not show the empty state while loading', async () => {
      mockIsLoading.value = true
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).not.toContain('No hay mascotas en adopción')
    })
  })

  // ── Empty state ────────────────────────────────────────────

  describe('empty state (no listings)', () => {
    it('shows the "No hay mascotas en adopción" heading when listings is empty', async () => {
      mockAdoptionListings.value = []
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).toContain('No hay mascotas en adopción')
    })

    it('does not render listing cards in the empty state', async () => {
      mockAdoptionListings.value = []
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: { template: '<div class="listing-card-stub" />' } } },
      })
      expect(wrapper.findAll('.listing-card-stub')).toHaveLength(0)
    })
  })

  // ── Listing grid (data loaded) ─────────────────────────────

  describe('listing grid', () => {
    it('renders an AdoptionPetCard for each listing', async () => {
      mockAdoptionListings.value = [listingA, listingB, listingC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: { template: '<div class="listing-card-stub" />' } } },
      })
      expect(wrapper.findAll('.listing-card-stub')).toHaveLength(3)
    })

    it('does not show the empty state when listings are loaded', async () => {
      mockAdoptionListings.value = [listingA]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).not.toContain('No hay mascotas en adopción')
    })

    it('shows the result count when listings are loaded', async () => {
      mockAdoptionListings.value = [listingA, listingB]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).toContain('2')
      expect(wrapper.text()).toContain('mascotas encontradas')
    })

    it('shows singular "mascota encontrada" when exactly 1 result', async () => {
      mockAdoptionListings.value = [listingA]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).toContain('1 mascota encontrada')
    })
  })

  // ── Search filter ──────────────────────────────────────────

  describe('search filter', () => {
    it('filters listings by name (case-insensitive)', async () => {
      mockAdoptionListings.value = [listingA, listingB, listingC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: { template: '<div class="listing-card-stub" />' } } },
      })

      const searchInput = wrapper.find('input[type="search"]')
      await searchInput.setValue('luna')

      expect(wrapper.findAll('.listing-card-stub')).toHaveLength(1)
    })

    it('filters listings by city (case-insensitive)', async () => {
      mockAdoptionListings.value = [listingA, listingB, listingC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: { template: '<div class="listing-card-stub" />' } } },
      })

      const searchInput = wrapper.find('input[type="search"]')
      await searchInput.setValue('medellín')

      expect(wrapper.findAll('.listing-card-stub')).toHaveLength(1)
    })

    it('shows no-results state when search term does not match any listing', async () => {
      mockAdoptionListings.value = [listingA, listingB]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })

      await wrapper.find('input[type="search"]').setValue('xyz no existe')

      expect(wrapper.text()).toContain('Sin resultados')
    })

    it('shows the "Limpiar filtros" button when a search query is active', async () => {
      mockAdoptionListings.value = [listingA]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })

      await wrapper.find('input[type="search"]').setValue('max')

      expect(wrapper.text()).toContain('Limpiar filtros')
    })
  })

  // ── Species filter ─────────────────────────────────────────

  describe('species filter', () => {
    it('filters listings to only those matching the selected species', async () => {
      mockAdoptionListings.value = [listingA, listingB, listingC] // A=dog, B=cat, C=dog
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: { template: '<div class="listing-card-stub" />' } } },
      })

      const speciesSelect = wrapper.find('#listing-species')
      await speciesSelect.setValue('cat')

      expect(wrapper.findAll('.listing-card-stub')).toHaveLength(1)
    })

    it('filters to dogs when "dog" is selected', async () => {
      mockAdoptionListings.value = [listingA, listingB, listingC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: { template: '<div class="listing-card-stub" />' } } },
      })

      await wrapper.find('#listing-species').setValue('dog')

      expect(wrapper.findAll('.listing-card-stub')).toHaveLength(2)
    })
  })

  // ── Clear filters ──────────────────────────────────────────

  describe('Limpiar filtros button', () => {
    it('does not show "Limpiar filtros" when no filters are active', async () => {
      mockAdoptionListings.value = [listingA]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      const buttons = wrapper.findAll('button')
      const clearBtn = buttons.find(b => b.text() === 'Limpiar filtros')
      expect(clearBtn).toBeUndefined()
    })

    it('clicking "Limpiar filtros" resets the search query', async () => {
      mockAdoptionListings.value = [listingA, listingB, listingC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: { template: '<div class="listing-card-stub" />' } } },
      })

      await wrapper.find('input[type="search"]').setValue('luna')
      expect(wrapper.findAll('.listing-card-stub')).toHaveLength(1)

      const clearBtn = wrapper.findAll('button').find(b => b.text() === 'Limpiar filtros')!
      await clearBtn.trigger('click')

      expect(wrapper.findAll('.listing-card-stub')).toHaveLength(3)
    })

    it('clicking "Limpiar filtros" in the no-results panel also resets filters', async () => {
      mockAdoptionListings.value = [listingA, listingB]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: { template: '<div class="listing-card-stub" />' } } },
      })

      await wrapper.find('input[type="search"]').setValue('xyz no existe')
      expect(wrapper.text()).toContain('Sin resultados')

      const clearBtns = wrapper.findAll('button').filter(b => b.text() === 'Limpiar filtros')
      await clearBtns[0].trigger('click')

      expect(wrapper.findAll('.listing-card-stub')).toHaveLength(2)
      expect(wrapper.text()).not.toContain('Sin resultados')
    })
  })

  // ── Result count ───────────────────────────────────────────

  describe('result count display', () => {
    it('shows the correct count when filters narrow the result set', async () => {
      mockAdoptionListings.value = [listingA, listingB, listingC]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })

      await wrapper.find('#listing-species').setValue('cat')

      expect(wrapper.text()).toContain('1 mascota encontrada')
    })

    it('shows the result count with role="status" for screen readers', async () => {
      mockAdoptionListings.value = [listingA]
      const wrapper = await mountSuspended(ShelterList, {
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })

      const status = wrapper.find('[role="status"]')
      expect(status.exists()).toBe(true)
    })
  })
})
