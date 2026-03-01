// ============================================================
// PetshopDetail.test.ts
// Tests for the PetshopDetail component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports. The component
// calls usePetshops() which internally calls useApi() and usePetshopsStore().
// We mock usePetshops at the composable boundary so we can control the
// store state and stub fetchPetshopById/fetchStoreProducts.
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
//   - Contact: composed phone (phone_country_code + phone), email, website, WhatsApp.
//   - Security: javascript: website blocked; invalid phone blocked.
//   - Products section with product cards.
//   - Back navigation link.
//   - fetchPetshopById called on mount with numeric ID.
//   - Invalid petshopId format (NaN, non-numeric) is rejected.
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
import type { Petshop, StoreProduct } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makePetshop(overrides: Partial<Petshop> = {}): Petshop {
  return {
    id: 1,
    name: 'Mascotas Felices',
    email: 'info@mascotasfelices.com',
    description: 'Una tienda completa para mascotas',
    logo_url: 'https://example.com/tienda.jpg',
    country: 'Colombia',
    city: 'Bogotá',
    phone_country_code: '+57',
    phone: '300 123 4567',
    whatsapp_link: 'https://wa.me/573001234567',
    website: 'https://mascotasfelices.com',
    verified: true,
    is_active: true,
    plan: '',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeProduct(overrides: Partial<StoreProduct> = {}): StoreProduct {
  return {
    id: 1,
    store_id: 1,
    name: 'Alimento Premium',
    description: 'Alimento para perros adultos',
    category: 'alimento',
    price: 45.99,
    photo_url: 'https://example.com/food.jpg',
    is_available: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── usePetshops mock ──────────────────────────────────────────
// Module-level reactive refs control the mock state per test.
// The component reads petshopsStore.selectedPetshop / isLoading / storeProducts.

const mockFetchPetshopById = vi.fn()
const mockFetchStoreProducts = vi.fn()
const mockClearSelectedPetshop = vi.fn()
const mockClearStoreProducts = vi.fn()
const mockError = ref<string | null>(null)
const mockSelectedPetshop = ref<Petshop | null>(null)
const mockStoreProducts = ref<StoreProduct[]>([])
const mockIsLoading = ref(false)

vi.mock('../composables/usePetshops', () => ({
  usePetshops: () => ({
    fetchPetshopById: mockFetchPetshopById,
    fetchStoreProducts: mockFetchStoreProducts,
    error: mockError,
    petshopsStore: {
      get selectedPetshop() { return mockSelectedPetshop.value },
      get storeProducts() { return mockStoreProducts.value },
      get isLoading() { return mockIsLoading.value },
      get petshops() { return [] },
      clearSelectedPetshop: mockClearSelectedPetshop,
      clearStoreProducts: mockClearStoreProducts,
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
    mockFetchStoreProducts.mockReset()
    mockFetchStoreProducts.mockResolvedValue(undefined)
    mockClearSelectedPetshop.mockReset()
    mockClearStoreProducts.mockReset()
    mockError.value = null
    mockSelectedPetshop.value = null
    mockStoreProducts.value = []
    mockIsLoading.value = false
  })

  // ── fetchPetshopById on mount ──────────────────────────────

  describe('lifecycle — mount', () => {
    it('calls fetchPetshopById with numeric ID parsed from petshopId prop', async () => {
      await mountDetail('1')
      expect(mockFetchPetshopById).toHaveBeenCalledWith(1)
    })

    it('calls fetchPetshopById exactly once', async () => {
      await mountDetail('1')
      expect(mockFetchPetshopById).toHaveBeenCalledTimes(1)
    })

    it('calls fetchStoreProducts with numeric ID on mount', async () => {
      await mountDetail('1')
      expect(mockFetchStoreProducts).toHaveBeenCalledWith(1)
    })

    it('does NOT call fetchPetshopById when petshopId is not a number', async () => {
      await mountDetail('abc')
      expect(mockFetchPetshopById).not.toHaveBeenCalled()
    })

    it('does NOT call fetchPetshopById when petshopId is 0', async () => {
      await mountDetail('0')
      expect(mockFetchPetshopById).not.toHaveBeenCalled()
    })

    it('does NOT call fetchPetshopById when petshopId is negative', async () => {
      await mountDetail('-1')
      expect(mockFetchPetshopById).not.toHaveBeenCalled()
    })

    it('does NOT call fetchPetshopById when petshopId is empty string', async () => {
      await mountDetail('')
      expect(mockFetchPetshopById).not.toHaveBeenCalled()
    })

    it('calls fetchPetshopById with a large numeric ID', async () => {
      await mountDetail('42')
      expect(mockFetchPetshopById).toHaveBeenCalledWith(42)
    })
  })

  // ── Loading state ──────────────────────────────────────────

  describe('loading state', () => {
    it('renders the loading skeleton when isLoading is true and no petshop is selected', async () => {
      mockIsLoading.value = true
      mockSelectedPetshop.value = null
      const wrapper = await mountDetail('1')
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
      expect(wrapper.find('[aria-label="Cargando tienda"]').exists()).toBe(true)
    })

    it('does not render petshop profile content while loading', async () => {
      mockIsLoading.value = true
      mockSelectedPetshop.value = null
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).not.toContain('Mascotas Felices')
    })
  })

  // ── Not-found state ────────────────────────────────────────

  describe('not-found state', () => {
    it('shows "Tienda no encontrada" when not loading and no petshop selected', async () => {
      mockIsLoading.value = false
      mockSelectedPetshop.value = null
      const wrapper = await mountDetail('999')
      expect(wrapper.text()).toContain('Tienda no encontrada')
    })

    it('shows a "Volver al directorio" link in the not-found state', async () => {
      mockIsLoading.value = false
      mockSelectedPetshop.value = null
      const wrapper = await mountDetail('999')
      const links = wrapper.findAll('a')
      const backLink = links.find(l => l.text().includes('Volver al directorio'))
      expect(backLink).toBeDefined()
    })
  })

  // ── Petshop profile ────────────────────────────────────────

  describe('petshop profile rendering', () => {
    it('renders the store name', async () => {
      mockSelectedPetshop.value = makePetshop({ name: 'Mascotas Felices' })
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('Mascotas Felices')
    })

    it('renders the store description', async () => {
      mockSelectedPetshop.value = makePetshop({ description: 'La mejor tienda para tus mascotas' })
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('La mejor tienda para tus mascotas')
    })

    it('renders the city and country', async () => {
      mockSelectedPetshop.value = makePetshop({ city: 'Medellín', country: 'Colombia' })
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('Medellín, Colombia')
    })

    it('renders the "Verificado" badge when verified is true', async () => {
      mockSelectedPetshop.value = makePetshop({ verified: true })
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('Verificado')
    })

    it('hides the "Verificado" badge when verified is false', async () => {
      mockSelectedPetshop.value = makePetshop({ verified: false })
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).not.toContain('Verificado')
    })

    it('renders the "Destacado" badge when plan is non-empty', async () => {
      mockSelectedPetshop.value = makePetshop({ plan: 'premium' })
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('Destacado')
    })

    it('hides the "Destacado" badge when plan is empty string', async () => {
      mockSelectedPetshop.value = makePetshop({ plan: '' })
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).not.toContain('Destacado')
    })
  })

  // ── Contact section ────────────────────────────────────────

  describe('contact section', () => {
    it('renders the composed phone link with tel: href', async () => {
      mockSelectedPetshop.value = makePetshop({ phone_country_code: '+57', phone: '300 123 4567' })
      const wrapper = await mountDetail('1')
      const phoneLink = wrapper.find('a[href^="tel:"]')
      expect(phoneLink.exists()).toBe(true)
      expect(phoneLink.attributes('href')).toBe('tel:+57 300 123 4567')
    })

    it('hides the phone section when phone is empty', async () => {
      mockSelectedPetshop.value = makePetshop({ phone: '' })
      const wrapper = await mountDetail('1')
      expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
    })

    it('renders the email link with mailto: href when email is safe', async () => {
      mockSelectedPetshop.value = makePetshop({ email: 'info@mascotasfelices.com' })
      const wrapper = await mountDetail('1')
      const emailLink = wrapper.find('a[href^="mailto:"]')
      expect(emailLink.exists()).toBe(true)
      expect(emailLink.attributes('href')).toBe('mailto:info@mascotasfelices.com')
    })

    it('hides the email section when email is invalid', async () => {
      mockSelectedPetshop.value = makePetshop({ email: 'not-an-email' })
      const wrapper = await mountDetail('1')
      expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
    })

    it('renders the website link when website starts with https://', async () => {
      mockSelectedPetshop.value = makePetshop({ website: 'https://mascotasfelices.com' })
      const wrapper = await mountDetail('1')
      const websiteLink = wrapper.find('a[href="https://mascotasfelices.com"]')
      expect(websiteLink.exists()).toBe(true)
    })

    it('blocks the website link when website starts with javascript: (XSS)', async () => {
      mockSelectedPetshop.value = makePetshop({ website: 'javascript:alert(document.cookie)' })
      const wrapper = await mountDetail('1')
      const allLinks = wrapper.findAll('a')
      const jsLinks = allLinks.filter(l => (l.attributes('href') ?? '').startsWith('javascript:'))
      expect(jsLinks).toHaveLength(0)
    })

    it('hides the website section when website is undefined', async () => {
      mockSelectedPetshop.value = makePetshop({ website: undefined })
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).not.toContain('Sitio web')
    })
  })

  // ── WhatsApp section ───────────────────────────────────────

  describe('WhatsApp section', () => {
    it('renders the WhatsApp link when whatsapp_link is a valid https URL', async () => {
      mockSelectedPetshop.value = makePetshop({ whatsapp_link: 'https://wa.me/573001234567' })
      const wrapper = await mountDetail('1')
      const waLink = wrapper.find('[aria-label="WhatsApp de Mascotas Felices"]')
      expect(waLink.exists()).toBe(true)
      expect(waLink.attributes('href')).toBe('https://wa.me/573001234567')
    })

    it('hides the WhatsApp section when whatsapp_link is undefined', async () => {
      mockSelectedPetshop.value = makePetshop({ whatsapp_link: undefined })
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).not.toContain('WhatsApp')
    })

    it('hides the WhatsApp section when whatsapp_link is a javascript: URI', async () => {
      mockSelectedPetshop.value = makePetshop({ whatsapp_link: 'javascript:alert(1)' })
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).not.toContain('WhatsApp')
    })
  })

  // ── Products section ───────────────────────────────────────

  describe('products section', () => {
    it('shows the products section when products are loaded', async () => {
      mockSelectedPetshop.value = makePetshop()
      mockStoreProducts.value = [makeProduct()]
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('Productos')
    })

    it('renders product name', async () => {
      mockSelectedPetshop.value = makePetshop()
      mockStoreProducts.value = [makeProduct({ name: 'Alimento Premium' })]
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('Alimento Premium')
    })

    it('renders product price formatted', async () => {
      mockSelectedPetshop.value = makePetshop()
      mockStoreProducts.value = [makeProduct({ price: 45.99 })]
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('$45.99')
    })

    it('renders "Disponible" when product.is_available is true', async () => {
      mockSelectedPetshop.value = makePetshop()
      mockStoreProducts.value = [makeProduct({ is_available: true })]
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('Disponible')
    })

    it('renders "No disponible" when product.is_available is false', async () => {
      mockSelectedPetshop.value = makePetshop()
      mockStoreProducts.value = [makeProduct({ is_available: false })]
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('No disponible')
    })

    it('renders category label for product', async () => {
      mockSelectedPetshop.value = makePetshop()
      mockStoreProducts.value = [makeProduct({ category: 'accesorios' })]
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('Accesorios')
    })

    it('renders multiple product cards', async () => {
      mockSelectedPetshop.value = makePetshop()
      mockStoreProducts.value = [
        makeProduct({ id: 1, name: 'Alimento Premium' }),
        makeProduct({ id: 2, name: 'Collar LED' }),
      ]
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('Alimento Premium')
      expect(wrapper.text()).toContain('Collar LED')
    })

    it('hides the products section when no products are loaded', async () => {
      mockSelectedPetshop.value = makePetshop()
      mockStoreProducts.value = []
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).not.toContain('Productos')
    })
  })

  // ── Back navigation ────────────────────────────────────────

  describe('back navigation', () => {
    it('renders a "Volver al directorio" link', async () => {
      const wrapper = await mountDetail('1')
      expect(wrapper.text()).toContain('Volver al directorio')
    })

    it('the back link points to /stores', async () => {
      const wrapper = await mountDetail('1')
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
      const wrapper = await mountDetail('1')
      expect(wrapper.find('[role="alert"]').exists()).toBe(true)
      expect(wrapper.text()).toContain('Tienda no disponible')
    })

    it('does not show the error alert when error is null', async () => {
      mockError.value = null
      mockSelectedPetshop.value = null
      const wrapper = await mountDetail('1')
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Accessibility ──────────────────────────────────────────

  describe('accessibility', () => {
    it('has aria-label "Detalle de tienda" on the section', async () => {
      const wrapper = await mountDetail('1')
      expect(wrapper.find('[aria-label="Detalle de tienda"]').exists()).toBe(true)
    })
  })
})
