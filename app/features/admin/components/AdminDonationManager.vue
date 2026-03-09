<script setup lang="ts">
// AdminDonationManager — paginated donation log with Wompi details.
// Shows all donations with donor, shelter, amounts (including fees),
// payment method, payout status, and Wompi transaction references.
// Read-only — no action buttons. Supports prev/next pagination.

import type { TransactionStatus, AdminDonationFilters } from '../types'

const { fetchDonations, error, adminStore } = useAdmin()

// ── Pagination ──────────────────────────────────────────────
const currentPage = ref(1)
const PER_PAGE = 20

const totalPages = computed(() => Math.max(1, Math.ceil(adminStore.totalDonations / PER_PAGE)))
const hasPrevPage = computed(() => currentPage.value > 1)
const hasNextPage = computed(() => currentPage.value < totalPages.value)

async function prevPage(): Promise<void> {
  if (!hasPrevPage.value) return
  currentPage.value -= 1
  await loadDonations()
}

async function nextPage(): Promise<void> {
  if (!hasNextPage.value) return
  currentPage.value += 1
  await loadDonations()
}

// ── Filters ─────────────────────────────────────────────────
const filterStatus = ref('')

async function loadDonations(): Promise<void> {
  const filters: AdminDonationFilters = {
    page: currentPage.value,
    limit: PER_PAGE,
  }
  if (filterStatus.value) filters.status = filterStatus.value as TransactionStatus
  await fetchDonations(filters)
}

async function applyFilter(): Promise<void> {
  currentPage.value = 1
  await loadDonations()
}

// ── Badge helpers ───────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  declined: 'Rechazado',
  error: 'Error',
}

const STATUS_BADGE: Record<string, string> = {
  approved: 'bg-success',
  pending: 'bg-warning text-dark',
  declined: 'bg-danger',
  error: 'bg-secondary',
}

const PAYOUT_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  dispatched: 'Enviado',
  completed: 'Completado',
  failed: 'Fallido',
}

const PAYOUT_BADGE: Record<string, string> = {
  pending: 'bg-warning text-dark',
  dispatched: 'bg-info text-dark',
  completed: 'bg-success',
  failed: 'bg-danger',
}

// ── Formatters ──────────────────────────────────────────────

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatCOP(amount: number): string {
  return copFormatter.format(amount)
}

const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short', timeStyle: 'short' })

function formatDate(dateString: string): string {
  try {
    return dateFormatter.format(new Date(dateString))
  }
  catch {
    return dateString
  }
}

// ── Lifecycle ───────────────────────────────────────────────

onMounted(async () => {
  await loadDonations()
})
</script>

<template>
  <section aria-label="Registro de donaciones">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h2 class="h5 fw-bold mb-1">
          <span class="material-symbols-outlined" style="font-size: 1.1rem;" aria-hidden="true">favorite</span> Donaciones
        </h2>
        <p class="text-muted small mb-0">
          Registro de donaciones a refugios via Wompi.
        </p>
      </div>
      <span
        class="text-muted small"
        role="status"
        aria-live="polite"
      >
        {{ adminStore.totalDonations }} donacion{{ adminStore.totalDonations !== 1 ? 'es' : '' }}
      </span>
    </div>

    <!-- Filters -->
    <div class="d-flex align-items-center gap-2 mb-3">
      <select
        v-model="filterStatus"
        class="form-select form-select-sm"
        style="max-width: 180px;"
        aria-label="Filtrar por estado"
        @change="applyFilter"
      >
        <option value="">Todos los estados</option>
        <option value="approved">Aprobado</option>
        <option value="pending">Pendiente</option>
        <option value="declined">Rechazado</option>
        <option value="error">Error</option>
      </select>
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
              <th scope="col" class="text-muted small">ID</th>
              <th scope="col">Donante</th>
              <th scope="col">Refugio</th>
              <th scope="col" class="text-end">Monto</th>
              <th scope="col" class="text-end">Fee</th>
              <th scope="col" class="text-end">Neto</th>
              <th scope="col" class="text-center">Estado</th>
              <th scope="col" class="text-center">Payout</th>
              <th scope="col">Metodo</th>
              <th scope="col">Fecha</th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton rows while loading -->
            <template v-if="adminStore.isLoading">
              <tr v-for="n in 5" :key="`skel-${n}`" aria-hidden="true">
                <td><div class="skeleton-pulse rounded don-skeleton__id" /></td>
                <td><div class="skeleton-pulse rounded don-skeleton__text" /></td>
                <td><div class="skeleton-pulse rounded don-skeleton__text" /></td>
                <td class="text-end"><div class="skeleton-pulse rounded don-skeleton__amount ms-auto" /></td>
                <td class="text-end"><div class="skeleton-pulse rounded don-skeleton__amount ms-auto" /></td>
                <td class="text-end"><div class="skeleton-pulse rounded don-skeleton__amount ms-auto" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded don-skeleton__badge mx-auto" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded don-skeleton__badge mx-auto" /></td>
                <td><div class="skeleton-pulse rounded don-skeleton__method" /></td>
                <td><div class="skeleton-pulse rounded don-skeleton__date" /></td>
              </tr>
            </template>

            <!-- Data rows -->
            <template v-else-if="adminStore.donations.length > 0">
              <tr v-for="don in adminStore.donations" :key="don.id">
                <td class="text-muted small font-monospace">{{ don.id }}</td>
                <td class="small">
                  <div class="fw-semibold">{{ don.donor_name }}</div>
                  <div class="text-muted" style="font-size: 0.8em;">{{ don.donor_email }}</div>
                  <span class="badge bg-light text-dark border" style="font-size: 0.7em;">{{ don.donor_label }}</span>
                </td>
                <td class="small">{{ don.shelter_name }}</td>
                <td class="text-end fw-semibold">{{ formatCOP(don.amount ?? don.amount_cop) }}</td>
                <td class="text-end text-muted small">{{ don.platform_fee !== undefined ? formatCOP(don.platform_fee) : '—' }}</td>
                <td class="text-end text-success small fw-semibold">{{ don.shelter_amount !== undefined ? formatCOP(don.shelter_amount) : '—' }}</td>
                <td class="text-center">
                  <span
                    class="badge"
                    :class="STATUS_BADGE[don.status] ?? 'bg-secondary'"
                  >
                    {{ STATUS_LABEL[don.status] ?? don.status }}
                  </span>
                </td>
                <td class="text-center">
                  <span
                    v-if="don.payout_status"
                    class="badge"
                    :class="PAYOUT_BADGE[don.payout_status] ?? 'bg-secondary'"
                  >
                    {{ PAYOUT_LABEL[don.payout_status] ?? don.payout_status }}
                  </span>
                  <span v-else class="text-muted small">—</span>
                </td>
                <td class="small">{{ don.payment_method ?? '—' }}</td>
                <td class="text-muted small">{{ formatDate(don.created_at) }}</td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else>
              <td colspan="10" class="text-center py-5 text-muted">
                <span class="material-symbols-outlined" style="font-size: 2rem;" aria-hidden="true">favorite</span>
                No hay donaciones registradas aun.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination footer -->
      <div
        v-if="adminStore.totalDonations > PER_PAGE"
        class="card-footer bg-transparent d-flex align-items-center justify-content-between py-3"
      >
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          :disabled="!hasPrevPage"
          aria-label="Pagina anterior"
          @click="prevPage"
        >
          &larr; Anterior
        </button>
        <span class="text-muted small" aria-live="polite">
          Pagina {{ currentPage }} de {{ totalPages }}
        </span>
        <button
          type="button"
          class="btn btn-outline-secondary btn-sm"
          :disabled="!hasNextPage"
          aria-label="Pagina siguiente"
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

.don-skeleton {
  &__id { height: 0.75rem; width: 30px; }
  &__text { height: 0.875rem; width: 80px; }
  &__amount { height: 0.875rem; width: 70px; }
  &__badge { height: 1.25rem; width: 4.5rem; border-radius: var(--bs-border-radius-pill) !important; }
  &__method { height: 0.875rem; width: 60px; }
  &__date { height: 0.875rem; width: 90px; }
}
</style>
