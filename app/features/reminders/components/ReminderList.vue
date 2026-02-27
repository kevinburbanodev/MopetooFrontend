<script setup lang="ts">
// ReminderList — responsive grid of ReminderCard components.
// Owns the filter bar, empty-state, and loading-skeleton states.
// Delegates edit/delete events to the parent page.

import type { Reminder, ReminderType } from '../types'
import type { Pet } from '../../pets/types'

const props = defineProps<{
  reminders: Reminder[]
  isLoading: boolean
  pets: Pet[]
}>()

const emit = defineEmits<{
  'edit-reminder': [reminder: Reminder]
  'delete-reminder': [id: number]
}>()

// Number of skeleton cards during load
const SKELETON_COUNT = 6

// ── Filters ───────────────────────────────────────────────────
// filterPetId uses Pet.id (string) so comparison is consistent
const filterPetId = ref<string | null>(null)
const filterType = ref<ReminderType | null>(null)

const TYPE_OPTIONS: { value: ReminderType; label: string }[] = [
  { value: 'vacuna', label: 'Vacuna' },
  { value: 'medicina', label: 'Medicina' },
  { value: 'baño', label: 'Baño' },
  { value: 'visita', label: 'Visita vet.' },
  { value: 'otro', label: 'Otro' },
]

const hasActiveFilters = computed(
  () => filterPetId.value !== null || filterType.value !== null,
)

const filteredReminders = computed(() => {
  let list = props.reminders
  if (filterPetId.value !== null) {
    // reminder.pet_id is number; Pet.id is string — convert for comparison
    list = list.filter(r => String(r.pet_id) === filterPetId.value)
  }
  if (filterType.value !== null) {
    list = list.filter(r => r.type === filterType.value)
  }
  // Sort by scheduled_date ascending (soonest first)
  return [...list].sort(
    (a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime(),
  )
})

function getPetName(petId: number): string | undefined {
  return props.pets.find(p => String(p.id) === String(petId))?.name
}

function clearFilters(): void {
  filterPetId.value = null
  filterType.value = null
}
</script>

<template>
  <section aria-label="Lista de recordatorios">
    <!-- Filter bar — only show when there's data or active filters -->
    <div
      v-if="!isLoading && (reminders.length > 0 || hasActiveFilters)"
      class="d-flex flex-wrap gap-3 mb-4 align-items-center"
    >
      <!-- Pet filter -->
      <div class="d-flex align-items-center gap-2">
        <label for="filter-reminder-pet" class="form-label mb-0 small fw-semibold text-muted text-nowrap">
          Mascota
        </label>
        <select
          id="filter-reminder-pet"
          v-model="filterPetId"
          class="form-select form-select-sm"
          style="min-width: 140px"
        >
          <option :value="null">Todas</option>
          <option v-for="pet in pets" :key="pet.id" :value="pet.id">
            {{ pet.name }}
          </option>
        </select>
      </div>

      <!-- Type filter -->
      <div class="d-flex align-items-center gap-2">
        <label for="filter-reminder-type" class="form-label mb-0 small fw-semibold text-muted text-nowrap">
          Tipo
        </label>
        <select
          id="filter-reminder-type"
          v-model="filterType"
          class="form-select form-select-sm"
          style="min-width: 140px"
        >
          <option :value="null">Todos</option>
          <option v-for="opt in TYPE_OPTIONS" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>

      <!-- Clear filters -->
      <button
        v-if="hasActiveFilters"
        type="button"
        class="btn btn-sm btn-link text-muted p-0 text-decoration-none"
        @click="clearFilters"
      >
        Limpiar filtros ✕
      </button>
    </div>

    <!-- Loading skeleton grid -->
    <div
      v-if="isLoading"
      class="row g-4"
      aria-busy="true"
      aria-label="Cargando recordatorios"
    >
      <div
        v-for="n in SKELETON_COUNT"
        :key="n"
        class="col-12 col-sm-6 col-lg-4"
      >
        <div class="card border-0 shadow-sm h-100 reminder-skeleton" aria-hidden="true">
          <div class="card-header border-0 bg-transparent pt-3 pb-0 d-flex align-items-center gap-2">
            <div class="reminder-skeleton__icon skeleton-pulse rounded" />
            <div class="reminder-skeleton__badge skeleton-pulse rounded" />
          </div>
          <div class="card-body pt-2">
            <div class="skeleton-pulse rounded mb-2 reminder-skeleton__title" />
            <div class="skeleton-pulse rounded mb-2 reminder-skeleton__line" />
            <div class="skeleton-pulse rounded reminder-skeleton__line reminder-skeleton__line--short" />
          </div>
          <div class="card-footer bg-transparent border-top d-flex gap-2 pt-2 pb-3">
            <div class="skeleton-pulse rounded reminder-skeleton__btn flex-fill" />
            <div class="skeleton-pulse rounded reminder-skeleton__btn" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state — no reminders at all -->
    <div
      v-else-if="reminders.length === 0"
      class="reminder-empty text-center py-5"
    >
      <div class="reminder-empty__illustration" aria-hidden="true">🔔</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Sin recordatorios registrados</h2>
      <p class="text-muted mb-4">
        Crea recordatorios para vacunas, medicinas, baños y visitas veterinarias.
      </p>
      <NuxtLink to="/dashboard/reminders/new" class="btn btn-primary px-4">
        Crear primer recordatorio
      </NuxtLink>
    </div>

    <!-- Empty state — filters return no results -->
    <div
      v-else-if="filteredReminders.length === 0"
      class="text-center py-5 text-muted"
    >
      <p class="mb-2">No hay recordatorios con los filtros seleccionados.</p>
      <button type="button" class="btn btn-sm btn-link p-0" @click="clearFilters">
        Ver todos los recordatorios
      </button>
    </div>

    <!-- Reminder grid -->
    <div v-else class="row g-4">
      <div
        v-for="reminder in filteredReminders"
        :key="reminder.id"
        class="col-12 col-sm-6 col-lg-4"
      >
        <ReminderCard
          :reminder="reminder"
          :pet-name="getPetName(reminder.pet_id)"
          @edit-reminder="emit('edit-reminder', $event)"
          @delete-reminder="emit('delete-reminder', $event)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
// ── Empty state ───────────────────────────────────────────────
.reminder-empty {
  &__illustration {
    font-size: 4rem;
    line-height: 1;
    display: block;
    animation: reminder-bounce 2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

@keyframes reminder-bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

// ── Skeleton shimmer ──────────────────────────────────────────
.skeleton-pulse {
  background: linear-gradient(
    90deg,
    var(--bs-secondary-bg) 25%,
    var(--bs-tertiary-bg, #e8e8e8) 50%,
    var(--bs-secondary-bg) 75%
  );
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: var(--bs-secondary-bg);
  }
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.reminder-skeleton {
  border-radius: var(--bs-border-radius-lg);

  &__icon {
    width: 2rem;
    height: 2rem;
    flex-shrink: 0;
  }

  &__badge {
    height: 1.25rem;
    width: 5rem;
  }

  &__title {
    height: 1rem;
    width: 80%;
  }

  &__line {
    height: 0.75rem;
    width: 100%;

    &--short { width: 60%; }
  }

  &__btn {
    height: 2rem;
    min-width: 2.5rem;
  }
}
</style>
