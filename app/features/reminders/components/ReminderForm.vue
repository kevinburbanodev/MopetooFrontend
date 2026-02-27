<script setup lang="ts">
// ReminderForm — create / edit form for a reminder.
// In create mode: all fields empty (or pre-set to first pet).
// In edit mode: all fields pre-populated from the `reminder` prop.
// Emits a typed submit payload so the parent page handles API calls.

import type { CreateReminderPayload, ReminderType, RecurrenceType, Reminder } from '../types'
import type { Pet } from '../../pets/types'

const props = defineProps<{
  /** When provided, the form operates in edit mode with pre-populated fields. */
  reminder?: Reminder
  /** User's pets to populate the pet selector. */
  pets: Pet[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  submit: [{ data: CreateReminderPayload }]
  cancel: []
}>()

const isEditMode = computed(() => !!props.reminder)

// ── Form state ────────────────────────────────────────────────
const form = reactive({
  pet_id: props.reminder ? String(props.reminder.pet_id) : (props.pets[0]?.id ?? ''),
  type: (props.reminder?.type ?? 'vacuna') as ReminderType,
  title: props.reminder?.title ?? '',
  // datetime-local input expects "YYYY-MM-DDTHH:MM" (16 chars)
  scheduled_date: props.reminder?.scheduled_date
    ? props.reminder.scheduled_date.slice(0, 16)
    : '',
  recurrence: (props.reminder?.recurrence ?? '') as RecurrenceType | '',
  notes: props.reminder?.notes ?? '',
})

// When pets load after the form mounts (empty array → populated), auto-select the first
watch(
  () => props.pets,
  (newPets) => {
    if (!form.pet_id && newPets.length > 0) {
      form.pet_id = newPets[0].id
    }
  },
)

// ── Validation ────────────────────────────────────────────────
const submitted = ref(false)
const isPetIdValid = computed(() => !!form.pet_id)
const isTitleValid = computed(() => form.title.trim().length >= 2)
const isDateValid = computed(() => !!form.scheduled_date)
const isFormValid = computed(() => isPetIdValid.value && isTitleValid.value && isDateValid.value)

// ── Options ───────────────────────────────────────────────────
const TYPE_OPTIONS: { value: ReminderType; label: string; icon: string }[] = [
  { value: 'vacuna', label: 'Vacuna', icon: '💉' },
  { value: 'medicina', label: 'Medicina', icon: '💊' },
  { value: 'baño', label: 'Baño', icon: '🛁' },
  { value: 'visita', label: 'Visita veterinaria', icon: '🏥' },
  { value: 'otro', label: 'Otro', icon: '📌' },
]

const RECURRENCE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: 'once', label: 'Una vez' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'monthly', label: 'Mensual' },
  { value: 'yearly', label: 'Anual' },
]

// ── Submit ────────────────────────────────────────────────────
function handleSubmit(): void {
  submitted.value = true
  if (!isFormValid.value) return

  const payload: CreateReminderPayload = {
    pet_id: Number(form.pet_id),
    type: form.type,
    title: form.title.trim(),
    scheduled_date: form.scheduled_date,
    ...(form.recurrence ? { recurrence: form.recurrence as RecurrenceType } : {}),
    ...(form.notes.trim() ? { notes: form.notes.trim() } : {}),
  }

  emit('submit', { data: payload })
}
</script>

<template>
  <form
    novalidate
    :class="{ 'was-validated': submitted }"
    @submit.prevent="handleSubmit"
  >
    <!-- Pet selector -->
    <div class="mb-3">
      <label for="reminder-pet" class="form-label fw-semibold">
        Mascota <span class="text-danger" aria-hidden="true">*</span>
      </label>
      <select
        id="reminder-pet"
        v-model="form.pet_id"
        class="form-select"
        :class="{
          'is-invalid': submitted && !isPetIdValid,
          'is-valid': submitted && isPetIdValid,
        }"
        required
        aria-required="true"
      >
        <option value="" disabled>Selecciona una mascota</option>
        <option v-for="pet in pets" :key="pet.id" :value="pet.id">
          {{ pet.name }}
        </option>
      </select>
      <div v-if="submitted && !isPetIdValid" class="invalid-feedback">
        Selecciona una mascota.
      </div>
      <div v-if="pets.length === 0" class="form-text text-warning">
        No tienes mascotas registradas.
        <NuxtLink to="/dashboard/pets/new">Agrega una primero.</NuxtLink>
      </div>
    </div>

    <!-- Reminder type -->
    <div class="mb-3">
      <label for="reminder-type" class="form-label fw-semibold">
        Tipo de recordatorio <span class="text-danger" aria-hidden="true">*</span>
      </label>
      <select
        id="reminder-type"
        v-model="form.type"
        class="form-select"
        required
      >
        <option v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">
          {{ opt.icon }} {{ opt.label }}
        </option>
      </select>
    </div>

    <!-- Title -->
    <div class="mb-3">
      <label for="reminder-title" class="form-label fw-semibold">
        Título <span class="text-danger" aria-hidden="true">*</span>
      </label>
      <input
        id="reminder-title"
        v-model="form.title"
        type="text"
        class="form-control"
        :class="{
          'is-invalid': submitted && !isTitleValid,
          'is-valid': submitted && isTitleValid,
        }"
        placeholder="Ej: Vacuna antirrábica, Revisión anual..."
        maxlength="100"
        required
        aria-required="true"
      >
      <div v-if="submitted && !isTitleValid" class="invalid-feedback">
        El título debe tener al menos 2 caracteres.
      </div>
    </div>

    <!-- Scheduled date -->
    <div class="mb-3">
      <label for="reminder-date" class="form-label fw-semibold">
        Fecha y hora <span class="text-danger" aria-hidden="true">*</span>
      </label>
      <input
        id="reminder-date"
        v-model="form.scheduled_date"
        type="datetime-local"
        class="form-control"
        :class="{
          'is-invalid': submitted && !isDateValid,
          'is-valid': submitted && isDateValid,
        }"
        required
        aria-required="true"
      >
      <div v-if="submitted && !isDateValid" class="invalid-feedback">
        Selecciona una fecha y hora.
      </div>
    </div>

    <!-- Recurrence -->
    <div class="mb-3">
      <label for="reminder-recurrence" class="form-label fw-semibold">
        Recurrencia
      </label>
      <select
        id="reminder-recurrence"
        v-model="form.recurrence"
        class="form-select"
      >
        <option value="">Sin recurrencia</option>
        <option v-for="opt in RECURRENCE_OPTIONS" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <div class="form-text">Repetirá automáticamente este recordatorio.</div>
    </div>

    <!-- Notes -->
    <div class="mb-4">
      <label for="reminder-notes" class="form-label fw-semibold">
        Notas
      </label>
      <textarea
        id="reminder-notes"
        v-model="form.notes"
        class="form-control"
        rows="3"
        maxlength="500"
        placeholder="Dosis, veterinario, instrucciones adicionales..."
      />
      <div class="form-text text-end">{{ form.notes.length }}/500</div>
    </div>

    <!-- Actions -->
    <div class="d-flex gap-2 justify-content-end flex-wrap">
      <button
        type="button"
        class="btn btn-outline-secondary"
        :disabled="isLoading"
        @click="emit('cancel')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        class="btn btn-primary"
        :disabled="isLoading"
      >
        <span
          v-if="isLoading"
          class="spinner-border spinner-border-sm me-2"
          role="status"
          aria-hidden="true"
        />
        {{ isEditMode ? 'Guardar cambios' : 'Crear recordatorio' }}
      </button>
    </div>
  </form>
</template>
