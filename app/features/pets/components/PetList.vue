<script setup lang="ts">
// PetList — responsive grid of PetCard components.
// Owns the empty-state and loading-skeleton states.
// Delegates select/edit/delete events to the parent page.

import type { Pet } from '../types'

defineProps<{
  pets: Pet[]
  isLoading: boolean
}>()

const emit = defineEmits<{
  'select-pet': [pet: Pet]
  'edit-pet': [pet: Pet]
  'delete-pet': [id: string]
}>()

// Number of skeleton cards to show during load — matches the default grid density
const SKELETON_COUNT = 6
</script>

<template>
  <section aria-label="Lista de mascotas">
    <!-- Loading skeleton grid -->
    <div v-if="isLoading" class="row g-4" aria-busy="true" aria-label="Cargando mascotas">
      <div
        v-for="n in SKELETON_COUNT"
        :key="n"
        class="col-12 col-sm-6 col-lg-4"
      >
        <div class="card border-0 shadow-sm h-100 pet-skeleton" aria-hidden="true">
          <div class="card-header border-0 bg-transparent pt-3 pb-0 d-flex align-items-center gap-3">
            <div class="pet-skeleton__avatar skeleton-pulse rounded-circle" />
            <div class="flex-grow-1">
              <div class="skeleton-pulse rounded mb-1 pet-skeleton__title" />
              <div class="skeleton-pulse rounded pet-skeleton__badge" />
            </div>
          </div>
          <div class="card-body pt-2">
            <div class="skeleton-pulse rounded mb-2 pet-skeleton__line" />
            <div class="skeleton-pulse rounded mb-2 pet-skeleton__line pet-skeleton__line--short" />
            <div class="skeleton-pulse rounded pet-skeleton__line pet-skeleton__line--shorter" />
          </div>
          <div class="card-footer bg-transparent border-top d-flex gap-2 pt-2 pb-3">
            <div class="skeleton-pulse rounded pet-skeleton__btn flex-fill" />
            <div class="skeleton-pulse rounded pet-skeleton__btn" />
            <div class="skeleton-pulse rounded pet-skeleton__btn" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else-if="pets.length === 0"
      class="pet-empty text-center py-5"
    >
      <div class="pet-empty__illustration" aria-hidden="true">🐾</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Aún no tienes mascotas registradas</h2>
      <p class="text-muted mb-4">
        Agrega a tu primer compañero y lleva un registro de su salud, peso y recordatorios.
      </p>
      <NuxtLink to="/dashboard/pets/new" class="btn btn-primary px-4">
        Agregar primera mascota
      </NuxtLink>
    </div>

    <!-- Pet grid -->
    <div v-else class="row g-4">
      <div
        v-for="pet in pets"
        :key="pet.id"
        class="col-12 col-sm-6 col-lg-4"
      >
        <PetCard
          :pet="pet"
          @select-pet="emit('select-pet', $event)"
          @edit-pet="emit('edit-pet', $event)"
          @delete-pet="emit('delete-pet', $event)"
        />
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
// ── Empty state ───────────────────────────────────────────────
.pet-empty {
  &__illustration {
    font-size: 4rem;
    line-height: 1;
    display: block;
    // Gentle bounce animation to draw attention without being distracting
    animation: pet-bounce 2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

@keyframes pet-bounce {
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

.pet-skeleton {
  border-radius: var(--bs-border-radius-lg);

  &__avatar {
    width: 64px;
    height: 64px;
    flex-shrink: 0;
  }

  &__title {
    height: 1rem;
    width: 60%;
  }

  &__badge {
    height: 0.75rem;
    width: 40%;
  }

  &__line {
    height: 0.75rem;
    width: 100%;

    &--short { width: 70%; }
    &--shorter { width: 50%; }
  }

  &__btn {
    height: 2rem;
    min-width: 2.5rem;
  }
}
</style>
