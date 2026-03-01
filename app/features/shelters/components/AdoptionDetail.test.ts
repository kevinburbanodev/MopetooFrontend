// ============================================================
// AdoptionDetail.test.ts
// Tests for the AdoptionDetail component.
//
// Strategy: mountSuspended from @nuxt/test-utils resolves Nuxt
// auto-imports. We control state by mocking useShelters at the
// composable boundary and injecting auth state by setting the
// auth store's token directly.
//
// Key design points:
//   - Listing data is read from sheltersStore.selectedListing.
//   - No shelterId dependency — fetches via GET /api/adoption-listings/:id.
//   - Back link always points to /shelter.
//   - Story field (not description).
//   - Age field in years (not age_months).
//   - No size/vaccinated/neutered displays.
//   - Adoption form uses submitAdoptionRequest(listing.id, message).
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref, nextTick } from 'vue'
import AdoptionDetail from './AdoptionDetail.vue'
import type { AdoptionListing, AdoptionRequest } from '../types'

// ── localStorage stub (module-level) ─────────────────────────

const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))
vi.stubGlobal('localStorage', localStorageMock)

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
    story: 'Un perro muy cariñoso que busca hogar.',
    city: 'Bogotá',
    country: 'Colombia',
    status: 'available',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const availableListing = makeAdoptionListing({ status: 'available' })
const pendingListing = makeAdoptionListing({ status: 'pending', name: 'Luna' })
const adoptedListing = makeAdoptionListing({ status: 'adopted', name: 'Toby' })

// ── useShelters mock ──────────────────────────────────────────

const mockFetchAdoptionListingById = vi.fn()
const mockSubmitAdoptionRequest = vi.fn()
const mockError = ref<string | null>(null)
const mockSelectedListing = ref<AdoptionListing | null>(null)
const mockIsLoading = ref(false)

vi.mock('../composables/useShelters', () => ({
  useShelters: () => ({
    fetchAdoptionListingById: mockFetchAdoptionListingById,
    submitAdoptionRequest: mockSubmitAdoptionRequest,
    error: mockError,
    sheltersStore: {
      get selectedListing() { return mockSelectedListing.value },
      get adoptionListings() { return [] },
      get isLoading() { return mockIsLoading.value },
      setSelectedListing: vi.fn(),
      clearSelectedListing: vi.fn(),
    },
  }),
}))

// ── Suite ─────────────────────────────────────────────────────

describe('AdoptionDetail', () => {
  beforeEach(async () => {
    mockFetchAdoptionListingById.mockReset()
    mockFetchAdoptionListingById.mockResolvedValue(null)
    mockSubmitAdoptionRequest.mockReset()
    mockError.value = null
    mockSelectedListing.value = null
    mockIsLoading.value = false
    localStorageMock.getItem.mockReturnValue(null)

    const { useAuthStore } = await import('../../auth/stores/auth.store')
    useAuthStore().token = null
  })

  // ── Listing detail rendering ────────────────────────────────

  describe('listing detail rendering', () => {
    it('renders the listing name when selectedListing is set', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Max')
    })

    it('renders the species label "Perro" for species "dog"', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Perro')
    })

    it('renders the breed when breed is provided', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Labrador')
    })

    it('renders the listing story when provided', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Un perro muy cariñoso que busca hogar.')
    })

    it('renders the city and country', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá')
      expect(wrapper.text()).toContain('Colombia')
    })

    it('renders the age in years', async () => {
      mockSelectedListing.value = makeAdoptionListing({ age: 3 })
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('3 años')
    })

    it('renders the "not found" state when selectedListing is null and not loading', async () => {
      mockSelectedListing.value = null
      mockIsLoading.value = false
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '999' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Mascota no encontrada')
    })
  })

  // ── Adoption form — authenticated + available ──────────────

  describe('adoption form (authenticated user, available listing)', () => {
    it('shows the adoption form textarea when user is authenticated and listing is available', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.find('textarea').exists()).toBe(true)
    })

    it('shows the "Solicitar adopción" heading when authenticated and listing is available', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.text()).toContain('Solicitar adopción')
    })

    it('shows the "Enviar solicitud" submit button', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Enviar solicitud'))
      expect(submitBtn).toBeDefined()
    })

    it('shows the char counter with 500 chars remaining on empty textarea', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.text()).toContain('500 restantes')
    })
  })

  // ── Login CTA — unauthenticated + available ────────────────

  describe('login CTA (unauthenticated user, available listing)', () => {
    it('shows the login CTA when user is NOT authenticated and listing is available', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Inicia sesión para solicitar adopción')
    })

    it('does NOT show the adoption form textarea when unauthenticated', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('textarea').exists()).toBe(false)
    })

    it('shows a link to /login in the login CTA', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: {
          stubs: {
            NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
          },
        },
      })
      const loginLink = wrapper.find('a[href="/login"]')
      expect(loginLink.exists()).toBe(true)
    })

    it('shows a link to /register in the login CTA', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: {
          stubs: {
            NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
          },
        },
      })
      const registerLink = wrapper.find('a[href="/register"]')
      expect(registerLink.exists()).toBe(true)
    })
  })

  // ── "En proceso" status message ────────────────────────────

  describe('"pending" status section', () => {
    it('shows "Solicitud en proceso" heading when listing status is pending', async () => {
      mockSelectedListing.value = pendingListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Solicitud en proceso')
    })

    it('does NOT show the adoption form when listing is pending even when authenticated', async () => {
      mockSelectedListing.value = pendingListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.find('textarea').exists()).toBe(false)
    })
  })

  // ── "Adoptado" status message ──────────────────────────────

  describe('"adopted" status section', () => {
    it('shows "Esta mascota ya tiene un hogar" heading when listing is adopted', async () => {
      mockSelectedListing.value = adoptedListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Esta mascota ya tiene un hogar')
    })

    it('does NOT show the adoption form when listing is adopted even when authenticated', async () => {
      mockSelectedListing.value = adoptedListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.find('textarea').exists()).toBe(false)
    })
  })

  // ── Adoption form validation ───────────────────────────────

  describe('adoption form validation', () => {
    it('shows validation error div when submitting with a message shorter than 20 chars', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      await wrapper.find('textarea').setValue('Corto')
      await wrapper.find('form').trigger('submit')

      const errorDiv = wrapper.find('#adoption-message-error')
      expect(errorDiv.exists()).toBe(true)
    })

    it('does NOT call submitAdoptionRequest when message is too short', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      await wrapper.find('textarea').setValue('Demasiado corto')
      await wrapper.find('form').trigger('submit')

      expect(mockSubmitAdoptionRequest).not.toHaveBeenCalled()
    })
  })

  // ── Success state ──────────────────────────────────────────

  describe('success state after submission', () => {
    it('shows the "¡Solicitud enviada!" alert after a successful submission', async () => {
      const successRequest: AdoptionRequest = {
        id: 1, adoption_listing_id: 1, user_id: 1,
        message: 'Mi mensaje', status: 'pending',
        created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
      }
      mockSubmitAdoptionRequest.mockResolvedValue(successRequest)
      mockSelectedListing.value = availableListing

      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      const validMessage = 'Mi mensaje de adopción válido con más de 20 caracteres.'
      await wrapper.find('textarea').setValue(validMessage)
      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.text()).toContain('¡Solicitud enviada!')
    })

    it('calls submitAdoptionRequest with listing id and trimmed message', async () => {
      mockSubmitAdoptionRequest.mockResolvedValue({
        id: 1, adoption_listing_id: 1, user_id: 1,
        message: '', status: 'pending',
        created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
      })
      mockSelectedListing.value = availableListing // id: 1

      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      const validMessage = '  Quiero adoptar a Max porque tengo mucho espacio.  '
      await wrapper.find('textarea').setValue(validMessage)
      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(mockSubmitAdoptionRequest).toHaveBeenCalledWith(
        1,                                                      // listing.id (number)
        'Quiero adoptar a Max porque tengo mucho espacio.',     // trimmed
      )
    })

    it('shows the submission error alert when submitAdoptionRequest returns null', async () => {
      mockSubmitAdoptionRequest.mockResolvedValue(null)
      mockSelectedListing.value = availableListing

      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      const validMessage = 'Este mensaje tiene suficientes caracteres para ser válido en el sistema.'
      await wrapper.find('textarea').setValue(validMessage)
      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(wrapper.text()).toContain('No se pudo enviar la solicitud')
    })
  })

  // ── Back navigation ────────────────────────────────────────

  const nuxtLinkHrefStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

  describe('back navigation', () => {
    it('renders the "Volver a adopciones" back link', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: nuxtLinkHrefStub } },
      })
      expect(wrapper.text()).toContain('Volver a adopciones')
    })

    it('back link always points to /shelter', async () => {
      mockSelectedListing.value = makeAdoptionListing({ shelter_id: 42 })
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: nuxtLinkHrefStub } },
      })
      const backLink = wrapper.find('a[href="/shelter"]')
      expect(backLink.exists()).toBe(true)
    })

    it('back link does NOT include a shelter id in the path', async () => {
      mockSelectedListing.value = makeAdoptionListing({ shelter_id: 42 })
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: nuxtLinkHrefStub } },
      })
      const links = wrapper.findAll('a')
      const backLink = links.find(l => l.text().includes('Volver'))
      expect(backLink?.attributes('href')).toBe('/shelter')
    })
  })

  // ── Fetch on mount ─────────────────────────────────────────

  describe('fetchAdoptionListingById on mount', () => {
    it('calls fetchAdoptionListingById when the listing is not in the cache', async () => {
      mockSelectedListing.value = null
      await mountSuspended(AdoptionDetail, {
        props: { listingId: '5' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(mockFetchAdoptionListingById).toHaveBeenCalledWith(5)
    })
  })

  // ── Error alert ────────────────────────────────────────────

  describe('error alert', () => {
    it('shows the fetch error alert when error is set and listing is null', async () => {
      mockSelectedListing.value = null
      mockError.value = 'No se pudo cargar la mascota'
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('No se pudo cargar la mascota')
    })
  })

  // ── Accessibility ──────────────────────────────────────────

  describe('accessibility', () => {
    it('section has aria-label containing "adopción"', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const section = wrapper.find('section')
      expect(section.attributes('aria-label')).toContain('adopción')
    })

    it('the adoption form textarea has aria-required="true"', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.find('textarea').attributes('aria-required')).toBe('true')
    })

    it('the status badge has a descriptive aria-label when listing is available', async () => {
      mockSelectedListing.value = availableListing
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { listingId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('[aria-label*="Estado"]')
      expect(badge.exists()).toBe(true)
      expect(badge.attributes('aria-label')).toContain('Disponible')
    })
  })
})
