<script setup lang="ts">
// ClinicList — public clinic directory.
// Fetches clinics on mount, provides client-side search + specialty + city
// filters. Featured clinics appear in a dedicated section above the grid
// when no filters are active.
// Displays skeleton loading and two empty states.

const { fetchClinics, error, clinicsStore } = useClinics()

// ── Client-side filters ────────────────────────────────────
const searchQuery = ref('')
const selectedSpecialty = ref('')
const selectedCity = ref('')

// Derive unique city options from loaded data for the city select
const cityOptions = computed<string[]>(() => {
  const cities = clinicsStore.clinics
    .map(c => c.city)
    .filter(c => c && c.trim() !== '')
  return [...new Set(cities)].sort()
})

// Derive unique specialty options from loaded data for the specialty select
const specialtyOptions = computed<string[]>(() => {
  const specs: string[] = []
  for (const c of clinicsStore.clinics) {
    for (const s of c.specialties) {
      if (!specs.includes(s)) specs.push(s)
    }
  }
  return specs.sort()
})

const hasActiveFilters = computed(() =>
  searchQuery.value.trim() !== ''
  || selectedSpecialty.value !== ''
  || selectedCity.value !== '',
)

// All clinics after applying client-side filters
const filteredClinics = computed(() => {
  let result = clinicsStore.clinics

  if (selectedCity.value) {
    result = result.filter(c => c.city === selectedCity.value)
  }

  if (selectedSpecialty.value) {
    result = result.filter(c => c.specialties.includes(selectedSpecialty.value))
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(c =>
      c.name.toLowerCase().includes(q)
      || c.description.toLowerCase().includes(q)
      || c.city.toLowerCase().includes(q),
    )
  }

  return result
})

// Featured section only visible when no filters are active
const showFeaturedSection = computed(() =>
  !hasActiveFilters.value && clinicsStore.getFeaturedClinics.length > 0,
)

// Regular (non-featured) clinics for the main grid when no filters active
const regularClinics = computed(() => {
  if (hasActiveFilters.value) return filteredClinics.value
  return filteredClinics.value.filter(c => !c.is_featured)
})

function clearFilters(): void {
  searchQuery.value = ''
  selectedSpecialty.value = ''
  selectedCity.value = ''
}

const SKELETON_COUNT = 6

onMounted(async () => {
  await fetchClinics()
})
</script>

<template>
  <section aria-label="Directorio de clínicas veterinarias">
    <!-- Page header -->
    <div class="mb-4">
      <h1 class="h3 fw-bold mb-1">Clínicas Veterinarias</h1>
      <p class="text-muted mb-0">
        Encuentra clínicas veterinarias especializadas para el cuidado de tu mascota. Consultas, cirugías, vacunas y más.
      </p>
    </div>

    <!-- Filters bar -->
    <div class="card border-0 shadow-sm mb-4 p-3">
      <div class="row g-3 align-items-end">
        <!-- Search input -->
        <div class="col-12 col-md-5">
          <label for="clinic-search" class="form-label small fw-semibold text-muted">
            Buscar clínica
          </label>
          <div class="input-group">
            <span class="input-group-text bg-transparent border-end-0" aria-hidden="true">
              🔍
            </span>
            <input
              id="clinic-search"
              v-model="searchQuery"
              type="search"
              class="form-control border-start-0"
              placeholder="Nombre, ciudad o descripción..."
              aria-label="Buscar clínicas"
            />
          </div>
        </div>

        <!-- Specialty filter -->
        <div class="col-12 col-sm-6 col-md-3">
          <label for="clinic-specialty" class="form-label small fw-semibold text-muted">
            Especialidad
          </label>
          <select
            id="clinic-specialty"
            v-model="selectedSpecialty"
            class="form-select"
            aria-label="Filtrar por especialidad"
          >
            <option value="">Todas las especialidades</option>
            <option
              v-for="spec in specialtyOptions"
              :key="spec"
              :value="spec"
            >
              {{ spec }}
            </option>
          </select>
        </div>

        <!-- City filter -->
        <div class="col-12 col-sm-6 col-md-2">
          <label for="clinic-city" class="form-label small fw-semibold text-muted">
            Ciudad
          </label>
          <select
            id="clinic-city"
            v-model="selectedCity"
            class="form-select"
            aria-label="Filtrar por ciudad"
          >
            <option value="">Todas las ciudades</option>
            <option
              v-for="city in cityOptions"
              :key="city"
              :value="city"
            >
              {{ city }}
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
      v-if="clinicsStore.isLoading"
      class="row g-4"
      aria-busy="true"
      aria-label="Cargando clínicas"
    >
      <div
        v-for="n in SKELETON_COUNT"
        :key="n"
        class="col-12 col-md-6 col-lg-4"
      >
        <div class="card border-0 shadow-sm h-100 clinic-skeleton" aria-hidden="true">
          <div class="clinic-skeleton__photo skeleton-pulse" />
          <div class="card-body p-3 d-flex flex-column gap-2">
            <div class="skeleton-pulse rounded clinic-skeleton__title" />
            <div class="skeleton-pulse rounded clinic-skeleton__subtitle" />
            <div class="d-flex gap-1 mt-1">
              <div class="skeleton-pulse rounded clinic-skeleton__badge" />
              <div class="skeleton-pulse rounded clinic-skeleton__badge" />
            </div>
          </div>
          <div class="card-footer bg-transparent border-top-0 px-3 pb-3 pt-0">
            <div class="skeleton-pulse rounded clinic-skeleton__btn" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state — no clinics at all -->
    <div
      v-else-if="clinicsStore.clinics.length === 0"
      class="clinic-empty text-center py-5"
    >
      <div class="clinic-empty__illustration" aria-hidden="true">🏥</div>
      <h2 class="h5 fw-bold mt-4 mb-2">No hay clínicas disponibles</h2>
      <p class="text-muted mb-0">
        Por el momento no hay clínicas registradas. Vuelve a intentarlo más tarde.
      </p>
    </div>

    <!-- Empty state — filters returned no results -->
    <div
      v-else-if="filteredClinics.length === 0"
      class="clinic-empty text-center py-5"
    >
      <div class="clinic-empty__illustration" aria-hidden="true">🔍</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Sin resultados</h2>
      <p class="text-muted mb-3">
        Ninguna clínica coincide con tus filtros actuales.
      </p>
      <button type="button" class="btn btn-outline-primary" @click="clearFilters">
        Limpiar filtros
      </button>
    </div>

    <!-- Results -->
    <template v-else>
      <!-- Featured clinics section — hidden when filters are active -->
      <section
        v-if="showFeaturedSection"
        class="mb-5"
        aria-label="Clínicas destacadas"
      >
        <div class="d-flex align-items-center gap-2 mb-3">
          <h2 class="h5 fw-bold mb-0">
            <span aria-hidden="true">⭐</span> Clínicas Destacadas
          </h2>
          <span class="badge bg-warning text-dark">
            {{ clinicsStore.getFeaturedClinics.length }}
          </span>
        </div>
        <div class="row g-4">
          <div
            v-for="clinic in clinicsStore.getFeaturedClinics"
            :key="clinic.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <ClinicCard :clinic="clinic" />
          </div>
        </div>
      </section>

      <!-- Result counter -->
      <p class="text-muted small mb-3" role="status" aria-live="polite">
        Mostrando
        {{ filteredClinics.length }}
        {{ filteredClinics.length === 1 ? 'clínica' : 'clínicas' }}
      </p>

      <!-- Main grid — all results when filters active, non-featured otherwise -->
      <div class="row g-4">
        <div
          v-for="clinic in regularClinics"
          :key="clinic.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <ClinicCard :clinic="clinic" />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
// ── Empty state ───────────────────────────────────────────────
.clinic-empty {
  &__illustration {
    font-size: 4rem;
    line-height: 1;
    display: block;
    animation: clinic-bounce 2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

@keyframes clinic-bounce {
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

.clinic-skeleton {
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
