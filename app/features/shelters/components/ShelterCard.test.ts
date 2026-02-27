// ============================================================
// ShelterCard.test.ts
// Tests for the ShelterCard component.
//
// Strategy: mountSuspended from @nuxt/test-utils resolves Nuxt
// auto-imports inside the component. We test behaviour and DOM
// output — not CSS or implementation details.
//
// Key design points:
//   - isSafeImageUrl: http: and https: are accepted; data: and
//     javascript: are rejected; no url shows fallback emoji.
//   - Verified badge is conditionally rendered by is_verified prop.
//   - Species badges are rendered for each entry in the species array.
//   - "Ver refugio" link navigates to /shelter/:id.
//
// NuxtLink stubs:
//   - { NuxtLink: true } → renders as <nuxtlink-stub>, slot content hidden.
//   - { NuxtLink: false } → renders as real <a> with slot content visible.
//   - We use NuxtLink: false for href/aria-label assertions on the CTA.
//
// What this suite does NOT cover intentionally:
//   - CSS transitions / SCSS visual styles.
//   - img @error event beyond checking the DOM changes state
//     (happy-dom does not fire real network events).
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ShelterCard from './ShelterCard.vue'
import type { Shelter } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeShelter(overrides: Partial<Shelter> = {}): Shelter {
  return {
    id: '1',
    name: 'Refugio Esperanza',
    description: 'Un refugio para animales necesitados',
    location: 'Bogotá, Colombia',
    city: 'Bogotá',
    address: 'Calle 100 #20-30',
    phone: '+57 300 000 0000',
    email: 'info@refugio.com',
    website: 'https://refugio.com',
    photo_url: 'https://example.com/shelter.jpg',
    species: ['dogs', 'cats'],
    is_verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const defaultShelter = makeShelter()

// ── Suite ─────────────────────────────────────────────────────

describe('ShelterCard', () => {
  // ── Core content rendering ─────────────────────────────────

  describe('content rendering', () => {
    it('renders the shelter name', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Refugio Esperanza')
    })

    it('renders the shelter city', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá')
    })

    it('renders the shelter description', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Un refugio para animales necesitados')
    })

    it('wraps the card in an <article> element with a descriptive aria-label', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: true } },
      })
      const article = wrapper.find('article')
      expect(article.exists()).toBe(true)
      expect(article.attributes('aria-label')).toContain('Refugio Esperanza')
    })
  })

  // ── Photo rendering ────────────────────────────────────────

  describe('photo rendering', () => {
    it('renders the photo when photo_url is a valid https URL', async () => {
      const shelter = makeShelter({ photo_url: 'https://example.com/shelter.jpg' })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/shelter.jpg')
    })

    it('renders the photo when photo_url is a valid http URL', async () => {
      const shelter = makeShelter({ photo_url: 'http://example.com/shelter.jpg' })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
    })

    it('shows the fallback house emoji when photo_url is undefined', async () => {
      const shelter = makeShelter({ photo_url: undefined })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏠')
    })

    it('shows the fallback emoji when photo_url is a data: URI (rejected by isSafeImageUrl)', async () => {
      const shelter = makeShelter({ photo_url: 'data:image/png;base64,abc123' })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏠')
    })

    it('shows the fallback emoji when photo_url is a javascript: URI (rejected)', async () => {
      const shelter = makeShelter({ photo_url: 'javascript:alert(1)' })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🏠')
    })

    it('the photo has a descriptive alt text containing the shelter name', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.attributes('alt')).toContain('Refugio Esperanza')
    })
  })

  // ── Verified badge ─────────────────────────────────────────

  describe('verified badge', () => {
    it('shows the "Verificado" badge when is_verified is true', async () => {
      const shelter = makeShelter({ is_verified: true })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Verificado')
    })

    it('hides the "Verificado" badge when is_verified is false', async () => {
      const shelter = makeShelter({ is_verified: false })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Verificado')
    })

    it('the verified badge has a descriptive aria-label', async () => {
      const shelter = makeShelter({ is_verified: true })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('[aria-label="Refugio verificado"]')
      expect(badge.exists()).toBe(true)
    })
  })

  // ── Species badges ─────────────────────────────────────────

  describe('species badges', () => {
    it('renders a badge for each species in the species array', async () => {
      const shelter = makeShelter({ species: ['dogs', 'cats', 'birds'] })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Perros')
      expect(wrapper.text()).toContain('Gatos')
      expect(wrapper.text()).toContain('Aves')
    })

    it('renders "Perros" for the "dogs" species key', async () => {
      const shelter = makeShelter({ species: ['dogs'] })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Perros')
    })

    it('renders "Gatos" for the "cats" species key', async () => {
      const shelter = makeShelter({ species: ['cats'] })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Gatos')
    })

    it('renders "Conejos" for the "rabbits" species key', async () => {
      const shelter = makeShelter({ species: ['rabbits'] })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Conejos')
    })

    it('hides the species section when species array is empty', async () => {
      const shelter = makeShelter({ species: [] })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: true } },
      })
      const speciesSection = wrapper.find('[aria-label="Especies aceptadas"]')
      expect(speciesSection.exists()).toBe(false)
    })
  })

  // ── CTA link ───────────────────────────────────────────────

  describe('"Ver refugio" CTA', () => {
    it('renders the "Ver refugio" link text', async () => {
      // NuxtLink: false so slot content is visible as a real <a> element
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: false } },
      })
      expect(wrapper.text()).toContain('Ver refugio')
    })

    it('the CTA link navigates to /shelter/:id', async () => {
      const shelter = makeShelter({ id: '42' })
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter },
        global: { stubs: { NuxtLink: false } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('href')).toContain('/shelter/42')
    })

    it('the CTA link has a descriptive aria-label containing the shelter name', async () => {
      const wrapper = await mountSuspended(ShelterCard, {
        props: { shelter: defaultShelter },
        global: { stubs: { NuxtLink: false } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('aria-label')).toContain('Refugio Esperanza')
    })
  })
})
