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
//     javascript: rejected; absent photo_url shows 🏪 fallback.
//   - Verified badge (is_verified) and Featured badge (is_featured)
//     conditionally rendered.
//   - Category chips: max 3 visible; overflow shown as "+N".
//   - Phone: tel: href only when safePhone passes regex.
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
    id: '1',
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

    it('renders the city', async () => {
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop: defaultPetshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá')
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

    it('renders the address alongside the city when address is present', async () => {
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop: defaultPetshop },
        global: { stubs: { NuxtLink: true } },
      })
      // Combined format: "address, city"
      expect(wrapper.text()).toContain('Calle 50 #10-20')
    })

    it('renders only the city when address is absent', async () => {
      const petshop = makePetshop({ address: '' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá')
      expect(wrapper.text()).not.toContain(', Bogotá')
    })
  })

  // ── Photo rendering ────────────────────────────────────────

  describe('photo rendering', () => {
    it('renders the photo when photo_url is a valid https URL', async () => {
      const petshop = makePetshop({ photo_url: 'https://example.com/tienda.jpg' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/tienda.jpg')
    })

    it('renders the photo when photo_url is a valid http URL', async () => {
      const petshop = makePetshop({ photo_url: 'http://example.com/tienda.jpg' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(true)
    })

    it('shows the 🏪 fallback when photo_url is undefined', async () => {
      const petshop = makePetshop({ photo_url: undefined })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏪')
    })

    it('shows the 🏪 fallback when photo_url is a data: URI (rejected)', async () => {
      const petshop = makePetshop({ photo_url: 'data:image/png;base64,abc123' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏪')
    })

    it('shows the 🏪 fallback when photo_url is a javascript: URI (rejected)', async () => {
      const petshop = makePetshop({ photo_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏪')
    })

    it('the photo has a descriptive alt text containing the store name', async () => {
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
    it('shows the "Verificado" badge when is_verified is true', async () => {
      const petshop = makePetshop({ is_verified: true })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Verificado')
    })

    it('hides the "Verificado" badge when is_verified is false', async () => {
      const petshop = makePetshop({ is_verified: false })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Verificado')
    })

    it('the verified badge has a descriptive aria-label', async () => {
      const petshop = makePetshop({ is_verified: true })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('[aria-label="Tienda verificada"]')
      expect(badge.exists()).toBe(true)
    })
  })

  // ── Featured badge ─────────────────────────────────────────

  describe('featured badge', () => {
    it('shows the "Destacado" badge when is_featured is true', async () => {
      const petshop = makePetshop({ is_featured: true })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Destacado')
    })

    it('hides the "Destacado" badge when is_featured is false', async () => {
      const petshop = makePetshop({ is_featured: false })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Destacado')
    })

    it('the featured badge has a descriptive aria-label', async () => {
      const petshop = makePetshop({ is_featured: true })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('[aria-label="Tienda destacada"]')
      expect(badge.exists()).toBe(true)
    })
  })

  // ── Category chips ─────────────────────────────────────────

  describe('category chips', () => {
    it('renders all categories when there are 3 or fewer', async () => {
      const petshop = makePetshop({ categories: ['Alimentos', 'Accesorios', 'Veterinaria'] })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Alimentos')
      expect(wrapper.text()).toContain('Accesorios')
      expect(wrapper.text()).toContain('Veterinaria')
    })

    it('shows only 3 category chips when there are more than 3 categories', async () => {
      const petshop = makePetshop({ categories: ['Alimentos', 'Accesorios', 'Veterinaria', 'Peluquería'] })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const chips = wrapper.findAll('.petshop-card__category')
      expect(chips).toHaveLength(3)
    })

    it('shows the +N overflow badge when categories.length > 3', async () => {
      const petshop = makePetshop({ categories: ['A', 'B', 'C', 'D', 'E'] })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('+2')
    })

    it('does NOT show an overflow badge when categories.length === 3', async () => {
      const petshop = makePetshop({ categories: ['A', 'B', 'C'] })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('+')
    })

    it('hides the category section when categories is empty', async () => {
      const petshop = makePetshop({ categories: [] })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('[aria-label="Categorías de la tienda"]').exists()).toBe(false)
    })
  })

  // ── Contact links ──────────────────────────────────────────

  describe('contact links', () => {
    it('renders the phone link with tel: href when phone is safe', async () => {
      const petshop = makePetshop({ phone: '+57 300 123 4567' })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      const link = wrapper.find('a[href^="tel:"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('tel:+57 300 123 4567')
    })

    it('hides the phone link when phone is null', async () => {
      const petshop = makePetshop({ phone: undefined })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="tel:"]').exists()).toBe(false)
    })

    it('hides the phone link when phone fails the safety regex (injection attempt)', async () => {
      // Phone contains script tag — fails /^[+\d\s\-().]{4,25}$/ regex
      const petshop = makePetshop({ phone: '<script>alert(1)</script>' })
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

    it('hides the email link when email is null', async () => {
      const petshop = makePetshop({ email: undefined })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('a[href^="mailto:"]').exists()).toBe(false)
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
      // safeWebsiteUrl returns null → v-if hides the entire <a>
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

  // ── CTA "Ver tienda" stretched-link ────────────────────────

  describe('"Ver tienda" CTA', () => {
    it('renders the "Ver tienda" link text', async () => {
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop: defaultPetshop },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      expect(wrapper.text()).toContain('Ver tienda')
    })

    it('the stretched-link href points to /stores/:id', async () => {
      // Use a petshop with NO phone/email/website to avoid finding contact <a> elements first.
      // This ensures wrapper.find('a') picks up the CTA NuxtLink, not a contact link.
      const petshop = makePetshop({ id: '42', phone: undefined, email: undefined, website: undefined })
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('href')).toContain('/stores/42')
    })

    it('the CTA has a descriptive aria-label containing the store name', async () => {
      // NuxtLink: true because we only need to check aria-label attribute on the stub element
      const wrapper = await mountSuspended(PetshopCard, {
        props: { petshop: defaultPetshop },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('aria-label')).toContain('Mascotas Felices')
    })
  })
})
