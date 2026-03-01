<script setup lang="ts">
// RevenueReport — tabular revenue breakdown.
// Receives revenue series data and optional aggregate stats as props.
// Columns: date, revenue (COP), count. Totals row uses aggregates
// from the RevenueStats object when available.

import type { RevenueSeriesPoint, RevenueStats } from '../types'

// ── Props ─────────────────────────────────────────────────────

interface Props {
  data: RevenueSeriesPoint[]
  stats?: RevenueStats | null
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  stats: null,
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

function formatDateFull(date: string): string {
  try {
    const parts = date.split('-')
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2] ?? 1))
    return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(d)
  } catch {
    return date
  }
}

// ── Totals ─────────────────────────────────────────────────────

const totals = computed(() => ({
  revenue: props.stats?.total_accumulated_cop ?? props.data.reduce((s, d) => s + d.revenue, 0),
  count: props.stats?.approved_transactions ?? props.data.reduce((s, d) => s + d.count, 0),
}))
</script>

<template>
  <section aria-label="Reporte de ingresos">
    <h2 class="h5 fw-bold mb-4">
      <span aria-hidden="true">💰</span> Reporte de Ingresos
    </h2>

    <div class="card border-0 shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col" class="text-end">Ingresos (COP)</th>
              <th scope="col" class="text-end">Transacciones</th>
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
              </tr>
            </template>

            <!-- Data rows -->
            <template v-else-if="data.length > 0">
              <tr
                v-for="point in data"
                :key="point.date"
              >
                <td class="fw-semibold small text-capitalize">
                  {{ formatDateFull(point.date) }}
                </td>
                <td class="text-end">
                  <span class="badge bg-primary">{{ formatCOP(point.revenue) }}</span>
                </td>
                <td class="text-end fw-semibold">
                  {{ point.count }}
                </td>
              </tr>
            </template>

            <!-- Empty state -->
            <tr v-else>
              <td
                colspan="3"
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
              <td class="text-end text-primary">{{ formatCOP(totals.revenue) }}</td>
              <td class="text-end">{{ totals.count }}</td>
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
