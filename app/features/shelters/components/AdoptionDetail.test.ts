// ============================================================
// AdoptionDetail.test.ts
// Tests for the AdoptionDetail component.
//
// Strategy: mountSuspended from @nuxt/test-utils resolves Nuxt
// auto-imports. We control state by mocking useShelters at the
// composable boundary and injecting auth state by setting the
// auth store's token directly (the Nuxt test env activates its own
// pinia — we must use its useAuthStore(), not create a separate one).
//
// Key design points:
//   - Pet data is read from sheltersStore.selectedAdoptionPet.
//   - The adoption form lives inside a <ClientOnly> block.
//     In the happy-dom test environment, <ClientOnly> renders its
//     default slot, so form content IS visible in tests.
//   - Adoption form visibility:
//       - pet.status === 'available' AND authStore.isAuthenticated → form
//       - pet.status === 'available' AND NOT authenticated → login CTA
//       - pet.status === 'adopted' → "Esta mascota ya tiene un hogar"
//       - pet.status === 'pending' → "Solicitud en proceso"
//   - Success state: adoptionSuccess ref set to true after submitAdoptionRequest
//   - Validation: message must be 20–500 chars; invalid shows error div
//   - Back navigation: link points to /shelter/:shelter_id when pet is loaded
//
// Mocking:
//   - useShelters: mocked via vi.mock (project composable, not Nuxt built-in)
//   - useAuthStore: accessed from the active Nuxt test env pinia; we call
//     setActivePinia(createPinia()) + useAuthStore() then set token directly
//   - localStorage: stubbed at module level via vi.hoisted (auth.client.ts
//     plugin runs at Nuxt init before any beforeEach hook — see MEMORY.md)
//   - useRoute: mocked via mockNuxtImport
//
// Nuxt environment note:
//   - import.meta.client evaluates to true in happy-dom, so <ClientOnly>
//     renders its default slot, making the adoption form visible in tests.
//
// What this suite does NOT cover intentionally:
//   - CSS animations.
//   - The onMounted cache lookup when the pet is already in adoptionPets —
//     covered separately in useShelters.test.ts.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended, mockNuxtImport } from '@nuxt/test-utils/runtime'
import { setActivePinia, createPinia } from 'pinia'
import { ref, nextTick } from 'vue'
import AdoptionDetail from './AdoptionDetail.vue'
import type { AdoptionPet, AdoptionRequest } from '../types'

// ── localStorage stub (module-level) ─────────────────────────
// The auth.client.ts plugin calls localStorage.getItem during Nuxt app
// init — before any beforeEach hook runs. We must stub at module level.

const localStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}))
vi.stubGlobal('localStorage', localStorageMock)

// ── useRoute mock ─────────────────────────────────────────────
// useRoute is a Nuxt auto-import — use mockNuxtImport, not vi.mock.

mockNuxtImport('useRoute', () => () => ({
  query: { shelterId: '1' },
  params: {},
}))

// ── Fixtures ─────────────────────────────────────────────────

function makeAdoptionPet(overrides: Partial<AdoptionPet> = {}): AdoptionPet {
  return {
    id: 'pet1',
    shelter_id: '1',
    name: 'Max',
    species: 'dog',
    breed: 'Labrador',
    age_months: 18,
    gender: 'male',
    size: 'large',
    description: 'Un perro muy cariñoso que busca hogar.',
    photo_url: 'https://example.com/max.jpg',
    status: 'available',
    vaccinated: true,
    neutered: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const availablePet = makeAdoptionPet({ status: 'available' })
const pendingPet = makeAdoptionPet({ status: 'pending', name: 'Luna' })
const adoptedPet = makeAdoptionPet({ status: 'adopted', name: 'Toby' })

// ── useShelters mock ──────────────────────────────────────────
// Control the selected pet and submission function via the mock.

const mockFetchAdoptionPetById = vi.fn()
const mockSubmitAdoptionRequest = vi.fn()
const mockError = ref<string | null>(null)
const mockSelectedAdoptionPet = ref<AdoptionPet | null>(null)
const mockIsLoading = ref(false)

vi.mock('../composables/useShelters', () => ({
  useShelters: () => ({
    fetchAdoptionPetById: mockFetchAdoptionPetById,
    submitAdoptionRequest: mockSubmitAdoptionRequest,
    error: mockError,
    sheltersStore: {
      get selectedAdoptionPet() { return mockSelectedAdoptionPet.value },
      // adoptionPets is always [] so onMounted always calls fetchAdoptionPetById
      get adoptionPets() { return [] },
      get isLoading() { return mockIsLoading.value },
      setSelectedAdoptionPet: vi.fn(),
      clearSelectedAdoptionPet: vi.fn(),
      clearSelectedShelter: vi.fn(),
    },
  }),
}))

// ── Suite ─────────────────────────────────────────────────────

describe('AdoptionDetail', () => {
  beforeEach(async () => {
    mockFetchAdoptionPetById.mockReset()
    mockFetchAdoptionPetById.mockResolvedValue(null)
    mockSubmitAdoptionRequest.mockReset()
    mockError.value = null
    mockSelectedAdoptionPet.value = null
    mockIsLoading.value = false
    localStorageMock.getItem.mockReturnValue(null)

    // Always reset the auth store's token between tests.
    // The Nuxt test environment activates its own pinia instance — calling
    // setActivePinia(createPinia()) swaps the "active" pinia but the
    // component's reactive useAuthStore() is still bound to the Nuxt env pinia.
    // We must clear the token on THAT store instance so isAuthenticated resets to false.
    const { useAuthStore } = await import('../../auth/stores/auth.store')
    useAuthStore().token = null
  })

  // ── Pet detail rendering ───────────────────────────────────

  describe('pet detail rendering', () => {
    it('renders the pet name when selectedAdoptionPet is set', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Max')
    })

    it('renders the species label "Perro" for species "dog"', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Perro')
    })

    it('renders the breed when breed is provided', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Labrador')
    })

    it('renders the pet description when provided', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Un perro muy cariñoso que busca hogar.')
    })

    it('renders "Vacunado" health chip when vaccinated is true', async () => {
      mockSelectedAdoptionPet.value = makeAdoptionPet({ vaccinated: true })
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Vacunado')
    })

    it('renders "Sin vacuna" health chip when vaccinated is false', async () => {
      mockSelectedAdoptionPet.value = makeAdoptionPet({ vaccinated: false })
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Sin vacuna')
    })

    it('renders "Esterilizado" health chip when neutered is true', async () => {
      mockSelectedAdoptionPet.value = makeAdoptionPet({ neutered: true })
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Esterilizado')
    })

    it('renders "Sin esterilizar" health chip when neutered is false', async () => {
      mockSelectedAdoptionPet.value = makeAdoptionPet({ neutered: false })
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Sin esterilizar')
    })

    it('renders the "not found" state when selectedAdoptionPet is null and not loading', async () => {
      mockSelectedAdoptionPet.value = null
      mockIsLoading.value = false
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet-999' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Mascota no encontrada')
    })
  })

  // ── Adoption form — authenticated + available ──────────────
  // Pattern: mount first (Nuxt env sets up its pinia), then set token on the
  // store instance from that same pinia, then await nextTick for Vue to re-render.

  describe('adoption form (authenticated user, available pet)', () => {
    it('shows the adoption form textarea when user is authenticated and pet is available', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      // Set token after mount — the component's reactive authStore picks it up
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.find('textarea').exists()).toBe(true)
    })

    it('shows the "Solicitar adopción" heading when authenticated and pet is available', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.text()).toContain('Solicitar adopción')
    })

    it('shows the "Enviar solicitud" submit button', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      const submitBtn = wrapper.findAll('button').find(b => b.text().includes('Enviar solicitud'))
      expect(submitBtn).toBeDefined()
    })

    it('shows the char counter with 500 chars remaining on empty textarea', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.text()).toContain('500 restantes')
    })

    it('shows the minimum chars hint text', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.text()).toContain('Mínimo 20 caracteres')
    })
  })

  // ── Login CTA — unauthenticated + available ────────────────

  describe('login CTA (unauthenticated user, available pet)', () => {
    it('shows the login CTA when user is NOT authenticated and pet is available', async () => {
      mockSelectedAdoptionPet.value = availablePet
      // token is null by default (createPinia in beforeEach resets the store)
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Inicia sesión para solicitar adopción')
    })

    it('does NOT show the adoption form textarea when unauthenticated', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('textarea').exists()).toBe(false)
    })

    it('shows a link to /login in the login CTA', async () => {
      mockSelectedAdoptionPet.value = availablePet
      // Use a custom NuxtLink stub that renders as <a :href="to"> so we can assert href.
      // NuxtLink: false delegates to the router which produces no plain href in happy-dom.
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
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
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
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
    it('shows "Solicitud en proceso" heading when pet status is pending', async () => {
      mockSelectedAdoptionPet.value = pendingPet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Solicitud en proceso')
    })

    it('does NOT show the adoption form when pet is pending even when authenticated', async () => {
      mockSelectedAdoptionPet.value = pendingPet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
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
    it('shows "Esta mascota ya tiene un hogar" heading when pet is adopted', async () => {
      mockSelectedAdoptionPet.value = adoptedPet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Esta mascota ya tiene un hogar')
    })

    it('does NOT show the adoption form when pet is adopted even when authenticated', async () => {
      mockSelectedAdoptionPet.value = adoptedPet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.find('textarea').exists()).toBe(false)
    })
  })

  // ── Adoption form validation ───────────────────────────────
  // Pattern: mount first → set token → nextTick → textarea is in DOM →
  // trigger 'submit' on the <form> element (NOT click on the button, because
  // happy-dom does not propagate button clicks to the form's @submit.prevent handler).

  describe('adoption form validation', () => {
    it('shows validation error div when submitting with a message shorter than 20 chars', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      await wrapper.find('textarea').setValue('Corto')
      // Trigger submit on the <form> element — happy-dom does not propagate
      // button[type=submit] clicks to @submit.prevent on the form element.
      await wrapper.find('form').trigger('submit')

      const errorDiv = wrapper.find('#adoption-message-error')
      expect(errorDiv.exists()).toBe(true)
    })

    it('the validation error message mentions the 20-char minimum', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      await wrapper.find('textarea').setValue('Corto')
      await wrapper.find('form').trigger('submit')

      expect(wrapper.text()).toContain('20')
    })

    it('does NOT call submitAdoptionRequest when message is too short', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      await wrapper.find('textarea').setValue('Demasiado corto')
      await wrapper.find('form').trigger('submit')

      expect(mockSubmitAdoptionRequest).not.toHaveBeenCalled()
    })

    it('adds is-invalid class to textarea when message is too short and form submitted', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      await wrapper.find('textarea').setValue('Corto')
      await wrapper.find('form').trigger('submit')

      expect(wrapper.find('textarea').classes()).toContain('is-invalid')
    })
  })

  // ── Success state ──────────────────────────────────────────
  // Pattern: mount first → set token → nextTick → textarea is in DOM →
  // trigger 'submit' on the <form> element to fire @submit.prevent handler.

  describe('success state after submission', () => {
    it('shows the "¡Solicitud enviada!" alert after a successful submission', async () => {
      const successRequest: AdoptionRequest = {
        id: 'req1', pet_id: 'pet1', user_id: 'u1', shelter_id: '1',
        message: 'Mi mensaje', status: 'pending',
        created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
      }
      mockSubmitAdoptionRequest.mockResolvedValue(successRequest)
      mockSelectedAdoptionPet.value = availablePet

      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      const validMessage = 'Mi mensaje de adopción válido con más de 20 caracteres.'
      await wrapper.find('textarea').setValue(validMessage)
      // Trigger submit on the form element — the @submit.prevent handler fires
      await wrapper.find('form').trigger('submit')
      // Wait for the async handleAdoptionSubmit to resolve
      await nextTick()

      expect(wrapper.text()).toContain('¡Solicitud enviada!')
    })

    it('calls submitAdoptionRequest with shelter_id, pet id, and trimmed message', async () => {
      mockSubmitAdoptionRequest.mockResolvedValue({
        id: 'req1', pet_id: 'pet1', user_id: 'u1', shelter_id: '1',
        message: '', status: 'pending',
        created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z',
      })
      mockSelectedAdoptionPet.value = availablePet // shelter_id: '1', id: 'pet1'

      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      // Note: setValue on textarea trims whitespace from the ends — the value stored
      // by v-model will be the raw string; the handler trims before calling the mock.
      const validMessage = '  Quiero adoptar a Max porque tengo mucho espacio.  '
      await wrapper.find('textarea').setValue(validMessage)
      await wrapper.find('form').trigger('submit')
      await nextTick()

      expect(mockSubmitAdoptionRequest).toHaveBeenCalledWith(
        '1',                                                      // pet.shelter_id
        'pet1',                                                   // pet.id
        'Quiero adoptar a Max porque tengo mucho espacio.',       // trimmed
      )
    })

    it('shows the submission error alert when submitAdoptionRequest returns null', async () => {
      mockSubmitAdoptionRequest.mockResolvedValue(null)
      mockSelectedAdoptionPet.value = availablePet

      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      const validMessage = 'Este mensaje tiene suficientes caracteres para ser válido en el sistema.'
      await wrapper.find('textarea').setValue(validMessage)
      await wrapper.find('form').trigger('submit')
      await nextTick()

      // adoptionError is set to error.value ?? 'No se pudo enviar la solicitud...'
      // Since our mock error ref is null, the fallback string is shown.
      expect(wrapper.text()).toContain('No se pudo enviar la solicitud')
    })
  })

  // ── Back navigation ────────────────────────────────────────
  // Use a custom NuxtLink stub that renders as <a :href="to"> so we can assert
  // href values. NuxtLink: false delegates to the real router (no plain href in happy-dom).

  const nuxtLinkHrefStub = { template: '<a :href="to"><slot /></a>', props: ['to'] }

  describe('back navigation', () => {
    it('renders the "Volver al refugio" back link', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: nuxtLinkHrefStub } },
      })
      expect(wrapper.text()).toContain('Volver al refugio')
    })

    it('back link points to /shelter/:shelter_id when pet is loaded', async () => {
      mockSelectedAdoptionPet.value = makeAdoptionPet({ shelter_id: '42' })
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: nuxtLinkHrefStub } },
      })
      const backLink = wrapper.find('a[href*="/shelter/42"]')
      expect(backLink.exists()).toBe(true)
    })

    it('back link falls back to /shelter when pet is not loaded', async () => {
      mockSelectedAdoptionPet.value = null
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: nuxtLinkHrefStub } },
      })
      const backLink = wrapper.find('a[href="/shelter"]')
      expect(backLink.exists()).toBe(true)
    })
  })

  // ── Fetch on mount ─────────────────────────────────────────

  describe('fetchAdoptionPetById on mount', () => {
    it('calls fetchAdoptionPetById when the pet is not in the adoptionPets cache', async () => {
      // adoptionPets is always [] in our mock, so the pet is never cached
      mockSelectedAdoptionPet.value = null
      await mountSuspended(AdoptionDetail, {
        props: { petId: 'some-other-pet' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(mockFetchAdoptionPetById).toHaveBeenCalled()
    })

    it('calls fetchAdoptionPetById with the shelterId from the route query', async () => {
      // useRoute mock returns { query: { shelterId: '1' } }
      mockSelectedAdoptionPet.value = null
      await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet-from-query' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(mockFetchAdoptionPetById).toHaveBeenCalledWith('1', 'pet-from-query')
    })
  })

  // ── Error alert ────────────────────────────────────────────

  describe('error alert', () => {
    it('shows the fetch error alert when error is set and pet is null', async () => {
      mockSelectedAdoptionPet.value = null
      mockError.value = 'No se pudo cargar la mascota'
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('No se pudo cargar la mascota')
    })

    it('does not show the fetch error block when error is null', async () => {
      mockSelectedAdoptionPet.value = availablePet
      mockError.value = null
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      // error block is `v-if="error && !pet"` — with pet loaded, not shown
      const alertDangers = wrapper.findAll('.alert-danger')
      const fetchErrAlert = alertDangers.find(a => a.text().includes('No se pudo cargar'))
      expect(fetchErrAlert).toBeUndefined()
    })
  })

  // ── Accessibility ──────────────────────────────────────────

  describe('accessibility', () => {
    it('section has aria-label containing "adopción"', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const section = wrapper.find('section')
      expect(section.attributes('aria-label')).toContain('adopción')
    })

    it('the adoption form textarea has aria-required="true"', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      // Mount first, then set token so the Nuxt env pinia's reactive store triggers re-render
      const { useAuthStore } = await import('../../auth/stores/auth.store')
      useAuthStore().token = 'test-jwt-token'
      await nextTick()

      expect(wrapper.find('textarea').attributes('aria-required')).toBe('true')
    })

    it('the status badge has a descriptive aria-label when pet is available', async () => {
      mockSelectedAdoptionPet.value = availablePet
      const wrapper = await mountSuspended(AdoptionDetail, {
        props: { petId: 'pet1' },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('[aria-label*="Estado"]')
      expect(badge.exists()).toBe(true)
      expect(badge.attributes('aria-label')).toContain('Disponible')
    })
  })
})
