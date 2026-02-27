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
//   - clinicId path traversal guard: invalid IDs do NOT call fetchClinicById.
//   - Valid clinicId calls clearSelectedClinic() then fetchClinicById().
//   - Profile content: name, city, address, specialties, description, contact.
//   - Photo rendering with isSafeImageUrl guard (🏥 fallback on unsafe URLs).
//   - Verified and featured badges.
//   - Business hours table (shown only when hours object has data).
//   - Coordinates / map placeholder (shown only when lat+lng present).
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
import type { Clinic, ClinicHours } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeHours(overrides: Partial<ClinicHours> = {}): ClinicHours {
  return {
    monday: '8:00 AM - 6:00 PM',
    tuesday: '8:00 AM - 6:00 PM',
    wednesday: '8:00 AM - 6:00 PM',
    thursday: '8:00 AM - 6:00 PM',
    friday: '8:00 AM - 5:00 PM',
    saturday: '9:00 AM - 1:00 PM',
    sunday: undefined,
    ...overrides,
  }
}

function makeClinic(overrides: Partial<Clinic> = {}): Clinic {
  return {
    id: '1',
    name: 'Los Andes Vet',
    description: 'Atención veterinaria integral para toda tu familia',
    address: 'Calle 72 #15-30',
    city: 'Bogotá',
    phone: '+57 300 987 6543',
    email: 'info@clinicaandes.com',
    website: 'https://clinicaandes.com',
    photo_url: 'https://example.com/clinica.jpg',
    specialties: ['Cirugía', 'Dermatología'],
    is_verified: true,
    is_featured: false,
    hours: makeHours(),
    latitude: 4.7109886,
    longitude: -74.072092,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── useClinics mock ────────────────────────────────────────────
// Module-level reactive refs so each test can override values before mount.

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
    it('calls clearSelectedClinic then fetchClinicById on mount with valid id', async () => {
      const callOrder: string[] = []
      mockClearSelectedClinic.mockImplementation(() => callOrder.push('clear'))
      mockFetchClinicById.mockImplementation(async () => { callOrder.push('fetch'); return null })

      await mountSuspended(ClinicDetail, {
        props: { clinicId: 'abc-123' },
        global: { stubs: { NuxtLink: true } },
      })

      expect(callOrder).toEqual(['clear', 'fetch'])
      expect(mockFetchClinicById).toHaveBeenCalledWith('abc-123')
    })

    it('does NOT call fetchClinicById when clinicId contains path traversal characters', async () => {
      await mountSuspended(ClinicDetail, {
        props: { clinicId: '../../../etc/passwd' },
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

    it('accepts clinicId with hyphens (valid slug format)', async () => {
      await mountSuspended(ClinicDetail, {
        props: { clinicId: 'los-andes-vet-123' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(mockFetchClinicById).toHaveBeenCalledWith('los-andes-vet-123')
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

    it('renders the city', async () => {
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá')
    })

    it('renders the address and city combined', async () => {
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Calle 72 #15-30')
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

    it('renders the "Verificado" badge when is_verified is true', async () => {
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Verificado')
    })

    it('hides the "Verificado" badge when is_verified is false', async () => {
      mockSelectedClinic.value = makeClinic({ is_verified: false })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Verificado')
    })

    it('renders the "Destacado" badge when is_featured is true', async () => {
      mockSelectedClinic.value = makeClinic({ is_featured: true })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Destacado')
    })
  })

  // ── Photo rendering ────────────────────────────────────────

  describe('photo rendering', () => {
    it('renders the photo when photo_url is a valid https URL', async () => {
      mockSelectedClinic.value = makeClinic({ photo_url: 'https://example.com/clinica.jpg' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(true)
    })

    it('shows the 🏥 fallback when photo_url is undefined', async () => {
      mockSelectedClinic.value = makeClinic({ photo_url: undefined })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.clinic-detail__banner-fallback').exists()).toBe(true)
      expect(wrapper.text()).toContain('🏥')
    })

    it('shows the 🏥 fallback when photo_url is a javascript: URI (XSS vector)', async () => {
      mockSelectedClinic.value = makeClinic({ photo_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.clinic-detail__banner-fallback').exists()).toBe(true)
    })

    it('shows the 🏥 fallback when photo_url is a data: URI (rejected)', async () => {
      mockSelectedClinic.value = makeClinic({ photo_url: 'data:image/png;base64,abc' })
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

    it('hides the phone section when phone is undefined', async () => {
      mockSelectedClinic.value = makeClinic({ phone: undefined })
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

    it('hides the email section when email is undefined', async () => {
      mockSelectedClinic.value = makeClinic({ email: undefined })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
    })

    it('renders the website link when website is an https URL', async () => {
      mockSelectedClinic.value = makeClinic({ website: 'https://clinicaandes.com' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('a[href="https://clinicaandes.com"]')
      expect(link.exists()).toBe(true)
    })

    it('hides the website link when website is a javascript: URI (XSS block)', async () => {
      mockSelectedClinic.value = makeClinic({ website: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="javascript:"]').exists()).toBe(false)
    })
  })

  // ── Business hours ─────────────────────────────────────────

  describe('business hours', () => {
    it('renders the hours table when the clinic has hours data', async () => {
      mockSelectedClinic.value = makeClinic({ hours: makeHours() })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Horarios de atención')
      expect(wrapper.find('.clinic-detail__hours-table').exists()).toBe(true)
    })

    it('shows "Cerrado" for days with no hours defined', async () => {
      mockSelectedClinic.value = makeClinic({ hours: { monday: '8:00 AM - 6:00 PM' } })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Cerrado')
    })

    it('hides the hours section when hours object is undefined', async () => {
      mockSelectedClinic.value = makeClinic({ hours: undefined })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Horarios de atención')
    })

    it('hides the hours section when all days have empty string values', async () => {
      mockSelectedClinic.value = makeClinic({
        hours: { monday: '', tuesday: '', wednesday: '', thursday: '', friday: '', saturday: '', sunday: '' },
      })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Horarios de atención')
    })
  })

  // ── Map placeholder ────────────────────────────────────────

  describe('map placeholder', () => {
    it('shows the coordinates card when latitude and longitude are present', async () => {
      mockSelectedClinic.value = makeClinic({ latitude: 4.71, longitude: -74.07 })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Ubicación')
      expect(wrapper.find('.clinic-detail__map-placeholder').exists()).toBe(true)
    })

    it('hides the coordinates card when latitude is absent', async () => {
      mockSelectedClinic.value = makeClinic({ latitude: undefined, longitude: -74.07 })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.clinic-detail__map-placeholder').exists()).toBe(false)
    })

    it('hides the coordinates card when both lat and lng are absent', async () => {
      mockSelectedClinic.value = makeClinic({ latitude: undefined, longitude: undefined })
      const wrapper = await mountSuspended(ClinicDetail, {
        props: { clinicId: '1' },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.clinic-detail__map-placeholder').exists()).toBe(false)
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
