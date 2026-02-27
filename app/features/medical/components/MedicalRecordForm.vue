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
  date: props.record?.date ?? '',
  veterinarian: props.record?.veterinarian ?? '',
  diagnosis: props.record?.diagnosis ?? '',
  treatment: props.record?.treatment ?? '',
  notes: props.record?.notes ?? '',
  // Keep weight as a string in the input; convert on submit
  weight: props.record?.weight !== undefined ? String(props.record.weight) : '',
  next_visit: props.record?.next_visit ?? '',
})

// ── Validation ────────────────────────────────────────────────
const submitted = ref(false)

const isDateValid = computed(() => !!form.date)
const isVeterinarianValid = computed(() => form.veterinarian.trim().length >= 2)
const isDiagnosisValid = computed(() => form.diagnosis.trim().length >= 2)
const isTreatmentValid = computed(() => form.treatment.trim().length >= 2)
const isWeightValid = computed(() => {
  if (!form.weight) return true // Optional field
  const n = parseFloat(form.weight)
  return !isNaN(n) && n >= 0 && n <= 200
})

const isFormValid = computed(
  () =>
    isDateValid.value &&
    isVeterinarianValid.value &&
    isDiagnosisValid.value &&
    isTreatmentValid.value &&
    isWeightValid.value,
)

// ── Submit ────────────────────────────────────────────────────
async function handleSubmit(): Promise<void> {
  submitted.value = true
  if (!isFormValid.value) return

  const dto: CreateMedicalRecordDTO = {
    date: form.date,
    veterinarian: form.veterinarian.trim(),
    diagnosis: form.diagnosis.trim(),
    treatment: form.treatment.trim(),
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
    ...(form.weight ? { weight: parseFloat(form.weight) } : {}),
    ...(form.next_visit ? { next_visit: form.next_visit } : {}),
  }

  let result: MedicalRecord | null = null

  if (isEditMode.value && props.record) {
    result = await updateMedicalRecord(props.petId, props.record.id, dto)
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

    <!-- Veterinarian (required) -->
    <div class="mb-3">
      <label for="medical-vet" class="form-label fw-semibold">
        Veterinario <span class="text-danger" aria-hidden="true">*</span>
      </label>
      <input
        id="medical-vet"
        v-model="form.veterinarian"
        type="text"
        class="form-control"
        :class="{
          'is-invalid': submitted && !isVeterinarianValid,
          'is-valid': submitted && isVeterinarianValid,
        }"
        placeholder="Nombre del veterinario o clínica"
        maxlength="150"
        required
        aria-required="true"
      >
      <div v-if="submitted && !isVeterinarianValid" class="invalid-feedback">
        El nombre del veterinario debe tener al menos 2 caracteres.
      </div>
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
    <div class="mb-3">
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

    <!-- Weight (optional) -->
    <div class="mb-3">
      <label for="medical-weight" class="form-label fw-semibold">
        Peso en la visita (kg)
      </label>
      <input
        id="medical-weight"
        v-model="form.weight"
        type="number"
        class="form-control"
        :class="{
          'is-invalid': submitted && !isWeightValid,
          'is-valid': submitted && !!form.weight && isWeightValid,
        }"
        min="0"
        max="200"
        step="0.1"
        placeholder="Ej: 4.5"
        aria-describedby="medical-weight-hint"
      >
      <div id="medical-weight-hint" class="form-text">Opcional. Entre 0 y 200 kg.</div>
      <div v-if="submitted && !isWeightValid" class="invalid-feedback">
        El peso debe estar entre 0 y 200 kg.
      </div>
    </div>

    <!-- Next visit (optional) -->
    <div class="mb-4">
      <label for="medical-next-visit" class="form-label fw-semibold">
        Próxima visita
      </label>
      <input
        id="medical-next-visit"
        v-model="form.next_visit"
        type="date"
        class="form-control"
        aria-describedby="medical-next-visit-hint"
      >
      <div id="medical-next-visit-hint" class="form-text">
        Opcional. Si se establece, aparecerá un recordatorio de fecha en el historial.
      </div>
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
