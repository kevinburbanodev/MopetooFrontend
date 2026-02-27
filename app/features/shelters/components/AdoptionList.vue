<script setup lang="ts">
// AdoptionList — grid of AdoptionPetCard components with client-side filters.
// Receives a shelterId; the parent (ShelterDetail) must have already fetched
// the adoption pets via useShelters before mounting this component.
// This component reads from the store directly — no extra fetch here.

const props = defineProps<{
  shelterId: string
}>()

const { sheltersStore } = useShelters()

// ── Client-side filters ────────────────────────────────────
const selectedSpecies = ref('')
const selectedGender = ref('')
const selectedSize = ref('')
const selectedStatus = ref('')

const SPECIES_OPTIONS = [
  { value: '', label: 'Todas las especies' },
  { value: 'dog', label: 'Perros' },
  { value: 'cat', label: 'Gatos' },
  { value: 'bird', label: 'Aves' },
  { value: 'rabbit', label: 'Conejos' },
  { value: 'other', label: 'Otros' },
]

const GENDER_OPTIONS = [
  { value: '', label: 'Cualquier sexo' },
  { value: 'male', label: 'Macho' },
  { value: 'female', label: 'Hembra' },
  { value: 'unknown', label: 'Desconocido' },
]

const SIZE_OPTIONS = [
  { value: '', label: 'Cualquier tamaño' },
  { value: 'small', label: 'Pequeño' },
  { value: 'medium', label: 'Mediano' },
  { value: 'large', label: 'Grande' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Todos los estados' },
  { value: 'available', label: 'Disponible' },
  { value: 'pending', label: 'En proceso' },
  { value: 'adopted', label: 'Adoptado' },
]

const filteredPets = computed(() => {
  // Only show pets belonging to this shelter
  let result = sheltersStore.adoptionPets.filter(
    p => p.shelter_id === props.shelterId,
  )

  if (selectedSpecies.value) {
    result = result.filter(p => p.species === selectedSpecies.value)
  }
  if (selectedGender.value) {
    result = result.filter(p => p.gender === selectedGender.value)
  }
  if (selectedSize.value) {
    result = result.filter(p => p.size === selectedSize.value)
  }
  if (selectedStatus.value) {
    result = result.filter(p => p.status === selectedStatus.value)
  }

  return result
})

const hasActiveFilters = computed(() =>
  selectedSpecies.value !== ''
  || selectedGender.value !== ''
  || selectedSize.value !== ''
  || selectedStatus.value !== '',
)

function clearFilters(): void {
  selectedSpecies.value = ''
  selectedGender.value = ''
  selectedSize.value = ''
  selectedStatus.value = ''
}

const SKELETON_COUNT = 3
</script>

<template>
  <div aria-label="Mascotas en adopción">
    <!-- Filters -->
    <div class="card border-0 shadow-sm mb-4 p-3">
      <div class="row g-2">
        <div class="col-6 col-md-3">
          <label :for="`adoption-species-${shelterId}`" class="form-label small fw-semibold text-muted mb-1">
            Especie
          </label>
          <select
            :id="`adoption-species-${shelterId}`"
            v-model="selectedSpecies"
            class="form-select form-select-sm"
          >
            <option v-for="opt in SPECIES_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="col-6 col-md-3">
          <label :for="`adoption-gender-${shelterId}`" class="form-label small fw-semibold text-muted mb-1">
            Sexo
          </label>
          <select
            :id="`adoption-gender-${shelterId}`"
            v-model="selectedGender"
            class="form-select form-select-sm"
          >
            <option v-for="opt in GENDER_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="col-6 col-md-3">
          <label :for="`adoption-size-${shelterId}`" class="form-label small fw-semibold text-muted mb-1">
            Tamaño
          </label>
          <select
            :id="`adoption-size-${shelterId}`"
            v-model="selectedSize"
            class="form-select form-select-sm"
          >
            <option v-for="opt in SIZE_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div class="col-6 col-md-3">
          <label :for="`adoption-status-${shelterId}`" class="form-label small fw-semibold text-muted mb-1">
            Estado
          </label>
          <select
            :id="`adoption-status-${shelterId}`"
            v-model="selectedStatus"
            class="form-select form-select-sm"
          >
            <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="hasActiveFilters" class="mt-2 text-end">
        <button
          type="button"
          class="btn btn-link btn-sm p-0 text-muted text-decoration-none"
          @click="clearFilters"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="sheltersStore.isLoading"
      class="row g-4"
      aria-busy="true"
      aria-label="Cargando mascotas"
    >
      <div
        v-for="n in SKELETON_COUNT"
        :key="n"
        class="col-12 col-md-6 col-lg-4"
      >
        <div class="card border-0 shadow-sm h-100 adoption-skeleton" aria-hidden="true">
          <div class="adoption-skeleton__photo skeleton-pulse" />
          <div class="card-body p-3 d-flex flex-column gap-2">
            <div class="skeleton-pulse rounded adoption-skeleton__title" />
            <div class="skeleton-pulse rounded adoption-skeleton__subtitle" />
            <div class="d-flex gap-1">
              <div class="skeleton-pulse rounded adoption-skeleton__badge" />
              <div class="skeleton-pulse rounded adoption-skeleton__badge" />
              <div class="skeleton-pulse rounded adoption-skeleton__badge" />
            </div>
          </div>
          <div class="card-footer bg-transparent border-top-0 px-3 pb-3 pt-0">
            <div class="skeleton-pulse rounded adoption-skeleton__btn" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state — no pets in this shelter at all -->
    <div
      v-else-if="sheltersStore.adoptionPets.length === 0"
      class="adoption-empty text-center py-4"
    >
      <div class="adoption-empty__illustration" aria-hidden="true">🐾</div>
      <h3 class="h6 fw-bold mt-3 mb-2">Sin mascotas disponibles</h3>
      <p class="text-muted small mb-0">
        Este refugio todavía no tiene mascotas registradas para adopción.
      </p>
    </div>

    <!-- Empty state — filters returned no results -->
    <div
      v-else-if="filteredPets.length === 0"
      class="adoption-empty text-center py-4"
    >
      <div class="adoption-empty__illustration" aria-hidden="true">🔍</div>
      <h3 class="h6 fw-bold mt-3 mb-2">Sin resultados con estos filtros</h3>
      <button type="button" class="btn btn-sm btn-outline-secondary" @click="clearFilters">
        Ver todas las mascotas
      </button>
    </div>

    <!-- Pets grid -->
    <div v-else class="row g-4">
      <div
        v-for="pet in filteredPets"
        :key="pet.id"
        class="col-12 col-md-6 col-lg-4"
      >
        <AdoptionPetCard :pet="pet" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
// ── Empty state ───────────────────────────────────────────────
.adoption-empty {
  &__illustration {
    font-size: 3.5rem;
    line-height: 1;
    display: block;
    animation: adoption-bounce 2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

@keyframes adoption-bounce {
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

.adoption-skeleton {
  border-radius: var(--bs-border-radius-lg);

  &__photo {
    height: 180px;
    border-radius: var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0;
  }

  &__title {
    height: 1rem;
    width: 60%;
  }

  &__subtitle {
    height: 0.75rem;
    width: 40%;
  }

  &__badge {
    height: 1.25rem;
    width: 4rem;
    border-radius: var(--bs-border-radius-pill) !important;
  }

  &__btn {
    height: 2rem;
    width: 100%;
  }
}
</style>
