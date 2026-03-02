<script setup lang="ts">
// MedicalRecordForm — create / edit form for a medical record.
// In create mode: all fields empty.
// In edit mode: all fields pre-populated from the `record` prop.
// Calls the API directly via useMedical composable and navigates on success.
// Cancel navigates back to the pet's medical history page.

import type { MedicalRecord, CreateMedicalRecordDTO } from '../types'

const props = defineProps<{
  petId: string
  /** When provided, the form operates in edit mode with pre-populated fields. */
  record?: MedicalRecord
}>()

const { createMedicalRecord, updateMedicalRecord, error, medicalStore } = useMedical()

const isEditMode = computed(() => !!props.record)

// ── Form state ────────────────────────────────────────────────
const form = reactive({
  date: props.record?.date?.slice(0, 10) ?? '',
  symptoms: props.record?.symptoms ?? '',
  diagnosis: props.record?.diagnosis ?? '',
  treatment: props.record?.treatment ?? '',
  notes: props.record?.notes ?? '',
})

// ── Validation ────────────────────────────────────────────────
const submitted = ref(false)

const isDateValid = computed(() => !!form.date)
const isDiagnosisValid = computed(() => form.diagnosis.trim().length >= 2)
const isTreatmentValid = computed(() => form.treatment.trim().length >= 2)

const isFormValid = computed(
  () =>
    isDateValid.value &&
    isDiagnosisValid.value &&
    isTreatmentValid.value,
)

// ── Submit ────────────────────────────────────────────────────
async function handleSubmit(): Promise<void> {
  submitted.value = true
  if (!isFormValid.value) return

  const dto: CreateMedicalRecordDTO = {
    pet_id: Number(props.petId),
    date: form.date + 'T00:00:00Z',
    diagnosis: form.diagnosis.trim(),
    treatment: form.treatment.trim(),
    ...(form.symptoms.trim() ? { symptoms: form.symptoms.trim() } : {}),
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
  }

  let result: MedicalRecord | null = null

  if (isEditMode.value && props.record) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pet_id, ...updateData } = dto
    result = await updateMedicalRecord(props.record.id, updateData)
  }
  else {
    result = await createMedicalRecord(props.petId, dto)
  }

  if (result) {
    await navigateTo(`/dashboard/medical/${props.petId}`)
  }
}

function handleCancel(): void {
  navigateTo(`/dashboard/medical/${props.petId}`)
}
</script>

<template>
  <form
    novalidate
    :class="{ 'was-validated': submitted }"
    @submit.prevent="handleSubmit"
  >
    <!-- API error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">⚠</span>
      {{ error }}
    </div>

    <!-- Date (required) -->
    <div class="mb-3">
      <label for="medical-date" class="form-label fw-semibold">
        Fecha de la visita <span class="text-danger" aria-hidden="true">*</span>
      </label>
      <input
        id="medical-date"
        v-model="form.date"
        type="date"
        class="form-control"
        :class="{
          'is-invalid': submitted && !isDateValid,
          'is-valid': submitted && isDateValid,
        }"
        required
        aria-required="true"
      >
      <div v-if="submitted && !isDateValid" class="invalid-feedback">
        Selecciona la fecha de la visita.
      </div>
    </div>

    <!-- Symptoms (optional) -->
    <div class="mb-3">
      <label for="medical-symptoms" class="form-label fw-semibold">
        Síntomas
      </label>
      <textarea
        id="medical-symptoms"
        v-model="form.symptoms"
        class="form-control"
        rows="3"
        maxlength="1000"
        placeholder="Fiebre, tos, pérdida de apetito…"
      />
      <div class="form-text text-end">{{ form.symptoms.length }}/1000</div>
    </div>

    <!-- Diagnosis (required) -->
    <div class="mb-3">
      <label for="medical-diagnosis" class="form-label fw-semibold">
        Diagnóstico <span class="text-danger" aria-hidden="true">*</span>
      </label>
      <textarea
        id="medical-diagnosis"
        v-model="form.diagnosis"
        class="form-control"
        :class="{
          'is-invalid': submitted && !isDiagnosisValid,
          'is-valid': submitted && isDiagnosisValid,
        }"
        rows="3"
        maxlength="1000"
        placeholder="Descripción del diagnóstico"
        required
        aria-required="true"
      />
      <div v-if="submitted && !isDiagnosisValid" class="invalid-feedback">
        El diagnóstico debe tener al menos 2 caracteres.
      </div>
      <div class="form-text text-end">{{ form.diagnosis.length }}/1000</div>
    </div>

    <!-- Treatment (required) -->
    <div class="mb-3">
      <label for="medical-treatment" class="form-label fw-semibold">
        Tratamiento <span class="text-danger" aria-hidden="true">*</span>
      </label>
      <textarea
        id="medical-treatment"
        v-model="form.treatment"
        class="form-control"
        :class="{
          'is-invalid': submitted && !isTreatmentValid,
          'is-valid': submitted && isTreatmentValid,
        }"
        rows="3"
        maxlength="1000"
        placeholder="Medicamentos, procedimientos, dosis..."
        required
        aria-required="true"
      />
      <div v-if="submitted && !isTreatmentValid" class="invalid-feedback">
        El tratamiento debe tener al menos 2 caracteres.
      </div>
      <div class="form-text text-end">{{ form.treatment.length }}/1000</div>
    </div>

    <!-- Notes (optional) -->
    <div class="mb-4">
      <label for="medical-notes" class="form-label fw-semibold">
        Notas adicionales
      </label>
      <textarea
        id="medical-notes"
        v-model="form.notes"
        class="form-control"
        rows="3"
        maxlength="500"
        placeholder="Observaciones, recomendaciones, alergias..."
      />
      <div class="form-text text-end">{{ form.notes.length }}/500</div>
    </div>

    <!-- Actions -->
    <div class="d-flex gap-2 justify-content-end flex-wrap">
      <button
        type="button"
        class="btn btn-outline-secondary"
        :disabled="medicalStore.isLoading"
        @click="handleCancel"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="medicalStore.isLoading"
      >
        <span
          v-if="medicalStore.isLoading"
          class="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        />
        {{ isEditMode ? 'Guardar cambios' : 'Guardar registro' }}
      </button>
    </div>
  </form>
</template>
