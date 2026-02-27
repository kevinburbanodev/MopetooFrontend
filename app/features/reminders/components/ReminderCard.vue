<script setup lang="ts">
// ReminderCard — compact card showing a single reminder.
// Displays type, title, scheduled date, and optional pet name.
// Events bubble up to ReminderList so the parent owns navigation and deletion.

import type { Reminder, ReminderType } from '../types'

const props = defineProps<{
  reminder: Reminder
  petName?: string
}>()

const emit = defineEmits<{
  'edit-reminder': [reminder: Reminder]
  'delete-reminder': [id: number]
}>()

// ── Display maps ─────────────────────────────────────────────
const TYPE_LABEL: Record<ReminderType, string> = {
  vacuna: 'Vacuna',
  medicina: 'Medicina',
  baño: 'Baño',
  visita: 'Visita vet.',
  otro: 'Otro',
}

const TYPE_ICON: Record<ReminderType, string> = {
  vacuna: '💉',
  medicina: '💊',
  baño: '🛁',
  visita: '🏥',
  otro: '📌',
}

const TYPE_COLOR: Record<ReminderType, string> = {
  vacuna: 'success',
  medicina: 'warning',
  baño: 'info',
  visita: 'primary',
  otro: 'secondary',
}

const RECURRENCE_LABEL: Record<string, string> = {
  once: 'Una vez',
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
}

const typeLabel = computed(() => TYPE_LABEL[props.reminder.type])
const typeIcon = computed(() => TYPE_ICON[props.reminder.type])
const typeColor = computed(() => TYPE_COLOR[props.reminder.type])
const recurrenceLabel = computed(() =>
  props.reminder.recurrence ? RECURRENCE_LABEL[props.reminder.recurrence] : null,
)

const isPast = computed(() => new Date(props.reminder.scheduled_date) < new Date())

function formatDate(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('es', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const formattedDate = computed(() => formatDate(props.reminder.scheduled_date))

function handleEdit(event: Event): void {
  event.stopPropagation()
  emit('edit-reminder', props.reminder)
}

function handleDelete(event: Event): void {
  event.stopPropagation()
  emit('delete-reminder', props.reminder.id)
}
</script>

<template>
  <article
    class="card h-100 border-0 shadow-sm reminder-card"
    :class="{ 'reminder-card--past': isPast }"
    :aria-label="`Recordatorio: ${reminder.title}`"
  >
    <!-- Type badge header -->
    <div class="card-header border-0 bg-transparent pt-3 pb-0 d-flex align-items-center gap-2 flex-wrap">
      <span class="fs-4" aria-hidden="true">{{ typeIcon }}</span>
      <span :class="`badge bg-${typeColor}-subtle text-${typeColor}-emphasis fw-normal`">
        {{ typeLabel }}
      </span>
      <span
        v-if="recurrenceLabel"
        class="badge bg-body-secondary text-body-secondary fw-normal small ms-1"
      >
        🔁 {{ recurrenceLabel }}
      </span>
      <span
        v-if="isPast"
        class="badge bg-danger-subtle text-danger-emphasis ms-auto small"
      >
        Vencido
      </span>
    </div>

    <!-- Body -->
    <div class="card-body pt-2 pb-1">
      <h2 class="h6 fw-bold mb-2 reminder-card__title">{{ reminder.title }}</h2>
      <ul class="list-unstyled small text-muted mb-0 reminder-card__meta">
        <li class="d-flex align-items-center gap-1">
          <span aria-hidden="true">📅</span>
          <time
            :datetime="reminder.scheduled_date"
            :class="{ 'text-danger fw-semibold': isPast }"
          >{{ formattedDate }}</time>
        </li>
        <li v-if="petName" class="d-flex align-items-center gap-1">
          <span aria-hidden="true">🐾</span>
          <span class="text-truncate">{{ petName }}</span>
        </li>
        <li v-if="reminder.notes" class="d-flex align-items-center gap-1">
          <span aria-hidden="true">📝</span>
          <span class="reminder-card__notes text-truncate">{{ reminder.notes }}</span>
        </li>
      </ul>
    </div>

    <!-- Action footer -->
    <div class="card-footer bg-transparent border-top d-flex gap-2 pt-2 pb-3">
      <button
        type="button"
        class="btn btn-sm btn-outline-primary flex-fill"
        :aria-label="`Editar recordatorio: ${reminder.title}`"
        @click="handleEdit"
      >
        Editar
      </button>
      <button
        type="button"
        class="btn btn-sm btn-outline-danger"
        :aria-label="`Eliminar recordatorio: ${reminder.title}`"
        @click="handleDelete"
      >
        <span aria-hidden="true">🗑</span>
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
.reminder-card {
  border-radius: var(--bs-border-radius-lg);
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &--past {
    opacity: 0.85;
    border-left: 3px solid var(--bs-danger) !important;
  }

  &__title {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__notes {
    max-width: 100%;
    display: block;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
}
</style>
