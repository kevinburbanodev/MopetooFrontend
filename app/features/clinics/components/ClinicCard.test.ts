// ============================================================
// ClinicCard.test.ts
// Tests for the ClinicCard component.
//
// Strategy: mountSuspended from @nuxt/test-utils resolves Nuxt
// auto-imports inside the component. We test behaviour and DOM
// output — not CSS or implementation details.
//
// Key design points:
//   - isSafeImageUrl: https: and http: accepted; data: and
//     javascript: rejected; absent cover_image_url shows 🏥 fallback.
//   - Verified badge (verified) and Plan badge (plan !== '' && plan !== 'free')
//     conditionally rendered.
//   - Specialty chips: max 3 visible; overflow shown as "+N".
//   - Phone: tel: href only when safePhone passes regex.
//   - Email: mailto: href only when safeEmail passes regex.
//   - Social links: Facebook, Instagram, Twitter with URL safety checks.
//   - "Ver clínica" link navigates to /clinics/:id (numeric).
//
// NuxtLink stubs:
//   - { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } }
//     is the canonical stub for href assertions (MEMORY.md convention).
//
// What this suite does NOT cover intentionally:
//   - CSS transitions / SCSS visual styles.
//   - img @error event (happy-dom does not fire real network events).
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ClinicCard from './ClinicCard.vue'
import type { Clinic } from '../types'

// ── NuxtLink stub ─────────────────────────────────────────────
const NuxtLinkHrefStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

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
    services: ['Consulta general', 'Vacunación'],
    cover_image_url: 'https://example.com/clinica.jpg',
    plan: 'free',
    verified: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const defaultClinic = makeClinic()

// ── Suite ─────────────────────────────────────────────────────

describe('ClinicCard', () => {
  // ── Core content ──────────────────────────────────────────

  describe('core content', () => {
    it('renders the clinic name', async () => {
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic: defaultClinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Los Andes Vet')
    })

    it('renders the city and country', async () => {
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic: defaultClinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá')
      expect(wrapper.text()).toContain('Colombia')
    })

    it('wraps the card in an <article> with a descriptive aria-label', async () => {
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic: defaultClinic },
        global: { stubs: { NuxtLink: true } },
      })
      const article = wrapper.find('article')
      expect(article.exists()).toBe(true)
      expect(article.attributes('aria-label')).toContain('Los Andes Vet')
    })

    it('renders city, country format in location', async () => {
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic: defaultClinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá, Colombia')
    })
  })

  // ── Photo rendering ────────────────────────────────────────

  describe('photo rendering', () => {
    it('renders the cover image when cover_image_url is a valid https URL', async () => {
      const clinic = makeClinic({ cover_image_url: 'https://example.com/clinica.jpg' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/clinica.jpg')
    })

    it('renders the cover image when cover_image_url is a valid http URL', async () => {
      const clinic = makeClinic({ cover_image_url: 'http://example.com/clinica.jpg' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(true)
    })

    it('shows the 🏥 fallback when cover_image_url is undefined', async () => {
      const clinic = makeClinic({ cover_image_url: undefined })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏥')
    })

    it('shows the 🏥 fallback when cover_image_url is a data: URI (rejected)', async () => {
      const clinic = makeClinic({ cover_image_url: 'data:image/png;base64,abc123' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏥')
    })

    it('shows the 🏥 fallback when cover_image_url is a javascript: URI (rejected)', async () => {
      const clinic = makeClinic({ cover_image_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏥')
    })

    it('the cover image has a descriptive alt text containing the clinic name', async () => {
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic: defaultClinic },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.attributes('alt')).toContain('Los Andes Vet')
    })
  })

  // ── Verified badge ─────────────────────────────────────────

  describe('verified badge', () => {
    it('shows the "Verificado" badge when verified is true', async () => {
      const clinic = makeClinic({ verified: true })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Verificado')
    })

    it('hides the "Verificado" badge when verified is false', async () => {
      const clinic = makeClinic({ verified: false })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Verificado')
    })

    it('the verified badge has a descriptive aria-label', async () => {
      const clinic = makeClinic({ verified: true })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('[aria-label="Clínica verificada"]')
      expect(badge.exists()).toBe(true)
    })
  })

  // ── Plan badge (Destacado) ─────────────────────────────────

  describe('plan badge', () => {
    it('shows the "Destacado" badge when plan is a paid plan (e.g. "pro")', async () => {
      const clinic = makeClinic({ plan: 'pro' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Destacado')
    })

    it('hides the "Destacado" badge when plan is "free"', async () => {
      const clinic = makeClinic({ plan: 'free' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Destacado')
    })

    it('hides the "Destacado" badge when plan is empty string', async () => {
      const clinic = makeClinic({ plan: '' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Destacado')
    })

    it('the plan badge has a descriptive aria-label', async () => {
      const clinic = makeClinic({ plan: 'premium' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('[aria-label="Clínica destacada"]')
      expect(badge.exists()).toBe(true)
    })
  })

  // ── Specialty chips ────────────────────────────────────────

  describe('specialty chips', () => {
    it('renders all specialties when there are 3 or fewer', async () => {
      const clinic = makeClinic({ specialties: ['Cirugía', 'Dermatología', 'Cardiología'] })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Cirugía')
      expect(wrapper.text()).toContain('Dermatología')
      expect(wrapper.text()).toContain('Cardiología')
    })

    it('shows only 3 specialty chips when there are more than 3 specialties', async () => {
      const clinic = makeClinic({ specialties: ['Cirugía', 'Dermatología', 'Cardiología', 'Oncología'] })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const chips = wrapper.findAll('.clinic-card__specialty')
      expect(chips).toHaveLength(3)
    })

    it('shows the +N overflow badge when specialties.length > 3', async () => {
      const clinic = makeClinic({ specialties: ['A', 'B', 'C', 'D', 'E'] })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('+2')
    })

    it('does NOT show an overflow badge when specialties.length === 3', async () => {
      const clinic = makeClinic({ specialties: ['A', 'B', 'C'] })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('+')
    })

    it('hides the specialty section when specialties is empty', async () => {
      const clinic = makeClinic({ specialties: [] })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Especialidades de la clínica"]').exists()).toBe(false)
    })
  })

  // ── Contact links ──────────────────────────────────────────

  describe('contact links', () => {
    it('renders the phone link with tel: href when phone is safe', async () => {
      const clinic = makeClinic({ phone: '+57 300 987 6543' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('a[href^="tel:"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('tel:+57 300 987 6543')
    })

    it('hides the phone link when phone is empty', async () => {
      const clinic = makeClinic({ phone: '' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
    })

    it('renders the email link with mailto: href when email is safe', async () => {
      const clinic = makeClinic({ email: 'info@clinicaandes.com' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('a[href^="mailto:"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('mailto:info@clinicaandes.com')
    })

    it('hides the email link when email has no @ character (invalid)', async () => {
      const clinic = makeClinic({ email: 'not-an-email' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
    })
  })

  // ── Social media links ──────────────────────────────────────

  describe('social media links', () => {
    it('renders the Facebook link when facebook_url is a valid https URL', async () => {
      const clinic = makeClinic({ facebook_url: 'https://facebook.com/clinicaandes' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('[aria-label="Facebook de Los Andes Vet"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://facebook.com/clinicaandes')
    })

    it('hides the Facebook link when facebook_url is undefined', async () => {
      const clinic = makeClinic({ facebook_url: undefined })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Facebook de Los Andes Vet"]').exists()).toBe(false)
    })

    it('hides the Facebook link when facebook_url is a javascript: URI', async () => {
      const clinic = makeClinic({ facebook_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Facebook de Los Andes Vet"]').exists()).toBe(false)
    })

    it('renders the Instagram link when instagram_url is a valid https URL', async () => {
      const clinic = makeClinic({ instagram_url: 'https://instagram.com/clinicaandes' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('[aria-label="Instagram de Los Andes Vet"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://instagram.com/clinicaandes')
    })

    it('hides the Instagram link when instagram_url is undefined', async () => {
      const clinic = makeClinic({ instagram_url: undefined })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Instagram de Los Andes Vet"]').exists()).toBe(false)
    })

    it('renders the Twitter link when twitter_url is a valid https URL', async () => {
      const clinic = makeClinic({ twitter_url: 'https://twitter.com/clinicaandes' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('[aria-label="Twitter de Los Andes Vet"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://twitter.com/clinicaandes')
    })

    it('hides the Twitter link when twitter_url is undefined', async () => {
      const clinic = makeClinic({ twitter_url: undefined })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Twitter de Los Andes Vet"]').exists()).toBe(false)
    })
  })

  // ── CTA "Ver clínica" stretched-link ───────────────────────

  describe('"Ver clínica" CTA', () => {
    it('renders the "Ver clínica" link text', async () => {
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic: defaultClinic },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      expect(wrapper.text()).toContain('Ver clínica')
    })

    it('the stretched-link href points to /clinics/:id (numeric)', async () => {
      const clinic = makeClinic({ id: 42, phone: '', email: 'not-valid' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('href')).toContain('/clinics/42')
    })

    it('the CTA has a descriptive aria-label containing the clinic name', async () => {
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic: defaultClinic },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('aria-label')).toContain('Los Andes Vet')
    })
  })
})
