// ============================================================
// PetAvatar.test.ts
// Tests for the PetAvatar component.
//
// Strategy: mountSuspended from @nuxt/test-utils. The component
// shows either a photo <img> or an emoji fallback <span> depending
// on whether photo_url is set and whether the image has errored.
//
// Image error fallback: we simulate a load error by triggering the
// @error handler on the img element, then assert the fallback renders.
//
// What this suite does NOT cover intentionally:
//   - SCSS sizing — visual concern only.
//   - The exact pixel dimensions — tested implicitly through the size
//     prop assertions on inline styles.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PetAvatar from './PetAvatar.vue'
import type { Pet } from '../types'

// ── Fixtures ────────────────────────────────────────────────

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: 'pet-1',
    user_id: 'user-1',
    name: 'Max',
    species: 'dog',
    breed: 'Labrador',
    birth_date: '2020-06-15',
    gender: 'male',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── Suite ────────────────────────────────────────────────────

describe('PetAvatar', () => {
  // ── Photo display ─────────────────────────────────────────

  describe('when photo_url is provided', () => {
    it('renders the photo img element', async () => {
      const pet = makePet({ photo_url: 'https://cdn.example.com/max.jpg' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      const img = wrapper.find('img.pet-avatar__img')
      expect(img.exists()).toBe(true)
    })

    it('sets the img src to the photo_url', async () => {
      const pet = makePet({ photo_url: 'https://cdn.example.com/max.jpg' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('img.pet-avatar__img').attributes('src')).toBe(
        'https://cdn.example.com/max.jpg',
      )
    })

    it('sets the img alt text to include the pet name', async () => {
      const pet = makePet({ photo_url: 'https://cdn.example.com/max.jpg' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('img.pet-avatar__img').attributes('alt')).toContain('Max')
    })

    it('does not render the emoji fallback span when a photo is present', async () => {
      const pet = makePet({ photo_url: 'https://cdn.example.com/max.jpg' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('.pet-avatar__fallback').exists()).toBe(false)
    })
  })

  // ── Emoji fallback ────────────────────────────────────────

  describe('when photo_url is absent', () => {
    it('renders the fallback span instead of an img', async () => {
      const pet = makePet({ photo_url: undefined })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('.pet-avatar__fallback').exists()).toBe(true)
    })

    it('does not render the photo img', async () => {
      const pet = makePet({ photo_url: undefined })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('img.pet-avatar__img').exists()).toBe(false)
    })

    it('shows the dog emoji for species "dog"', async () => {
      const pet = makePet({ species: 'dog' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('.pet-avatar__fallback').text()).toContain('🐶')
    })

    it('shows the cat emoji for species "cat"', async () => {
      const pet = makePet({ species: 'cat' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('.pet-avatar__fallback').text()).toContain('🐱')
    })

    it('shows the bird emoji for species "bird"', async () => {
      const pet = makePet({ species: 'bird' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('.pet-avatar__fallback').text()).toContain('🐦')
    })

    it('shows the rabbit emoji for species "rabbit"', async () => {
      const pet = makePet({ species: 'rabbit' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('.pet-avatar__fallback').text()).toContain('🐰')
    })

    it('shows the paw emoji for species "other"', async () => {
      const pet = makePet({ species: 'other' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('.pet-avatar__fallback').text()).toContain('🐾')
    })

    it('falls back to the paw emoji for an unknown species', async () => {
      const pet = makePet({ species: 'ferret' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('.pet-avatar__fallback').text()).toContain('🐾')
    })
  })

  // ── Image error fallback ──────────────────────────────────

  describe('when the photo fails to load', () => {
    it('renders the emoji fallback after an image load error', async () => {
      const pet = makePet({ photo_url: 'https://cdn.example.com/broken.jpg' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })

      // Trigger the @error event on the img
      await wrapper.find('img.pet-avatar__img').trigger('error')

      expect(wrapper.find('.pet-avatar__fallback').exists()).toBe(true)
    })

    it('removes the photo img from the DOM after an error', async () => {
      const pet = makePet({ photo_url: 'https://cdn.example.com/broken.jpg' })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })

      await wrapper.find('img.pet-avatar__img').trigger('error')

      expect(wrapper.find('img.pet-avatar__img').exists()).toBe(false)
    })
  })

  // ── Size prop ─────────────────────────────────────────────

  describe('size prop', () => {
    it('defaults to "md" size (64px) when size prop is omitted', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      const style = wrapper.find('.pet-avatar').attributes('style')
      expect(style).toContain('64px')
    })

    it('applies 40px dimensions for size "sm"', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetAvatar, { props: { pet, size: 'sm' } })
      const style = wrapper.find('.pet-avatar').attributes('style')
      expect(style).toContain('40px')
    })

    it('applies 100px dimensions for size "lg"', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetAvatar, { props: { pet, size: 'lg' } })
      const style = wrapper.find('.pet-avatar').attributes('style')
      expect(style).toContain('100px')
    })

    it('applies the correct modifier class for size "sm"', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetAvatar, { props: { pet, size: 'sm' } })
      expect(wrapper.find('.pet-avatar').classes()).toContain('pet-avatar--sm')
    })

    it('applies the correct modifier class for size "lg"', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetAvatar, { props: { pet, size: 'lg' } })
      expect(wrapper.find('.pet-avatar').classes()).toContain('pet-avatar--lg')
    })
  })

  // ── Accessibility ─────────────────────────────────────────

  describe('accessibility', () => {
    it('root div has role="img"', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('.pet-avatar').attributes('role')).toBe('img')
    })

    it('root div aria-label includes the pet name', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('.pet-avatar').attributes('aria-label')).toContain('Max')
    })

    it('fallback span has aria-hidden="true"', async () => {
      const pet = makePet({ photo_url: undefined })
      const wrapper = await mountSuspended(PetAvatar, { props: { pet } })
      expect(wrapper.find('.pet-avatar__fallback').attributes('aria-hidden')).toBe('true')
    })
  })
})
