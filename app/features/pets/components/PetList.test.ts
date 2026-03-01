// ============================================================
// PetList.test.ts
// Tests for the PetList component.
//
// Strategy: mountSuspended from @nuxt/test-utils. The component
// conditionally renders one of three states: loading skeleton,
// empty state, or the pet grid. We assert each state independently.
//
// Child component events: PetList forwards select-pet, edit-pet, and
// delete-pet from PetCard children to its own parent. We trigger these
// by finding and clicking the relevant buttons inside each PetCard.
//
// What this suite does NOT cover intentionally:
//   - PetCard internals — covered in PetCard.test.ts.
//   - PetAvatar internals — covered in PetAvatar.test.ts.
//   - Skeleton animation CSS — visual concern only.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PetList from './PetList.vue'
import type { Pet } from '../types'

// ── Fixtures ────────────────────────────────────────────────

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'pet-1',
    user_id: 'user-1',
    name: 'Max',
    species: 'dog',
    breed: 'Labrador',
    age: 3,
    gender: 'male',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const petA = makePet({ id: 'pet-1', name: 'Max' })
const petB = makePet({ id: 'pet-2', name: 'Luna', gender: 'female', species: 'cat' })
const petC = makePet({ id: 'pet-3', name: 'Pico', species: 'bird' })

// ── Suite ────────────────────────────────────────────────────

describe('PetList', () => {
  // ── Loading state ─────────────────────────────────────────

  describe('when isLoading is true', () => {
    it('renders the loading skeleton grid', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [], isLoading: true },
      })
      // aria-busy signals the skeleton is present
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('renders 6 skeleton cards', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [], isLoading: true },
      })
      const skeletons = wrapper.findAll('.pet-skeleton')
      expect(skeletons).toHaveLength(6)
    })

    it('does not render the empty state', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [], isLoading: true },
      })
      expect(wrapper.text()).not.toContain('Aún no tienes mascotas registradas')
    })

    it('does not render PetCard components while loading', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [petA], isLoading: true },
      })
      // PetCard renders an <article> element
      expect(wrapper.findAll('article')).toHaveLength(0)
    })
  })

  // ── Empty state ───────────────────────────────────────────

  describe('when pets is empty and isLoading is false', () => {
    it('renders the empty state heading', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [], isLoading: false },
      })
      expect(wrapper.text()).toContain('Aún no tienes mascotas registradas')
    })

    it('renders a link to add the first pet', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [], isLoading: false },
      })
      const link = wrapper.find('a[href="/dashboard/pets/new"]')
      expect(link.exists()).toBe(true)
    })

    it('does not render the loading skeleton', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [], isLoading: false },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('does not render PetCard components', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [], isLoading: false },
      })
      expect(wrapper.findAll('article')).toHaveLength(0)
    })
  })

  // ── Pet grid ──────────────────────────────────────────────

  describe('when pets are provided and isLoading is false', () => {
    it('renders one PetCard per pet in the array', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [petA, petB, petC], isLoading: false },
      })
      expect(wrapper.findAll('article')).toHaveLength(3)
    })

    it('renders the correct pet name for each card', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [petA, petB], isLoading: false },
      })
      expect(wrapper.text()).toContain('Max')
      expect(wrapper.text()).toContain('Luna')
    })

    it('does not render the empty state', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [petA], isLoading: false },
      })
      expect(wrapper.text()).not.toContain('Aún no tienes mascotas registradas')
    })

    it('does not render the loading skeleton', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [petA], isLoading: false },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('renders a single PetCard when the list has one pet', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [petA], isLoading: false },
      })
      expect(wrapper.findAll('article')).toHaveLength(1)
    })
  })

  // ── Event forwarding ──────────────────────────────────────

  describe('event forwarding', () => {
    it('forwards "select-pet" emitted by a child PetCard', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [petA], isLoading: false },
      })
      // Click the article to trigger select-pet inside PetCard
      await wrapper.find('article').trigger('click')
      const emitted = wrapper.emitted('select-pet')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(petA)
    })

    it('forwards "edit-pet" emitted by a child PetCard', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [petA], isLoading: false },
      })
      const editBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Editar'),
      )!
      await editBtn.trigger('click')
      const emitted = wrapper.emitted('edit-pet')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(petA)
    })

    it('forwards "delete-pet" emitted by a child PetCard', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [petA], isLoading: false },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')
      const emitted = wrapper.emitted('delete-pet')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBe('pet-1')
    })

    it('forwards events from the correct card when multiple pets are rendered', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [petA, petB], isLoading: false },
      })
      // Click the second card's article
      const articles = wrapper.findAll('article')
      await articles[1].trigger('click')
      const emitted = wrapper.emitted('select-pet')
      expect(emitted![0][0]).toEqual(petB)
    })
  })

  // ── Accessibility ─────────────────────────────────────────

  describe('accessibility', () => {
    it('the root section has aria-label "Lista de mascotas"', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [petA], isLoading: false },
      })
      expect(wrapper.find('section').attributes('aria-label')).toBe('Lista de mascotas')
    })

    it('skeleton grid has aria-label "Cargando mascotas" while loading', async () => {
      const wrapper = await mountSuspended(PetList, {
        props: { pets: [], isLoading: true },
      })
      expect(wrapper.find('[aria-busy="true"]').attributes('aria-label')).toBe('Cargando mascotas')
    })
  })
})
