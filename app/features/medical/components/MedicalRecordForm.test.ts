// ============================================================
// MedicalRecordForm.test.ts
// Tests for the MedicalRecordForm component.
//
// Strategy: mountSuspended from @nuxt/test-utils. The form operates
// in two modes: create (no record prop) and edit (record prop provided).
// We test field rendering, pre-fill, validation behaviour, submit
// payload, navigation on success, and loading state.
//
// Mocking strategy:
//   - useMedical is mocked via vi.mock because it is a project composable.
//     We control createMedicalRecord, updateMedicalRecord, error, and
//     medicalStore state through controlled test doubles.
//   - navigateTo is mocked via mockNuxtImport (Nuxt auto-import).
//
// Bootstrap validation: the form adds the class "was-validated" after
// a submit attempt. Validation errors (is-invalid) only appear after
// submitted.value is set to true, which happens on handleSubmit().
//
// Weight validation: weight is optional. Invalid values (>200, <0,
// non-numeric) make the field invalid after submit.
//
// What this suite does NOT cover intentionally:
//   - SCSS / Bootstrap CSS visual styles.
//   - Native form constraint validation UI (browser-controlled).
//   - MedicalRecordCard / MedicalHistory internals — those have their own tests.
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import MedicalRecordForm from './MedicalRecordForm.vue'
import type { MedicalRecord, CreateMedicalRecordDTO } from '../types'
import { ref } from 'vue'

// ── navigateTo mock ──────────────────────────────────────────
// navigateTo is a Nuxt auto-import — use mockNuxtImport.

const navigateToMock = vi.hoisted(() => vi.fn())
mockNuxtImport('navigateTo', () => navigateToMock)

// ── useMedical mock ──────────────────────────────────────────
// useMedical is a project composable — vi.mock intercepts the module.

const mockCreateMedicalRecord = vi.fn()
const mockUpdateMedicalRecord = vi.fn()
const mockError = ref<string | null>(null)
const mockMedicalStore = {
  isLoading: false,
}

vi.mock('../composables/useMedical', () => ({
  useMedical: () => ({
    createMedicalRecord: mockCreateMedicalRecord,
    updateMedicalRecord: mockUpdateMedicalRecord,
    error: mockError,
    medicalStore: mockMedicalStore,
  }),
}))

// ── Fixtures ─────────────────────────────────────────────────

function makeRecord(overrides: Partial<MedicalRecord> = {}): MedicalRecord {
  return {
    id: '1',
    pet_id: '42',
    date: '2024-06-15',
    veterinarian: 'Dr. García',
    diagnosis: 'Control rutinario',
    treatment: 'Vitaminas y desparasitante',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

// ── Helpers ───────────────────────────────────────────────────

/** Fill all required fields in the form. */
async function fillRequiredFields(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  overrides: { date?: string; veterinarian?: string; diagnosis?: string; treatment?: string } = {},
) {
  await wrapper.find('#medical-date').setValue(overrides.date ?? '2024-06-15')
  await wrapper.find('#medical-vet').setValue(overrides.veterinarian ?? 'Dr. García')
  await wrapper.find('#medical-diagnosis').setValue(overrides.diagnosis ?? 'Control rutinario')
  await wrapper.find('#medical-treatment').setValue(overrides.treatment ?? 'Vitaminas y desparasitante')
}

/** Fill required fields and trigger form submit. */
async function fillAndSubmit(
  wrapper: Awaited<ReturnType<typeof mountSuspended>>,
  overrides: Parameters<typeof fillRequiredFields>[1] = {},
) {
  await fillRequiredFields(wrapper, overrides)
  await wrapper.find('form').trigger('submit')
}

// ── Suite ─────────────────────────────────────────────────────

describe('MedicalRecordForm', () => {
  beforeEach(() => {
    mockCreateMedicalRecord.mockReset()
    mockUpdateMedicalRecord.mockReset()
    navigateToMock.mockReset()
    mockError.value = null
    mockMedicalStore.isLoading = false
    // Default: successful create returns a record
    mockCreateMedicalRecord.mockResolvedValue(makeRecord())
    mockUpdateMedicalRecord.mockResolvedValue(makeRecord())
  })

  // ── Create mode — field rendering ─────────────────────────

  describe('create mode (no record prop) — field rendering', () => {
    it('renders the date input', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('#medical-date').exists()).toBe(true)
    })

    it('renders the veterinarian input', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('#medical-vet').exists()).toBe(true)
    })

    it('renders the diagnosis textarea', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('#medical-diagnosis').exists()).toBe(true)
    })

    it('renders the treatment textarea', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('#medical-treatment').exists()).toBe(true)
    })

    it('renders the notes textarea', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('#medical-notes').exists()).toBe(true)
    })

    it('renders the weight input', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('#medical-weight').exists()).toBe(true)
    })

    it('renders the next_visit date input', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('#medical-next-visit').exists()).toBe(true)
    })

    it('starts with an empty date field', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect((wrapper.find('#medical-date').element as HTMLInputElement).value).toBe('')
    })

    it('starts with an empty veterinarian field', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect((wrapper.find('#medical-vet').element as HTMLInputElement).value).toBe('')
    })

    it('starts with an empty diagnosis field', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect((wrapper.find('#medical-diagnosis').element as HTMLTextAreaElement).value).toBe('')
    })

    it('starts with an empty treatment field', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect((wrapper.find('#medical-treatment').element as HTMLTextAreaElement).value).toBe('')
    })

    it('starts with an empty notes field', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect((wrapper.find('#medical-notes').element as HTMLTextAreaElement).value).toBe('')
    })

    it('starts with an empty weight field', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect((wrapper.find('#medical-weight').element as HTMLInputElement).value).toBe('')
    })

    it('starts with an empty next_visit field', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect((wrapper.find('#medical-next-visit').element as HTMLInputElement).value).toBe('')
    })

    it('shows "Guardar registro" on the submit button in create mode', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('button[type="submit"]').text()).toContain('Guardar registro')
    })

    it('does NOT show "Guardar cambios" in create mode', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('button[type="submit"]').text()).not.toContain('Guardar cambios')
    })
  })

  // ── Edit mode — field pre-population ──────────────────────

  describe('edit mode (record prop provided) — field pre-population', () => {
    it('pre-populates the date field from the record prop', async () => {
      const record = makeRecord({ date: '2024-06-15' })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      expect((wrapper.find('#medical-date').element as HTMLInputElement).value).toBe('2024-06-15')
    })

    it('pre-populates the veterinarian field from the record prop', async () => {
      const record = makeRecord({ veterinarian: 'Dra. Rodríguez' })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      expect((wrapper.find('#medical-vet').element as HTMLInputElement).value).toBe('Dra. Rodríguez')
    })

    it('pre-populates the diagnosis field from the record prop', async () => {
      const record = makeRecord({ diagnosis: 'Infección bacteriana' })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      expect((wrapper.find('#medical-diagnosis').element as HTMLTextAreaElement).value).toBe('Infección bacteriana')
    })

    it('pre-populates the treatment field from the record prop', async () => {
      const record = makeRecord({ treatment: 'Antibiótico 10 días' })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      expect((wrapper.find('#medical-treatment').element as HTMLTextAreaElement).value).toBe('Antibiótico 10 días')
    })

    it('pre-populates the notes field when notes is present', async () => {
      const record = makeRecord({ notes: 'Reposo relativo 3 días' })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      expect((wrapper.find('#medical-notes').element as HTMLTextAreaElement).value).toBe('Reposo relativo 3 días')
    })

    it('pre-populates the weight field when weight is present', async () => {
      const record = makeRecord({ weight: 4.5 })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      expect((wrapper.find('#medical-weight').element as HTMLInputElement).value).toBe('4.5')
    })

    it('pre-populates the next_visit field when next_visit is present', async () => {
      const record = makeRecord({ next_visit: '2025-01-15' })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      expect((wrapper.find('#medical-next-visit').element as HTMLInputElement).value).toBe('2025-01-15')
    })

    it('shows empty weight field when weight is undefined', async () => {
      const record = makeRecord({ weight: undefined })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      expect((wrapper.find('#medical-weight').element as HTMLInputElement).value).toBe('')
    })

    it('shows empty notes field when notes is undefined', async () => {
      const record = makeRecord({ notes: undefined })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      expect((wrapper.find('#medical-notes').element as HTMLTextAreaElement).value).toBe('')
    })

    it('shows "Guardar cambios" on the submit button in edit mode', async () => {
      const record = makeRecord()
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      expect(wrapper.find('button[type="submit"]').text()).toContain('Guardar cambios')
    })

    it('does NOT show "Guardar registro" in edit mode', async () => {
      const record = makeRecord()
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      expect(wrapper.find('button[type="submit"]').text()).not.toContain('Guardar registro')
    })
  })

  // ── Validation ────────────────────────────────────────────

  describe('validation on submit', () => {
    it('adds "was-validated" class to the form after a submit attempt', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('form').classes()).toContain('was-validated')
    })

    it('does NOT call createMedicalRecord when required fields are empty', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await wrapper.find('form').trigger('submit')
      expect(mockCreateMedicalRecord).not.toHaveBeenCalled()
    })

    it('applies "is-invalid" to the date input when date is empty after submit', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#medical-date').classes()).toContain('is-invalid')
    })

    it('applies "is-invalid" to the veterinarian input when empty after submit', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#medical-vet').classes()).toContain('is-invalid')
    })

    it('applies "is-invalid" to the diagnosis textarea when empty after submit', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#medical-diagnosis').classes()).toContain('is-invalid')
    })

    it('applies "is-invalid" to the treatment textarea when empty after submit', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#medical-treatment').classes()).toContain('is-invalid')
    })

    it('does NOT call createMedicalRecord when veterinarian has only 1 character', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await wrapper.find('#medical-date').setValue('2024-06-15')
      await wrapper.find('#medical-vet').setValue('A')
      await wrapper.find('#medical-diagnosis').setValue('Control rutinario')
      await wrapper.find('#medical-treatment').setValue('Vitaminas')
      await wrapper.find('form').trigger('submit')
      expect(mockCreateMedicalRecord).not.toHaveBeenCalled()
    })

    it('does NOT call createMedicalRecord when diagnosis has only 1 character', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await wrapper.find('#medical-date').setValue('2024-06-15')
      await wrapper.find('#medical-vet').setValue('Dr. García')
      await wrapper.find('#medical-diagnosis').setValue('X')
      await wrapper.find('#medical-treatment').setValue('Vitaminas')
      await wrapper.find('form').trigger('submit')
      expect(mockCreateMedicalRecord).not.toHaveBeenCalled()
    })

    it('does NOT call createMedicalRecord when treatment has only 1 character', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await wrapper.find('#medical-date').setValue('2024-06-15')
      await wrapper.find('#medical-vet').setValue('Dr. García')
      await wrapper.find('#medical-diagnosis').setValue('Control rutinario')
      await wrapper.find('#medical-treatment').setValue('X')
      await wrapper.find('form').trigger('submit')
      expect(mockCreateMedicalRecord).not.toHaveBeenCalled()
    })

    it('applies "is-invalid" to weight input when weight is out of range (>200) after submit', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillRequiredFields(wrapper)
      await wrapper.find('#medical-weight').setValue('250')
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#medical-weight').classes()).toContain('is-invalid')
    })

    it('applies "is-invalid" to weight input when weight is negative after submit', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillRequiredFields(wrapper)
      await wrapper.find('#medical-weight').setValue('-1')
      await wrapper.find('form').trigger('submit')
      expect(wrapper.find('#medical-weight').classes()).toContain('is-invalid')
    })

    it('weight field is valid when empty (optional field)', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillRequiredFields(wrapper)
      await wrapper.find('form').trigger('submit')
      // Empty weight → isWeightValid is true (optional) → no is-invalid
      expect(wrapper.find('#medical-weight').classes()).not.toContain('is-invalid')
    })

    it('form submits successfully when weight is exactly 0 (boundary)', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillRequiredFields(wrapper)
      await wrapper.find('#medical-weight').setValue('0')
      await wrapper.find('form').trigger('submit')
      expect(mockCreateMedicalRecord).toHaveBeenCalled()
    })

    it('form submits successfully when weight is exactly 200 (boundary)', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillRequiredFields(wrapper)
      await wrapper.find('#medical-weight').setValue('200')
      await wrapper.find('form').trigger('submit')
      expect(mockCreateMedicalRecord).toHaveBeenCalled()
    })
  })

  // ── Submit payload — create mode ──────────────────────────

  describe('submit payload in create mode', () => {
    it('calls createMedicalRecord with the correct petId and required fields', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillAndSubmit(wrapper)

      expect(mockCreateMedicalRecord).toHaveBeenCalledWith('42', expect.objectContaining({
        date: '2024-06-15',
        veterinarian: 'Dr. García',
        diagnosis: 'Control rutinario',
        treatment: 'Vitaminas y desparasitante',
      }))
    })

    it('trims whitespace from veterinarian in the payload', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillAndSubmit(wrapper, { veterinarian: '  Dr. García  ' })

      const dto = mockCreateMedicalRecord.mock.calls[0][1] as CreateMedicalRecordDTO
      expect(dto.veterinarian).toBe('Dr. García')
    })

    it('trims whitespace from diagnosis in the payload', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillAndSubmit(wrapper, { diagnosis: '  Control rutinario  ' })

      const dto = mockCreateMedicalRecord.mock.calls[0][1] as CreateMedicalRecordDTO
      expect(dto.diagnosis).toBe('Control rutinario')
    })

    it('trims whitespace from treatment in the payload', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillAndSubmit(wrapper, { treatment: '  Vitaminas  ' })

      const dto = mockCreateMedicalRecord.mock.calls[0][1] as CreateMedicalRecordDTO
      expect(dto.treatment).toBe('Vitaminas')
    })

    it('omits notes from payload when notes field is empty', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillAndSubmit(wrapper)

      const dto = mockCreateMedicalRecord.mock.calls[0][1] as CreateMedicalRecordDTO
      expect(dto.notes).toBeUndefined()
    })

    it('includes notes in payload when notes are provided', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillRequiredFields(wrapper)
      await wrapper.find('#medical-notes').setValue('Antibiótico 7 días')
      await wrapper.find('form').trigger('submit')

      const dto = mockCreateMedicalRecord.mock.calls[0][1] as CreateMedicalRecordDTO
      expect(dto.notes).toBe('Antibiótico 7 días')
    })

    it('trims whitespace from notes in the payload', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillRequiredFields(wrapper)
      await wrapper.find('#medical-notes').setValue('  Nota con espacios  ')
      await wrapper.find('form').trigger('submit')

      const dto = mockCreateMedicalRecord.mock.calls[0][1] as CreateMedicalRecordDTO
      expect(dto.notes).toBe('Nota con espacios')
    })

    it('omits notes from payload when notes is only whitespace', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillRequiredFields(wrapper)
      await wrapper.find('#medical-notes').setValue('   ')
      await wrapper.find('form').trigger('submit')

      const dto = mockCreateMedicalRecord.mock.calls[0][1] as CreateMedicalRecordDTO
      expect(dto.notes).toBeUndefined()
    })

    it('omits weight from payload when weight field is empty', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillAndSubmit(wrapper)

      const dto = mockCreateMedicalRecord.mock.calls[0][1] as CreateMedicalRecordDTO
      expect(dto.weight).toBeUndefined()
    })

    it('includes weight as a float in payload when weight is provided', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillRequiredFields(wrapper)
      await wrapper.find('#medical-weight').setValue('4.5')
      await wrapper.find('form').trigger('submit')

      const dto = mockCreateMedicalRecord.mock.calls[0][1] as CreateMedicalRecordDTO
      expect(dto.weight).toBe(4.5)
    })

    it('omits next_visit from payload when next_visit field is empty', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillAndSubmit(wrapper)

      const dto = mockCreateMedicalRecord.mock.calls[0][1] as CreateMedicalRecordDTO
      expect(dto.next_visit).toBeUndefined()
    })

    it('includes next_visit in payload when provided', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillRequiredFields(wrapper)
      await wrapper.find('#medical-next-visit').setValue('2025-03-15')
      await wrapper.find('form').trigger('submit')

      const dto = mockCreateMedicalRecord.mock.calls[0][1] as CreateMedicalRecordDTO
      expect(dto.next_visit).toBe('2025-03-15')
    })

    it('does NOT call updateMedicalRecord in create mode', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillAndSubmit(wrapper)
      expect(mockUpdateMedicalRecord).not.toHaveBeenCalled()
    })
  })

  // ── Submit payload — edit mode ────────────────────────────

  describe('submit payload in edit mode', () => {
    it('calls updateMedicalRecord with correct petId, recordId, and payload', async () => {
      const record = makeRecord({ id: '5', pet_id: '42' })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      await wrapper.find('form').trigger('submit')

      expect(mockUpdateMedicalRecord).toHaveBeenCalledWith('42', '5', expect.objectContaining({
        date: '2024-06-15',
        veterinarian: 'Dr. García',
      }))
    })

    it('does NOT call createMedicalRecord in edit mode', async () => {
      const record = makeRecord()
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      await wrapper.find('form').trigger('submit')
      expect(mockCreateMedicalRecord).not.toHaveBeenCalled()
    })

    it('sends the updated veterinarian after editing the field', async () => {
      const record = makeRecord({ veterinarian: 'Dr. García' })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      await wrapper.find('#medical-vet').setValue('Dra. López')
      await wrapper.find('form').trigger('submit')

      const dto = mockUpdateMedicalRecord.mock.calls[0][2]
      expect(dto.veterinarian).toBe('Dra. López')
    })

    it('omits weight when cleared in edit mode', async () => {
      const record = makeRecord({ weight: 4.5 })
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      // Clear the weight field
      await wrapper.find('#medical-weight').setValue('')
      await wrapper.find('form').trigger('submit')

      const dto = mockUpdateMedicalRecord.mock.calls[0][2]
      expect(dto.weight).toBeUndefined()
    })
  })

  // ── Navigation on success ─────────────────────────────────

  describe('navigation on success', () => {
    it('navigates to /dashboard/medical/{petId} after successful create', async () => {
      mockCreateMedicalRecord.mockResolvedValue(makeRecord())
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillAndSubmit(wrapper)

      expect(navigateToMock).toHaveBeenCalledWith('/dashboard/medical/42')
    })

    it('navigates to /dashboard/medical/{petId} after successful update', async () => {
      mockUpdateMedicalRecord.mockResolvedValue(makeRecord())
      const record = makeRecord()
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      await wrapper.find('form').trigger('submit')

      expect(navigateToMock).toHaveBeenCalledWith('/dashboard/medical/42')
    })

    it('does NOT navigate when createMedicalRecord returns null (API error)', async () => {
      mockCreateMedicalRecord.mockResolvedValue(null)
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      await fillAndSubmit(wrapper)

      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('does NOT navigate when updateMedicalRecord returns null (API error)', async () => {
      mockUpdateMedicalRecord.mockResolvedValue(null)
      const record = makeRecord()
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      await wrapper.find('form').trigger('submit')

      expect(navigateToMock).not.toHaveBeenCalled()
    })

    it('uses the correct petId in the navigation URL', async () => {
      mockCreateMedicalRecord.mockResolvedValue(makeRecord({ pet_id: '99' }))
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '99' },
      })
      await fillAndSubmit(wrapper)

      expect(navigateToMock).toHaveBeenCalledWith('/dashboard/medical/99')
    })
  })

  // ── Cancel navigation ─────────────────────────────────────

  describe('cancel button', () => {
    it('navigates to /dashboard/medical/{petId} when cancel is clicked', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      await cancelBtn.trigger('click')

      expect(navigateToMock).toHaveBeenCalledWith('/dashboard/medical/42')
    })

    it('does NOT call createMedicalRecord when cancel is clicked', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      await cancelBtn.trigger('click')

      expect(mockCreateMedicalRecord).not.toHaveBeenCalled()
    })

    it('cancel navigates to the correct petId in URL', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '99' },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      await cancelBtn.trigger('click')

      expect(navigateToMock).toHaveBeenCalledWith('/dashboard/medical/99')
    })
  })

  // ── Loading state ─────────────────────────────────────────

  describe('when medicalStore.isLoading is true', () => {
    beforeEach(() => {
      mockMedicalStore.isLoading = true
    })

    it('disables the submit button', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined()
    })

    it('disables the cancel button', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      expect(cancelBtn.attributes('disabled')).toBeDefined()
    })

    it('shows the spinner inside the submit button', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('.spinner-border').exists()).toBe(true)
    })
  })

  describe('when medicalStore.isLoading is false', () => {
    it('submit button is enabled', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined()
    })

    it('cancel button is enabled', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      const cancelBtn = wrapper.findAll('button').find(b => b.text().includes('Cancelar'))!
      expect(cancelBtn.attributes('disabled')).toBeUndefined()
    })

    it('does NOT show the spinner', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.find('.spinner-border').exists()).toBe(false)
    })
  })

  // ── Character counters ─────────────────────────────────────

  describe('character counters', () => {
    it('shows "0/1000" for diagnosis when field is empty in create mode', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      // The diagnosis counter is in the form-text after the textarea
      const diagnosisContainer = wrapper.find('#medical-diagnosis').element.closest('.mb-3')
      expect(diagnosisContainer?.textContent).toContain('0/1000')
    })

    it('shows "0/1000" for treatment when field is empty in create mode', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      const treatmentContainer = wrapper.find('#medical-treatment').element.closest('.mb-3')
      expect(treatmentContainer?.textContent).toContain('0/1000')
    })

    it('shows "0/500" for notes when field is empty in create mode', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      const notesContainer = wrapper.find('#medical-notes').element.closest('.mb-3')
      expect(notesContainer?.textContent).toContain('0/500')
    })

    it('reflects the pre-filled diagnosis length in edit mode', async () => {
      const record = makeRecord({ diagnosis: 'AB' }) // 2 chars
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      const diagnosisContainer = wrapper.find('#medical-diagnosis').element.closest('.mb-3')
      expect(diagnosisContainer?.textContent).toContain('2/1000')
    })

    it('reflects the pre-filled notes length in edit mode', async () => {
      const record = makeRecord({ notes: 'Nota breve' }) // 10 chars
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42', record },
      })
      const notesContainer = wrapper.find('#medical-notes').element.closest('.mb-3')
      expect(notesContainer?.textContent).toContain('10/500')
    })
  })

  // ── Error alert display ────────────────────────────────────

  describe('API error display', () => {
    it('shows the error alert when error ref has a value', async () => {
      mockError.value = 'Error del servidor al guardar.'
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.text()).toContain('Error del servidor al guardar.')
    })

    it('does not show the error alert when error is null', async () => {
      mockError.value = null
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      const alert = wrapper.find('[role="alert"]')
      expect(alert.exists()).toBe(false)
    })
  })

  // ── Required field labels ──────────────────────────────────

  describe('required field labels', () => {
    it('renders the "Fecha de la visita" label', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.text()).toContain('Fecha de la visita')
    })

    it('renders the "Veterinario" label', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.text()).toContain('Veterinario')
    })

    it('renders the "Diagnóstico" label', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.text()).toContain('Diagnóstico')
    })

    it('renders the "Tratamiento" label', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.text()).toContain('Tratamiento')
    })

    it('renders the "Notas adicionales" label', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.text()).toContain('Notas adicionales')
    })

    it('renders the "Peso en la visita" label', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.text()).toContain('Peso en la visita')
    })

    it('renders the "Próxima visita" label', async () => {
      const wrapper = await mountSuspended(MedicalRecordForm, {
        props: { petId: '42' },
      })
      expect(wrapper.text()).toContain('Próxima visita')
    })
  })
})
