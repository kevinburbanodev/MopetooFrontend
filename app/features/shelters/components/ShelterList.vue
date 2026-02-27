<script setup lang="ts">
// ShelterList — public shelter directory.
// Fetches shelters on mount, provides client-side search + species filter,
// displays skeleton loading and empty state.
// All data fetching happens in this component via useShelters.

const { fetchShelters, error, sheltersStore } = useShelters()

// ── Client-side filters ────────────────────────────────────
const searchQuery = ref('')
const selectedSpecies = ref('')

const SPECIES_OPTIONS = [
  { value: '', label: 'Todas las especies' },
  { value: 'dogs', label: 'Perros' },
  { value: 'cats', label: 'Gatos' },
  { value: 'birds', label: 'Aves' },
  { value: 'rabbits', label: 'Conejos' },
  { value: 'other', label: 'Otros' },
]

const filteredShelters = computed(() => {
  let result = sheltersStore.shelters

  // Filter by species (every shelter must include the selected species)
  if (selectedSpecies.value) {
    result = result.filter(s => s.species.includes(selectedSpecies.value))
  }

  // Filter by search term — matches name, city, or description
  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(s =>
      s.name.toLowerCase().includes(q)
      || s.city.toLowerCase().includes(q)
      || s.description.toLowerCase().includes(q),
    )
  }

  return result
})

function clearFilters(): void {
  searchQuery.value = ''
  selectedSpecies.value = ''
}

const hasActiveFilters = computed(() =>
  searchQuery.value.trim() !== '' || selectedSpecies.value !== '',
)

const SKELETON_COUNT = 6

onMounted(async () => {
  await fetchShelters()
})
</script>

<template>
  <section aria-label="Directorio de refugios">
    <!-- Page header -->
    <div class="mb-4">
      <h1 class="h3 fw-bold mb-1">Refugios y Adopciones</h1>
      <p class="text-muted mb-0">
        Encuentra refugios de animales cerca de ti y da un hogar a una mascota que lo necesita.
      </p>
    </div>

    <!-- Filters bar -->
    <div class="card border-0 shadow-sm mb-4 p-3">
      <div class="row g-3 align-items-end">
        <!-- Search input -->
        <div class="col-12 col-md-6">
          <label for="shelter-search" class="form-label small fw-semibold text-muted">
            Buscar refugio
          </label>
          <div class="input-group">
            <span class="input-group-text bg-transparent border-end-0" aria-hidden="true">
              🔍
            </span>
            <input
              id="shelter-search"
              v-model="searchQuery"
              type="search"
              class="form-control border-start-0"
              placeholder="Nombre, ciudad o descripción..."
              aria-label="Buscar refugios"
            />
          </div>
        </div>

        <!-- Species filter -->
        <div class="col-12 col-sm-6 col-md-3">
          <label for="shelter-species" class="form-label small fw-semibold text-muted">
            Especie
          </label>
          <select
            id="shelter-species"
            v-model="selectedSpecies"
            class="form-select"
            aria-label="Filtrar por especie"
          >
            <option
              v-for="opt in SPECIES_OPTIONS"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Clear filters -->
        <div class="col-12 col-sm-6 col-md-3 d-flex align-items-end">
          <button
            v-if="hasActiveFilters"
            type="button"
            class="btn btn-outline-secondary w-100"
            @click="clearFilters"
          >
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">⚠</span>
      {{ error }}
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="sheltersStore.isLoading"
      class="row g-4"
      aria-busy="true"
      aria-label="Cargando refugios"
    >
      <div
        v-for="n in SKELETON_COUNT"
        :key="n"
        class="col-12 col-md-6 col-lg-4"
      >
        <div class="card border-0 shadow-sm h-100 shelter-skeleton" aria-hidden="true">
          <div class="shelter-skeleton__photo skeleton-pulse" />
          <div class="card-body p-3 d-flex flex-column gap-2">
            <div class="skeleton-pulse rounded shelter-skeleton__title" />
            <div class="skeleton-pulse rounded shelter-skeleton__subtitle" />
            <div class="skeleton-pulse rounded shelter-skeleton__line" />
            <div class="skeleton-pulse rounded shelter-skeleton__line shelter-skeleton__line--short" />
            <div class="d-flex gap-1 mt-1">
              <div class="skeleton-pulse rounded shelter-skeleton__badge" />
              <div class="skeleton-pulse rounded shelter-skeleton__badge" />
            </div>
          </div>
          <div class="card-footer bg-transparent border-top-0 px-3 pb-3 pt-0">
            <div class="skeleton-pulse rounded shelter-skeleton__btn" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state — no shelters at all -->
    <div
      v-else-if="sheltersStore.shelters.length === 0"
      class="shelter-empty text-center py-5"
    >
      <div class="shelter-empty__illustration" aria-hidden="true">🏠</div>
      <h2 class="h5 fw-bold mt-4 mb-2">No hay refugios disponibles</h2>
      <p class="text-muted mb-0">
        Por el momento no hay refugios registrados. Vuelve a intentarlo más tarde.
      </p>
    </div>

    <!-- Empty state — filters returned no results -->
    <div
      v-else-if="filteredShelters.length === 0"
      class="shelter-empty text-center py-5"
    >
      <div class="shelter-empty__illustration" aria-hidden="true">🔍</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Sin resultados</h2>
      <p class="text-muted mb-3">
        Ningún refugio coincide con tus filtros actuales.
      </p>
      <button type="button" class="btn btn-outline-primary" @click="clearFilters">
        Limpiar filtros
      </button>
    </div>

    <!-- Results -->
    <template v-else>
      <!-- Result count -->
      <p class="text-muted small mb-3" role="status" aria-live="polite">
        {{ filteredShelters.length }}
        {{ filteredShelters.length === 1 ? 'refugio encontrado' : 'refugios encontrados' }}
      </p>

      <div class="row g-4">
        <div
          v-for="shelter in filteredShelters"
          :key="shelter.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <ShelterCard :shelter="shelter" />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
// ── Empty state ───────────────────────────────────────────────
.shelter-empty {
  &__illustration {
    font-size: 4rem;
    line-height: 1;
    display: block;
    animation: shelter-bounce 2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

@keyframes shelter-bounce {
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

.shelter-skeleton {
  border-radius: var(--bs-border-radius-lg);

  &__photo {
    height: 160px;
    border-radius: var(--bs-border-radius-lg) var(--bs-border-radius-lg) 0 0;
  }

  &__title {
    height: 1rem;
    width: 65%;
  }

  &__subtitle {
    height: 0.75rem;
    width: 45%;
  }

  &__line {
    height: 0.75rem;
    width: 100%;

    &--short { width: 70%; }
  }

  &__badge {
    height: 1.25rem;
    width: 4.5rem;
    border-radius: var(--bs-border-radius-pill) !important;
  }

  &__btn {
    height: 2rem;
    width: 100%;
  }
}
</style>
