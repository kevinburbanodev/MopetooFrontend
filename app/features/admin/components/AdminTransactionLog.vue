<script setup lang="ts">
// AdminTransactionLog — paginated financial transaction log.
// Shows all subscription transactions with plan, status, reference,
// and amount_cop. Read-only — no action buttons.
// Supports simple prev/next pagination.

import type { TransactionStatus, AdminTransactionFilters } from '../types'

const { fetchTransactions, error, adminStore } = useAdmin()

// ── Pagination ──────────────────────────────────────────────
const currentPage = ref(1)
const PER_PAGE = 20

const totalPages = computed(() => Math.max(1, Math.ceil(adminStore.totalTransactions / PER_PAGE)))
const hasPrevPage = computed(() => currentPage.value > 1)
const hasNextPage = computed(() => currentPage.value < totalPages.value)

async function prevPage(): Promise<void> {
  if (!hasPrevPage.value) return
  currentPage.value -= 1
  await loadTransactions()
}

async function nextPage(): Promise<void> {
  if (!hasNextPage.value) return
  currentPage.value += 1
  await loadTransactions()
}

async function loadTransactions(): Promise<void> {
  const filters: AdminTransactionFilters = {
    page: currentPage.value,
    limit: PER_PAGE,
  }
  await fetchTransactions(filters)
}

// ── Badge helpers ───────────────────────────────────────────

type StatusBadgeClass = 'bg-success' | 'bg-warning text-dark' | 'bg-danger' | 'bg-secondary'

const STATUS_LABEL: Record<TransactionStatus, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  declined: 'Rechazado',
  error: 'Error',
}

const STATUS_BADGE: Record<TransactionStatus, StatusBadgeClass> = {
  approved: 'bg-success',
  pending: 'bg-warning text-dark',
  declined: 'bg-danger',
  error: 'bg-secondary',
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

const dateFormatter = new Intl.DateTimeFormat('es-ES', { dateStyle: 'short' })

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
  await loadTransactions()
})
</script>

<template>
  <section aria-label="Registro de transacciones">
    <div class="d-flex align-items-center justify-content-between mb-4">
      <div>
        <h2 class="h5 fw-bold mb-1">
          <span aria-hidden="true">💳</span> Registro de Transacciones
        </h2>
        <p class="text-muted small mb-0">
          Suscripciones PRO y donaciones registradas en la plataforma.
        </p>
      </div>
      <span
        class="text-muted small"
        role="status"
        aria-live="polite"
      >
        {{ adminStore.totalTransactions }} transacción{{ adminStore.totalTransactions !== 1 ? 'es' : '' }}
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
              <th scope="col" class="text-muted small">ID</th>
              <th scope="col">Plan</th>
              <th scope="col" class="text-end">Monto</th>
              <th scope="col" class="text-center">Estado</th>
              <th scope="col">Referencia</th>
              <th scope="col">Fecha</th>
            </tr>
          </thead>
          <tbody>
            <!-- Skeleton rows while loading -->
            <template v-if="adminStore.isLoading">
              <tr v-for="n in 5" :key="`skel-${n}`" aria-hidden="true">
                <td><div class="skeleton-pulse rounded tx-skeleton__id" /></td>
                <td><div class="skeleton-pulse rounded tx-skeleton__badge" /></td>
                <td class="text-end"><div class="skeleton-pulse rounded tx-skeleton__amount ms-auto" /></td>
                <td class="text-center"><div class="skeleton-pulse rounded tx-skeleton__badge mx-auto" /></td>
                <td><div class="skeleton-pulse rounded tx-skeleton__ref" /></td>
                <td><div class="skeleton-pulse rounded tx-skeleton__date" /></td>
              </tr>
            </template>

            <!-- Data rows -->
            <template v-else-if="adminStore.transactions.length > 0">
              <tr v-for="tx in adminStore.transactions" :key="tx.id">
                <td class="text-muted small font-monospace">{{ tx.id }}</td>
                <td class="fw-semibold small">{{ tx.plan }}</td>
                <td class="text-end fw-semibold">
                  {{ formatCOP(tx.amount_cop) }}
                </td>
                <td class="text-center">
                  <span
                    class="badge"
                    :class="STATUS_BADGE[tx.status]"
                    :aria-label="`Estado: ${STATUS_LABEL[tx.status]}`"
                  >
                    {{ STATUS_LABEL[tx.status] }}
                  </span>
                </td>
                <td class="text-muted small font-monospace" style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  {{ tx.reference }}
                </td>
                <td class="text-muted small">{{ formatDate(tx.created_at) }}</td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else>
              <td colspan="6" class="text-center py-5 text-muted">
                <div class="fs-2 mb-2" aria-hidden="true">💳</div>
                No hay transacciones registradas aún.
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination footer -->
      <div
        v-if="adminStore.totalTransactions > PER_PAGE"
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

.tx-skeleton {
  &__id { height: 0.75rem; width: 50px; }
  &__badge { height: 1.25rem; width: 4.5rem; border-radius: var(--bs-border-radius-pill) !important; }
  &__amount { height: 0.875rem; width: 70px; }
  &__ref { height: 0.875rem; width: 140px; }
  &__date { height: 0.875rem; width: 70px; }
}
</style>
