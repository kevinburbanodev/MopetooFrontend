<script setup lang="ts">
// MedicalRecordCard — compact card for a single medical record.
// Shows: date, veterinarian, diagnosis, treatment, optional notes (truncated),
// optional weight, and optional next_visit (with overdue badge).
// Two-step inline delete confirmation — no modal needed.
// Edit action emits up to the parent; parent owns navigation.

import type { MedicalRecord } from '../types'

const props = defineProps<{
  record: MedicalRecord
  petId: string
}>()

const emit = defineEmits<{
  'delete-record': [id: string]
}>()

// ── Date helpers ──────────────────────────────────────────────

function formatDate(iso: string | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const formattedDate = computed(() => formatDate(props.record.date))
const formattedNextVisit = computed(() => formatDate(props.record.next_visit))

/**
 * A next_visit is overdue when it is in the past and has not been cleared.
 * We compare ISO date strings at day-level precision to avoid timezone issues.
 */
const isNextVisitOverdue = computed(() => {
  if (!props.record.next_visit) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const visitDate = new Date(props.record.next_visit)
  visitDate.setHours(0, 0, 0, 0)
  return visitDate < today
})

// ── Two-step delete confirmation ───────────────────────────────
const confirmingDelete = ref(false)

function requestDelete(): void {
  confirmingDelete.value = true
}

function cancelDelete(): void {
  confirmingDelete.value = false
}

function confirmDelete(): void {
  confirmingDelete.value = false
  emit('delete-record', props.record.id)
}
</script>

<template>
  <article
    class="card h-100 border-0 shadow-sm medical-record-card"
    :aria-label="`Registro médico del ${formattedDate}`"
  >
    <!-- Card header: date + veterinarian badge -->
    <div class="card-header border-0 bg-transparent pt-3 pb-0 d-flex align-items-start gap-2 flex-wrap">
      <div class="d-flex flex-column gap-1 flex-grow-1">
        <time
          :datetime="record.date"
          class="fw-bold text-body small"
        >
          {{ formattedDate }}
        </time>
        <span class="badge bg-info text-dark fw-normal text-truncate" style="max-width: 100%;">
          {{ record.veterinarian }}
        </span>
      </div>

      <!-- Weight badge -->
      <span
        v-if="record.weight !== undefined"
        class="badge bg-secondary-subtle text-secondary-emphasis fw-normal"
        :title="`Peso en la visita: ${record.weight} kg`"
      >
        {{ record.weight }} kg
      </span>
    </div>

    <!-- Card body: diagnosis, treatment, notes -->
    <div class="card-body pt-2 pb-1">
      <!-- Diagnosis -->
      <div class="mb-2">
        <p class="text-muted small mb-0 text-uppercase fw-semibold" style="letter-spacing: 0.04em;">
          Diagnóstico
        </p>
        <p class="mb-0 medical-record-card__clamp">{{ record.diagnosis }}</p>
      </div>

      <!-- Treatment -->
      <div class="mb-2">
        <p class="text-muted small mb-0 text-uppercase fw-semibold" style="letter-spacing: 0.04em;">
          Tratamiento
        </p>
        <p class="mb-0 medical-record-card__clamp">{{ record.treatment }}</p>
      </div>

      <!-- Notes — truncated, only shown if present -->
      <div v-if="record.notes" class="mb-2">
        <p class="text-muted small mb-0 text-uppercase fw-semibold" style="letter-spacing: 0.04em;">
          Notas
        </p>
        <p class="mb-0 text-muted small medical-record-card__clamp">{{ record.notes }}</p>
      </div>

      <!-- Next visit badge -->
      <div v-if="record.next_visit" class="mt-2">
        <span
          :class="[
            'badge fw-normal',
            isNextVisitOverdue ? 'bg-danger' : 'bg-warning text-dark',
          ]"
          :aria-label="isNextVisitOverdue ? `Próxima visita vencida: ${formattedNextVisit}` : `Próxima visita: ${formattedNextVisit}`"
        >
          <span aria-hidden="true">{{ isNextVisitOverdue ? '⚠' : '📅' }}</span>
          Próxima visita: {{ formattedNextVisit }}
          <span v-if="isNextVisitOverdue" class="ms-1">(Vencida)</span>
        </span>
      </div>
    </div>

    <!-- Card footer: actions -->
    <div class="card-footer bg-transparent border-top d-flex gap-2 pt-2 pb-3 flex-wrap">
      <!-- Edit — NuxtLink navigates to the edit form -->
      <NuxtLink
        :to="`/dashboard/medical/${petId}/record/${record.id}/edit`"
        class="btn btn-sm btn-outline-primary flex-fill"
        :aria-label="`Editar registro del ${formattedDate}`"
      >
        Editar
      </NuxtLink>

      <!-- Delete — two-step inline confirmation -->
      <template v-if="!confirmingDelete">
        <button
          type="button"
          class="btn btn-sm btn-outline-danger"
          :aria-label="`Eliminar registro del ${formattedDate}`"
          @click="requestDelete"
        >
          <span aria-hidden="true">🗑</span>
        </button>
      </template>
      <template v-else>
        <div class="d-flex align-items-center gap-2 w-100 flex-wrap">
          <span class="small text-danger fw-semibold">¿Estás seguro?</span>
          <button
            type="button"
            class="btn btn-sm btn-danger"
            @click="confirmDelete"
          >
            Sí, eliminar
          </button>
          <button
            type="button"
            class="btn btn-sm btn-outline-secondary"
            @click="cancelDelete"
          >
            Cancelar
          </button>
        </div>
      </template>
    </div>
  </article>
</template>

<style scoped lang="scss">
.medical-record-card {
  border-radius: var(--bs-border-radius-lg);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &__clamp {
    // Limit to 3 lines with ellipsis
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
