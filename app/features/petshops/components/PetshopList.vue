<script setup lang="ts">
// PetshopList — public petshop directory.
// Fetches petshops on mount, provides client-side search + category + city
// filters. Featured stores appear in a dedicated section above the grid
// when no filters are active.
// Displays skeleton loading and two empty states.

const { fetchPetshops, error, petshopsStore } = usePetshops()

// ── Client-side filters ────────────────────────────────────
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedCity = ref('')

// Derive unique city options from loaded data for the city select
const cityOptions = computed<string[]>(() => {
  const cities = petshopsStore.petshops
    .map(p => p.city)
    .filter(c => c && c.trim() !== '')
  return [...new Set(cities)].sort()
})

// Derive unique category options from loaded data for the category select
const categoryOptions = computed<string[]>(() => {
  const cats: string[] = []
  for (const p of petshopsStore.petshops) {
    for (const c of p.categories) {
      if (!cats.includes(c)) cats.push(c)
    }
  }
  return cats.sort()
})

const hasActiveFilters = computed(() =>
  searchQuery.value.trim() !== ''
  || selectedCategory.value !== ''
  || selectedCity.value !== '',
)

// All petshops after applying client-side filters
const filteredPetshops = computed(() => {
  let result = petshopsStore.petshops

  if (selectedCity.value) {
    result = result.filter(p => p.city === selectedCity.value)
  }

  if (selectedCategory.value) {
    result = result.filter(p => p.categories.includes(selectedCategory.value))
  }

  const q = searchQuery.value.trim().toLowerCase()
  if (q) {
    result = result.filter(p =>
      p.name.toLowerCase().includes(q)
      || p.description.toLowerCase().includes(q)
      || p.city.toLowerCase().includes(q),
    )
  }

  return result
})

// Featured section only visible when no filters are active
const showFeaturedSection = computed(() =>
  !hasActiveFilters.value && petshopsStore.getFeaturedPetshops.length > 0,
)

// Regular (non-featured) petshops for the main grid when no filters active
const regularPetshops = computed(() => {
  if (hasActiveFilters.value) return filteredPetshops.value
  return filteredPetshops.value.filter(p => !p.is_featured)
})

function clearFilters(): void {
  searchQuery.value = ''
  selectedCategory.value = ''
  selectedCity.value = ''
}

const SKELETON_COUNT = 6

onMounted(async () => {
  await fetchPetshops()
})
</script>

<template>
  <section aria-label="Directorio de tiendas pet-friendly">
    <!-- Page header -->
    <div class="mb-4">
      <h1 class="h3 fw-bold mb-1">Tiendas Pet-Friendly</h1>
      <p class="text-muted mb-0">
        Descubre tiendas y servicios para mascotas en tu ciudad. Alimentos, accesorios, veterinarias y mucho más.
      </p>
    </div>

    <!-- Filters bar -->
    <div class="card border-0 shadow-sm mb-4 p-3">
      <div class="row g-3 align-items-end">
        <!-- Search input -->
        <div class="col-12 col-md-5">
          <label for="petshop-search" class="form-label small fw-semibold text-muted">
            Buscar tienda
          </label>
          <div class="input-group">
            <span class="input-group-text bg-transparent border-end-0" aria-hidden="true">
              🔍
            </span>
            <input
              id="petshop-search"
              v-model="searchQuery"
              type="search"
              class="form-control border-start-0"
              placeholder="Nombre, ciudad o descripción..."
              aria-label="Buscar tiendas"
            />
          </div>
        </div>

        <!-- Category filter -->
        <div class="col-12 col-sm-6 col-md-3">
          <label for="petshop-category" class="form-label small fw-semibold text-muted">
            Categoría
          </label>
          <select
            id="petshop-category"
            v-model="selectedCategory"
            class="form-select"
            aria-label="Filtrar por categoría"
          >
            <option value="">Todas las categorías</option>
            <option
              v-for="cat in categoryOptions"
              :key="cat"
              :value="cat"
            >
              {{ cat }}
            </option>
          </select>
        </div>

        <!-- City filter -->
        <div class="col-12 col-sm-6 col-md-2">
          <label for="petshop-city" class="form-label small fw-semibold text-muted">
            Ciudad
          </label>
          <select
            id="petshop-city"
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
      v-if="petshopsStore.isLoading"
      class="row g-4"
      aria-busy="true"
      aria-label="Cargando tiendas"
    >
      <div
        v-for="n in SKELETON_COUNT"
        :key="n"
        class="col-12 col-md-6 col-lg-4"
      >
        <div class="card border-0 shadow-sm h-100 petshop-skeleton" aria-hidden="true">
          <div class="petshop-skeleton__photo skeleton-pulse" />
          <div class="card-body p-3 d-flex flex-column gap-2">
            <div class="skeleton-pulse rounded petshop-skeleton__title" />
            <div class="skeleton-pulse rounded petshop-skeleton__subtitle" />
            <div class="d-flex gap-1 mt-1">
              <div class="skeleton-pulse rounded petshop-skeleton__badge" />
              <div class="skeleton-pulse rounded petshop-skeleton__badge" />
            </div>
          </div>
          <div class="card-footer bg-transparent border-top-0 px-3 pb-3 pt-0">
            <div class="skeleton-pulse rounded petshop-skeleton__btn" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state — no petshops at all -->
    <div
      v-else-if="petshopsStore.petshops.length === 0"
      class="petshop-empty text-center py-5"
    >
      <div class="petshop-empty__illustration" aria-hidden="true">🏪</div>
      <h2 class="h5 fw-bold mt-4 mb-2">No hay tiendas disponibles</h2>
      <p class="text-muted mb-0">
        Por el momento no hay tiendas registradas. Vuelve a intentarlo más tarde.
      </p>
    </div>

    <!-- Empty state — filters returned no results -->
    <div
      v-else-if="filteredPetshops.length === 0"
      class="petshop-empty text-center py-5"
    >
      <div class="petshop-empty__illustration" aria-hidden="true">🔍</div>
      <h2 class="h5 fw-bold mt-4 mb-2">Sin resultados</h2>
      <p class="text-muted mb-3">
        Ninguna tienda coincide con tus filtros actuales.
      </p>
      <button type="button" class="btn btn-outline-primary" @click="clearFilters">
        Limpiar filtros
      </button>
    </div>

    <!-- Results -->
    <template v-else>
      <!-- Featured stores section — hidden when filters are active -->
      <section
        v-if="showFeaturedSection"
        class="mb-5"
        aria-label="Tiendas destacadas"
      >
        <div class="d-flex align-items-center gap-2 mb-3">
          <h2 class="h5 fw-bold mb-0">
            <span aria-hidden="true">⭐</span> Tiendas Destacadas
          </h2>
          <span class="badge bg-warning text-dark">
            {{ petshopsStore.getFeaturedPetshops.length }}
          </span>
        </div>
        <div class="row g-4">
          <div
            v-for="petshop in petshopsStore.getFeaturedPetshops"
            :key="petshop.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <PetshopCard :petshop="petshop" />
          </div>
        </div>
      </section>

      <!-- Result counter -->
      <p class="text-muted small mb-3" role="status" aria-live="polite">
        Mostrando
        {{ filteredPetshops.length }}
        {{ filteredPetshops.length === 1 ? 'tienda' : 'tiendas' }}
      </p>

      <!-- Main grid — all results when filters active, non-featured otherwise -->
      <div class="row g-4">
        <div
          v-for="petshop in regularPetshops"
          :key="petshop.id"
          class="col-12 col-md-6 col-lg-4"
        >
          <PetshopCard :petshop="petshop" />
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped lang="scss">
// ── Empty state ───────────────────────────────────────────────
.petshop-empty {
  &__illustration {
    font-size: 4rem;
    line-height: 1;
    display: block;
    animation: petshop-bounce 2s ease-in-out infinite;

    @media (prefers-reduced-motion: reduce) {
      animation: none;
    }
  }
}

@keyframes petshop-bounce {
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

.petshop-skeleton {
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
