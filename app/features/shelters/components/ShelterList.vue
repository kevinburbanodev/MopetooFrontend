<script setup lang="ts">
// ShelterList — adoption listings directory.
// Fetches all adoption listings on mount from GET /api/adoption-listings,
// provides client-side search + species/city/gender filters,
// displays skeleton loading and empty state.

const { fetchAdoptionListings, error, sheltersStore } = useShelters()

// ── Client-side filters ────────────────────────────────────
const searchQuery = ref('')
const selectedSpecies = ref('')
const selectedCity = ref('')

const SPECIES_OPTIONS = [
  { value: '', label: 'Todas las especies' },
  { value: 'dog', label: 'Perros' },
  { value: 'cat', label: 'Gatos' },
  { value: 'bird', label: 'Aves' },
  { value: 'rabbit', label: 'Conejos' },
  { value: 'other', label: 'Otros' },
]

/** Unique cities derived from the current listings for the filter dropdown */
const cityOptions = computed(() => {
  const cities = new Set(sheltersStore.adoptionListings.map(l => l.city))
  return [
    { value: '', label: 'Todas las ciudades' },
    ...[...cities].sort().map(c => ({ value: c, label: c })),
  ]
})

const filteredListings = computed(() => {
  let result = sheltersStore.adoptionListings

  if (selectedSpecies.value) {
    result = result.filter(l => l.species === selectedSpecies.value)
  }

  if (selectedCity.value) {
    result = result.filter(l => l.city === selectedCity.value)
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(l =>
      l.name.toLowerCase().includes(q)
      || l.species.toLowerCase().includes(q)
      || l.city.toLowerCase().includes(q),
    )
  }

  return result
})

function clearFilters(): void {
  searchQuery.value = ''
  selectedSpecies.value = ''
  selectedCity.value = ''
}

const hasActiveFilters = computed(() =>
  searchQuery.value.trim() !== '' || selectedSpecies.value !== '' || selectedCity.value !== '',
)

const SKELETON_COUNT = 6

onMounted(async () => {
  await fetchAdoptionListings()
})
</script>

<template>
  <section aria-label="Listados de adopción">
    <!-- Page header -->
    <div class="mb-4">
      <h1 class="h3 fw-bold mb-1">Mascotas en Adopción</h1>
      <p class="text-muted mb-0">
        Encuentra mascotas que buscan un hogar y da un nuevo comienzo a quien lo necesita.
      </p>
    </div>

    <!-- Filters bar -->
    <div class="card border-0 shadow-sm mb-4 p-3">
      <div class="row g-3 align-items-end">
        <!-- Search input -->
        <div class="col-12 col-md-4">
          <label for="listing-search" class="form-label small fw-semibold text-muted">
            Buscar mascota
          </label>
          <div class="input-group">
            <span class="input-group-text bg-transparent border-end-0" aria-hidden="true">
              🔍
            </span>
            <input
              id="listing-search"
              v-model="searchQuery"
              type="search"
              class="form-control border-start-0"
              placeholder="Nombre, especie o ciudad..."
              aria-label="Buscar mascotas en adopción"
            />
          </div>
        </div>

        <!-- Species filter -->
        <div class="col-6 col-md-3">
          <label for="listing-species" class="form-label small fw-semibold text-muted">
            Especie
          </label>
          <select
            id="listing-species"
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

        <!-- City filter -->
        <div class="col-6 col-md-3">
          <label for="listing-city" class="form-label small fw-semibold text-muted">
            Ciudad
          </label>
          <select
            id="listing-city"
            v-model="selectedCity"
            class="form-select"
            aria-label="Filtrar por ciudad"
          >
            <option
              v-for="opt in cityOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>

        <!-- Clear filters -->
        <div class="col-12 col-md-2 d-flex align-items-end">
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
      aria-label="Cargando mascotas en adopción"
    >
      <div
        v-for="n in SKELETON_COUNT"
        :key="n"
        class="col-12 col-md-6 col-lg-4"
      >
        <div class="card border-0 shadow-sm h-100 listing-skeleton" aria-hidden="true">
          <div class="listing-skeleton__photo skeleton-pulse" />
          <div class="card-body p-3 d-flex flex-column gap-2">
            <div class="skeleton-pulse rounded listing-skeleton__title" />
            <div class="skeleton-pulse rounded listing-skeleton__subtitle" />
            <div class="skeleton-pulse rounded listing-skeleton__line" />
            <div class="skeleton-pulse rounded listing-skeleton__line listing-skeleton__line--short" />
            <div class="d-flex gap-1 mt-1">
              <div class="skeleton-pulse rounded listing-skeleton__badge" />
              <div class="skeleton-pulse rounded listing-skeleton__badge" />
            </div>
          </div>
          <div class="card-footer bg-transparent border-top-0 px-3 pb-3 pt-0">
            <div class="skeleton-pulse rounded listing-skeleton__btn" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state — no listings at all -->
    <div
      v-else-if="sheltersStore.adoptionListings.length === 0"
      class="listing-empty text-center py-5"
    >
      <div class="listing-empty__illustration" aria-hidden="true">🐾</div>
      <h2 class="h5 fw-bold mt-4 mb-2">No hay mascotas en adopción</h2>
      <p class="text-muted mb-0">
        Por el momento no hay mascotas registradas para adopción. Vuelve a intentarlo más tarde.
      </p>
    </div>

    <!-- Empty state — filters returned no results -->
    <div
      v-else-if="filteredListings.length === 0"
      class="listing-empty text-center py-5"
    >
      <div class="listing-empty__illustration" aria-hidden="true">🔍</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Sin resultados</h2>
      <p class="text-muted mb-3">
        Ninguna mascota coincide con tus filtros actuales.
      </p>
      <button type="button" class="btn btn-outline-primary" @click="clearFilters">
        Limpiar filtros
      </button>
    </div>

    <!-- Results -->
    <template v-else>
      <!-- Result count -->
      <p class="text-muted small mb-3" role="status" aria-live="polite">
        {{ filteredListings.length }}
        {{ filteredListings.length === 1 ? 'mascota encontrada' : 'mascotas encontradas' }}
      </p>

      <div class="row g-4">
        <div
          v-for="listing in filteredListings"
          :key="listing.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <AdoptionPetCard :listing="listing" />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
// ── Empty state ───────────────────────────────────────────────
.listing-empty {
  &__illustration {
    font-size: 4rem;
    line-height: 1;
    display: block;
    animation: listing-bounce 2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

@keyframes listing-bounce {
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

.listing-skeleton {
  border-radius: var(--bs-border-radius-lg);

  &__photo {
    height: 180px;
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
