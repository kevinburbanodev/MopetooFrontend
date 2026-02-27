<script setup lang="ts">
// AdminStoreManager — paginated petshop management table.
// Each row supports toggling is_verified and is_featured,
// plus 2-step inline delete confirmation.

import type { AdminFilters } from '../types'

const { fetchPetshops, updatePetshop, deletePetshop, error, adminStore } = useAdmin()

// ── Filters ────────────────────────────────────────────────
const searchQuery = ref('')
const currentPage = ref(1)
const PER_PAGE = 20

// ── Delete confirmation (2-step inline) ─────────────────────
const confirmingDeleteId = ref<string | null>(null)

function requestDelete(petshopId: string): void {
  confirmingDeleteId.value = petshopId
}

function cancelDelete(): void {
  confirmingDeleteId.value = null
}

async function confirmDelete(petshopId: string): Promise<void> {
  confirmingDeleteId.value = null
  await deletePetshop(petshopId)
}

// ── Debounced fetch ─────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRefetch(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    loadPetshops()
  }, 350)
}

async function loadPetshops(): Promise<void> {
  const filters: AdminFilters = {
    page: currentPage.value,
    per_page: PER_PAGE,
  }
  const q = searchQuery.value.trim()
  if (q) filters.search = q
  await fetchPetshops(filters)
}

// ── Pagination helpers ──────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(adminStore.totalPetshops / PER_PAGE)))
const hasPrevPage = computed(() => currentPage.value > 1)
const hasNextPage = computed(() => currentPage.value < totalPages.value)

async function prevPage(): Promise<void> {
  if (!hasPrevPage.value) return
  currentPage.value -= 1
  await loadPetshops()
}

async function nextPage(): Promise<void> {
  if (!hasNextPage.value) return
  currentPage.value += 1
  await loadPetshops()
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
  await loadPetshops()
})
</script>

<template>
  <section aria-label="Gestión de tiendas">
    <div class="d-flex flex-wrap align-items-center gap-3 mb-4">
      <!-- Search -->
      <div class="flex-grow-1" style="min-width: 200px; max-width: 360px;">
        <label for="store-search" class="visually-hidden">Buscar tienda</label>
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0" aria-hidden="true">🔍</span>
          <input
            id="store-search"
            v-model="searchQuery"
            type="search"
            class="form-control border-start-0"
            placeholder="Nombre o ciudad..."
            aria-label="Buscar tienda"
          />
        </div>
      </div>

      <!-- Result count -->
      <span
        class="text-muted small ms-auto"
        role="status"
        aria-live="polite"
      >
        {{ adminStore.totalPetshops }} tienda{{ adminStore.totalPetshops !== 1 ? 's' : '' }}
      </span>
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
              <th scope="col" class="text-center">Destacado</th>
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
                <td><div class="skeleton-pulse rounded admin-table-skeleton__date" /></td>
                <td><div class="skeleton-pulse rounded admin-table-skeleton__actions ms-auto" /></td>
              </tr>
            </template>

            <!-- Data rows -->
            <template v-else-if="adminStore.petshops.length > 0">
              <tr v-for="petshop in adminStore.petshops" :key="petshop.id">
                <td class="fw-semibold">{{ petshop.name }}</td>
                <td class="text-muted small">{{ petshop.city }}</td>
                <td class="text-muted small">
                  <div v-if="petshop.email">{{ petshop.email }}</div>
                  <div v-if="petshop.phone">{{ petshop.phone }}</div>
                  <span v-if="!petshop.email && !petshop.phone" class="text-muted">—</span>
                </td>
                <td class="text-center">
                  <span
                    v-if="petshop.is_verified"
                    class="badge bg-success"
                    aria-label="Tienda verificada"
                  >
                    Verificado
                  </span>
                  <span
                    v-else
                    class="text-muted small"
                    aria-label="Tienda no verificada"
                  >
                    No
                  </span>
                </td>
                <td class="text-center">
                  <span
                    v-if="petshop.is_featured"
                    class="badge bg-warning text-dark"
                    aria-label="Tienda destacada"
                  >
                    Destacado
                  </span>
                  <span
                    v-else
                    class="text-muted small"
                    aria-label="Tienda no destacada"
                  >
                    No
                  </span>
                </td>
                <td class="text-muted small">{{ formatDate(petshop.created_at) }}</td>
                <td class="text-end">
                  <div class="d-flex justify-content-end gap-1 flex-wrap">
                    <!-- 2-step delete confirmation -->
                    <template v-if="confirmingDeleteId === petshop.id">
                      <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        :aria-label="`Confirmar eliminación de ${petshop.name}`"
                        @click="confirmDelete(petshop.id)"
                      >
                        ¿Confirmar?
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-secondary"
                        aria-label="Cancelar eliminación"
                        @click="cancelDelete"
                      >
                        Cancelar
                      </button>
                    </template>
                    <template v-else>
                      <!-- Toggle Verificado -->
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-success"
                        :aria-label="petshop.is_verified ? `Quitar verificación a ${petshop.name}` : `Verificar ${petshop.name}`"
                        @click="updatePetshop(petshop.id, { is_verified: !petshop.is_verified })"
                      >
                        {{ petshop.is_verified ? 'Desverificar' : 'Verificar' }}
                      </button>
                      <!-- Toggle Destacado -->
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-warning"
                        :aria-label="petshop.is_featured ? `Quitar destacado a ${petshop.name}` : `Destacar ${petshop.name}`"
                        @click="updatePetshop(petshop.id, { is_featured: !petshop.is_featured })"
                      >
                        {{ petshop.is_featured ? 'Quitar dest.' : 'Destacar' }}
                      </button>
                      <!-- Delete -->
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        :aria-label="`Eliminar tienda ${petshop.name}`"
                        @click="requestDelete(petshop.id)"
                      >
                        Eliminar
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else>
              <td colspan="7" class="text-center py-5 text-muted">
                <div class="fs-2 mb-2" aria-hidden="true">🛍️</div>
                No se encontraron tiendas con los filtros actuales.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination footer -->
      <div
        v-if="adminStore.totalPetshops > PER_PAGE"
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
  &__date { height: 0.875rem; width: 70px; }
  &__actions { height: 2rem; width: 180px; }
}
</style>
