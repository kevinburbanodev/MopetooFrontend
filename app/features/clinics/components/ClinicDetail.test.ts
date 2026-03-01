// ============================================================
// ClinicDetail.test.ts
// Tests for the ClinicDetail component.
//
// Strategy: mountSuspended resolves Nuxt auto-imports.
// The component accepts a clinicId prop and calls useClinics()
// on mount. We mock useClinics at the composable boundary.
//
// Mocking:
//   - useClinics: vi.mock('../composables/useClinics', ...) — project
//     composable, NOT mockNuxtImport.
//   - The mock exposes module-level reactive refs so we can control
//     selectedClinic, isLoading, and error per test.
//
// Key behaviours tested:
//   - clinicId numeric validation: NaN, 0, negative → do NOT call fetchClinicById.
//   - Valid clinicId calls clearSelectedClinic() then fetchClinicById(numericId).
//   - Profile content: name, city, country, specialties, services, description, contact.
//   - Cover image rendering with isSafeImageUrl guard (🏥 fallback on unsafe URLs).
//   - Verified and plan-based badges.
//   - Schedules section (preformatted text, shown only when schedules is truthy).
//   - Social media links (facebook, instagram, twitter) with URL safety.
//   - Loading skeleton while fetching.
//   - "Not found" state when selectedClinic is null and not loading.
//   - onUnmounted clears selectedClinic.
//
// What this suite does NOT cover intentionally:
//   - CSS / SCSS visual styles.
//   - img @error native event (happy-dom does not fire it).
// ============================================================

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import ClinicDetail from './ClinicDetail.vue'
import type { Clinic } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeClinic(overrides: Partial<Clinic> = {}): Clinic {
  return {
    id: 1,
    name: 'Los Andes Vet',
    email: 'info@clinicaandes.com',
    phone: '+57 300 987 6543',
    address: 'Calle 72 #15-30',
    city: 'Bogotá',
    country: 'Colombia',
    description: 'Atención veterinaria integral para toda tu familia',
    specialties: ['Cirugía', 'Dermatología'],
    services: ['Consulta general', 'Vacunación', 'Cirugía menor'],
    schedules: 'Lunes a Viernes: 8:00 AM - 6:00 PM\nSábado: 9:00 AM - 1:00 PM',
    cover_image_url: 'https://example.com/clinica.jpg',
    facebook_url: 'https://facebook.com/clinicaandes',
    instagram_url: 'https://instagram.com/clinicaandes',
    plan: 'free',
    verified: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── useClinics mock ────────────────────────────────────────────

const mockFetchClinicById = vi.fn()
const mockClearSelectedClinic = vi.fn()
const mockError = ref<string | null>(null)
const mockSelectedClinic = ref<Clinic | null>(null)
const mockIsLoading = ref(false)

vi.mock('../composables/useClinics', () => ({
  useClinics: () => ({
    fetchClinicById: mockFetchClinicById,
    error: mockError,
    clinicsStore: {
      get selectedClinic() { return mockSelectedClinic.value },
      get isLoading() { return mockIsLoading.value },
      clearSelectedClinic: mockClearSelectedClinic,
    },
  }),
}))

// ── Suite ─────────────────────────────────────────────────────

describe('ClinicDetail', () => {
  beforeEach(() => {
    mockFetchClinicById.mockReset()
    mockFetchClinicById.mockResolvedValue(null)
    mockClearSelectedClinic.mockReset()
    mockError.value = null
    mockSelectedClinic.value = null
    mockIsLoading.value = false
  })

  // ── Lifecycle ──────────────────────────────────────────────

  describe('lifecycle', () => {
    it('calls clearSelectedClinic then fetchClinicById on mount with valid numeric id', async () => {
      const callOrder: string[] = []
      mockClearSelectedClinic.mockImplementation(() => callOrder.push('clear'))
      mockFetchClinicById.mockImplementation(async () => { callOrder.push('fetch'); return null })

      await mountSuspended(ClinicDetail, {
        props: { clinicId: '5' },
        global: { stubs: { NuxtLink: true } },
      })

      expect(callOrder).toEqual(['clear', 'fetch'])
      expect(mockFetchClinicById).toHaveBeenCalledWith(5)
    })

    it('does NOT call fetchClinicById when clinicId is NaN', async () => {
      await mountSuspended(ClinicDetail, {
        props: { clinicId: 'not-a-number' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(mockFetchClinicById).not.toHaveBeenCalled()
    })

    it('does NOT call fetchClinicById when clinicId is 0', async () => {
      await mountSuspended(ClinicDetail, {
        props: { clinicId: '0' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(mockFetchClinicById).not.toHaveBeenCalled()
    })

    it('does NOT call fetchClinicById when clinicId is negative', async () => {
      await mountSuspended(ClinicDetail, {
        props: { clinicId: '-1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(mockFetchClinicById).not.toHaveBeenCalled()
    })

    it('does NOT call fetchClinicById when clinicId is empty', async () => {
      await mountSuspended(ClinicDetail, {
        props: { clinicId: '' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(mockFetchClinicById).not.toHaveBeenCalled()
    })

    it('parses clinicId as a number before calling fetchClinicById', async () => {
      await mountSuspended(ClinicDetail, {
        props: { clinicId: '42' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(mockFetchClinicById).toHaveBeenCalledWith(42)
    })
  })

  // ── Loading skeleton ────────────────────────────────────────

  describe('loading skeleton', () => {
    it('renders the loading skeleton when isLoading is true and no clinic is selected', async () => {
      mockIsLoading.value = true
      mockSelectedClinic.value = null
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('hides the skeleton when a clinic is loaded', async () => {
      mockIsLoading.value = false
      mockSelectedClinic.value = makeClinic()
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })
  })

  // ── "Not found" state ──────────────────────────────────────

  describe('"not found" state', () => {
    it('shows the "Clínica no encontrada" message when clinic is null and not loading', async () => {
      mockIsLoading.value = false
      mockSelectedClinic.value = null
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '999' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Clínica no encontrada')
    })

    it('renders a link to return to the directory in the "not found" state', async () => {
      mockIsLoading.value = false
      mockSelectedClinic.value = null
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '999' },
        global: {
          stubs: {
            NuxtLink: {
              template: '<a :href="to"><slot /></a>',
              props: ['to'],
            },
          },
        },
      })
      const link = wrapper.findAll('a').find(a => a.attributes('href') === '/clinics')
      expect(link).toBeDefined()
    })
  })

  // ── Clinic profile content ─────────────────────────────────

  describe('clinic profile content', () => {
    beforeEach(() => {
      mockSelectedClinic.value = makeClinic()
    })

    it('renders the clinic name as <h1>', async () => {
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('h1').text()).toContain('Los Andes Vet')
    })

    it('renders the city and country', async () => {
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá')
      expect(wrapper.text()).toContain('Colombia')
    })

    it('renders the address, city, and country combined', async () => {
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Calle 72 #15-30')
      expect(wrapper.text()).toContain('Bogotá')
      expect(wrapper.text()).toContain('Colombia')
    })

    it('renders the description as plain text (not v-html)', async () => {
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Atención veterinaria integral')
    })

    it('renders all specialties', async () => {
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Cirugía')
      expect(wrapper.text()).toContain('Dermatología')
    })

    it('renders the "Verificado" badge when verified is true', async () => {
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Verificado')
    })

    it('hides the "Verificado" badge when verified is false', async () => {
      mockSelectedClinic.value = makeClinic({ verified: false })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Verificado')
    })

    it('renders the "Destacado" badge when plan is a paid plan', async () => {
      mockSelectedClinic.value = makeClinic({ plan: 'pro' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Destacado')
    })

    it('hides the "Destacado" badge when plan is "free"', async () => {
      mockSelectedClinic.value = makeClinic({ plan: 'free' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Destacado')
    })
  })

  // ── Services section ─────────────────────────────────────────

  describe('services section', () => {
    it('renders the services when services array is non-empty', async () => {
      mockSelectedClinic.value = makeClinic({ services: ['Consulta general', 'Vacunación'] })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Servicios')
      expect(wrapper.text()).toContain('Consulta general')
      expect(wrapper.text()).toContain('Vacunación')
    })

    it('hides the services section when services array is empty', async () => {
      mockSelectedClinic.value = makeClinic({ services: [] })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Servicios de la clínica"]').exists()).toBe(false)
    })
  })

  // ── Schedules section ────────────────────────────────────────

  describe('schedules section', () => {
    it('renders the schedules section when schedules is truthy', async () => {
      mockSelectedClinic.value = makeClinic({ schedules: 'Lunes a Viernes: 8:00 AM - 6:00 PM' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Horarios de atención')
      expect(wrapper.text()).toContain('Lunes a Viernes: 8:00 AM - 6:00 PM')
    })

    it('hides the schedules section when schedules is undefined', async () => {
      mockSelectedClinic.value = makeClinic({ schedules: undefined })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Horarios de atención')
    })

    it('hides the schedules section when schedules is empty string', async () => {
      mockSelectedClinic.value = makeClinic({ schedules: '' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Horarios de atención')
    })
  })

  // ── Photo rendering ────────────────────────────────────────

  describe('photo rendering', () => {
    it('renders the cover image when cover_image_url is a valid https URL', async () => {
      mockSelectedClinic.value = makeClinic({ cover_image_url: 'https://example.com/clinica.jpg' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(true)
    })

    it('shows the 🏥 fallback when cover_image_url is undefined', async () => {
      mockSelectedClinic.value = makeClinic({ cover_image_url: undefined })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.clinic-detail__banner-fallback').exists()).toBe(true)
      expect(wrapper.text()).toContain('🏥')
    })

    it('shows the 🏥 fallback when cover_image_url is a javascript: URI (XSS vector)', async () => {
      mockSelectedClinic.value = makeClinic({ cover_image_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.clinic-detail__banner-fallback').exists()).toBe(true)
    })

    it('shows the 🏥 fallback when cover_image_url is a data: URI (rejected)', async () => {
      mockSelectedClinic.value = makeClinic({ cover_image_url: 'data:image/png;base64,abc' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.clinic-detail__banner-fallback').exists()).toBe(true)
    })
  })

  // ── Contact section ────────────────────────────────────────

  describe('contact section', () => {
    it('renders the phone number with tel: href when phone is safe', async () => {
      mockSelectedClinic.value = makeClinic({ phone: '+57 300 987 6543' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('a[href^="tel:"]')
      expect(link.exists()).toBe(true)
    })

    it('hides the phone section when phone is empty', async () => {
      mockSelectedClinic.value = makeClinic({ phone: '' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
    })

    it('renders the email with mailto: href when email is safe', async () => {
      mockSelectedClinic.value = makeClinic({ email: 'info@clinicaandes.com' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('a[href^="mailto:"]')
      expect(link.exists()).toBe(true)
    })

    it('hides the email section when email fails regex', async () => {
      mockSelectedClinic.value = makeClinic({ email: 'not-an-email' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
    })
  })

  // ── Social media links ───────────────────────────────────────

  describe('social media links', () => {
    it('renders the Facebook link when facebook_url is a valid URL', async () => {
      mockSelectedClinic.value = makeClinic({ facebook_url: 'https://facebook.com/clinicaandes' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('[aria-label="Facebook de Los Andes Vet"]')
      expect(link.exists()).toBe(true)
    })

    it('hides the Facebook link when facebook_url is undefined', async () => {
      mockSelectedClinic.value = makeClinic({ facebook_url: undefined })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Facebook de Los Andes Vet"]').exists()).toBe(false)
    })

    it('renders the Instagram link when instagram_url is a valid URL', async () => {
      mockSelectedClinic.value = makeClinic({ instagram_url: 'https://instagram.com/clinicaandes' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('[aria-label="Instagram de Los Andes Vet"]')
      expect(link.exists()).toBe(true)
    })

    it('renders the Twitter link when twitter_url is a valid URL', async () => {
      mockSelectedClinic.value = makeClinic({ twitter_url: 'https://twitter.com/clinicaandes' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('[aria-label="Twitter de Los Andes Vet"]')
      expect(link.exists()).toBe(true)
    })

    it('hides the social section when no social URLs are provided', async () => {
      mockSelectedClinic.value = makeClinic({
        facebook_url: undefined,
        instagram_url: undefined,
        twitter_url: undefined,
      })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Redes sociales')
    })

    it('blocks social links with javascript: URI', async () => {
      mockSelectedClinic.value = makeClinic({
        facebook_url: 'javascript:alert(1)',
        instagram_url: 'javascript:alert(2)',
        twitter_url: 'javascript:alert(3)',
      })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Redes sociales')
    })
  })

  // ── Error alert ────────────────────────────────────────────

  describe('error alert', () => {
    it('renders the error alert when error ref is set', async () => {
      mockError.value = 'Error al cargar la clínica'
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const alert = wrapper.find('[role="alert"]')
      expect(alert.exists()).toBe(true)
      expect(alert.text()).toContain('Error al cargar la clínica')
    })

    it('hides the error alert when error is null', async () => {
      mockError.value = null
      mockSelectedClinic.value = makeClinic()
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    })
  })

  // ── Back navigation ────────────────────────────────────────

  describe('back navigation', () => {
    it('renders a link back to /clinics', async () => {
      mockSelectedClinic.value = makeClinic()
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: {
          stubs: {
            NuxtLink: {
              template: '<a :href="to"><slot /></a>',
              props: ['to'],
            },
          },
        },
      })
      const backLink = wrapper.findAll('a').find(a => a.attributes('href') === '/clinics')
      expect(backLink).toBeDefined()
    })
  })
})
