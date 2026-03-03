// ============================================================
// ShelterDetail.test.ts
// Tests for the ShelterDetail component (public shelter profile).
//
// Strategy: mountSuspended from @nuxt/test-utils resolves Nuxt
// auto-imports. We mock useShelters at the composable boundary
// to control store state and stub API calls.
//
// Key design points:
//   - Fetches shelter via fetchShelterById(numericId) on mount.
//   - Shows shelter profile with logo, name, verified badge,
//     description, contact (sanitized), and website.
//   - "Sus mascotas en adopción" section filters adoptionListings
//     by shelter_id.
//   - Back link always points to /shelters.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ShelterDetail from './ShelterDetail.vue'
import type { Shelter, AdoptionListing } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeShelter(overrides: Partial<Shelter> = {}): Shelter {
  return {
    id: 1,
    organization_name: 'Refugio Esperanza',
    email: 'contacto@refugio.com',
    description: 'Un refugio dedicado a rescatar animales abandonados.',
    country: 'Colombia',
    city: 'Bogotá',
    phone_country_code: '+57',
    phone: '3001234567',
    logo_url: 'https://example.com/logo.jpg',
    website: 'https://refugioesperanza.org',
    verified: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

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
    story: 'Un perro cariñoso',
    city: 'Bogotá',
    country: 'Colombia',
    status: 'available',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const defaultShelter = makeShelter()
const listingA = makeAdoptionListing({ id: 1, shelter_id: 1, name: 'Max' })
const listingB = makeAdoptionListing({ id: 2, shelter_id: 1, name: 'Luna' })
const listingOther = makeAdoptionListing({ id: 3, shelter_id: 99, name: 'Toby' })

// ── useShelters mock ──────────────────────────────────────────

const mockFetchShelterById = vi.fn()
const mockFetchAdoptionListings = vi.fn()
const mockError = ref<string | null>(null)
const mockSelectedShelter = ref<Shelter | null>(null)
const mockAdoptionListings = ref<AdoptionListing[]>([])
const mockIsLoading = ref(false)

vi.mock('../composables/useShelters', () => ({
  useShelters: () => ({
    fetchShelterById: mockFetchShelterById,
    fetchAdoptionListings: mockFetchAdoptionListings,
    error: mockError,
    sheltersStore: {
      get selectedShelter() { return mockSelectedShelter.value },
      get adoptionListings() { return mockAdoptionListings.value },
      get isLoading() { return mockIsLoading.value },
      clearSelectedShelter: vi.fn(),
    },
  }),
}))

// ── NuxtLink stub ─────────────────────────────────────────────
const NuxtLinkHrefStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

// ── Suite ─────────────────────────────────────────────────────

describe('ShelterDetail', () => {
  beforeEach(() => {
    mockFetchShelterById.mockReset()
    mockFetchShelterById.mockResolvedValue(null)
    mockFetchAdoptionListings.mockReset()
    mockFetchAdoptionListings.mockResolvedValue(undefined)
    mockError.value = null
    mockSelectedShelter.value = null
    mockAdoptionListings.value = []
    mockIsLoading.value = false
  })

  // ── Profile rendering ──────────────────────────────────────

  describe('profile rendering', () => {
    it('renders the shelter organization_name', async () => {
      mockSelectedShelter.value = defaultShelter
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).toContain('Refugio Esperanza')
    })

    it('renders the city and country', async () => {
      mockSelectedShelter.value = defaultShelter
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).toContain('Bogotá, Colombia')
    })

    it('renders the description when provided', async () => {
      mockSelectedShelter.value = defaultShelter
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).toContain('Un refugio dedicado a rescatar animales abandonados.')
    })

    it('does not render description section when description is undefined', async () => {
      mockSelectedShelter.value = makeShelter({ description: undefined })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).not.toContain('Acerca del refugio')
    })

    it('renders the "not found" state when selectedShelter is null and not loading', async () => {
      mockSelectedShelter.value = null
      mockIsLoading.value = false
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '999' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).toContain('Refugio no encontrado')
    })
  })

  // ── Verified badge ──────────────────────────────────────────

  describe('verified badge', () => {
    it('shows the "Verificado" badge when shelter is verified', async () => {
      mockSelectedShelter.value = makeShelter({ verified: true })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).toContain('Verificado')
    })

    it('hides the "Verificado" badge when shelter is not verified', async () => {
      mockSelectedShelter.value = makeShelter({ verified: false })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      const badge = wrapper.find('[aria-label="Refugio verificado por Mopetoo"]')
      expect(badge.exists()).toBe(false)
    })
  })

  // ── Logo rendering ──────────────────────────────────────────

  describe('logo rendering', () => {
    it('renders the logo image when logo_url is a valid https URL', async () => {
      mockSelectedShelter.value = makeShelter({ logo_url: 'https://example.com/logo.jpg' })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/logo.jpg')
    })

    it('shows the 🏠 fallback when logo_url is undefined', async () => {
      mockSelectedShelter.value = makeShelter({ logo_url: undefined })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏠')
    })

    it('shows the 🏠 fallback when logo_url is a javascript: URI', async () => {
      mockSelectedShelter.value = makeShelter({ logo_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
    })
  })

  // ── Contact section ─────────────────────────────────────────

  describe('contact section', () => {
    it('renders a tel: link when phone is a valid phone number', async () => {
      mockSelectedShelter.value = makeShelter({ phone: '+57 300 1234567' })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      const telLink = wrapper.find('a[href^="tel:"]')
      expect(telLink.exists()).toBe(true)
      expect(telLink.text()).toContain('+57 300 1234567')
    })

    it('does NOT render a tel: link when phone contains injection chars', async () => {
      mockSelectedShelter.value = makeShelter({ phone: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
    })

    it('renders a mailto: link when email is a valid email', async () => {
      mockSelectedShelter.value = makeShelter({ email: 'contacto@refugio.com' })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      const mailLink = wrapper.find('a[href^="mailto:"]')
      expect(mailLink.exists()).toBe(true)
      expect(mailLink.text()).toContain('contacto@refugio.com')
    })

    it('does NOT render a mailto: link when email is invalid', async () => {
      mockSelectedShelter.value = makeShelter({ email: 'not-an-email <script>' })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
    })

    it('renders the website link when website is a valid https URL', async () => {
      mockSelectedShelter.value = makeShelter({ website: 'https://refugio.org' })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      const link = wrapper.find('a[href="https://refugio.org"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('target')).toBe('_blank')
    })

    it('does NOT render the website link when website is a javascript: URI', async () => {
      mockSelectedShelter.value = makeShelter({ website: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.find('a[href="javascript:alert(1)"]').exists()).toBe(false)
    })

    it('does NOT render the website link when website is undefined', async () => {
      mockSelectedShelter.value = makeShelter({ website: undefined })
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      const websiteLinks = wrapper.findAll('a').filter(a => {
        const href = a.attributes('href') ?? ''
        return href.startsWith('https://') && !href.startsWith('https://wa.me/')
      })
      expect(websiteLinks.length).toBe(0)
    })
  })

  // ── Adoption listings section ──────────────────────────────

  describe('adoption listings section', () => {
    it('shows "Sus mascotas en adopción" heading when shelter has listings', async () => {
      mockSelectedShelter.value = defaultShelter
      mockAdoptionListings.value = [listingA, listingB]
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: { template: '<div class="pet-card-stub" />' } } },
      })
      expect(wrapper.text()).toContain('Sus mascotas en adopción')
    })

    it('renders AdoptionPetCards only for listings matching the shelter_id', async () => {
      mockSelectedShelter.value = defaultShelter
      mockAdoptionListings.value = [listingA, listingB, listingOther]
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: { template: '<div class="pet-card-stub" />' } } },
      })
      expect(wrapper.findAll('.pet-card-stub')).toHaveLength(2)
    })

    it('does not show adoption listings section when shelter has no listings', async () => {
      mockSelectedShelter.value = defaultShelter
      mockAdoptionListings.value = [listingOther] // only listing from different shelter
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).not.toContain('Sus mascotas en adopción')
    })
  })

  // ── Fetch on mount ─────────────────────────────────────────

  describe('fetch on mount', () => {
    it('calls fetchShelterById with the numeric shelter id', async () => {
      await mountSuspended(ShelterDetail, {
        props: { shelterId: '5' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(mockFetchShelterById).toHaveBeenCalledWith(5)
    })

    it('does NOT call fetchShelterById when shelterId is not a valid number', async () => {
      await mountSuspended(ShelterDetail, {
        props: { shelterId: 'abc' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(mockFetchShelterById).not.toHaveBeenCalled()
    })

    it('does NOT call fetchShelterById when shelterId is zero', async () => {
      await mountSuspended(ShelterDetail, {
        props: { shelterId: '0' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(mockFetchShelterById).not.toHaveBeenCalled()
    })
  })

  // ── Back navigation ────────────────────────────────────────

  describe('back navigation', () => {
    it('renders the "Volver al directorio" back link', async () => {
      mockSelectedShelter.value = defaultShelter
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub, AdoptionPetCard: true } },
      })
      expect(wrapper.text()).toContain('Volver al directorio')
    })

    it('back link points to /shelters', async () => {
      mockSelectedShelter.value = defaultShelter
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub, AdoptionPetCard: true } },
      })
      const backLink = wrapper.find('a[href="/shelters"]')
      expect(backLink.exists()).toBe(true)
    })
  })

  // ── Error alert ────────────────────────────────────────────

  describe('error alert', () => {
    it('shows the error alert when error is set', async () => {
      mockError.value = 'No se pudo cargar el refugio'
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.find('.alert-danger').exists()).toBe(true)
      expect(wrapper.text()).toContain('No se pudo cargar el refugio')
    })
  })

  // ── Loading state ──────────────────────────────────────────

  describe('loading state', () => {
    it('shows skeleton while loading and shelter is null', async () => {
      mockIsLoading.value = true
      mockSelectedShelter.value = null
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('does not show skeleton when shelter data is loaded', async () => {
      mockIsLoading.value = false
      mockSelectedShelter.value = defaultShelter
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })
  })

  // ── Accessibility ──────────────────────────────────────────

  describe('accessibility', () => {
    it('section has aria-label "Detalle de refugio"', async () => {
      const wrapper = await mountSuspended(ShelterDetail, {
        props: { shelterId: '1' },
        global: { stubs: { NuxtLink: true, AdoptionPetCard: true } },
      })
      expect(wrapper.find('section[aria-label="Detalle de refugio"]').exists()).toBe(true)
    })
  })
})
