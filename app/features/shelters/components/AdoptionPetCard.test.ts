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
//   - Health chips: "Vacunado"/"Sin vacuna" and "Esterilizado"/"Sin esterilizar".
//   - Age display: derived from age_months field.
//   - "Ver detalles" link: visible for available and pending pets,
//     hidden (replaced with "Ya fue adoptada") for adopted pets.
//
// NuxtLink stubs:
//   - { NuxtLink: true } for most tests (slot content hidden).
//   - { NuxtLink: false } for href assertions.
//
// What this suite does NOT cover intentionally:
//   - CSS transition / animation behaviour.
//   - img @error event (happy-dom does not fire real network events).
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AdoptionPetCard from './AdoptionPetCard.vue'
import type { AdoptionPet } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeAdoptionPet(overrides: Partial<AdoptionPet> = {}): AdoptionPet {
  return {
    id: 'pet1',
    shelter_id: '1',
    name: 'Max',
    species: 'dog',
    breed: 'Labrador',
    age_months: 18,
    gender: 'male',
    size: 'large',
    description: 'Un perro muy cariñoso',
    photo_url: 'https://example.com/max.jpg',
    status: 'available',
    vaccinated: true,
    neutered: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const defaultPet = makeAdoptionPet()

// ── Suite ─────────────────────────────────────────────────────

describe('AdoptionPetCard', () => {
  // ── Core content rendering ─────────────────────────────────

  describe('content rendering', () => {
    it('renders the pet name', async () => {
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet: defaultPet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Max')
    })

    it('renders the species label "Perro" for species "dog"', async () => {
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet: defaultPet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Perro')
    })

    it('renders the species label "Gato" for species "cat"', async () => {
      const pet = makeAdoptionPet({ species: 'cat' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Gato')
    })

    it('renders the breed when breed is provided', async () => {
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet: defaultPet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Labrador')
    })

    it('omits the breed separator when breed is undefined', async () => {
      const pet = makeAdoptionPet({ breed: undefined })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).not.toContain('·')
    })

    it('wraps the card in an <article> element with a descriptive aria-label', async () => {
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet: defaultPet },
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
        props: { pet: defaultPet },
        global: { stubs: { NuxtLink: true } },
      })
      const img = wrapper.find('img')
      expect(img.exists()).toBe(true)
      expect(img.attributes('src')).toBe('https://example.com/max.jpg')
    })

    it('shows the species fallback emoji when photo_url is undefined', async () => {
      const pet = makeAdoptionPet({ photo_url: undefined, species: 'dog' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
      expect(wrapper.text()).toContain('🐕')
    })

    it('shows the cat emoji fallback for species "cat" with no photo', async () => {
      const pet = makeAdoptionPet({ photo_url: undefined, species: 'cat' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('🐱')
    })

    it('shows a generic paw emoji for unknown species with no photo', async () => {
      const pet = makeAdoptionPet({ photo_url: undefined, species: 'reptile' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      // The fallback icon in the photo area is the species emoji which defaults to 🐾
      const fallback = wrapper.find('.adoption-pet-card__fallback-icon')
      expect(fallback.text()).toContain('🐾')
    })

    it('shows the fallback when photo_url is a data: URI (rejected by isSafeImageUrl)', async () => {
      const pet = makeAdoptionPet({ photo_url: 'data:image/png;base64,abc' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.find('img').exists()).toBe(false)
    })
  })

  // ── Status badge ───────────────────────────────────────────

  describe('status badge', () => {
    it('shows "Disponible" badge for status "available"', async () => {
      const pet = makeAdoptionPet({ status: 'available' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Disponible')
    })

    it('shows "En proceso" badge for status "pending"', async () => {
      const pet = makeAdoptionPet({ status: 'pending' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('En proceso')
    })

    it('shows "Adoptado" badge for status "adopted"', async () => {
      const pet = makeAdoptionPet({ status: 'adopted' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Adoptado')
    })

    it('applies bg-success class to the badge for status "available"', async () => {
      const pet = makeAdoptionPet({ status: 'available' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('.adoption-pet-card__status')
      expect(badge.classes()).toContain('bg-success')
    })

    it('applies bg-warning class to the badge for status "pending"', async () => {
      const pet = makeAdoptionPet({ status: 'pending' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('.adoption-pet-card__status')
      expect(badge.classes()).toContain('bg-warning')
    })

    it('applies bg-secondary class to the badge for status "adopted"', async () => {
      const pet = makeAdoptionPet({ status: 'adopted' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      const badge = wrapper.find('.adoption-pet-card__status')
      expect(badge.classes()).toContain('bg-secondary')
    })
  })

  // ── Health chips ───────────────────────────────────────────

  describe('health chips', () => {
    it('shows "Vacunado" chip when vaccinated is true', async () => {
      const pet = makeAdoptionPet({ vaccinated: true })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Vacunado')
    })

    it('shows "Sin vacuna" chip when vaccinated is false', async () => {
      const pet = makeAdoptionPet({ vaccinated: false })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Sin vacuna')
    })

    it('shows "Esterilizado" chip when neutered is true', async () => {
      const pet = makeAdoptionPet({ neutered: true })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Esterilizado')
    })

    it('shows "Sin esterilizar" chip when neutered is false', async () => {
      const pet = makeAdoptionPet({ neutered: false })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Sin esterilizar')
    })
  })

  // ── Age display ────────────────────────────────────────────

  describe('age display from age_months', () => {
    it('shows "Recién nacido" when age_months is 0', async () => {
      const pet = makeAdoptionPet({ age_months: 0 })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Recién nacido')
    })

    it('shows "1 mes" when age_months is 1', async () => {
      const pet = makeAdoptionPet({ age_months: 1 })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('1 mes')
    })

    it('shows "6 meses" when age_months is 6', async () => {
      const pet = makeAdoptionPet({ age_months: 6 })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('6 meses')
    })

    it('shows "1 año" when age_months is 12', async () => {
      const pet = makeAdoptionPet({ age_months: 12 })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('1 año')
    })

    it('shows "2 años" when age_months is 24', async () => {
      const pet = makeAdoptionPet({ age_months: 24 })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('2 años')
    })

    it('shows "1 año y 6 meses" when age_months is 18', async () => {
      const pet = makeAdoptionPet({ age_months: 18 })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('1 año y 6 meses')
    })

    it('shows "2 años y 3 meses" when age_months is 27', async () => {
      const pet = makeAdoptionPet({ age_months: 27 })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('2 años y 3 meses')
    })

    it('shows "Desconocida" when age_months is undefined', async () => {
      const pet = makeAdoptionPet({ age_months: undefined })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Desconocida')
    })
  })

  // ── "Ver detalles" link ────────────────────────────────────

  describe('"Ver detalles" CTA', () => {
    it('renders "Ver detalles" link for available pets', async () => {
      const pet = makeAdoptionPet({ status: 'available' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: false } },
      })
      expect(wrapper.text()).toContain('Ver detalles')
    })

    it('renders "Ver detalles" link for pending pets (not adopted)', async () => {
      const pet = makeAdoptionPet({ status: 'pending' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: false } },
      })
      expect(wrapper.text()).toContain('Ver detalles')
    })

    it('does NOT render "Ver detalles" for adopted pets', async () => {
      const pet = makeAdoptionPet({ status: 'adopted' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: false } },
      })
      expect(wrapper.text()).not.toContain('Ver detalles')
    })

    it('shows "Ya fue adoptada" message instead of the link for adopted pets', async () => {
      const pet = makeAdoptionPet({ status: 'adopted' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: true } },
      })
      expect(wrapper.text()).toContain('Ya fue adoptada')
    })

    it('the "Ver detalles" link includes the pet id in the path', async () => {
      const pet = makeAdoptionPet({ id: 'pet-42', status: 'available' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: false } },
      })
      const link = wrapper.find('a[href*="pet-42"]')
      expect(link.exists()).toBe(true)
    })

    it('the "Ver detalles" link has a descriptive aria-label containing the pet name', async () => {
      const pet = makeAdoptionPet({ status: 'available' })
      const wrapper = await mountSuspended(AdoptionPetCard, {
        props: { pet },
        global: { stubs: { NuxtLink: false } },
      })
      const link = wrapper.find('a')
      expect(link.attributes('aria-label')).toContain('Max')
    })
  })
})
