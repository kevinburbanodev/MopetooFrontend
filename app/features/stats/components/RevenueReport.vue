<script setup lang="ts">
// RevenueReport — tabular monthly revenue breakdown.
// Receives revenue data as a prop (fetched by the parent page) and
// renders a table with subscriptions + donations per month, plus
// a totals row with grand sums. All amounts formatted as COP.

import type { RevenueDataPoint } from '../types'

// ── Props ─────────────────────────────────────────────────────

interface Props {
  data: RevenueDataPoint[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

// ── Formatters ────────────────────────────────────────────────

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatCOP(amount: number): string {
  return copFormatter.format(amount)
}

function formatMonthFull(month: string): string {
  try {
    const [year, m] = month.split('-')
    const date = new Date(Number(year), Number(m) - 1, 1)
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(date)
  } catch {
    return month
  }
}

// ── Totals ─────────────────────────────────────────────────────

const totals = computed(() => ({
  subscriptions: props.data.reduce((s, d) => s + d.subscriptions, 0),
  donations: props.data.reduce((s, d) => s + d.donations, 0),
  total: props.data.reduce((s, d) => s + d.total, 0),
}))
</script>

<template>
  <section aria-label="Reporte de ingresos por fuente">
    <h2 class="h5 fw-bold mb-4">
      <span aria-hidden="true">💰</span> Reporte de Ingresos por Fuente
    </h2>

    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">Mes</th>
              <th scope="col" class="text-end">Suscripciones PRO</th>
              <th scope="col" class="text-end">Donaciones</th>
              <th scope="col" class="text-end fw-bold">Total</th>
            </tr>
          </thead>
          <tbody>
            <!-- Loading skeleton rows -->
            <template v-if="isLoading">
              <tr
                v-for="n in 6"
                :key="`skel-${n}`"
                aria-hidden="true"
              >
                <td><div class="revenue-skeleton__month skeleton-pulse rounded" /></td>
                <td class="text-end"><div class="revenue-skeleton__amount skeleton-pulse rounded ms-auto" /></td>
                <td class="text-end"><div class="revenue-skeleton__amount skeleton-pulse rounded ms-auto" /></td>
                <td class="text-end"><div class="revenue-skeleton__amount skeleton-pulse rounded ms-auto" /></td>
              </tr>
            </template>

            <!-- Data rows -->
            <template v-else-if="data.length > 0">
              <tr
                v-for="point in data"
                :key="point.month"
              >
                <td class="fw-semibold small text-capitalize">
                  {{ formatMonthFull(point.month) }}
                </td>
                <td class="text-end">
                  <span class="badge bg-info text-dark">{{ formatCOP(point.subscriptions) }}</span>
                </td>
                <td class="text-end">
                  <span class="badge bg-success">{{ formatCOP(point.donations) }}</span>
                </td>
                <td class="text-end fw-bold">
                  {{ formatCOP(point.total) }}
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else>
              <td
                colspan="4"
                class="text-center py-5 text-muted"
              >
                <div class="fs-2 mb-2" aria-hidden="true">💰</div>
                No hay datos de ingresos disponibles aún.
              </td>
            </tr>
          </tbody>

          <!-- Grand totals footer row -->
          <tfoot
            v-if="!isLoading && data.length > 0"
            class="table-light"
          >
            <tr class="fw-bold">
              <td>Total acumulado</td>
              <td class="text-end text-info">{{ formatCOP(totals.subscriptions) }}</td>
              <td class="text-end text-success">{{ formatCOP(totals.donations) }}</td>
              <td class="text-end text-primary">{{ formatCOP(totals.total) }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.revenue-skeleton {
  &__month {
    height: 0.875rem;
    width: 8rem;
  }

  &__amount {
    height: 1.25rem;
    width: 5.5rem;
    border-radius: var(--bs-border-radius-pill) !important;
  }
}

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
</style>
