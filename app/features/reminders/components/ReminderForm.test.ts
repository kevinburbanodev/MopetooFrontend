// ============================================================
// ReminderForm.test.ts
// Tests for the ReminderForm component.
//
// Strategy: mountSuspended from @nuxt/test-utils. The form operates
// in two modes: create (no reminder prop) and edit (reminder prop
// provided). We test field rendering, pre-fill, validation behaviour,
// emit payloads, and async pet loading — not styling or animation.
//
// Bootstrap validation: the form adds the class "was-validated" after
// a submit is attempted. Validation errors (is-invalid) only appear
// after submitted.value is set to true, which happens on handleSubmit().
//
// NuxtLink: stubbed via global.stubs to avoid real router dependency.
//
// What this suite does NOT cover intentionally:
//   - SCSS / Bootstrap CSS visual styles.
//   - Native form constraint validation UI (browser-controlled).
//   - ReminderCard / ReminderList internals — those have their own tests.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReminderForm from './ReminderForm.vue'
import type { Reminder, CreateReminderPayload } from '../types'
import type { Pet } from '../../pets/types'

// ── Fixtures ────────────────────────────────────────────────

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 1,
    pet_id: 42,
    type: 'vacuna',
    title: 'Vacuna antirrábica',
    scheduled_date: '2027-06-15T10:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makePet(overrides: Partial<Pet> = {}): Pet {
  return {
    id: '42',
    user_id: '1',
    name: 'Luna',
    species: 'dog',
    breed: 'Labrador',
    age: 3,
    gender: 'female',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const petLuna = makePet({ id: '42', name: 'Luna' })
const petMax = makePet({ id: '99', name: 'Max', species: 'cat' })

// Global stubs: NuxtLink (in the "no pets" warning text)
const globalStubs = { NuxtLink: true }

// ── Helpers ──────────────────────────────────────────────────

/** Fill all required fields and trigger submit. Returns the wrapper. */
async function fillAndSubmit(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  overrides: { title?: string; date?: string } = {},
) {
  await wrapper.find('#reminder-title').setValue(overrides.title ?? 'Mi recordatorio')
  await wrapper.find('#reminder-date').setValue(overrides.date ?? '2027-06-15T10:00')
  await wrapper.find('form').trigger('submit')
}

// ── Suite ────────────────────────────────────────────────────

describe('ReminderForm', () => {
  // ── Create mode ───────────────────────────────────────────

  describe('create mode (no reminder prop)', () => {
    it('renders the pet selector', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('#reminder-pet').exists()).toBe(true)
    })

    it('renders the type select', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('#reminder-type').exists()).toBe(true)
    })

    it('renders the title input', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('#reminder-title').exists()).toBe(true)
    })

    it('renders the scheduled_date input', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('#reminder-date').exists()).toBe(true)
    })

    it('does NOT render a recurrence select (removed)', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('#reminder-recurrence').exists()).toBe(false)
    })

    it('renders the notes textarea', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('#reminder-notes').exists()).toBe(true)
    })

    it('starts with an empty title field', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect((wrapper.find('#reminder-title').element as HTMLInputElement).value).toBe('')
    })

    it('starts with an empty scheduled_date field', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect((wrapper.find('#reminder-date').element as HTMLInputElement).value).toBe('')
    })

    it('defaults type to "vacuna"', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect((wrapper.find('#reminder-type').element as HTMLSelectElement).value).toBe('vacuna')
    })

    it('auto-selects the first pet in the pet selector', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      expect((wrapper.find('#reminder-pet').element as HTMLSelectElement).value).toBe('42')
    })

    it('starts with an empty notes field', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect((wrapper.find('#reminder-notes').element as HTMLTextAreaElement).value).toBe('')
    })

    it('shows "Crear recordatorio" on the submit button in create mode', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('button[type="submit"]').text()).toContain('Crear recordatorio')
    })

    it('does NOT show "Guardar cambios" in create mode', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('button[type="submit"]').text()).not.toContain('Guardar cambios')
    })
  })

  // ── Edit mode ─────────────────────────────────────────────

  describe('edit mode (reminder prop provided)', () => {
    it('pre-populates the title field from the reminder prop', async () => {
      const reminder = makeReminder({ title: 'Desparasitación anual' })
      const wrapper = await mountSuspended(ReminderForm, {
        props: { reminder, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect((wrapper.find('#reminder-title').element as HTMLInputElement).value).toBe('Desparasitación anual')
    })

    it('pre-selects the type from the reminder prop', async () => {
      const reminder = makeReminder({ type: 'medicina' })
      const wrapper = await mountSuspended(ReminderForm, {
        props: { reminder, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect((wrapper.find('#reminder-type').element as HTMLSelectElement).value).toBe('medicina')
    })

    it('pre-fills the scheduled_date (truncated to 16 chars)', async () => {
      const reminder = makeReminder({ scheduled_date: '2027-06-15T10:00:00Z' })
      const wrapper = await mountSuspended(ReminderForm, {
        props: { reminder, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect((wrapper.find('#reminder-date').element as HTMLInputElement).value).toBe('2027-06-15T10:00')
    })

    it('pre-selects the pet from the reminder pet_id', async () => {
      const reminder = makeReminder({ pet_id: 99 })
      const wrapper = await mountSuspended(ReminderForm, {
        props: { reminder, pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      expect((wrapper.find('#reminder-pet').element as HTMLSelectElement).value).toBe('99')
    })

    it('pre-fills the notes textarea when notes is present', async () => {
      const reminder = makeReminder({ notes: 'Dosis 0.5ml' })
      const wrapper = await mountSuspended(ReminderForm, {
        props: { reminder, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect((wrapper.find('#reminder-notes').element as HTMLTextAreaElement).value).toBe('Dosis 0.5ml')
    })

    it('shows "Guardar cambios" on the submit button in edit mode', async () => {
      const reminder = makeReminder()
      const wrapper = await mountSuspended(ReminderForm, {
        props: { reminder, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('button[type="submit"]').text()).toContain('Guardar cambios')
    })

    it('does NOT show "Crear recordatorio" in edit mode', async () => {
      const reminder = makeReminder()
      const wrapper = await mountSuspended(ReminderForm, {
        props: { reminder, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('button[type="submit"]').text()).not.toContain('Crear recordatorio')
    })
  })

  // ── Validation ────────────────────────────────────────────

  describe('validation on submit', () => {
    it('does NOT emit "submit" when required fields are empty', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('adds "was-validated" class to the form after a submit attempt', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('form').classes()).toContain('was-validated')
    })

    it('applies "is-invalid" to the title input when title is empty after submit', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#reminder-title').classes()).toContain('is-invalid')
    })

    it('applies "is-invalid" to the date input when date is empty after submit', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#reminder-date').classes()).toContain('is-invalid')
    })

    it('does NOT emit "submit" when title is too short (fewer than 2 chars)', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#reminder-title').setValue('A')
      await wrapper.find('#reminder-date').setValue('2027-06-15T10:00')
      await wrapper.find('form').trigger('submit')
      expect(wrapper.emitted('submit')).toBeFalsy()
    })

    it('applies "is-invalid" to the pet selector when no pet is selected', async () => {
      // Use empty pets array so form.pet_id starts as ''
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#reminder-title').setValue('Mi recordatorio')
      await wrapper.find('#reminder-date').setValue('2027-06-15T10:00')
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#reminder-pet').classes()).toContain('is-invalid')
    })
  })

  // ── Valid submit payload ───────────────────────────────────

  describe('submit with valid data', () => {
    it('emits "submit" with the correct required field data', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await fillAndSubmit(wrapper)

      const emitted = wrapper.emitted('submit')
      expect(emitted).toBeTruthy()
      const payload = emitted![0][0] as { data: CreateReminderPayload }
      expect(payload.data).toMatchObject({
        pet_id: 42,
        type: 'vacuna',
        title: 'Mi recordatorio',
        scheduled_date: '2027-06-15T10:00:00Z',
      })
    })

    it('emits pet_id as a Number, not a string', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await fillAndSubmit(wrapper)

      const payload = wrapper.emitted('submit')![0][0] as { data: CreateReminderPayload }
      expect(typeof payload.data.pet_id).toBe('number')
      expect(payload.data.pet_id).toBe(42)
    })

    it('trims whitespace from title in the emitted payload', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#reminder-title').setValue('  Vacuna importante  ')
      await wrapper.find('#reminder-date').setValue('2027-06-15T10:00')
      await wrapper.find('form').trigger('submit')

      const payload = wrapper.emitted('submit')![0][0] as { data: CreateReminderPayload }
      expect(payload.data.title).toBe('Vacuna importante')
    })

    it('emits scheduled_date with :00Z suffix (RFC3339)', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await fillAndSubmit(wrapper, { date: '2027-06-15T10:00' })

      const payload = wrapper.emitted('submit')![0][0] as { data: CreateReminderPayload }
      expect(payload.data.scheduled_date).toBe('2027-06-15T10:00:00Z')
    })

    it('does not include recurrence in the emitted payload', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await fillAndSubmit(wrapper)

      const payload = wrapper.emitted('submit')![0][0] as { data: CreateReminderPayload }
      expect((payload.data as Record<string, unknown>).recurrence).toBeUndefined()
    })

    it('omits notes from payload when notes field is empty', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await fillAndSubmit(wrapper)

      const payload = wrapper.emitted('submit')![0][0] as { data: CreateReminderPayload }
      expect(payload.data.notes).toBeUndefined()
    })

    it('includes notes in payload when notes are provided', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#reminder-notes').setValue('Dosis 0.5ml subcutánea')
      await fillAndSubmit(wrapper)

      const payload = wrapper.emitted('submit')![0][0] as { data: CreateReminderPayload }
      expect(payload.data.notes).toBe('Dosis 0.5ml subcutánea')
    })

    it('trims whitespace from notes in the emitted payload', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#reminder-notes').setValue('  Nota con espacios  ')
      await fillAndSubmit(wrapper)

      const payload = wrapper.emitted('submit')![0][0] as { data: CreateReminderPayload }
      expect(payload.data.notes).toBe('Nota con espacios')
    })

    it('omits notes from payload when notes is only whitespace', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#reminder-notes').setValue('   ')
      await fillAndSubmit(wrapper)

      const payload = wrapper.emitted('submit')![0][0] as { data: CreateReminderPayload }
      expect(payload.data.notes).toBeUndefined()
    })

    it('emits correct pet_id when a different pet is selected', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#reminder-pet').setValue('99')
      await fillAndSubmit(wrapper)

      const payload = wrapper.emitted('submit')![0][0] as { data: CreateReminderPayload }
      expect(payload.data.pet_id).toBe(99)
    })

    it('emits the correct type when a non-default type is selected', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#reminder-type').setValue('visita')
      await fillAndSubmit(wrapper)

      const payload = wrapper.emitted('submit')![0][0] as { data: CreateReminderPayload }
      expect(payload.data.type).toBe('visita')
    })
  })

  // ── Notes character counter ────────────────────────────────

  describe('notes character counter', () => {
    it('shows 0/500 when notes field is empty', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('0/500')
    })

    it('updates the character count as notes are typed', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#reminder-notes').setValue('Hola')
      expect(wrapper.text()).toContain('4/500')
    })

    it('reflects the pre-filled notes length in edit mode', async () => {
      const reminder = makeReminder({ notes: 'Nota inicial' })
      const wrapper = await mountSuspended(ReminderForm, {
        props: { reminder, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      // 'Nota inicial' has 12 characters
      expect(wrapper.text()).toContain('12/500')
    })
  })

  // ── Cancel button ─────────────────────────────────────────

  describe('cancel button', () => {
    it('emits "cancel" when the Cancelar button is clicked', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      await cancelBtn.trigger('click')
      expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('does NOT emit "submit" when cancel is clicked', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      await cancelBtn.trigger('click')
      expect(wrapper.emitted('submit')).toBeFalsy()
    })
  })

  // ── Loading state ─────────────────────────────────────────

  describe('when isLoading prop is true', () => {
    it('disables the submit button', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna], isLoading: true },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    })

    it('disables the cancel button', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna], isLoading: true },
        global: { stubs: globalStubs },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      expect(cancelBtn.attributes('disabled')).toBeDefined()
    })

    it('shows the spinner inside the submit button', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna], isLoading: true },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('.spinner-border').exists()).toBe(true)
    })

    it('both buttons are enabled when isLoading is false', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna], isLoading: false },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      expect(cancelBtn.attributes('disabled')).toBeUndefined()
    })

    it('does NOT show the spinner when isLoading is false', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna], isLoading: false },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('.spinner-border').exists()).toBe(false)
    })
  })

  // ── No pets warning ───────────────────────────────────────

  describe('when pets array is empty', () => {
    it('shows the "No tienes mascotas registradas" warning', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('No tienes mascotas registradas.')
    })

    it('does NOT show the warning when pets are provided', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).not.toContain('No tienes mascotas registradas.')
    })
  })

  // ── Async pet loading ─────────────────────────────────────

  describe('when pets load asynchronously (empty → populated)', () => {
    it('auto-selects the first pet when pets prop updates from empty to populated', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [] },
        global: { stubs: globalStubs },
      })
      // Initially no pet selected
      expect((wrapper.find('#reminder-pet').element as HTMLSelectElement).value).toBe('')

      // Simulate pets arriving
      await wrapper.setProps({ pets: [petLuna, petMax] })

      // The watch in ReminderForm sets form.pet_id to newPets[0].id when it was empty
      expect((wrapper.find('#reminder-pet').element as HTMLSelectElement).value).toBe('42')
    })

    it('does NOT override the pet selection if a pet was already selected from the start', async () => {
      // Start with both pets present — pet_id is already '42' (petLuna)
      // User changes selection to petMax ('99')
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      // Verify initial auto-selection
      expect((wrapper.find('#reminder-pet').element as HTMLSelectElement).value).toBe('42')

      // User selects petMax — this updates form.pet_id via v-model to '99'
      await wrapper.find('#reminder-pet').setValue('99')
      expect((wrapper.find('#reminder-pet').element as HTMLSelectElement).value).toBe('99')

      // Simulate a pets prop update (e.g. refresh adds a third pet)
      const petExtra = makePet({ id: '77', name: 'Coco', species: 'bird' })
      await wrapper.setProps({ pets: [petLuna, petMax, petExtra] })

      // The watch fires but form.pet_id is '99' (truthy), so guard !form.pet_id is false
      // — the watch must NOT override the user's selection
      expect((wrapper.find('#reminder-pet').element as HTMLSelectElement).value).toBe('99')
    })
  })

  // ── Type options completeness ──────────────────────────────

  describe('type select options', () => {
    it('contains all 5 reminder type options', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      const options = wrapper.find('#reminder-type').findAll('option')
      expect(options).toHaveLength(5)
    })

    it('includes vacuna option with icon', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('#reminder-type').text()).toContain('Vacuna')
    })

    it('includes medicina option', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('#reminder-type').text()).toContain('Medicina')
    })

    it('includes visita veterinaria option', async () => {
      const wrapper = await mountSuspended(ReminderForm, {
        props: { pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('#reminder-type').text()).toContain('Visita veterinaria')
    })
  })
})
