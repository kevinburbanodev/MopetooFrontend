<script setup lang="ts">
// AdminShelterManager — paginated shelter management table.
// Each row supports verify, activate/deactivate actions via
// specific PATCH endpoints. No delete or featured toggles.

import type { AdminFilters } from '../types'

const { fetchShelters, verifyShelter, activateShelter, deactivateShelter, error, adminStore } = useAdmin()

// ── Filters ────────────────────────────────────────────────
const searchQuery = ref('')
const currentPage = ref(1)
const PER_PAGE = 20

// ── Debounced fetch ─────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRefetch(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    loadShelters()
  }, 350)
}

async function loadShelters(): Promise<void> {
  const filters: AdminFilters = {
    page: currentPage.value,
    limit: PER_PAGE,
  }
  const q = searchQuery.value.trim()
  if (q) filters.search = q
  await fetchShelters(filters)
}

// ── Pagination helpers ──────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(adminStore.totalShelters / PER_PAGE)))
const hasPrevPage = computed(() => currentPage.value > 1)
const hasNextPage = computed(() => currentPage.value < totalPages.value)

async function prevPage(): Promise<void> {
  if (!hasPrevPage.value) return
  currentPage.value -= 1
  await loadShelters()
}

async function nextPage(): Promise<void> {
  if (!hasNextPage.value) return
  currentPage.value += 1
  await loadShelters()
}

// ── Date formatter ──────────────────────────────────────────
const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' })

function formatDate(dateString: string): string {
  try {
    return dateFormatter.format(new Date(dateString))
  }
  catch {
    return dateString
  }
}

watch(searchQuery, scheduleRefetch)

onMounted(async () => {
  await loadShelters()
})
</script>

<template>
  <section aria-label="Gestión de refugios">
    <div class="d-flex flex-wrap align-items-center gap-3 mb-4">
      <!-- Search -->
      <div class="flex-grow-1" style="min-width: 200px; max-width: 360px;">
        <label for="shelter-search" class="visually-hidden">Buscar refugio</label>
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0" aria-hidden="true"><span class="material-symbols-outlined" style="font-size: 1.1rem;">search</span></span>
          <input
            id="shelter-search"
            v-model="searchQuery"
            type="search"
            class="form-control border-start-0"
            placeholder="Nombre o ciudad..."
            aria-label="Buscar refugio"
          />
        </div>
      </div>

      <!-- Result count -->
      <span
        class="text-muted small ms-auto"
        role="status"
        aria-live="polite"
      >
        {{ adminStore.totalShelters }} refugio{{ adminStore.totalShelters !== 1 ? 's' : '' }}
      </span>
    </div>

    <!-- Error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span class="material-symbols-outlined" style="font-size: 1.1rem;" aria-hidden="true">warning</span>
      {{ error }}
    </div>

    <!-- Table -->
    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Ciudad</th>
              <th scope="col">Contacto</th>
              <th scope="col" class="text-center">Verificado</th>
              <th scope="col" class="text-center">Activo</th>
              <th scope="col" class="text-center">Mascotas</th>
              <th scope="col">Registro</th>
              <th scope="col" class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton rows while loading -->
            <template v-if="adminStore.isLoading">
              <tr v-for="n in 5" :key="`skel-${n}`" aria-hidden="true">
                <td><div class="skeleton-pulse rounded admin-table-skeleton__name" /></td>
                <td><div class="skeleton-pulse rounded admin-table-skeleton__city" /></td>
                <td><div class="skeleton-pulse rounded admin-table-skeleton__email" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded admin-table-skeleton__badge mx-auto" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded admin-table-skeleton__badge mx-auto" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded admin-table-skeleton__count mx-auto" /></td>
                <td><div class="skeleton-pulse rounded admin-table-skeleton__date" /></td>
                <td><div class="skeleton-pulse rounded admin-table-skeleton__actions ms-auto" /></td>
              </tr>
            </template>

            <!-- Data rows -->
            <template v-else-if="adminStore.shelters.length > 0">
              <tr v-for="shelter in adminStore.shelters" :key="shelter.id">
                <td class="fw-semibold">{{ shelter.organization_name }}</td>
                <td class="text-muted small">{{ shelter.city?.name }}</td>
                <td class="text-muted small">
                  <div v-if="shelter.email">{{ shelter.email }}</div>
                  <div v-if="shelter.phone">{{ shelter.phone }}</div>
                  <span v-if="!shelter.email && !shelter.phone" class="text-muted">—</span>
                </td>
                <td class="text-center">
                  <span
                    v-if="shelter.verified"
                    class="badge bg-success"
                    aria-label="Refugio verificado"
                  >
                    Verificado
                  </span>
                  <span
                    v-else
                    class="text-muted small"
                    aria-label="Refugio no verificado"
                  >
                    No
                  </span>
                </td>
                <td class="text-center">
                  <span
                    v-if="shelter.is_active"
                    class="badge bg-success"
                    aria-label="Refugio activo"
                  >
                    Activo
                  </span>
                  <span
                    v-else
                    class="badge bg-secondary"
                    aria-label="Refugio inactivo"
                  >
                    Inactivo
                  </span>
                </td>
                <td class="text-center">{{ shelter.pets_count }}</td>
                <td class="text-muted small">{{ formatDate(shelter.created_at) }}</td>
                <td class="text-end">
                  <div class="d-flex justify-content-end gap-1 flex-wrap">
                    <!-- Verificar / Revocar verificación -->
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="shelter.verified ? 'btn-outline-warning' : 'btn-outline-success'"
                      :aria-label="shelter.verified ? `Revocar verificación de ${shelter.organization_name}` : `Verificar ${shelter.organization_name}`"
                      @click="verifyShelter(shelter.id, !shelter.verified)"
                    >
                      {{ shelter.verified ? 'Revocar' : 'Verificar' }}
                    </button>
                    <!-- Activar / Desactivar -->
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="shelter.is_active ? 'btn-outline-secondary' : 'btn-outline-success'"
                      :aria-label="shelter.is_active ? `Desactivar ${shelter.organization_name}` : `Activar ${shelter.organization_name}`"
                      @click="shelter.is_active ? deactivateShelter(shelter.id) : activateShelter(shelter.id)"
                    >
                      {{ shelter.is_active ? 'Desactivar' : 'Activar' }}
                    </button>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else>
              <td colspan="8" class="text-center py-5 text-muted">
                <span class="material-symbols-outlined" style="font-size: 2rem;" aria-hidden="true">home_health</span>
                No se encontraron refugios con los filtros actuales.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination footer -->
      <div
        v-if="adminStore.totalShelters > PER_PAGE"
        class="card-footer bg-transparent d-flex align-items-center justify-content-between py-3"
      >
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          :disabled="!hasPrevPage"
          aria-label="Página anterior"
          @click="prevPage"
        >
          &larr; Anterior
        </button>
        <span class="text-muted small" aria-live="polite">
          Página {{ currentPage }} de {{ totalPages }}
        </span>
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          :disabled="!hasNextPage"
          aria-label="Página siguiente"
          @click="nextPage"
        >
          Siguiente &rarr;
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
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

.admin-table-skeleton {
  &__name { height: 0.875rem; width: 120px; }
  &__city { height: 0.875rem; width: 80px; }
  &__email { height: 0.875rem; width: 140px; }
  &__badge { height: 1.25rem; width: 4rem; border-radius: var(--bs-border-radius-pill) !important; }
  &__count { height: 0.875rem; width: 2rem; }
  &__date { height: 0.875rem; width: 70px; }
  &__actions { height: 2rem; width: 160px; }
}
</style>
