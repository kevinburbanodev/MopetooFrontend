<script setup lang="ts">
// PetCard — compact card summarising a pet with quick actions.
// Uses PetAvatar for the photo/fallback and usePetAge for age display.
// Events bubble up to PetList so the parent owns navigation and deletion.

import type { Pet } from '../types'

const props = defineProps<{
  pet: Pet
}>()

const emit = defineEmits<{
  'select-pet': [pet: Pet]
  'edit-pet': [pet: Pet]
  'delete-pet': [id: string]
}>()

const { formatAge } = usePetAge()

// ── Species label map (backend values → Spanish display) ─────
const SPECIES_LABEL: Record<string, string> = {
  dog: 'Perro',
  cat: 'Gato',
  bird: 'Pájaro',
  rabbit: 'Conejo',
  other: 'Otro',
}

const GENDER_LABEL: Record<string, string> = {
  male: 'Macho',
  female: 'Hembra',
}

const speciesLabel = computed(() => SPECIES_LABEL[props.pet.species] ?? props.pet.species)
const genderLabel = computed(() => GENDER_LABEL[props.pet.gender] ?? props.pet.gender)
const age = computed(() => formatAge(props.pet.birth_date))

function handleSelect(): void {
  emit('select-pet', props.pet)
}
function handleEdit(event: Event): void {
  event.stopPropagation()
  emit('edit-pet', props.pet)
}
function handleDelete(event: Event): void {
  event.stopPropagation()
  emit('delete-pet', props.pet.id)
}
</script>

<template>
  <article
    class="card h-100 border-0 shadow-sm pet-card"
    tabindex="0"
    :aria-label="`Ver detalle de ${pet.name}`"
    @click="handleSelect"
    @keydown.enter="handleSelect"
    @keydown.space.prevent="handleSelect"
  >
    <!-- Header with avatar + species badge -->
    <div class="card-header border-0 bg-transparent pt-3 pb-0 d-flex align-items-center gap-3">
      <PetAvatar :pet="pet" size="md" />
      <div class="min-w-0">
        <h2 class="h6 fw-bold mb-0 text-truncate">{{ pet.name }}</h2>
        <span class="badge bg-primary-subtle text-primary-emphasis fw-normal">
          {{ speciesLabel }}
        </span>
      </div>
    </div>

    <!-- Body with key info -->
    <div class="card-body pt-2 pb-1">
      <ul class="list-unstyled small text-muted mb-0 pet-card__meta">
        <li v-if="pet.breed" class="d-flex align-items-center gap-1">
          <span aria-hidden="true">🐾</span>
          <span class="text-truncate">{{ pet.breed }}</span>
        </li>
        <li class="d-flex align-items-center gap-1">
          <span aria-hidden="true">🎂</span>
          <span>{{ age }}</span>
        </li>
        <li v-if="pet.gender" class="d-flex align-items-center gap-1">
          <span aria-hidden="true">{{ pet.gender === 'male' ? '♂' : '♀' }}</span>
          <span>{{ genderLabel }}</span>
        </li>
        <li v-if="pet.weight" class="d-flex align-items-center gap-1">
          <span aria-hidden="true">⚖️</span>
          <span>{{ pet.weight }} kg</span>
        </li>
        <li v-if="pet.color" class="d-flex align-items-center gap-1">
          <span aria-hidden="true">🎨</span>
          <span class="text-truncate">{{ pet.color }}</span>
        </li>
      </ul>
      <p v-if="pet.notes" class="small text-muted mt-2 mb-0 pet-card__notes">
        {{ pet.notes }}
      </p>
    </div>

    <!-- Action footer -->
    <div class="card-footer bg-transparent border-top d-flex gap-2 pt-2 pb-3">
      <button
        type="button"
        class="btn btn-sm btn-outline-primary flex-fill"
        :aria-label="`Ver detalle de ${pet.name}`"
        @click.stop="handleSelect"
      >
        Ver detalle
      </button>
      <button
        type="button"
        class="btn btn-sm btn-outline-secondary"
        :aria-label="`Editar ${pet.name}`"
        @click="handleEdit"
      >
        Editar
      </button>
      <button
        type="button"
        class="btn btn-sm btn-outline-danger"
        :aria-label="`Eliminar ${pet.name}`"
        @click="handleDelete"
      >
        <span aria-hidden="true">🗑</span>
      </button>
    </div>
  </article>
</template>

<style scoped lang="scss">
.pet-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  border-radius: var(--bs-border-radius-lg);

  &:hover,
  &:focus-visible {
    transform: translateY(-3px);
    box-shadow: var(--bs-box-shadow-lg) !important;
    outline: 2px solid var(--bs-primary);
    outline-offset: 2px;
  }

  &__meta {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  &__notes {
    // Clamp to two lines to keep cards uniform height
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
