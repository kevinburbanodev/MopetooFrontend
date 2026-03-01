// ============================================================
// PetForm.test.ts
// Tests for the PetForm component.
//
// Strategy: mountSuspended from @nuxt/test-utils. The form operates
// in two modes: create (no pet prop) and edit (pet prop provided).
// We test field rendering, pre-fill, validation behaviour, emit
// payloads, and photo upload — not styling or animation.
//
// Bootstrap validation: the form adds the class "was-validated" after
// submit is attempted. Validation errors (is-invalid) only appear after
// submitted.value is set to true, which happens on handleSubmit().
//
// What this suite does NOT cover intentionally:
//   - URL.createObjectURL / URL.revokeObjectURL side effects —
//     these are browser APIs; we assert photoFile state through
//     the emitted payload, not by inspecting internal refs.
//   - SCSS / Bootstrap CSS — visual concern only.
//   - useTemplateRef(photoInput) click behaviour — cannot trigger
//     file-picker in jsdom without full browser environment.
// ============================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import PetForm from './PetForm.vue'
import type { Pet } from '../types'

// ── URL API stubs ────────────────────────────────────────────
// happy-dom does not implement URL.createObjectURL. Spy on the static
// methods so the real URL constructor remains callable (isSafeImageUrl
// inside PetForm calls `new URL(url)` and must not be broken).
beforeEach(() => {
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:http://localhost/fake-object-url')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

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
    notes: 'Alergias: ninguna.',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeFile(name = 'photo.jpg'): File {
  return new File(['(binary)'], name, { type: 'image/jpeg' })
}

/**
 * Attaches a fake photo file to the file input and triggers the change event.
 * Required for create-mode submissions where photo is mandatory.
 */
async function attachPhoto(wrapper: Awaited<ReturnType<typeof mountSuspended>>): Promise<void> {
  const photoInput = wrapper.find('input[type="file"]')
  const file = new File(['(binary)'], 'photo.jpg', { type: 'image/jpeg' })
  Object.defineProperty(photoInput.element, 'files', {
    value: { 0: file, length: 1, item: (i: number) => (i === 0 ? file : null) },
    configurable: true,
  })
  await photoInput.trigger('change')
}

// ── Suite ────────────────────────────────────────────────────

describe('PetForm', () => {
  // ── Create mode ───────────────────────────────────────────

  describe('create mode (no pet prop)', () => {
    it('renders the name input', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect(wrapper.find('#pet-name').exists()).toBe(true)
    })

    it('renders the species select', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect(wrapper.find('#pet-species').exists()).toBe(true)
    })

    it('renders the breed input', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect(wrapper.find('#pet-breed').exists()).toBe(true)
    })

    it('renders the age input', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect(wrapper.find('#pet-age').exists()).toBe(true)
    })

    it('renders the male gender radio', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect(wrapper.find('#gender-male').exists()).toBe(true)
    })

    it('renders the female gender radio', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect(wrapper.find('#gender-female').exists()).toBe(true)
    })

    it('renders the weight input', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect(wrapper.find('#pet-weight').exists()).toBe(true)
    })

    it('renders the notes textarea', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect(wrapper.find('#pet-notes').exists()).toBe(true)
    })

    it('starts with empty name field', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect((wrapper.find('#pet-name').element as HTMLInputElement).value).toBe('')
    })

    it('starts with empty species selection', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect((wrapper.find('#pet-species').element as HTMLSelectElement).value).toBe('')
    })

    it('starts with empty breed field', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect((wrapper.find('#pet-breed').element as HTMLInputElement).value).toBe('')
    })

    it('starts with no gender selected', async () => {
      const wrapper = await mountSuspended(PetForm)
      const male = wrapper.find('#gender-male').element as HTMLInputElement
      const female = wrapper.find('#gender-female').element as HTMLInputElement
      expect(male.checked).toBe(false)
      expect(female.checked).toBe(false)
    })

    it('renders the submit button with "Agregar mascota" label', async () => {
      const wrapper = await mountSuspended(PetForm)
      const submitBtn = wrapper.find('button[type="submit"]')
      expect(submitBtn.text()).toContain('Agregar mascota')
    })

    it('renders the photo placeholder (no photo yet)', async () => {
      const wrapper = await mountSuspended(PetForm)
      expect(wrapper.find('.pet-form__photo-placeholder').exists()).toBe(true)
    })
  })

  // ── Edit mode ─────────────────────────────────────────────

  describe('edit mode (pet prop provided)', () => {
    it('pre-fills the name field', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetForm, { props: { pet } })
      expect((wrapper.find('#pet-name').element as HTMLInputElement).value).toBe('Max')
    })

    it('pre-selects the species', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetForm, { props: { pet } })
      expect((wrapper.find('#pet-species').element as HTMLSelectElement).value).toBe('dog')
    })

    it('pre-fills the breed field', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetForm, { props: { pet } })
      expect((wrapper.find('#pet-breed').element as HTMLInputElement).value).toBe('Labrador')
    })

    it('pre-fills the age field', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetForm, { props: { pet } })
      expect((wrapper.find('#pet-age').element as HTMLInputElement).value).toBe('3')
    })

    it('pre-selects male gender', async () => {
      const pet = makePet({ gender: 'male' })
      const wrapper = await mountSuspended(PetForm, { props: { pet } })
      const male = wrapper.find('#gender-male').element as HTMLInputElement
      expect(male.checked).toBe(true)
    })

    it('pre-selects female gender', async () => {
      const pet = makePet({ gender: 'female' })
      const wrapper = await mountSuspended(PetForm, { props: { pet } })
      const female = wrapper.find('#gender-female').element as HTMLInputElement
      expect(female.checked).toBe(true)
    })

    it('pre-fills the weight field', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetForm, { props: { pet } })
      expect((wrapper.find('#pet-weight').element as HTMLInputElement).value).toBe('28')
    })

    it('pre-fills the notes textarea', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetForm, { props: { pet } })
      expect((wrapper.find('#pet-notes').element as HTMLTextAreaElement).value).toBe('Alergias: ninguna.')
    })

    it('renders the submit button with "Guardar cambios" label', async () => {
      const pet = makePet()
      const wrapper = await mountSuspended(PetForm, { props: { pet } })
      const submitBtn = wrapper.find('button[type="submit"]')
      expect(submitBtn.text()).toContain('Guardar cambios')
    })

    it('shows the existing photo_url as preview when a photo_url exists', async () => {
      const pet = makePet({ photo_url: 'https://cdn.example.com/max.jpg' })
      const wrapper = await mountSuspended(PetForm, { props: { pet } })
      const preview = wrapper.find('.pet-form__photo-preview')
      expect(preview.exists()).toBe(true)
      expect(preview.attributes('src')).toBe('https://cdn.example.com/max.jpg')
    })
  })

  // ── Validation ────────────────────────────────────────────

  describe('validation on submit', () => {
    it('does NOT emit "submit" when required fields are empty', async () => {
      const wrapper = await mountSuspended(PetForm)
      await wrapper.find('form').trigger('submit')
      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('adds "was-validated" class to form after submit attempt', async () => {
      const wrapper = await mountSuspended(PetForm)
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('form').classes()).toContain('was-validated')
    })

    it('applies "is-invalid" to the name input when empty after submit', async () => {
      const wrapper = await mountSuspended(PetForm)
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#pet-name').classes()).toContain('is-invalid')
    })

    it('applies "is-invalid" to the species select when unselected after submit', async () => {
      const wrapper = await mountSuspended(PetForm)
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#pet-species').classes()).toContain('is-invalid')
    })

    it('applies "is-invalid" to the breed input when empty after submit', async () => {
      const wrapper = await mountSuspended(PetForm)
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#pet-breed').classes()).toContain('is-invalid')
    })

    it('applies "is-invalid" to gender inputs when no gender selected after submit', async () => {
      const wrapper = await mountSuspended(PetForm)
      await wrapper.find('form').trigger('submit')
      const maleInput = wrapper.find('#gender-male')
      expect(maleInput.classes()).toContain('is-invalid')
    })

    it('does NOT emit "submit" when no photo selected in create mode', async () => {
      const wrapper = await mountSuspended(PetForm)
      // Fill all required text fields but do NOT attach a photo
      await wrapper.find('#pet-name').setValue('Buddy')
      await wrapper.find('#pet-species').setValue('dog')
      await wrapper.find('#pet-breed').setValue('Beagle')
      await wrapper.find('#gender-male').setValue(true)
      await wrapper.find('form').trigger('submit')

      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  // ── Submit with valid data ────────────────────────────────

  describe('submit with valid data', () => {
    async function fillAndSubmit(wrapper: Awaited<ReturnType<typeof mountSuspended>>) {
      await wrapper.find('#pet-name').setValue('Buddy')
      await wrapper.find('#pet-species').setValue('dog')
      await wrapper.find('#pet-breed').setValue('Beagle')
      await wrapper.find('#gender-male').setValue(true)
      // Photo is required in create mode
      await attachPhoto(wrapper)
      await wrapper.find('form').trigger('submit')
    }

    it('emits "submit" with the correct required field data', async () => {
      const wrapper = await mountSuspended(PetForm)
      await fillAndSubmit(wrapper)

      const emitted = wrapper.emitted('submit')
      expect(emitted).toBeTruthy()
      const payload = emitted![0][0] as { data: Record<string, unknown>; photo?: File }
      expect(payload.data).toMatchObject({
        name: 'Buddy',
        species: 'dog',
        breed: 'Beagle',
        gender: 'male',
      })
    })

    it('does NOT include birth_date, color, microchip, or veterinarian_id in the payload', async () => {
      const wrapper = await mountSuspended(PetForm)
      await fillAndSubmit(wrapper)

      const payload = wrapper.emitted('submit')![0][0] as { data: Record<string, unknown> }
      expect(payload.data).not.toHaveProperty('birth_date')
      expect(payload.data).not.toHaveProperty('color')
      expect(payload.data).not.toHaveProperty('microchip')
      expect(payload.data).not.toHaveProperty('veterinarian_id')
    })

    it('includes age in payload when age field has a value', async () => {
      const wrapper = await mountSuspended(PetForm)
      await wrapper.find('#pet-name').setValue('Buddy')
      await wrapper.find('#pet-species').setValue('dog')
      await wrapper.find('#pet-breed').setValue('Beagle')
      await wrapper.find('#gender-male').setValue(true)
      await wrapper.find('#pet-age').setValue(5)
      await attachPhoto(wrapper)
      await wrapper.find('form').trigger('submit')

      const payload = wrapper.emitted('submit')![0][0] as { data: Record<string, unknown> }
      expect(payload.data.age).toBe(5)
    })

    it('trims whitespace from name in the emitted payload', async () => {
      const wrapper = await mountSuspended(PetForm)
      await wrapper.find('#pet-name').setValue('  Buddy  ')
      await wrapper.find('#pet-species').setValue('dog')
      await wrapper.find('#pet-breed').setValue('Beagle')
      await wrapper.find('#gender-male').setValue(true)
      await attachPhoto(wrapper)
      await wrapper.find('form').trigger('submit')

      const payload = wrapper.emitted('submit')![0][0] as { data: Record<string, unknown> }
      expect(payload.data.name).toBe('Buddy')
    })

    it('includes weight in payload when a positive weight is entered', async () => {
      const wrapper = await mountSuspended(PetForm)
      await wrapper.find('#pet-name').setValue('Buddy')
      await wrapper.find('#pet-species').setValue('dog')
      await wrapper.find('#pet-breed').setValue('Beagle')
      await wrapper.find('#gender-male').setValue(true)
      await wrapper.find('#pet-weight').setValue(12)
      await attachPhoto(wrapper)
      await wrapper.find('form').trigger('submit')

      const payload = wrapper.emitted('submit')![0][0] as { data: Record<string, unknown> }
      expect(payload.data.weight).toBe(12)
    })

    it('does NOT include weight in payload when weight field is empty', async () => {
      const wrapper = await mountSuspended(PetForm)
      await fillAndSubmit(wrapper)
      const payload = wrapper.emitted('submit')![0][0] as { data: Record<string, unknown> }
      expect(payload.data.weight).toBeUndefined()
    })

    it('emits photo File when a file was selected', async () => {
      const wrapper = await mountSuspended(PetForm)
      await fillAndSubmit(wrapper)
      const payload = wrapper.emitted('submit')![0][0] as { data: Record<string, unknown>; photo?: File }
      expect(payload.photo).toBeInstanceOf(File)
    })

    it('does NOT emit "submit" when weight is present but <= 0', async () => {
      const wrapper = await mountSuspended(PetForm)
      await wrapper.find('#pet-name').setValue('Buddy')
      await wrapper.find('#pet-species').setValue('dog')
      await wrapper.find('#pet-breed').setValue('Beagle')
      await wrapper.find('#gender-male').setValue(true)
      await wrapper.find('#pet-weight').setValue(0)
      await attachPhoto(wrapper)
      await wrapper.find('form').trigger('submit')

      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  // ── Cancel button ─────────────────────────────────────────

  describe('cancel button', () => {
    it('emits "cancel" when the cancel button is clicked', async () => {
      const wrapper = await mountSuspended(PetForm)
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      await cancelBtn.trigger('click')
      expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('does NOT emit "submit" when cancel is clicked', async () => {
      const wrapper = await mountSuspended(PetForm)
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      await cancelBtn.trigger('click')
      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  // ── Loading state ─────────────────────────────────────────

  describe('when isLoading prop is true', () => {
    it('disables the submit button', async () => {
      const wrapper = await mountSuspended(PetForm, { props: { isLoading: true } })
      const submitBtn = wrapper.find('button[type="submit"]')
      expect(submitBtn.attributes('disabled')).toBeDefined()
    })

    it('disables the cancel button', async () => {
      const wrapper = await mountSuspended(PetForm, { props: { isLoading: true } })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      expect(cancelBtn.attributes('disabled')).toBeDefined()
    })

    it('shows the spinner inside the submit button', async () => {
      const wrapper = await mountSuspended(PetForm, { props: { isLoading: true } })
      expect(wrapper.find('.spinner-border').exists()).toBe(true)
    })

    it('shows "Guardando…" text on the submit button', async () => {
      const wrapper = await mountSuspended(PetForm, { props: { isLoading: true } })
      expect(wrapper.find('button[type="submit"]').text()).toContain('Guardando…')
    })
  })

  // ── Photo upload ──────────────────────────────────────────

  describe('photo upload', () => {
    it('shows the preview image after a file is selected', async () => {
      const wrapper = await mountSuspended(PetForm)
      const photoInput = wrapper.find('input[type="file"]')
      const file = makeFile()

      // Simulate a file input change event with a fake FileList
      Object.defineProperty(photoInput.element, 'files', {
        value: { 0: file, length: 1, item: (i: number) => (i === 0 ? file : null) },
        configurable: true,
      })
      await photoInput.trigger('change')

      // After file selection, the preview img should appear
      expect(wrapper.find('.pet-form__photo-preview').exists()).toBe(true)
    })

    it('calls URL.createObjectURL when a file is selected', async () => {
      const wrapper = await mountSuspended(PetForm)
      const photoInput = wrapper.find('input[type="file"]')
      const file = makeFile()

      Object.defineProperty(photoInput.element, 'files', {
        value: { 0: file, length: 1, item: (i: number) => (i === 0 ? file : null) },
        configurable: true,
      })
      await photoInput.trigger('change')

      expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    })

    it('includes the photo File in the emitted "submit" payload', async () => {
      const wrapper = await mountSuspended(PetForm)

      // Upload photo
      const photoInput = wrapper.find('input[type="file"]')
      const file = makeFile()
      Object.defineProperty(photoInput.element, 'files', {
        value: { 0: file, length: 1, item: (i: number) => (i === 0 ? file : null) },
        configurable: true,
      })
      await photoInput.trigger('change')

      // Fill required fields and submit
      await wrapper.find('#pet-name').setValue('Buddy')
      await wrapper.find('#pet-species').setValue('dog')
      await wrapper.find('#pet-breed').setValue('Beagle')
      await wrapper.find('#gender-male').setValue(true)
      await wrapper.find('form').trigger('submit')

      const payload = wrapper.emitted('submit')![0][0] as { data: unknown; photo?: File }
      expect(payload.photo).toBeInstanceOf(File)
      expect(payload.photo?.name).toBe('photo.jpg')
    })
  })
})
