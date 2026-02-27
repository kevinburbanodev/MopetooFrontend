<script setup lang="ts">
// AdminClinicManager — paginated clinic management table.
// Each row supports toggling is_verified and is_featured,
// plus 2-step inline delete confirmation.
// Displays the first 3 specialties + overflow count badge.

import type { AdminFilters } from '../types'

const { fetchAdminClinics, updateAdminClinic, deleteAdminClinic, error, adminStore } = useAdmin()

// ── Filters ────────────────────────────────────────────────
const searchQuery = ref('')
const currentPage = ref(1)
const PER_PAGE = 20

// ── Specialty display — max 2 visible, overflow as "+N" ────
const MAX_VISIBLE_SPECIALTIES = 2

function visibleSpecialties(specialties: string[]): string[] {
  return specialties.slice(0, MAX_VISIBLE_SPECIALTIES)
}

function hiddenSpecialtyCount(specialties: string[]): number {
  return Math.max(0, specialties.length - MAX_VISIBLE_SPECIALTIES)
}

// ── Delete confirmation (2-step inline) ─────────────────────
const confirmingDeleteId = ref<string | null>(null)

function requestDelete(clinicId: string): void {
  confirmingDeleteId.value = clinicId
}

function cancelDelete(): void {
  confirmingDeleteId.value = null
}

async function confirmDelete(clinicId: string): Promise<void> {
  confirmingDeleteId.value = null
  await deleteAdminClinic(clinicId)
}

// ── Debounced fetch ─────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRefetch(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    loadClinics()
  }, 350)
}

async function loadClinics(): Promise<void> {
  const filters: AdminFilters = {
    page: currentPage.value,
    per_page: PER_PAGE,
  }
  const q = searchQuery.value.trim()
  if (q) filters.search = q
  await fetchAdminClinics(filters)
}

// ── Pagination helpers ──────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(adminStore.totalClinics / PER_PAGE)))
const hasPrevPage = computed(() => currentPage.value > 1)
const hasNextPage = computed(() => currentPage.value < totalPages.value)

async function prevPage(): Promise<void> {
  if (!hasPrevPage.value) return
  currentPage.value -= 1
  await loadClinics()
}

async function nextPage(): Promise<void> {
  if (!hasNextPage.value) return
  currentPage.value += 1
  await loadClinics()
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
  await loadClinics()
})
</script>

<template>
  <section aria-label="Gestión de clínicas">
    <div class="d-flex flex-wrap align-items-center gap-3 mb-4">
      <!-- Search -->
      <div class="flex-grow-1" style="min-width: 200px; max-width: 360px;">
        <label for="clinic-admin-search" class="visually-hidden">Buscar clínica</label>
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0" aria-hidden="true">🔍</span>
          <input
            id="clinic-admin-search"
            v-model="searchQuery"
            type="search"
            class="form-control border-start-0"
            placeholder="Nombre o ciudad..."
            aria-label="Buscar clínica"
          />
        </div>
      </div>

      <!-- Result count -->
      <span
        class="text-muted small ms-auto"
        role="status"
        aria-live="polite"
      >
        {{ adminStore.totalClinics }} clínica{{ adminStore.totalClinics !== 1 ? 's' : '' }}
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
              <th scope="col">Especialidades</th>
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
                <td>
                  <div class="d-flex gap-1">
                    <div class="skeleton-pulse rounded admin-table-skeleton__spec" />
                    <div class="skeleton-pulse rounded admin-table-skeleton__spec" />
                  </div>
                </td>
                <td class="text-center"><div class="skeleton-pulse rounded admin-table-skeleton__badge mx-auto" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded admin-table-skeleton__badge mx-auto" /></td>
                <td><div class="skeleton-pulse rounded admin-table-skeleton__date" /></td>
                <td><div class="skeleton-pulse rounded admin-table-skeleton__actions ms-auto" /></td>
              </tr>
            </template>

            <!-- Data rows -->
            <template v-else-if="adminStore.clinics.length > 0">
              <tr v-for="clinic in adminStore.clinics" :key="clinic.id">
                <td class="fw-semibold">{{ clinic.name }}</td>
                <td class="text-muted small">{{ clinic.city }}</td>
                <td>
                  <div
                    v-if="clinic.specialties.length > 0"
                    class="d-flex flex-wrap gap-1"
                    :aria-label="`Especialidades: ${clinic.specialties.join(', ')}`"
                  >
                    <span
                      v-for="spec in visibleSpecialties(clinic.specialties)"
                      :key="spec"
                      class="badge bg-primary bg-opacity-10 text-primary fw-normal"
                    >
                      {{ spec }}
                    </span>
                    <span
                      v-if="hiddenSpecialtyCount(clinic.specialties) > 0"
                      class="badge bg-primary bg-opacity-10 text-primary fw-normal"
                      :aria-label="`${hiddenSpecialtyCount(clinic.specialties)} especialidades más`"
                    >
                      +{{ hiddenSpecialtyCount(clinic.specialties) }}
                    </span>
                  </div>
                  <span v-else class="text-muted small">—</span>
                </td>
                <td class="text-center">
                  <span
                    v-if="clinic.is_verified"
                    class="badge bg-success"
                    aria-label="Clínica verificada"
                  >
                    Verificado
                  </span>
                  <span
                    v-else
                    class="text-muted small"
                    aria-label="Clínica no verificada"
                  >
                    No
                  </span>
                </td>
                <td class="text-center">
                  <span
                    v-if="clinic.is_featured"
                    class="badge bg-warning text-dark"
                    aria-label="Clínica destacada"
                  >
                    Destacado
                  </span>
                  <span
                    v-else
                    class="text-muted small"
                    aria-label="Clínica no destacada"
                  >
                    No
                  </span>
                </td>
                <td class="text-muted small">{{ formatDate(clinic.created_at) }}</td>
                <td class="text-end">
                  <div class="d-flex justify-content-end gap-1 flex-wrap">
                    <!-- 2-step delete confirmation -->
                    <template v-if="confirmingDeleteId === clinic.id">
                      <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        :aria-label="`Confirmar eliminación de ${clinic.name}`"
                        @click="confirmDelete(clinic.id)"
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
                        :aria-label="clinic.is_verified ? `Quitar verificación a ${clinic.name}` : `Verificar ${clinic.name}`"
                        @click="updateAdminClinic(clinic.id, { is_verified: !clinic.is_verified })"
                      >
                        {{ clinic.is_verified ? 'Desverificar' : 'Verificar' }}
                      </button>
                      <!-- Toggle Destacado -->
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-warning"
                        :aria-label="clinic.is_featured ? `Quitar destacado a ${clinic.name}` : `Destacar ${clinic.name}`"
                        @click="updateAdminClinic(clinic.id, { is_featured: !clinic.is_featured })"
                      >
                        {{ clinic.is_featured ? 'Quitar dest.' : 'Destacar' }}
                      </button>
                      <!-- Delete -->
                      <button
                        type="button"
                        class="btn btn-sm btn-outline-danger"
                        :aria-label="`Eliminar clínica ${clinic.name}`"
                        @click="requestDelete(clinic.id)"
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
                <div class="fs-2 mb-2" aria-hidden="true">🏥</div>
                No se encontraron clínicas con los filtros actuales.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination footer -->
      <div
        v-if="adminStore.totalClinics > PER_PAGE"
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
  &__spec { height: 1.25rem; width: 5rem; border-radius: var(--bs-border-radius-pill) !important; }
  &__badge { height: 1.25rem; width: 4rem; border-radius: var(--bs-border-radius-pill) !important; }
  &__date { height: 0.875rem; width: 70px; }
  &__actions { height: 2rem; width: 180px; }
}
</style>
