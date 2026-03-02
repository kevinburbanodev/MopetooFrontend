// ============================================================
// ShelterCard.test.ts
// Tests for the ShelterCard component.
//
// Strategy: mountSuspended from @nuxt/test-utils resolves Nuxt
// auto-imports. We test DOM output and conditional rendering.
//
// Key design points:
//   - isSafeImageUrl: https/http accepted; data:/javascript: rejected;
//     absent logo_url shows 🏠 fallback.
//   - Verified badge conditionally rendered.
//   - Description excerpt truncated to 120 chars.
//   - "Ver refugio" link navigates to /shelters/:id (numeric).
//
// NuxtLink stubs:
//   - { NuxtLink: { template: '<a :href="to"><slot /></a>', props: ['to'] } }
//     is the canonical stub for href assertions.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ShelterCard from './ShelterCard.vue'
import type { Shelter } from '../types'

// ── NuxtLink stub ─────────────────────────────────────────────
const NuxtLinkHrefStub = {
  template: '<a :href="to"><slot /></a>',
  props: ['to'],
}

// ── Fixtures ─────────────────────────────────────────────────

function makeShelter(overrides: Partial<Shelter> = {}): Shelter {
  return {
    id: 1,
    organization_name: 'Refugio Esperanza',
    email: 'contacto@refugio.com',
    description: 'Un refugio dedicado a rescatar animales abandonados.',
    country: 'Colombia',
    city: 'Bogotá',
    phone_country_code: '+57',
    phone: '3001234567',
    logo_url: 'https://example.com/logo.jpg',
    website: 'https://refugioesperanza.org',
    verified: true,
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const defaultShelter = makeShelter()

// ── Suite ─────────────────────────────────────────────────────

describe('ShelterCard', () => {
  // ── Core content ──────────────────────────────────────────

  describe('core content', () => {
    it('renders the shelter organization_name', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Refugio Esperanza')
    })

    it('renders the city and country', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá, Colombia')
    })

    it('wraps the card in an <article> with a descriptive aria-label', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: true } },
      })
      const article = wrapper.find('article')
      expect(article.exists()).toBe(true)
      expect(article.attributes('aria-label')).toContain('Refugio Esperanza')
    })
  })

  // ── Logo rendering ──────────────────────────────────────────

  describe('logo rendering', () => {
    it('renders the logo image when logo_url is a valid https URL', async () => {
      const shelter = makeShelter({ logo_url: 'https://example.com/logo.jpg' })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/logo.jpg')
    })

    it('renders the logo image when logo_url is a valid http URL', async () => {
      const shelter = makeShelter({ logo_url: 'http://example.com/logo.jpg' })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(true)
    })

    it('shows the 🏠 fallback when logo_url is undefined', async () => {
      const shelter = makeShelter({ logo_url: undefined })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏠')
    })

    it('shows the 🏠 fallback when logo_url is a data: URI (rejected)', async () => {
      const shelter = makeShelter({ logo_url: 'data:image/png;base64,abc123' })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏠')
    })

    it('shows the 🏠 fallback when logo_url is a javascript: URI (rejected)', async () => {
      const shelter = makeShelter({ logo_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏠')
    })

    it('the logo image has a descriptive alt text containing the shelter name', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.attributes('alt')).toContain('Refugio Esperanza')
    })
  })

  // ── Verified badge ──────────────────────────────────────────

  describe('verified badge', () => {
    it('shows the "Verificado" badge when verified is true', async () => {
      const shelter = makeShelter({ verified: true })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Verificado')
    })

    it('hides the "Verificado" badge when verified is false', async () => {
      const shelter = makeShelter({ verified: false })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Verificado')
    })

    it('the verified badge has a descriptive aria-label', async () => {
      const shelter = makeShelter({ verified: true })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('[aria-label="Refugio verificado"]')
      expect(badge.exists()).toBe(true)
    })
  })

  // ── Description excerpt ──────────────────────────────────────

  describe('description excerpt', () => {
    it('renders the full description when it is 120 chars or fewer', async () => {
      const shelter = makeShelter({ description: 'Corta descripción.' })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Corta descripción.')
    })

    it('truncates description to 120 chars with "..." when it exceeds 120', async () => {
      const longDesc = 'a'.repeat(150)
      const shelter = makeShelter({ description: longDesc })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('a'.repeat(120) + '...')
    })

    it('does not render description paragraph when description is undefined', async () => {
      const shelter = makeShelter({ description: undefined })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('.shelter-card__desc').exists()).toBe(false)
    })
  })

  // ── CTA "Ver refugio" stretched-link ─────────────────────────

  describe('"Ver refugio" CTA', () => {
    it('renders the "Ver refugio" link text', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      expect(wrapper.text()).toContain('Ver refugio')
    })

    it('the stretched-link href points to /shelters/:id (numeric)', async () => {
      const shelter = makeShelter({ id: 42 })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('href')).toContain('/shelters/42')
    })

    it('the CTA has a descriptive aria-label containing the shelter name', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: NuxtLinkHrefStub } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('aria-label')).toContain('Refugio Esperanza')
    })
  })
})
