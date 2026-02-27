// ============================================================
// MedicalRecordCard.test.ts
// Tests for the MedicalRecordCard component.
//
// Strategy: mountSuspended from @nuxt/test-utils resolves Nuxt
// auto-imports inside the component without a real server. We test
// behaviour and DOM output — not implementation details or CSS.
//
// Key design points:
//   - Two-step delete confirmation: clicking the trash button shows
//     a confirmation panel; clicking "Sí, eliminar" emits delete-record;
//     clicking "Cancelar" returns to the initial button state.
//   - Overdue badge: next_visit in the past renders bg-danger + "(Vencida)";
//     next_visit in the future renders bg-warning.
//   - NuxtLink is stubbed to avoid a real router dependency in most tests.
//     For edit link href assertions, NuxtLink: false is used so it renders
//     as a real <a> element in the test environment.
//
// Date handling: future dates (2027-...) make isNextVisitOverdue false by
// default; clearly past dates (2020-...) make it true.
//
// What this suite does NOT cover intentionally:
//   - CSS transitions / SCSS visual styles.
//   - formatDate locale output exactness — locale-dependent in CI;
//     we assert the <time> element's datetime attribute instead.
// ============================================================

import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import MedicalRecordCard from './MedicalRecordCard.vue'
import type { MedicalRecord } from '../types'

// ── Fixtures ─────────────────────────────────────────────────

function makeRecord(overrides: Partial<MedicalRecord> = {}): MedicalRecord {
  return {
    id: '1',
    pet_id: '42',
    date: '2024-06-15',
    veterinarian: 'Dr. García',
    diagnosis: 'Control rutinario anual',
    treatment: 'Vitaminas y desparasitante oral',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const defaultRecord = makeRecord()
const globalStubs = { NuxtLink: true }

// ── Suite ─────────────────────────────────────────────────────

describe('MedicalRecordCard', () => {
  // ── Rendering — core required fields ──────────────────────

  describe('rendering required fields', () => {
    it('renders the formatted date inside a <time> element', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      const time = wrapper.find('time')
      expect(time.exists()).toBe(true)
      expect(time.attributes('datetime')).toBe('2024-06-15')
    })

    it('renders the veterinarian name', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Dr. García')
    })

    it('renders the diagnosis text', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Control rutinario anual')
    })

    it('renders the treatment text', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Vitaminas y desparasitante oral')
    })

    it('renders the "Diagnóstico" section label', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Diagnóstico')
    })

    it('renders the "Tratamiento" section label', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Tratamiento')
    })

    it('the <time> element has a non-empty formatted date text', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      const time = wrapper.find('time')
      expect(time.text().length).toBeGreaterThan(0)
    })
  })

  // ── Rendering — optional weight ───────────────────────────

  describe('optional weight field', () => {
    it('shows the weight badge when weight is provided', async () => {
      const record = makeRecord({ weight: 4.5 })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('4.5 kg')
    })

    it('shows the weight badge title attribute with the correct value', async () => {
      const record = makeRecord({ weight: 7.2 })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      const badge = wrapper.find('[title*="Peso en la visita"]')
      expect(badge.exists()).toBe(true)
      expect(badge.attributes('title')).toContain('7.2')
    })

    it('hides the weight badge when weight is undefined', async () => {
      const record = makeRecord({ weight: undefined })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).not.toContain('kg')
    })

    it('shows weight of 0 correctly (valid edge case)', async () => {
      const record = makeRecord({ weight: 0 })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      // weight: 0 satisfies `v-if="record.weight !== undefined"` — it SHOULD show
      expect(wrapper.text()).toContain('0 kg')
    })
  })

  // ── Rendering — optional notes ────────────────────────────

  describe('optional notes field', () => {
    it('shows notes when present in the record', async () => {
      const record = makeRecord({ notes: 'Antibiótico 7 días. Reposo relativo.' })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Antibiótico 7 días. Reposo relativo.')
    })

    it('shows the "Notas" section label when notes are present', async () => {
      const record = makeRecord({ notes: 'Alguna nota' })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Notas')
    })

    it('hides the notes section when notes is undefined', async () => {
      const record = makeRecord({ notes: undefined })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      // The notes section is v-if="record.notes" — without notes it must not appear.
      // Asserting the label is absent avoids brittle text coupling.
      const notesParagraphs = wrapper.findAll('p').filter(p =>
        p.classes().includes('text-muted') &&
        p.text().toUpperCase().includes('NOTAS'),
      )
      expect(notesParagraphs).toHaveLength(0)
    })
  })

  // ── Rendering — optional next_visit ───────────────────────

  describe('optional next_visit field', () => {
    it('shows the "Próxima visita" badge when next_visit is provided', async () => {
      const record = makeRecord({ next_visit: '2027-09-01' })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Próxima visita')
    })

    it('hides the next_visit badge when next_visit is undefined', async () => {
      const record = makeRecord({ next_visit: undefined })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).not.toContain('Próxima visita')
    })

    it('the badge has bg-warning class when next_visit is in the future (not overdue)', async () => {
      const record = makeRecord({ next_visit: '2027-09-01' })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      // Target the specific next_visit badge by its aria-label, not the first .badge
      // (the first .badge is the veterinarian bg-info badge)
      const badge = wrapper.find('[aria-label*="Próxima visita"]')
      expect(badge.exists()).toBe(true)
      // Future date → bg-warning, not bg-danger
      expect(badge.classes()).toContain('bg-warning')
      expect(badge.classes()).not.toContain('bg-danger')
    })
  })

  // ── Overdue badge (next_visit in the past) ────────────────

  describe('"Vencida" overdue badge', () => {
    it('shows "(Vencida)" text when next_visit is in the past', async () => {
      const record = makeRecord({ next_visit: '2020-01-01' })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.text()).toContain('Vencida')
    })

    it('applies bg-danger class to the badge when next_visit is overdue', async () => {
      const record = makeRecord({ next_visit: '2020-01-01' })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      // Find the next_visit badge (the one with aria-label containing "Próxima visita")
      const badge = wrapper.find('[aria-label*="Próxima visita"]')
      expect(badge.classes()).toContain('bg-danger')
    })

    it('does NOT apply bg-danger when next_visit is in the future', async () => {
      const record = makeRecord({ next_visit: '2027-09-01' })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      const badge = wrapper.find('[aria-label*="Próxima visita"]')
      expect(badge.classes()).not.toContain('bg-danger')
    })

    it('overdue badge has aria-label starting with "Próxima visita vencida"', async () => {
      const record = makeRecord({ next_visit: '2020-01-01' })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      const badge = wrapper.find('[aria-label*="vencida"]')
      expect(badge.exists()).toBe(true)
    })

    it('future badge has aria-label starting with "Próxima visita:" (no "vencida")', async () => {
      const record = makeRecord({ next_visit: '2027-09-01' })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      const badge = wrapper.find('[aria-label*="Próxima visita"]')
      expect(badge.attributes('aria-label')).not.toContain('vencida')
    })
  })

  // ── Edit link ─────────────────────────────────────────────

  describe('edit action link', () => {
    it('renders an "Editar" link (NuxtLink) in the card footer', async () => {
      // Use NuxtLink: false so the real NuxtLink renders its slot content ("Editar")
      // as an <a> element. NuxtLink: true stubs render as empty <nuxtlink-stub>.
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: { NuxtLink: false } },
      })
      expect(wrapper.text()).toContain('Editar')
    })

    it('the edit NuxtLink points to the correct edit route', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        // Use NuxtLink: false to get the real <a> rendered
        global: { stubs: { NuxtLink: false } },
      })
      const link = wrapper.find('a[href*="/edit"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe('/dashboard/medical/42/record/1/edit')
    })

    it('the edit link has a descriptive aria-label', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        // Use NuxtLink: false to get the <a> with aria-label
        global: { stubs: { NuxtLink: false } },
      })
      const link = wrapper.find('a[href*="/edit"]')
      expect(link.attributes('aria-label')).toContain('Editar registro')
    })
  })

  // ── Two-step delete confirmation ──────────────────────────

  describe('two-step delete confirmation', () => {
    it('initially shows the delete trash button and NOT the confirmation panel', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      // The trash button is visible; the confirmation panel is hidden
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )
      expect(deleteBtn).toBeDefined()
      expect(wrapper.text()).not.toContain('¿Estás seguro?')
    })

    it('shows the confirmation panel after clicking the delete button', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')

      expect(wrapper.text()).toContain('¿Estás seguro?')
    })

    it('shows "Sí, eliminar" and "Cancelar" buttons in confirmation state', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')

      expect(wrapper.text()).toContain('Sí, eliminar')
      expect(wrapper.text()).toContain('Cancelar')
    })

    it('hides the original trash button when in confirmation state', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')

      // Original trash button (aria-label "Eliminar...") should no longer exist
      const originalDeleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )
      expect(originalDeleteBtn).toBeUndefined()
    })

    it('emits "delete-record" with the record id when "Sí, eliminar" is clicked', async () => {
      const record = makeRecord({ id: '7' })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')

      const confirmBtn = wrapper.findAll('button').find(b => b.text() === 'Sí, eliminar')!
      await confirmBtn.trigger('click')

      const emitted = wrapper.emitted('delete-record')
      expect(emitted).toBeTruthy()
      expect(emitted![0][0]).toBe('7')
    })

    it('does NOT emit "delete-record" immediately on first delete click (before confirmation)', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')

      expect(wrapper.emitted('delete-record')).toBeFalsy()
    })

    it('returns to the initial state (trash button visible) after clicking "Cancelar"', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')

      const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancelar')!
      await cancelBtn.trigger('click')

      // Back to initial state — confirmation panel gone, trash button visible
      expect(wrapper.text()).not.toContain('¿Estás seguro?')
      const trashBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )
      expect(trashBtn).toBeDefined()
    })

    it('does NOT emit "delete-record" when "Cancelar" is clicked', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      await deleteBtn.trigger('click')

      const cancelBtn = wrapper.findAll('button').find(b => b.text() === 'Cancelar')!
      await cancelBtn.trigger('click')

      expect(wrapper.emitted('delete-record')).toBeFalsy()
    })
  })

  // ── Accessibility ─────────────────────────────────────────

  describe('accessibility', () => {
    it('article has a descriptive aria-label containing the date', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      // aria-label is "Registro médico del {formattedDate}"
      const article = wrapper.find('article')
      expect(article.attributes('aria-label')).toContain('Registro médico')
    })

    it('delete button has a descriptive aria-label containing "Eliminar"', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      const deleteBtn = wrapper.findAll('button').find(b =>
        b.attributes('aria-label')?.includes('Eliminar'),
      )!
      expect(deleteBtn.attributes('aria-label')).toBeTruthy()
      expect(deleteBtn.attributes('aria-label')).toContain('Eliminar')
    })

    it('decorative emoji icons have aria-hidden="true"', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      const hiddenSpans = wrapper.findAll('[aria-hidden="true"]')
      expect(hiddenSpans.length).toBeGreaterThan(0)
    })

    it('next_visit badge with future date has aria-label mentioning "Próxima visita"', async () => {
      const record = makeRecord({ next_visit: '2027-09-01' })
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record, petId: '42' },
        global: { stubs: globalStubs },
      })
      const badge = wrapper.find('[aria-label*="Próxima visita"]')
      expect(badge.exists()).toBe(true)
    })

    it('the article renders as an article element (semantic HTML)', async () => {
      const wrapper = await mountSuspended(MedicalRecordCard, {
        props: { record: defaultRecord, petId: '42' },
        global: { stubs: globalStubs },
      })
      expect(wrapper.find('article').exists()).toBe(true)
    })
  })
})
