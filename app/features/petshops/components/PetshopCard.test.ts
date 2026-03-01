// ============================================================
// PetshopCard.test.ts
// Tests for the PetshopCard component.
//
// Strategy: mountSuspended from @nuxt/test-utils resolves Nuxt
// auto-imports inside the component. We test behaviour and DOM
// output — not CSS or implementation details.
//
// Key design points:
//   - isSafeImageUrl: https: and http: accepted; data: and
//     javascript: rejected; absent logo_url shows 🏪 fallback.
//   - Verified badge (verified) and Plan badge (plan !== '')
//     conditionally rendered.
//   - Phone: composed from phone_country_code + phone.
//   - WhatsApp: href only when whatsapp_link is safe https/http.
//   - Email: mailto: href only when safeEmail passes regex.
//   - Website: href only when https:/http: — javascript: is blocked.
//   - "Ver tienda" link navigates to /stores/:id.
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
import PetshopCard from './PetshopCard.vue'
import type { Petshop } from '../types'

// ── NuxtLink stub ─────────────────────────────────────────────
// Renders slot content as <a href="..."> for href assertions.
const NuxtLinkHrefStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

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

const defaultPetshop = makePetshop()

// ── Suite ─────────────────────────────────────────────────────

describe('PetshopCard', () => {
  // ── Core content ──────────────────────────────────────────

  describe('core content', () => {
    it('renders the store name', async () => {
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop: defaultPetshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Mascotas Felices')
    })

    it('renders the city and country', async () => {
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop: defaultPetshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá')
      expect(wrapper.text()).toContain('Colombia')
    })

    it('wraps the card in an <article> with a descriptive aria-label', async () => {
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop: defaultPetshop },
        global: { stubs: { NuxtLink: true } },
      })
      const article = wrapper.find('article')
      expect(article.exists()).toBe(true)
      expect(article.attributes('aria-label')).toContain('Mascotas Felices')
    })

    it('renders city, country format in location', async () => {
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop: defaultPetshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá, Colombia')
    })
  })

  // ── Photo rendering ────────────────────────────────────────

  describe('photo rendering', () => {
    it('renders the logo when logo_url is a valid https URL', async () => {
      const petshop = makePetshop({ logo_url: 'https://example.com/tienda.jpg' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/tienda.jpg')
    })

    it('renders the logo when logo_url is a valid http URL', async () => {
      const petshop = makePetshop({ logo_url: 'http://example.com/tienda.jpg' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(true)
    })

    it('shows the 🏪 fallback when logo_url is undefined', async () => {
      const petshop = makePetshop({ logo_url: undefined })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏪')
    })

    it('shows the 🏪 fallback when logo_url is a data: URI (rejected)', async () => {
      const petshop = makePetshop({ logo_url: 'data:image/png;base64,abc123' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏪')
    })

    it('shows the 🏪 fallback when logo_url is a javascript: URI (rejected)', async () => {
      const petshop = makePetshop({ logo_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏪')
    })

    it('the logo has a descriptive alt text containing the store name', async () => {
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop: defaultPetshop },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.attributes('alt')).toContain('Mascotas Felices')
    })
  })

  // ── Verified badge ─────────────────────────────────────────

  describe('verified badge', () => {
    it('shows the "Verificado" badge when verified is true', async () => {
      const petshop = makePetshop({ verified: true })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Verificado')
    })

    it('hides the "Verificado" badge when verified is false', async () => {
      const petshop = makePetshop({ verified: false })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Verificado')
    })

    it('the verified badge has a descriptive aria-label', async () => {
      const petshop = makePetshop({ verified: true })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('[aria-label="Tienda verificada"]')
      expect(badge.exists()).toBe(true)
    })
  })

  // ── Plan badge (Destacado) ─────────────────────────────────

  describe('plan badge', () => {
    it('shows the "Destacado" badge when plan is non-empty', async () => {
      const petshop = makePetshop({ plan: 'premium' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Destacado')
    })

    it('hides the "Destacado" badge when plan is empty string', async () => {
      const petshop = makePetshop({ plan: '' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Destacado')
    })

    it('the plan badge has a descriptive aria-label', async () => {
      const petshop = makePetshop({ plan: 'premium' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('[aria-label="Tienda destacada"]')
      expect(badge.exists()).toBe(true)
    })
  })

  // ── Contact links ──────────────────────────────────────────

  describe('contact links', () => {
    it('renders the phone link with tel: href using composed phone', async () => {
      const petshop = makePetshop({ phone_country_code: '+57', phone: '300 123 4567' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('a[href^="tel:"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('tel:+57 300 123 4567')
    })

    it('hides the phone link when phone is empty', async () => {
      const petshop = makePetshop({ phone: '' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
    })

    it('renders the email link with mailto: href when email is safe', async () => {
      const petshop = makePetshop({ email: 'info@mascotasfelices.com' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('a[href^="mailto:"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('mailto:info@mascotasfelices.com')
    })

    it('hides the email link when email has no @ character (invalid)', async () => {
      const petshop = makePetshop({ email: 'not-an-email' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
    })

    it('renders the website link with the original href when website starts with https://', async () => {
      const petshop = makePetshop({ website: 'https://mascotasfelices.com' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('[aria-label="Visitar sitio web de Mascotas Felices"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://mascotasfelices.com')
    })

    it('blocks the website link when website starts with javascript: (XSS vector)', async () => {
      const petshop = makePetshop({ website: 'javascript:alert(document.cookie)' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Visitar sitio web de Mascotas Felices"]').exists()).toBe(false)
    })

    it('hides the website link when website is undefined', async () => {
      const petshop = makePetshop({ website: undefined })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Visitar sitio web de Mascotas Felices"]').exists()).toBe(false)
    })
  })

  // ── WhatsApp link ────────────────────────────────────────────

  describe('WhatsApp link', () => {
    it('renders the WhatsApp icon when whatsapp_link is a valid https URL', async () => {
      const petshop = makePetshop({ whatsapp_link: 'https://wa.me/573001234567' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('[aria-label="WhatsApp de Mascotas Felices"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('https://wa.me/573001234567')
    })

    it('hides the WhatsApp icon when whatsapp_link is undefined', async () => {
      const petshop = makePetshop({ whatsapp_link: undefined })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="WhatsApp de Mascotas Felices"]').exists()).toBe(false)
    })

    it('hides the WhatsApp icon when whatsapp_link is a javascript: URI', async () => {
      const petshop = makePetshop({ whatsapp_link: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="WhatsApp de Mascotas Felices"]').exists()).toBe(false)
    })
  })

  // ── CTA "Ver tienda" stretched-link ────────────────────────

  describe('"Ver tienda" CTA', () => {
    it('renders the "Ver tienda" link text', async () => {
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop: defaultPetshop },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      expect(wrapper.text()).toContain('Ver tienda')
    })

    it('the stretched-link href points to /stores/:id (numeric)', async () => {
      const petshop = makePetshop({ id: 42, phone: '', email: 'not-valid', website: undefined, whatsapp_link: undefined })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('href')).toContain('/stores/42')
    })

    it('the CTA has a descriptive aria-label containing the store name', async () => {
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop: defaultPetshop },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('aria-label')).toContain('Mascotas Felices')
    })
  })
})
