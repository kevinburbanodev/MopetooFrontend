<script setup lang="ts">
// StatsChart — revenue bar chart using CSS progress bars.
// No external chart library required — rendered with Bootstrap progress
// bars proportional to the maximum value in the dataset.
// Uses RevenueSeriesPoint with a single `revenue` metric.

import type { RevenueSeriesPoint } from '../types'

// ── Props ─────────────────────────────────────────────────────

interface Props {
  data: RevenueSeriesPoint[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

// ── Bar chart computations ─────────────────────────────────────

const maxValue = computed(() => {
  if (!props.data.length) return 1
  return Math.max(...props.data.map(d => d.revenue), 1)
})

function barPercent(point: RevenueSeriesPoint): number {
  return Math.round((point.revenue / maxValue.value) * 100)
}

// ── Formatters ────────────────────────────────────────────────

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatCOP(amount: number): string {
  return copFormatter.format(amount)
}

function formatDateLabel(date: string): string {
  try {
    const parts = date.split('-')
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2] ?? 1))
    return new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(d)
  } catch {
    return date
  }
}
</script>

<template>
  <section aria-label="Gráfico de ingresos por mes">
    <h2 class="h5 fw-bold mb-3">
      <span class="material-symbols-outlined" style="font-size: 1.25rem; vertical-align: text-bottom;" aria-hidden="true">trending_up</span> Ingresos por Mes
    </h2>

    <!-- Loading skeleton -->
    <div
      v-if="isLoading"
      aria-busy="true"
      aria-label="Cargando gráfico"
    >
      <div
        v-for="n in 6"
        :key="n"
        class="mb-3"
      >
        <div class="d-flex align-items-center gap-3">
          <div class="chart-skeleton__label skeleton-pulse rounded" />
          <div class="chart-skeleton__bar skeleton-pulse rounded flex-grow-1" />
          <div class="chart-skeleton__value skeleton-pulse rounded" />
        </div>
      </div>
    </div>

    <!-- Bar chart -->
    <div v-else-if="data.length > 0">
      <div
        v-for="point in data"
        :key="point.date"
        class="mb-3"
      >
        <div class="d-flex align-items-center gap-3">
          <div
            class="chart__date-label text-muted small fw-semibold text-end"
            style="min-width: 3.5rem;"
          >
            {{ formatDateLabel(point.date) }}
          </div>
          <div
            class="progress flex-grow-1"
            style="height: 1.5rem;"
            role="progressbar"
            :aria-valuenow="barPercent(point)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${formatDateLabel(point.date)}: ${formatCOP(point.revenue)}`"
          >
            <div
              class="progress-bar bg-primary"
              :style="`width: ${barPercent(point)}%`"
            />
          </div>
          <div
            class="chart__amount text-muted small fw-semibold text-end"
            style="min-width: 6rem;"
          >
            {{ formatCOP(point.revenue) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="text-center py-4 text-muted"
    >
      <span class="material-symbols-outlined" style="font-size: 2rem;" aria-hidden="true">trending_up</span>
      <p class="mb-0">No hay datos de ingresos disponibles aún.</p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.chart-skeleton {
  &__label { height: 0.875rem; width: 3.5rem; }
  &__bar { height: 1.5rem; }
  &__value { height: 0.875rem; width: 5rem; }
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
