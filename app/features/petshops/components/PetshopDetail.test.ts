// ============================================================
// PetshopDetail.test.ts
// Tests for the PetshopDetail component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// calls usePetshops() which internally calls useApi() and usePetshopsStore().
// We mock usePetshops at the composable boundary so we can control the
// store state and stub fetchPetshopById without making HTTP calls.
//
// Mocking:
//   - usePetshops: vi.mock('../composables/usePetshops', ...) — project
//     composable, NOT mockNuxtImport.
//   - Module-level reactive refs control mock state per test (same pattern
//     as ShelterList.test.ts and PetshopList.test.ts).
//
// Component interface: receives `petshopId` as a string prop.
// The component reads the petshop from petshopsStore.selectedPetshop
// (set by fetchPetshopById inside onMounted).
//
// Key behaviours tested:
//   - Loading skeleton rendered while isLoading is true and no petshop.
//   - Petshop profile rendered when selectedPetshop is set.
//   - All contact links: phone (tel:), email (mailto:), website.
//   - Security: javascript: website blocked; invalid phone blocked.
//   - Business hours table shown/hidden based on hasHoursData.
//   - "Cerrado" for days with no hours set.
//   - Map placeholder shown/hidden based on latitude + longitude.
//   - Back navigation link.
//   - fetchPetshopById called on mount with the prop value.
//   - Invalid petshopId format (path traversal) is rejected.
//   - Not-found state shown when not loading and no petshop.
//
// What this suite does NOT cover intentionally:
//   - CSS transitions / SCSS visual styles.
//   - Actual HTTP calls (usePetshops is fully mocked).
//   - clearSelectedPetshop on unmount — onUnmounted is not triggered
//     by component unmount in the happy-dom environment in these tests.
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import PetshopDetail from './PetshopDetail.vue'
import type { Petshop, PetshopHours } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makePetshop(overrides: Partial<Petshop> = {}): Petshop {
  return {
    id: 'shop-1',
    name: 'Mascotas Felices',
    description: 'Una tienda completa para mascotas',
    address: 'Calle 50 #10-20',
    city: 'Bogotá',
    phone: '+57 300 123 4567',
    email: 'info@mascotasfelices.com',
    website: 'https://mascotasfelices.com',
    photo_url: 'https://example.com/tienda.jpg',
    categories: ['Alimentos', 'Accesorios'],
    is_verified: true,
    is_featured: false,
    latitude: 4.7109886,
    longitude: -74.072092,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const defaultHours: PetshopHours = {
  monday: '8:00 - 18:00',
  tuesday: '8:00 - 18:00',
  wednesday: '8:00 - 18:00',
  thursday: '8:00 - 18:00',
  friday: '8:00 - 18:00',
  saturday: '9:00 - 14:00',
  // sunday intentionally absent → shows "Cerrado"
}

// ── usePetshops mock ──────────────────────────────────────────
// Module-level reactive refs control the mock state per test.
// The component reads petshopsStore.selectedPetshop / isLoading.

const mockFetchPetshopById = vi.fn()
const mockClearSelectedPetshop = vi.fn()
const mockError = ref<string | null>(null)
const mockSelectedPetshop = ref<Petshop | null>(null)
const mockIsLoading = ref(false)

vi.mock('../composables/usePetshops', () => ({
  usePetshops: () => ({
    fetchPetshopById: mockFetchPetshopById,
    error: mockError,
    petshopsStore: {
      get selectedPetshop() { return mockSelectedPetshop.value },
      get isLoading() { return mockIsLoading.value },
      get petshops() { return [] },
      clearSelectedPetshop: mockClearSelectedPetshop,
    },
  }),
}))

// ── Helper ────────────────────────────────────────────────────

async function mountDetail(petshopId: string) {
  return mountSuspended(PetshopDetail, {
    props: { petshopId },
    global: {
      stubs: {
        NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] },
      },
    },
  })
}

// ── Suite ─────────────────────────────────────────────────────

describe('PetshopDetail', () => {
  beforeEach(() => {
    mockFetchPetshopById.mockReset()
    mockFetchPetshopById.mockResolvedValue(null)
    mockClearSelectedPetshop.mockReset()
    mockError.value = null
    mockSelectedPetshop.value = null
    mockIsLoading.value = false
  })

  // ── fetchPetshopById on mount ──────────────────────────────

  describe('lifecycle — mount', () => {
    it('calls fetchPetshopById with the petshopId prop on mount', async () => {
      await mountDetail('shop-1')
      expect(mockFetchPetshopById).toHaveBeenCalledWith('shop-1')
    })

    it('calls fetchPetshopById exactly once', async () => {
      await mountDetail('shop-1')
      expect(mockFetchPetshopById).toHaveBeenCalledTimes(1)
    })

    it('does NOT call fetchPetshopById when petshopId contains path traversal (../ pattern)', async () => {
      // The component guards: /^[\w-]{1,64}$/.test() — "../etc" fails the regex
      await mountDetail('../etc/passwd')
      expect(mockFetchPetshopById).not.toHaveBeenCalled()
    })

    it('does NOT call fetchPetshopById when petshopId is empty string', async () => {
      await mountDetail('')
      expect(mockFetchPetshopById).not.toHaveBeenCalled()
    })

    it('does NOT call fetchPetshopById when petshopId contains a slash', async () => {
      await mountDetail('valid/id')
      expect(mockFetchPetshopById).not.toHaveBeenCalled()
    })

    it('calls fetchPetshopById with a hyphenated petshopId (valid format)', async () => {
      await mountDetail('petshop-42')
      expect(mockFetchPetshopById).toHaveBeenCalledWith('petshop-42')
    })
  })

  // ── Loading state ──────────────────────────────────────────

  describe('loading state', () => {
    it('renders the loading skeleton when isLoading is true and no petshop is selected', async () => {
      mockIsLoading.value = true
      mockSelectedPetshop.value = null
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Cargando tienda"]').exists()).toBe(true)
    })

    it('does not render petshop profile content while loading', async () => {
      mockIsLoading.value = true
      mockSelectedPetshop.value = null
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).not.toContain('Mascotas Felices')
    })
  })

  // ── Not-found state ────────────────────────────────────────

  describe('not-found state', () => {
    it('shows "Tienda no encontrada" when not loading and no petshop selected', async () => {
      mockIsLoading.value = false
      mockSelectedPetshop.value = null
      const wrapper = await mountDetail('shop-999')
      expect(wrapper.text()).toContain('Tienda no encontrada')
    })

    it('shows a "Volver al directorio" link in the not-found state', async () => {
      mockIsLoading.value = false
      mockSelectedPetshop.value = null
      const wrapper = await mountDetail('shop-999')
      const links = wrapper.findAll('a')
      const backLink = links.find(l => l.text().includes('Volver al directorio'))
      expect(backLink).toBeDefined()
    })
  })

  // ── Petshop profile ────────────────────────────────────────

  describe('petshop profile rendering', () => {
    it('renders the store name', async () => {
      mockSelectedPetshop.value = makePetshop({ name: 'Mascotas Felices' })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).toContain('Mascotas Felices')
    })

    it('renders the store description', async () => {
      mockSelectedPetshop.value = makePetshop({ description: 'La mejor tienda para tus mascotas' })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).toContain('La mejor tienda para tus mascotas')
    })

    it('renders the city', async () => {
      mockSelectedPetshop.value = makePetshop({ city: 'Medellín', address: '' })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).toContain('Medellín')
    })

    it('renders the "Verificado" badge when is_verified is true', async () => {
      mockSelectedPetshop.value = makePetshop({ is_verified: true })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).toContain('Verificado')
    })

    it('hides the "Verificado" badge when is_verified is false', async () => {
      mockSelectedPetshop.value = makePetshop({ is_verified: false })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).not.toContain('Verificado')
    })

    it('renders all category chips', async () => {
      mockSelectedPetshop.value = makePetshop({ categories: ['Alimentos', 'Accesorios', 'Veterinaria'] })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).toContain('Alimentos')
      expect(wrapper.text()).toContain('Accesorios')
      expect(wrapper.text()).toContain('Veterinaria')
    })
  })

  // ── Contact section ────────────────────────────────────────

  describe('contact section', () => {
    it('renders the phone link with tel: href when phone is safe', async () => {
      mockSelectedPetshop.value = makePetshop({ phone: '+57 300 123 4567' })
      const wrapper = await mountDetail('shop-1')
      const phoneLink = wrapper.find('a[href^="tel:"]')
      expect(phoneLink.exists()).toBe(true)
      expect(phoneLink.attributes('href')).toBe('tel:+57 300 123 4567')
    })

    it('hides the phone section when phone is null', async () => {
      mockSelectedPetshop.value = makePetshop({ phone: undefined })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
    })

    it('hides the phone section when phone fails the safety regex (injection attempt)', async () => {
      mockSelectedPetshop.value = makePetshop({ phone: '<script>alert(1)</script>' })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
    })

    it('renders the email link with mailto: href when email is safe', async () => {
      mockSelectedPetshop.value = makePetshop({ email: 'info@mascotasfelices.com' })
      const wrapper = await mountDetail('shop-1')
      const emailLink = wrapper.find('a[href^="mailto:"]')
      expect(emailLink.exists()).toBe(true)
      expect(emailLink.attributes('href')).toBe('mailto:info@mascotasfelices.com')
    })

    it('hides the email section when email is null', async () => {
      mockSelectedPetshop.value = makePetshop({ email: undefined })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
    })

    it('renders the website link when website starts with https://', async () => {
      mockSelectedPetshop.value = makePetshop({ website: 'https://mascotasfelices.com' })
      const wrapper = await mountDetail('shop-1')
      const websiteLink = wrapper.find('a[href="https://mascotasfelices.com"]')
      expect(websiteLink.exists()).toBe(true)
    })

    it('blocks the website link when website starts with javascript: (XSS)', async () => {
      mockSelectedPetshop.value = makePetshop({ website: 'javascript:alert(document.cookie)' })
      const wrapper = await mountDetail('shop-1')
      // safeWebsiteUrl returns null → the entire website div is hidden
      const allLinks = wrapper.findAll('a')
      const jsLinks = allLinks.filter(l => (l.attributes('href') ?? '').startsWith('javascript:'))
      expect(jsLinks).toHaveLength(0)
    })

    it('hides the website section when website is undefined', async () => {
      mockSelectedPetshop.value = makePetshop({ website: undefined })
      const wrapper = await mountDetail('shop-1')
      // No website <div> should be rendered at all
      // The website section is wrapped in v-if="safeWebsiteUrl"
      expect(wrapper.text()).not.toContain('Sitio web')
    })
  })

  // ── Business hours table ───────────────────────────────────

  describe('business hours table', () => {
    it('shows the hours table when petshop.hours has at least one non-empty value', async () => {
      mockSelectedPetshop.value = makePetshop({ hours: defaultHours })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.find('table').exists()).toBe(true)
      expect(wrapper.text()).toContain('Horarios de atención')
    })

    it('hides the hours table when petshop.hours is undefined', async () => {
      mockSelectedPetshop.value = makePetshop({ hours: undefined })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.find('table').exists()).toBe(false)
    })

    it('shows "Cerrado" for days not included in the hours object', async () => {
      // defaultHours does not define sunday → should show "Cerrado"
      mockSelectedPetshop.value = makePetshop({ hours: defaultHours })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).toContain('Cerrado')
    })

    it('renders the correct hours for Monday', async () => {
      mockSelectedPetshop.value = makePetshop({ hours: { monday: '9:00 - 19:00' } })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).toContain('9:00 - 19:00')
      expect(wrapper.text()).toContain('Lunes')
    })

    it('shows "Domingo" row in the hours table', async () => {
      mockSelectedPetshop.value = makePetshop({ hours: defaultHours })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).toContain('Domingo')
    })
  })

  // ── Map placeholder ────────────────────────────────────────

  describe('map placeholder', () => {
    it('shows the map section when latitude and longitude are present', async () => {
      mockSelectedPetshop.value = makePetshop({ latitude: 4.7109886, longitude: -74.072092 })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).toContain('Ubicación')
      expect(wrapper.text()).toContain('Mapa disponible próximamente')
    })

    it('shows the coordinates in the map placeholder', async () => {
      mockSelectedPetshop.value = makePetshop({ latitude: 4.7109886, longitude: -74.072092 })
      const wrapper = await mountDetail('shop-1')
      // latitude.toFixed(6) = "4.710989"
      expect(wrapper.text()).toContain('4.710989')
    })

    it('hides the map section when latitude is absent', async () => {
      mockSelectedPetshop.value = makePetshop({ latitude: undefined, longitude: undefined })
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).not.toContain('Ubicación')
    })
  })

  // ── Back navigation ────────────────────────────────────────

  describe('back navigation', () => {
    it('renders a "Volver al directorio" link', async () => {
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.text()).toContain('Volver al directorio')
    })

    it('the back link points to /stores', async () => {
      const wrapper = await mountDetail('shop-1')
      const links = wrapper.findAll('a')
      const backLink = links.find(l => l.text().includes('Volver'))
      expect(backLink).toBeDefined()
      expect(backLink!.attributes('href')).toBe('/stores')
    })
  })

  // ── Error alert ────────────────────────────────────────────

  describe('error alert', () => {
    it('shows the error alert when error is set', async () => {
      mockError.value = 'Tienda no disponible'
      mockSelectedPetshop.value = null
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Tienda no disponible')
    })

    it('does not show the error alert when error is null', async () => {
      mockError.value = null
      mockSelectedPetshop.value = null
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Accessibility ──────────────────────────────────────────

  describe('accessibility', () => {
    it('has aria-label "Detalle de tienda" on the section', async () => {
      const wrapper = await mountDetail('shop-1')
      expect(wrapper.find('[aria-label="Detalle de tienda"]').exists()).toBe(true)
    })
  })
})
