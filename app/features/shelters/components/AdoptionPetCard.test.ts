// ============================================================
// AdoptionPetCard.test.ts
// Tests for the AdoptionPetCard component.
//
// Strategy: mountSuspended from @nuxt/test-utils resolves Nuxt
// auto-imports. We test behaviour and DOM output — not CSS.
//
// Key design points:
//   - Photo: shown when photo_url is a safe http/https URL.
//   - Fallback: species emoji (🐕, 🐱, etc.) shown when no safe photo.
//   - Status badge: "Disponible" (bg-success), "En proceso" (bg-warning),
//     "Adoptado" (bg-secondary).
//   - Age display: derived from age field (years).
//   - City/country display.
//   - "Ver detalles" link: visible for available and pending listings,
//     hidden (replaced with "Ya fue adoptada") for adopted listings.
//   - Link format: /shelter/adoptions/:id (no shelterId query param).
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AdoptionPetCard from './AdoptionPetCard.vue'
import type { AdoptionListing } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeAdoptionListing(overrides: Partial<AdoptionListing> = {}): AdoptionListing {
  return {
    id: 1,
    shelter_id: 1,
    name: 'Max',
    species: 'dog',
    breed: 'Labrador',
    age: 2,
    weight: 25.5,
    gender: 'male',
    photo_url: 'https://example.com/max.jpg',
    story: 'Un perro muy cariñoso',
    city: 'Bogotá',
    country: 'Colombia',
    status: 'available',
    shelter: { id: 1, name: 'Refugio Esperanza', city: 'Bogotá', email: 'contacto@refugio.com', phone: '+57 300 1234567' },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const defaultListing = makeAdoptionListing()

// ── Suite ─────────────────────────────────────────────────────

describe('AdoptionPetCard', () => {
  // ── Core content rendering ─────────────────────────────────

  describe('content rendering', () => {
    it('renders the listing name', async () => {
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing: defaultListing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Max')
    })

    it('renders the species label "Perro" for species "dog"', async () => {
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing: defaultListing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Perro')
    })

    it('renders the species label "Gato" for species "cat"', async () => {
      const listing = makeAdoptionListing({ species: 'cat' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Gato')
    })

    it('renders the breed when breed is provided', async () => {
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing: defaultListing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Labrador')
    })

    it('wraps the card in an <article> element with a descriptive aria-label', async () => {
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing: defaultListing },
        global: { stubs: { NuxtLink: true } },
      })
      const article = wrapper.find('article')
      expect(article.exists()).toBe(true)
      expect(article.attributes('aria-label')).toContain('Max')
    })
  })

  // ── Photo rendering ────────────────────────────────────────

  describe('photo rendering', () => {
    it('renders the photo when photo_url is a valid https URL', async () => {
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing: defaultListing },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/max.jpg')
    })

    it('shows the species fallback emoji when photo_url is empty', async () => {
      const listing = makeAdoptionListing({ photo_url: '', species: 'dog' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🐕')
    })

    it('shows the cat emoji fallback for species "cat" with no photo', async () => {
      const listing = makeAdoptionListing({ photo_url: '', species: 'cat' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('🐱')
    })

    it('shows a generic paw emoji for unknown species with no photo', async () => {
      const listing = makeAdoptionListing({ photo_url: '', species: 'reptile' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      const fallback = wrapper.find('.adoption-pet-card__fallback-icon')
      expect(fallback.text()).toContain('🐾')
    })

    it('shows the fallback when photo_url is a data: URI (rejected by isSafeImageUrl)', async () => {
      const listing = makeAdoptionListing({ photo_url: 'data:image/png;base64,abc' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
    })
  })

  // ── Status badge ───────────────────────────────────────────

  describe('status badge', () => {
    it('shows "Disponible" badge for status "available"', async () => {
      const listing = makeAdoptionListing({ status: 'available' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Disponible')
    })

    it('shows "En proceso" badge for status "pending"', async () => {
      const listing = makeAdoptionListing({ status: 'pending' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('En proceso')
    })

    it('shows "Adoptado" badge for status "adopted"', async () => {
      const listing = makeAdoptionListing({ status: 'adopted' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Adoptado')
    })

    it('applies bg-success class to the badge for status "available"', async () => {
      const listing = makeAdoptionListing({ status: 'available' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('.adoption-pet-card__status')
      expect(badge.classes()).toContain('bg-success')
    })

    it('applies bg-warning class to the badge for status "pending"', async () => {
      const listing = makeAdoptionListing({ status: 'pending' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('.adoption-pet-card__status')
      expect(badge.classes()).toContain('bg-warning')
    })

    it('applies bg-secondary class to the badge for status "adopted"', async () => {
      const listing = makeAdoptionListing({ status: 'adopted' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('.adoption-pet-card__status')
      expect(badge.classes()).toContain('bg-secondary')
    })
  })

  // ── Age display ────────────────────────────────────────────

  describe('age display', () => {
    it('shows "Cachorro" when age is 0', async () => {
      const listing = makeAdoptionListing({ age: 0 })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Cachorro')
    })

    it('shows "1 año" when age is 1', async () => {
      const listing = makeAdoptionListing({ age: 1 })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('1 año')
    })

    it('shows "3 años" when age is 3', async () => {
      const listing = makeAdoptionListing({ age: 3 })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('3 años')
    })

    it('shows "Desconocida" when age is undefined', async () => {
      const listing = makeAdoptionListing({ age: undefined })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Desconocida')
    })
  })

  // ── City/country display ───────────────────────────────────

  describe('city/country display', () => {
    it('renders the city name', async () => {
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing: defaultListing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Bogotá')
    })

    it('renders the country after the city', async () => {
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing: defaultListing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Colombia')
    })
  })

  // ── Shelter name display ──────────────────────────────────

  describe('shelter name display', () => {
    it('renders the shelter name when shelter data is present', async () => {
      const listing = makeAdoptionListing()
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Refugio Esperanza')
    })

    it('does NOT render the shelter name when shelter is undefined', async () => {
      const listing = makeAdoptionListing({ shelter: undefined })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('Refugio Esperanza')
    })
  })

  // ── "Ver detalles" link ────────────────────────────────────

  describe('"Ver detalles" CTA', () => {
    it('renders "Ver detalles" link for available listings', async () => {
      const listing = makeAdoptionListing({ status: 'available' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: false } },
      })
      expect(wrapper.text()).toContain('Ver detalles')
    })

    it('renders "Ver detalles" link for pending listings', async () => {
      const listing = makeAdoptionListing({ status: 'pending' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: false } },
      })
      expect(wrapper.text()).toContain('Ver detalles')
    })

    it('does NOT render "Ver detalles" for adopted listings', async () => {
      const listing = makeAdoptionListing({ status: 'adopted' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: false } },
      })
      expect(wrapper.text()).not.toContain('Ver detalles')
    })

    it('shows "Ya fue adoptada" message for adopted listings', async () => {
      const listing = makeAdoptionListing({ status: 'adopted' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Ya fue adoptada')
    })

    it('the "Ver detalles" link includes the listing id in the path', async () => {
      const listing = makeAdoptionListing({ id: 42, status: 'available' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: false } },
      })
      const link = wrapper.find('a[href*="42"]')
      expect(link.exists()).toBe(true)
    })

    it('the "Ver detalles" link does NOT include a shelterId query parameter', async () => {
      const listing = makeAdoptionListing({ id: 42, shelter_id: 10, status: 'available' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: false } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('href')).not.toContain('shelterId')
    })

    it('the "Ver detalles" link has a descriptive aria-label containing the listing name', async () => {
      const listing = makeAdoptionListing({ status: 'available' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { listing },
        global: { stubs: { NuxtLink: false } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('aria-label')).toContain('Max')
    })
  })
})
