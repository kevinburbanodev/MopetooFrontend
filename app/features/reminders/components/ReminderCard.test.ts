// ============================================================
// ReminderCard.test.ts
// Tests for the ReminderCard component.
//
// Strategy: mountSuspended from @nuxt/test-utils resolves Nuxt
// auto-imports inside the component without a real server.
// We test behaviour and DOM output — not implementation details.
//
// Key design: ReminderCard calls event.stopPropagation() on edit
// and delete button clicks, so the outer article @click does NOT
// also fire. We verify this by checking that only the expected
// event is emitted when a button is clicked.
//
// Date handling: we use a fixed future date (2027-...) so that
// isPast is false in the happy path, and a past date for the
// "Vencido" badge tests.
//
// What this suite does NOT cover intentionally:
//   - CSS transitions / SCSS visual styles.
//   - formatDate locale output exactness — it is locale-dependent
//     in CI; we assert the <time> element's datetime attribute instead.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReminderCard from './ReminderCard.vue'
import type { Reminder } from '../types'

// ── Fixtures ────────────────────────────────────────────────

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 1,
    pet_id: 42,
    type: 'vacuna',
    title: 'Vacuna antirrábica',
    // Future date so isPast === false by default
    scheduled_date: '2027-06-15T10:00',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const defaultReminder = makeReminder()

// ── Suite ────────────────────────────────────────────────────

describe('ReminderCard', () => {
  // ── Rendering — title and core content ────────────────────

  describe('rendering the reminder title and date', () => {
    it('renders the reminder title', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      expect(wrapper.text()).toContain('Vacuna antirrábica')
    })

    it('renders a <time> element with the scheduled_date as datetime attribute', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      const time = wrapper.find('time')
      expect(time.exists()).toBe(true)
      expect(time.attributes('datetime')).toBe('2027-06-15T10:00')
    })

    it('renders a non-empty formatted date string inside the <time> element', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      const time = wrapper.find('time')
      // formatDate returns a locale-formatted string — we only assert it is non-empty
      expect(time.text().length).toBeGreaterThan(0)
    })
  })

  // ── Rendering — petName ────────────────────────────────────

  describe('petName prop', () => {
    it('shows the petName when provided', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder, petName: 'Luna' },
      })
      expect(wrapper.text()).toContain('Luna')
    })

    it('does not show a pet name section when petName is not provided', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      // The petName li is v-if="petName" — with no petName prop, it must not appear.
      // The paw emoji (🐾) only renders in the petName li.
      expect(wrapper.text()).not.toContain('🐾')
    })
  })

  // ── Rendering — notes ─────────────────────────────────────

  describe('notes field', () => {
    it('shows notes when present in the reminder', async () => {
      const reminder = makeReminder({ notes: 'Dosis 0.5ml subcutánea' })
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder },
      })
      expect(wrapper.text()).toContain('Dosis 0.5ml subcutánea')
    })

    it('hides the notes section when notes is undefined', async () => {
      const reminder = makeReminder({ notes: undefined })
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder },
      })
      // The notes li is v-if="reminder.notes"; no notes emoji (📝) without it
      expect(wrapper.text()).not.toContain('📝')
    })
  })

  // ── Rendering — type label and icon ───────────────────────

  describe('type label and icon', () => {
    it('shows "Vacuna" label and 💉 icon for type vacuna', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: makeReminder({ type: 'vacuna' }) },
      })
      expect(wrapper.text()).toContain('Vacuna')
      expect(wrapper.text()).toContain('💉')
    })

    it('shows "Medicina" label and 💊 icon for type medicina', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: makeReminder({ type: 'medicina' }) },
      })
      expect(wrapper.text()).toContain('Medicina')
      expect(wrapper.text()).toContain('💊')
    })

    it('shows "Baño" label and 🛁 icon for type baño', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: makeReminder({ type: 'baño' }) },
      })
      expect(wrapper.text()).toContain('Baño')
      expect(wrapper.text()).toContain('🛁')
    })

    it('shows "Visita vet." label and 🏥 icon for type visita', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: makeReminder({ type: 'visita' }) },
      })
      expect(wrapper.text()).toContain('Visita vet.')
      expect(wrapper.text()).toContain('🏥')
    })

    it('shows "Otro" label and 📌 icon for type otro', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: makeReminder({ type: 'otro' }) },
      })
      expect(wrapper.text()).toContain('Otro')
      expect(wrapper.text()).toContain('📌')
    })
  })

  // ── Rendering — recurrence ────────────────────────────────

  describe('recurrence label', () => {
    it('shows recurrence label when recurrence is "weekly"', async () => {
      const reminder = makeReminder({ recurrence: 'weekly' })
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder },
      })
      expect(wrapper.text()).toContain('Semanal')
    })

    it('shows recurrence label when recurrence is "monthly"', async () => {
      const reminder = makeReminder({ recurrence: 'monthly' })
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder },
      })
      expect(wrapper.text()).toContain('Mensual')
    })

    it('shows recurrence label when recurrence is "yearly"', async () => {
      const reminder = makeReminder({ recurrence: 'yearly' })
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder },
      })
      expect(wrapper.text()).toContain('Anual')
    })

    it('shows recurrence label when recurrence is "once"', async () => {
      const reminder = makeReminder({ recurrence: 'once' })
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder },
      })
      expect(wrapper.text()).toContain('Una vez')
    })

    it('hides the recurrence badge when recurrence is undefined', async () => {
      const reminder = makeReminder({ recurrence: undefined })
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder },
      })
      // The recurrence badge uses v-if="recurrenceLabel"; without recurrence, no 🔁
      expect(wrapper.text()).not.toContain('🔁')
    })
  })

  // ── Rendering — Vencido badge ─────────────────────────────

  describe('"Vencido" badge (past date)', () => {
    it('shows "Vencido" badge when scheduled_date is in the past', async () => {
      // A clearly past date — 2020 is well before current test execution year
      const reminder = makeReminder({ scheduled_date: '2020-01-01T10:00' })
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder },
      })
      expect(wrapper.text()).toContain('Vencido')
    })

    it('does NOT show "Vencido" badge when scheduled_date is in the future', async () => {
      const reminder = makeReminder({ scheduled_date: '2027-06-15T10:00' })
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder },
      })
      expect(wrapper.text()).not.toContain('Vencido')
    })

    it('applies reminder-card--past CSS class to the article when past', async () => {
      const reminder = makeReminder({ scheduled_date: '2020-01-01T10:00' })
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder },
      })
      expect(wrapper.find('article').classes()).toContain('reminder-card--past')
    })

    it('does NOT apply reminder-card--past class when the date is future', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      expect(wrapper.find('article').classes()).not.toContain('reminder-card--past')
    })
  })

  // ── Events ────────────────────────────────────────────────

  describe('edit-reminder event', () => {
    it('emits "edit-reminder" with the full reminder object when Editar is clicked', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      const editBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Editar'),
      )!
      await editBtn.trigger('click')

      const emitted = wrapper.emitted('edit-reminder')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(defaultReminder)
    })

    it('clicking Editar does NOT also emit "delete-reminder" (stopPropagation)', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      const editBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Editar'),
      )!
      await editBtn.trigger('click')

      expect(wrapper.emitted('edit-reminder')).toBeTruthy()
      expect(wrapper.emitted('delete-reminder')).toBeFalsy()
    })
  })

  describe('delete-reminder event', () => {
    it('emits "delete-reminder" with the reminder id when the delete button is clicked', async () => {
      const reminder = makeReminder({ id: 7 })
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')

      const emitted = wrapper.emitted('delete-reminder')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBe(7)
    })

    it('clicking the delete button does NOT also emit "edit-reminder" (stopPropagation)', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')

      expect(wrapper.emitted('delete-reminder')).toBeTruthy()
      expect(wrapper.emitted('edit-reminder')).toBeFalsy()
    })
  })

  // ── Accessibility ─────────────────────────────────────────

  describe('accessibility', () => {
    it('article has a descriptive aria-label containing the reminder title', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      expect(wrapper.find('article').attributes('aria-label')).toContain('Vacuna antirrábica')
    })

    it('Editar button has a descriptive aria-label containing the reminder title', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      const editBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Editar'),
      )!
      expect(editBtn.attributes('aria-label')).toContain('Vacuna antirrábica')
    })

    it('delete button has a descriptive aria-label containing the reminder title', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      expect(deleteBtn.attributes('aria-label')).toContain('Vacuna antirrábica')
    })

    it('type icon has aria-hidden="true" so screen readers skip the emoji', async () => {
      const wrapper = await mountSuspended(ReminderCard, {
        props: { reminder: defaultReminder },
      })
      // The type icon span has aria-hidden="true"
      const hiddenSpans = wrapper.findAll('[aria-hidden="true"]')
      expect(hiddenSpans.length).toBeGreaterThan(0)
    })
  })
})
