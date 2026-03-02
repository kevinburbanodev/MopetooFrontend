// ============================================================
// PetCard.test.ts
// Tests for the PetCard component.
//
// Strategy: mountSuspended from @nuxt/test-utils resolves Nuxt
// auto-imports (usePetAge, PetAvatar) inside the component without
// a real server. We test behaviour and DOM output — not implementation.
//
// Event propagation: PetCard calls event.stopPropagation() on the
// edit and delete button clicks so that the outer article @click does
// NOT also fire. We assert this by checking emitted events.
//
// What this suite does NOT cover intentionally:
//   - CSS transitions and SCSS — visual concern, not behaviour.
//   - Keyboard handlers (@keydown.enter / @keydown.space) — separate
//     accessibility test scope; focus on click interaction here.
//   - PetAvatar internals — covered in PetAvatar.test.ts.
// ============================================================

import { describe, it, expect, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PetCard from './PetCard.vue'
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
    weight: 28,
    notes: 'Le gusta jugar con pelotas.',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

const defaultPet = makePet()

// ── Suite ────────────────────────────────────────────────────

describe('PetCard', () => {
  // ── Rendering ─────────────────────────────────────────────

  describe('rendering', () => {
    it('renders the pet name', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      expect(wrapper.text()).toContain('Max')
    })

    it('renders the Spanish species label for a dog', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      expect(wrapper.text()).toContain('Perro')
    })

    it('renders the Spanish species label for a cat', async () => {
      const pet = makePet({ species: 'cat' })
      const wrapper = await mountSuspended(PetCard, { props: { pet } })
      expect(wrapper.text()).toContain('Gato')
    })

    it('renders the breed when provided', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      expect(wrapper.text()).toContain('Labrador')
    })

    it('does not render the breed row when breed is empty', async () => {
      const pet = makePet({ breed: '' })
      const wrapper = await mountSuspended(PetCard, { props: { pet } })
      // breed list item is v-if="pet.breed" — nothing to find when empty
      expect(wrapper.text()).not.toContain('Labrador')
    })

    it('renders the age string produced by formatAge', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      // Age is now a direct integer field; formatAge(3) produces "3 años"
      expect(wrapper.text()).toContain('3 años')
    })

    it('renders the gender label for male', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      expect(wrapper.text()).toContain('Macho')
    })

    it('renders the gender label for female', async () => {
      const pet = makePet({ gender: 'female' })
      const wrapper = await mountSuspended(PetCard, { props: { pet } })
      expect(wrapper.text()).toContain('Hembra')
    })

    it('renders the weight when provided', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      expect(wrapper.text()).toContain('28 kg')
    })

    it('does not render the weight row when weight is absent', async () => {
      const pet = makePet({ weight: undefined })
      const wrapper = await mountSuspended(PetCard, { props: { pet } })
      expect(wrapper.text()).not.toContain(' kg')
    })

    it('renders notes when provided', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      expect(wrapper.text()).toContain('Le gusta jugar con pelotas.')
    })

    it('does not render the notes paragraph when notes is absent', async () => {
      const pet = makePet({ notes: undefined })
      const wrapper = await mountSuspended(PetCard, { props: { pet } })
      expect(wrapper.text()).not.toContain('Le gusta jugar con pelotas.')
    })

    it('renders the PetAvatar component', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      // PetAvatar renders a div with role="img"
      expect(wrapper.find('[role="img"]').exists()).toBe(true)
    })

    it('renders a "Ver detalle" action button', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      const buttons = wrapper.findAll('button')
      const verDetalle = buttons.find(b => b.text().includes('Ver detalle'))
      expect(verDetalle).toBeDefined()
    })

    it('renders an "Editar" action button', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      const buttons = wrapper.findAll('button')
      const editBtn = buttons.find(b => b.attributes('aria-label')?.includes('Editar'))
      expect(editBtn).toBeDefined()
    })

    it('renders a delete action button', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      const buttons = wrapper.findAll('button')
      const deleteBtn = buttons.find(b => b.attributes('aria-label')?.includes('Eliminar'))
      expect(deleteBtn).toBeDefined()
    })
  })

  // ── Events ────────────────────────────────────────────────

  describe('events', () => {
    it('emits "select-pet" with the pet when the article card is clicked', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      await wrapper.find('article').trigger('click')
      const emitted = wrapper.emitted('select-pet')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(defaultPet)
    })

    it('emits "select-pet" with the pet when the "Ver detalle" button is clicked', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      const buttons = wrapper.findAll('button')
      const verDetalle = buttons.find(b => b.text().includes('Ver detalle'))!
      await verDetalle.trigger('click')
      const emitted = wrapper.emitted('select-pet')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(defaultPet)
    })

    it('emits "edit-pet" with the pet when the edit button is clicked', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      const editBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Editar'),
      )!
      await editBtn.trigger('click')
      const emitted = wrapper.emitted('edit-pet')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(defaultPet)
    })

    it('emits "delete-pet" with the pet id when the delete button is clicked', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')
      const emitted = wrapper.emitted('delete-pet')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBe('pet-1')
    })

    it('clicking the edit button does NOT additionally emit "select-pet" (stopPropagation)', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      const editBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Editar'),
      )!
      await editBtn.trigger('click')
      // edit-pet should fire
      expect(wrapper.emitted('edit-pet')).toBeTruthy()
      // select-pet must NOT fire — stopPropagation prevents the article click
      expect(wrapper.emitted('select-pet')).toBeFalsy()
    })

    it('clicking the delete button does NOT additionally emit "select-pet" (stopPropagation)', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')
      // delete-pet should fire
      expect(wrapper.emitted('delete-pet')).toBeTruthy()
      // select-pet must NOT fire
      expect(wrapper.emitted('select-pet')).toBeFalsy()
    })
  })

  // ── Accessibility ─────────────────────────────────────────

  describe('accessibility', () => {
    it('article has a descriptive aria-label containing the pet name', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      const article = wrapper.find('article')
      expect(article.attributes('aria-label')).toContain('Max')
    })

    it('article is focusable via keyboard (tabindex=0)', async () => {
      const wrapper = await mountSuspended(PetCard, { props: { pet: defaultPet } })
      expect(wrapper.find('article').attributes('tabindex')).toBe('0')
    })
  })
})
