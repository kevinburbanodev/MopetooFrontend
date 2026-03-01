// ============================================================
// ReminderList.test.ts
// Tests for the ReminderList component.
//
// Strategy: mountSuspended from @nuxt/test-utils. The component
// conditionally renders one of several states: loading skeleton,
// empty-all state, filter-no-results state, or the reminder grid.
// We assert each state independently.
//
// Filter logic: ReminderList owns its own filter state (pet and type).
// We interact with the select elements using wrapper.setValue() and
// assert that the rendered cards change accordingly.
//
// NuxtLink: stubbed via global.stubs to avoid real router dependency
// in component tests.
//
// What this suite does NOT cover intentionally:
//   - ReminderCard internals — covered in ReminderCard.test.ts.
//   - Skeleton animation CSS — visual concern only.
//   - Exact sort order with identical timestamps — sort is ascending
//     by scheduled_date; we assert ordering between clearly distinct dates.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import ReminderList from './ReminderList.vue'
import type { Reminder } from '../types'
import type { Pet } from '../../pets/types'

// ── Fixtures ────────────────────────────────────────────────

function makeReminder(overrides: Partial<Reminder> = {}): Reminder {
  return {
    id: 1,
    pet_id: 42,
    type: 'vacuna',
    title: 'Vacuna antirrábica',
    scheduled_date: '2027-06-15T10:00',
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

const reminderA = makeReminder({ id: 1, pet_id: 42, type: 'vacuna', title: 'Vacuna Luna', scheduled_date: '2027-03-01T10:00' })
const reminderB = makeReminder({ id: 2, pet_id: 42, type: 'medicina', title: 'Medicina Luna', scheduled_date: '2027-05-01T10:00' })
const reminderC = makeReminder({ id: 3, pet_id: 99, type: 'baño', title: 'Baño Max', scheduled_date: '2027-04-01T10:00' })

// Global stubs for NuxtLink — avoids real router dependency in component tests
const globalStubs = { NuxtLink: true }

// ── Suite ────────────────────────────────────────────────────

describe('ReminderList', () => {
  // ── Loading state ─────────────────────────────────────────

  describe('when isLoading is true', () => {
    it('renders the loading skeleton grid with aria-busy="true"', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [], isLoading: true, pets: [] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(true)
    })

    it('renders 6 skeleton cards', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [], isLoading: true, pets: [] },
        global: { stubs: globalStubs },
      })
      const skeletons = wrapper.findAll('.reminder-skeleton')
      expect(skeletons).toHaveLength(6)
    })

    it('does not render the empty state while loading', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [], isLoading: true, pets: [] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).not.toContain('Sin recordatorios registrados')
    })

    it('does not render ReminderCard components while loading', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: true, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      // ReminderCard renders an <article> element
      expect(wrapper.findAll('article')).toHaveLength(0)
    })

    it('does not render the filter bar while loading', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: true, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('#filter-reminder-pet').exists()).toBe(false)
    })

    it('skeleton grid has aria-label "Cargando recordatorios"', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [], isLoading: true, pets: [] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('[aria-busy="true"]').attributes('aria-label')).toBe('Cargando recordatorios')
    })
  })

  // ── Empty state ───────────────────────────────────────────

  describe('when reminders is empty and isLoading is false', () => {
    it('renders the empty state heading', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [], isLoading: false, pets: [] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Sin recordatorios registrados')
    })

    it('renders a CTA link to /dashboard/reminders/new', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [], isLoading: false, pets: [] },
        // Do not stub NuxtLink here so we can find the rendered link
        global: { stubs: { NuxtLink: false } },
      })
      // NuxtLink renders as <a> in the test environment
      const link = wrapper.find('a[href="/dashboard/reminders/new"]')
      expect(link.exists()).toBe(true)
    })

    it('does not render the loading skeleton', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [], isLoading: false, pets: [] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })

    it('does not render ReminderCard components', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [], isLoading: false, pets: [] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.findAll('article')).toHaveLength(0)
    })

    it('does not render the filter bar when there are no reminders', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [], isLoading: false, pets: [] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('#filter-reminder-pet').exists()).toBe(false)
    })
  })

  // ── Reminder grid ─────────────────────────────────────────

  describe('when reminders are provided and isLoading is false', () => {
    it('renders one ReminderCard per reminder in the array', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA, reminderB, reminderC], isLoading: false, pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.findAll('article')).toHaveLength(3)
    })

    it('renders the correct reminder titles', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA, reminderB], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Vacuna Luna')
      expect(wrapper.text()).toContain('Medicina Luna')
    })

    it('does not render the empty state', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).not.toContain('Sin recordatorios registrados')
    })

    it('does not render the loading skeleton', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    })
  })

  // ── Filter bar ────────────────────────────────────────────

  describe('filter bar', () => {
    it('shows "Todas" as the default option in the pet filter', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      const petSelect = wrapper.find('#filter-reminder-pet')
      expect(petSelect.text()).toContain('Todas')
    })

    it('renders one option per pet in the pet filter dropdown', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      const petSelect = wrapper.find('#filter-reminder-pet')
      // Options: "Todas" + petLuna + petMax = 3
      expect(petSelect.findAll('option')).toHaveLength(3)
    })

    it('shows pet names in the pet filter dropdown', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      const petSelect = wrapper.find('#filter-reminder-pet')
      expect(petSelect.text()).toContain('Luna')
      expect(petSelect.text()).toContain('Max')
    })

    it('shows "Todos" as the default option in the type filter', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      const typeSelect = wrapper.find('#filter-reminder-type')
      expect(typeSelect.text()).toContain('Todos')
    })

    it('renders all 5 reminder types in the type filter dropdown', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      const typeSelect = wrapper.find('#filter-reminder-type')
      // "Todos" + 5 types = 6 options
      expect(typeSelect.findAll('option')).toHaveLength(6)
    })

    it('does NOT show "Limpiar filtros" button when no filter is active', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).not.toContain('Limpiar filtros')
    })
  })

  // ── Pet filter behaviour ───────────────────────────────────

  describe('filtering by pet', () => {
    it('shows only reminders matching the selected pet', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA, reminderB, reminderC], isLoading: false, pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      // Select petMax (id='99')
      await wrapper.find('#filter-reminder-pet').setValue('99')

      const articles = wrapper.findAll('article')
      expect(articles).toHaveLength(1)
      expect(wrapper.text()).toContain('Baño Max')
      expect(wrapper.text()).not.toContain('Vacuna Luna')
    })

    it('shows all reminders when the pet filter is cleared via the Limpiar button', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA, reminderB, reminderC], isLoading: false, pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#filter-reminder-pet').setValue('99')
      // Use the "Limpiar filtros" button to reset — this avoids the null-option
      // binding issue in happy-dom where setValue(null) serializes to string "null"
      const clearBtn = wrapper.findAll('button').find(b => b.text().includes('Limpiar filtros'))!
      await clearBtn.trigger('click')

      expect(wrapper.findAll('article')).toHaveLength(3)
    })

    it('shows "Limpiar filtros" button when a pet filter is active', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA, reminderC], isLoading: false, pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#filter-reminder-pet').setValue('42')

      expect(wrapper.text()).toContain('Limpiar filtros')
    })

    it('clears the pet filter when "Limpiar filtros" is clicked', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA, reminderC], isLoading: false, pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#filter-reminder-pet').setValue('42')
      const clearBtn = wrapper.findAll('button').find(b => b.text().includes('Limpiar filtros'))!
      await clearBtn.trigger('click')

      expect(wrapper.findAll('article')).toHaveLength(2)
      expect(wrapper.text()).not.toContain('Limpiar filtros')
    })
  })

  // ── Type filter behaviour ──────────────────────────────────

  describe('filtering by type', () => {
    it('shows only reminders matching the selected type', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA, reminderB, reminderC], isLoading: false, pets: [petLuna, petMax] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#filter-reminder-type').setValue('medicina')

      const articles = wrapper.findAll('article')
      expect(articles).toHaveLength(1)
      expect(wrapper.text()).toContain('Medicina Luna')
      expect(wrapper.text()).not.toContain('Vacuna Luna')
    })

    it('shows "Limpiar filtros" button when a type filter is active', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA, reminderB], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#filter-reminder-type').setValue('vacuna')

      expect(wrapper.text()).toContain('Limpiar filtros')
    })

    it('clears the type filter when "Limpiar filtros" is clicked', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA, reminderB], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#filter-reminder-type').setValue('vacuna')
      const clearBtn = wrapper.findAll('button').find(b => b.text().includes('Limpiar filtros'))!
      await clearBtn.trigger('click')

      expect(wrapper.findAll('article')).toHaveLength(2)
    })
  })

  // ── Filter no-results state ────────────────────────────────

  describe('when active filter yields 0 results', () => {
    it('shows "No hay recordatorios con los filtros seleccionados" message', async () => {
      const reminderOnlyVacuna = makeReminder({ id: 1, type: 'vacuna', pet_id: 42 })
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderOnlyVacuna], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      // Filter by a type that has no reminders
      await wrapper.find('#filter-reminder-type').setValue('baño')

      expect(wrapper.text()).toContain('No hay recordatorios con los filtros seleccionados.')
    })

    it('does not render ReminderCard articles when filter yields 0 results', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#filter-reminder-type').setValue('medicina')

      expect(wrapper.findAll('article')).toHaveLength(0)
    })

    it('provides a "Ver todos los recordatorios" button in the no-results state', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#filter-reminder-type').setValue('medicina')

      const clearAllBtn = wrapper.findAll('button').find(b =>
        b.text().includes('Ver todos los recordatorios'),
      )
      expect(clearAllBtn).toBeDefined()
    })

    it('"Ver todos los recordatorios" clears filters and shows all reminders', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA, reminderB], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      await wrapper.find('#filter-reminder-type').setValue('baño')
      const clearAllBtn = wrapper.findAll('button').find(b =>
        b.text().includes('Ver todos los recordatorios'),
      )!
      await clearAllBtn.trigger('click')

      expect(wrapper.findAll('article')).toHaveLength(2)
    })
  })

  // ── Sort order ────────────────────────────────────────────

  describe('sort order', () => {
    it('sorts reminders by scheduled_date ascending (soonest first)', async () => {
      const early = makeReminder({ id: 10, title: 'Early reminder', scheduled_date: '2027-01-01T10:00' })
      const later = makeReminder({ id: 11, title: 'Later reminder', scheduled_date: '2027-12-31T10:00' })
      // Pass in reverse order to verify sorting
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [later, early], isLoading: false, pets: [] },
        global: { stubs: globalStubs },
      })
      const articles = wrapper.findAll('article')
      // Early reminder (2027-01-01) should render first
      expect(articles[0].text()).toContain('Early reminder')
      expect(articles[1].text()).toContain('Later reminder')
    })
  })

  // ── petName passing ───────────────────────────────────────

  describe('petName lookup', () => {
    it('passes the correct petName to ReminderCard based on pet_id lookup', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      // petLuna has id='42'; reminderA has pet_id=42
      // ReminderCard renders petName in the list when provided
      expect(wrapper.text()).toContain('Luna')
    })

    it('does not render a pet name for a reminder whose pet is not in the pets array', async () => {
      const reminderUnknownPet = makeReminder({ id: 99, pet_id: 9999, title: 'Huérfano' })
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderUnknownPet], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      // The paw emoji 🐾 is only shown when petName is defined
      expect(wrapper.text()).not.toContain('🐾')
    })
  })

  // ── Event forwarding ──────────────────────────────────────

  describe('event forwarding', () => {
    it('forwards "edit-reminder" emitted by a child ReminderCard', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      const editBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Editar'),
      )!
      await editBtn.trigger('click')

      const emitted = wrapper.emitted('edit-reminder')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toEqual(reminderA)
    })

    it('forwards "delete-reminder" emitted by a child ReminderCard', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')

      const emitted = wrapper.emitted('delete-reminder')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBe(1)
    })
  })

  // ── Accessibility ─────────────────────────────────────────

  describe('accessibility', () => {
    it('the root section has aria-label "Lista de recordatorios"', async () => {
      const wrapper = await mountSuspended(ReminderList, {
        props: { reminders: [reminderA], isLoading: false, pets: [petLuna] },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('section').attributes('aria-label')).toBe('Lista de recordatorios')
    })
  })
})
