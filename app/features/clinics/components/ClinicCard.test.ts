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
//     javascript: rejected; absent photo_url shows 🏥 fallback.
//   - Verified badge (is_verified) and Featured badge (is_featured)
//     conditionally rendered.
//   - Specialty chips: max 3 visible; overflow shown as "+N".
//   - Phone: tel: href only when safePhone passes regex.
//   - Email: mailto: href only when safeEmail passes regex.
//   - Website: href only when https:/http: — javascript: is blocked.
//   - "Ver clínica" link navigates to /clinics/:id.
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
// Renders slot content as <a href="..."> for href assertions.
const NuxtLinkHrefStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

// ── Fixtures ─────────────────────────────────────────────────

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

    it('renders the city', async () => {
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic: defaultClinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá')
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

    it('renders the address alongside the city when address is present', async () => {
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic: defaultClinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Calle 72 #15-30')
    })

    it('renders only the city when address is absent', async () => {
      const clinic = makeClinic({ address: '' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá')
      expect(wrapper.text()).not.toContain(', Bogotá')
    })
  })

  // ── Photo rendering ────────────────────────────────────────

  describe('photo rendering', () => {
    it('renders the photo when photo_url is a valid https URL', async () => {
      const clinic = makeClinic({ photo_url: 'https://example.com/clinica.jpg' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/clinica.jpg')
    })

    it('renders the photo when photo_url is a valid http URL', async () => {
      const clinic = makeClinic({ photo_url: 'http://example.com/clinica.jpg' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(true)
    })

    it('shows the 🏥 fallback when photo_url is undefined', async () => {
      const clinic = makeClinic({ photo_url: undefined })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏥')
    })

    it('shows the 🏥 fallback when photo_url is a data: URI (rejected)', async () => {
      const clinic = makeClinic({ photo_url: 'data:image/png;base64,abc123' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏥')
    })

    it('shows the 🏥 fallback when photo_url is a javascript: URI (rejected)', async () => {
      const clinic = makeClinic({ photo_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏥')
    })

    it('the photo has a descriptive alt text containing the clinic name', async () => {
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
    it('shows the "Verificado" badge when is_verified is true', async () => {
      const clinic = makeClinic({ is_verified: true })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Verificado')
    })

    it('hides the "Verificado" badge when is_verified is false', async () => {
      const clinic = makeClinic({ is_verified: false })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Verificado')
    })

    it('the verified badge has a descriptive aria-label', async () => {
      const clinic = makeClinic({ is_verified: true })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('[aria-label="Clínica verificada"]')
      expect(badge.exists()).toBe(true)
    })
  })

  // ── Featured badge ─────────────────────────────────────────

  describe('featured badge', () => {
    it('shows the "Destacado" badge when is_featured is true', async () => {
      const clinic = makeClinic({ is_featured: true })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Destacado')
    })

    it('hides the "Destacado" badge when is_featured is false', async () => {
      const clinic = makeClinic({ is_featured: false })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Destacado')
    })

    it('the featured badge has a descriptive aria-label', async () => {
      const clinic = makeClinic({ is_featured: true })
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

    it('hides the phone link when phone is null', async () => {
      const clinic = makeClinic({ phone: undefined })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
    })

    it('hides the phone link when phone fails the safety regex (injection attempt)', async () => {
      const clinic = makeClinic({ phone: '<script>alert(1)</script>' })
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

    it('hides the email link when email is null', async () => {
      const clinic = makeClinic({ email: undefined })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
    })

    it('hides the email link when email has no @ character (invalid)', async () => {
      const clinic = makeClinic({ email: 'not-an-email' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
    })

    it('renders the website link with the original href when website starts with https://', async () => {
      const clinic = makeClinic({ website: 'https://clinicaandes.com' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('[aria-label="Visitar sitio web de Los Andes Vet"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://clinicaandes.com')
    })

    it('blocks the website link when website starts with javascript: (XSS vector)', async () => {
      const clinic = makeClinic({ website: 'javascript:alert(document.cookie)' })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Visitar sitio web de Los Andes Vet"]').exists()).toBe(false)
    })

    it('hides the website link when website is undefined', async () => {
      const clinic = makeClinic({ website: undefined })
      const wrapper = await mountSuspended(ClinicCard, {
        props: { clinic },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Visitar sitio web de Los Andes Vet"]').exists()).toBe(false)
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

    it('the stretched-link href points to /clinics/:id', async () => {
      // Use a clinic with NO phone/email/website to avoid finding contact <a> elements first.
      const clinic = makeClinic({ id: '42', phone: undefined, email: undefined, website: undefined })
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
