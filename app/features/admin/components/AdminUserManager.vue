<script setup lang="ts">
// AdminUserManager — paginated user management table.
// Provides search + plan/active filters. Each row has:
//   - Toggle PRO (grantPro / revokePro)
//   - Toggle Admin (grantAdmin / revokeAdmin)
//   - Activar / Desactivar (activateUser / deactivateUser)
// Pagination: prev/next buttons with "Página X de Y" display.

import type { AdminUserFilters } from '../types'

const {
  fetchUsers, grantPro, revokePro, grantAdmin, revokeAdmin,
  activateUser, deactivateUser, error, adminStore,
} = useAdmin()
const authStore = useAuthStore()

/**
 * Returns true if the given user row is the currently authenticated admin.
 * Used to disable the "Quitar Admin" toggle and "Desactivar" button on the
 * admin's own row — prevents accidental self-demotion or self-deactivation.
 */
function isSelf(userId: number): boolean {
  return authStore.currentUser?.id === userId
}

// ── Filters ────────────────────────────────────────────────
const searchQuery = ref('')
const filterPlan = ref<string | undefined>(undefined)
const filterActive = ref<boolean | undefined>(undefined)
const currentPage = ref(1)
const PER_PAGE = 20

// ── Debounced fetch ─────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRefetch(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    currentPage.value = 1
    loadUsers()
  }, 350)
}

async function loadUsers(): Promise<void> {
  const filters: AdminUserFilters = {
    page: currentPage.value,
    limit: PER_PAGE,
  }
  const q = searchQuery.value.trim()
  if (q) filters.search = q
  if (filterPlan.value) filters.plan = filterPlan.value
  if (filterActive.value !== undefined) filters.active = filterActive.value
  await fetchUsers(filters)
}

// ── Pagination helpers ──────────────────────────────────────
const totalPages = computed(() => Math.max(1, Math.ceil(adminStore.totalUsers / PER_PAGE)))
const hasPrevPage = computed(() => currentPage.value > 1)
const hasNextPage = computed(() => currentPage.value < totalPages.value)

async function prevPage(): Promise<void> {
  if (!hasPrevPage.value) return
  currentPage.value -= 1
  await loadUsers()
}

async function nextPage(): Promise<void> {
  if (!hasNextPage.value) return
  currentPage.value += 1
  await loadUsers()
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

// ── Watchers ────────────────────────────────────────────────
watch(searchQuery, scheduleRefetch)
watch([filterPlan, filterActive], () => {
  currentPage.value = 1
  loadUsers()
})

onMounted(async () => {
  await loadUsers()
})
</script>

<template>
  <section aria-label="Gestión de usuarios">
    <div class="d-flex flex-wrap align-items-center gap-3 mb-4">
      <!-- Search -->
      <div class="flex-grow-1" style="min-width: 200px; max-width: 360px;">
        <label for="user-search" class="visually-hidden">Buscar usuario</label>
        <div class="input-group">
          <span class="input-group-text bg-transparent border-end-0" aria-hidden="true">🔍</span>
          <input
            id="user-search"
            v-model="searchQuery"
            type="search"
            class="form-control border-start-0"
            placeholder="Nombre o email..."
            aria-label="Buscar usuario"
          />
        </div>
      </div>

      <!-- Plan filter -->
      <div style="min-width: 140px;">
        <label for="filter-plan" class="visually-hidden">Filtrar por plan</label>
        <select
          id="filter-plan"
          v-model="filterPlan"
          class="form-select form-select-sm"
        >
          <option :value="undefined">Todos los planes</option>
          <option value="free">Free</option>
          <option value="pro_monthly">PRO mensual</option>
          <option value="pro_annual">PRO anual</option>
        </select>
      </div>

      <!-- Active filter -->
      <div class="form-check form-switch mb-0">
        <input
          id="filter-active"
          v-model="filterActive"
          class="form-check-input"
          type="checkbox"
          :true-value="true"
          :false-value="undefined"
        />
        <label class="form-check-label" for="filter-active">Solo activos</label>
      </div>

      <!-- Result count -->
      <span
        class="text-muted small ms-auto"
        role="status"
        aria-live="polite"
      >
        {{ adminStore.totalUsers }} usuario{{ adminStore.totalUsers !== 1 ? 's' : '' }}
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
              <th scope="col">Email</th>
              <th scope="col">Ciudad</th>
              <th scope="col" class="text-center">PRO</th>
              <th scope="col" class="text-center">Admin</th>
              <th scope="col" class="text-center">Estado</th>
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
                <td><div class="skeleton-pulse rounded admin-table-skeleton__email" /></td>
                <td><div class="skeleton-pulse rounded admin-table-skeleton__city" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded admin-table-skeleton__badge mx-auto" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded admin-table-skeleton__badge mx-auto" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded admin-table-skeleton__badge mx-auto" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded admin-table-skeleton__count mx-auto" /></td>
                <td><div class="skeleton-pulse rounded admin-table-skeleton__date" /></td>
                <td><div class="skeleton-pulse rounded admin-table-skeleton__actions ms-auto" /></td>
              </tr>
            </template>

            <!-- Data rows -->
            <template v-else-if="adminStore.users.length > 0">
              <tr v-for="user in adminStore.users" :key="user.id">
                <td class="fw-semibold">{{ user.name }} {{ user.last_name }}</td>
                <td class="text-muted small">{{ user.email }}</td>
                <td class="text-muted small">{{ user.city }}</td>
                <td class="text-center">
                  <span
                    v-if="user.is_pro"
                    class="badge bg-warning text-dark"
                    aria-label="Usuario PRO"
                  >
                    PRO
                  </span>
                  <span
                    v-else
                    class="text-muted small"
                    aria-label="Usuario sin plan PRO"
                  >
                    —
                  </span>
                </td>
                <td class="text-center">
                  <span
                    v-if="user.is_admin"
                    class="badge bg-danger"
                    aria-label="Usuario administrador"
                  >
                    Admin
                  </span>
                  <span
                    v-else
                    class="text-muted small"
                    aria-label="Usuario sin rol de administrador"
                  >
                    —
                  </span>
                </td>
                <td class="text-center">
                  <span
                    v-if="user.is_active"
                    class="badge bg-success"
                    aria-label="Usuario activo"
                  >
                    Activo
                  </span>
                  <span
                    v-else
                    class="badge bg-secondary"
                    aria-label="Usuario inactivo"
                  >
                    Inactivo
                  </span>
                </td>
                <td class="text-center">{{ user.pets_count }}</td>
                <td class="text-muted small">{{ formatDate(user.created_at) }}</td>
                <td class="text-end">
                  <div class="d-flex justify-content-end gap-1 flex-wrap">
                    <!-- Toggle PRO -->
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-warning"
                      :aria-label="user.is_pro ? `Quitar PRO a ${user.name}` : `Activar PRO para ${user.name}`"
                      @click="user.is_pro ? revokePro(user.id) : grantPro(user.id, 'pro_monthly')"
                    >
                      {{ user.is_pro ? 'Quitar PRO' : 'Dar PRO' }}
                    </button>
                    <!-- Toggle Admin — disabled for own account to prevent self-demotion -->
                    <button
                      type="button"
                      class="btn btn-sm btn-outline-danger"
                      :disabled="isSelf(user.id)"
                      :title="isSelf(user.id) ? 'No puedes modificar tu propio rol de administrador' : undefined"
                      :aria-label="isSelf(user.id) ? 'No puedes modificar tu propio rol de administrador' : (user.is_admin ? `Quitar Admin a ${user.name}` : `Hacer Admin a ${user.name}`)"
                      @click="user.is_admin ? revokeAdmin(user.id) : grantAdmin(user.id)"
                    >
                      {{ user.is_admin ? 'Quitar Admin' : 'Dar Admin' }}
                    </button>
                    <!-- Activar / Desactivar — disabled for own account to prevent self-deactivation -->
                    <button
                      type="button"
                      class="btn btn-sm"
                      :class="user.is_active ? 'btn-outline-secondary' : 'btn-outline-success'"
                      :disabled="isSelf(user.id)"
                      :title="isSelf(user.id) ? 'No puedes desactivar tu propia cuenta desde el panel' : undefined"
                      :aria-label="isSelf(user.id) ? 'No puedes desactivar tu propia cuenta desde el panel' : (user.is_active ? `Desactivar a ${user.name}` : `Activar a ${user.name}`)"
                      @click="user.is_active ? deactivateUser(user.id) : activateUser(user.id)"
                    >
                      {{ user.is_active ? 'Desactivar' : 'Activar' }}
                    </button>
                  </div>
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else>
              <td colspan="9" class="text-center py-5 text-muted">
                <div class="fs-2 mb-2" aria-hidden="true">👥</div>
                No se encontraron usuarios con los filtros actuales.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination footer -->
      <div
        v-if="adminStore.totalUsers > PER_PAGE"
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

.admin-table-skeleton {
  &__name { height: 0.875rem; width: 120px; }
  &__email { height: 0.875rem; width: 160px; }
  &__city { height: 0.875rem; width: 80px; }
  &__badge { height: 1.25rem; width: 3rem; border-radius: var(--bs-border-radius-pill) !important; }
  &__count { height: 0.875rem; width: 2rem; }
  &__date { height: 0.875rem; width: 70px; }
  &__actions { height: 2rem; width: 220px; }
}
</style>
