<script setup lang="ts">
// StatsChart — monthly revenue bar chart using CSS progress bars.
// No external chart library required — rendered with Bootstrap progress
// bars proportional to the maximum value in the dataset.
// Supports three metrics: total, subscriptions, donations.

import type { RevenueDataPoint } from '../types'

// ── Props ─────────────────────────────────────────────────────

interface Props {
  data: RevenueDataPoint[]
  isLoading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
})

// ── Metric selector ───────────────────────────────────────────

type MetricKey = 'total' | 'subscriptions' | 'donations'

const activeMetric = ref<MetricKey>('total')

const metrics: { key: MetricKey; label: string; colorClass: string }[] = [
  { key: 'total', label: 'Total', colorClass: 'bg-primary' },
  { key: 'subscriptions', label: 'Suscripciones', colorClass: 'bg-info' },
  { key: 'donations', label: 'Donaciones', colorClass: 'bg-success' },
]

const activeColorClass = computed(
  () => metrics.find(m => m.key === activeMetric.value)?.colorClass ?? 'bg-primary',
)

// ── Bar chart computations ─────────────────────────────────────

const maxValue = computed(() => {
  if (!props.data.length) return 1
  return Math.max(...props.data.map(d => d[activeMetric.value]), 1)
})

function barPercent(point: RevenueDataPoint): number {
  const val = point[activeMetric.value]
  return Math.round((val / maxValue.value) * 100)
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

function formatMonthLabel(month: string): string {
  // month = "YYYY-MM"
  try {
    const [year, m] = month.split('-')
    const date = new Date(Number(year), Number(m) - 1, 1)
    return new Intl.DateTimeFormat('es-ES', { month: 'short', year: '2-digit' }).format(date)
  } catch {
    return month
  }
}
</script>

<template>
  <section aria-label="Gráfico de ingresos por mes">
    <div class="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
      <h2 class="h5 fw-bold mb-0">
        <span aria-hidden="true">📈</span> Ingresos por Mes
      </h2>
      <!-- Metric toggle -->
      <div
        class="btn-group btn-group-sm"
        role="group"
        aria-label="Seleccionar métrica de ingresos"
      >
        <button
          v-for="metric in metrics"
          :key="metric.key"
          type="button"
          class="btn"
          :class="activeMetric === metric.key ? 'btn-primary' : 'btn-outline-secondary'"
          @click="activeMetric = metric.key"
        >
          {{ metric.label }}
        </button>
      </div>
    </div>

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
        :key="point.month"
        class="mb-3"
      >
        <div class="d-flex align-items-center gap-3">
          <div
            class="chart__month-label text-muted small fw-semibold text-end"
            style="min-width: 3.5rem;"
          >
            {{ formatMonthLabel(point.month) }}
          </div>
          <div
            class="progress flex-grow-1"
            style="height: 1.5rem;"
            role="progressbar"
            :aria-valuenow="barPercent(point)"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-label="`${formatMonthLabel(point.month)}: ${formatCOP(point[activeMetric])}`"
          >
            <div
              class="progress-bar"
              :class="activeColorClass"
              :style="`width: ${barPercent(point)}%`"
            />
          </div>
          <div
            class="chart__amount text-muted small fw-semibold text-end"
            style="min-width: 6rem;"
          >
            {{ formatCOP(point[activeMetric]) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="text-center py-4 text-muted"
    >
      <div class="fs-2 mb-2" aria-hidden="true">📈</div>
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
