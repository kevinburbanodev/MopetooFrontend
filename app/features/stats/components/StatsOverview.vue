<script setup lang="ts">
// StatsOverview — KPI cards for the statistics module.
// Fetches platform overview on mount (admin endpoint) and displays
// entity counts, revenue metrics, and content metrics from the
// nested StatsOverview structure returned by GET /api/admin/stats/overview.

const { fetchOverview, error, statsStore } = useStats()

// ── Formatters (SSR-safe — no window access) ─────────────────

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatCOP(amount: number): string {
  return copFormatter.format(amount)
}

// ── KPI card definitions ─────────────────────────────────────

interface KpiCard {
  icon: string
  label: string
  value: () => number
  color: string
}

const kpiCards: KpiCard[] = [
  { icon: 'group', label: 'Usuarios registrados', value: () => statsStore.overview?.users.total ?? 0, color: 'primary' },
  { icon: 'pets', label: 'Mascotas registradas', value: () => statsStore.overview?.content.total_pets ?? 0, color: 'success' },
  { icon: 'home_health', label: 'Refugios activos', value: () => statsStore.overview?.shelters.active ?? 0, color: 'info' },
  { icon: 'medical_services', label: 'Clínicas registradas', value: () => statsStore.overview?.clinics.total ?? 0, color: 'warning' },
  { icon: 'storefront', label: 'Tiendas pet-friendly', value: () => statsStore.overview?.stores.total ?? 0, color: 'secondary' },
  { icon: 'volunteer_activism', label: 'Adopciones procesadas', value: () => statsStore.overview?.content.adopted_in_period ?? 0, color: 'success' },
  { icon: 'star', label: 'Suscripciones PRO', value: () => statsStore.overview?.users.pro_active ?? 0, color: 'warning' },
  { icon: 'favorite', label: 'Donaciones realizadas', value: () => statsStore.overview?.donations_cop.total_count ?? 0, color: 'danger' },
]

const revenueCards = computed(() => [
  {
    icon: 'date_range',
    label: 'Ingresos del periodo',
    value: formatCOP(statsStore.overview?.revenue_cop.in_period ?? 0),
    color: 'success',
  },
  {
    icon: 'account_balance',
    label: 'Ingresos totales',
    value: formatCOP(statsStore.overview?.revenue_cop.total_accumulated ?? 0),
    color: 'primary',
  },
])

// ── Lifecycle ─────────────────────────────────────────────────

onMounted(async () => {
  await fetchOverview()
})
</script>

<template>
  <section aria-label="Resumen de estadísticas de la plataforma">
    <h2 class="h5 fw-bold mb-4">
      <span class="material-symbols-outlined" style="font-size: 1.25rem; vertical-align: text-bottom;" aria-hidden="true">leaderboard</span> Resumen General
    </h2>

    <!-- Error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span class="material-symbols-outlined" style="font-size: 1.1rem;" aria-hidden="true">warning</span>
      {{ error }}
      <button
        type="button"
        class="btn btn-sm btn-outline-danger ms-auto"
        @click="fetchOverview"
      >
        Reintentar
      </button>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="statsStore.isLoading && !statsStore.hasOverview"
      aria-busy="true"
      aria-label="Cargando estadísticas"
    >
      <div class="row g-3 mb-3">
        <div
          v-for="n in 8"
          :key="n"
          class="col-6 col-md-3"
        >
          <div class="card border-0 shadow-sm p-3 h-100">
            <div class="stats-skeleton__icon skeleton-pulse rounded mb-2 mx-auto" />
            <div class="stats-skeleton__number skeleton-pulse rounded mx-auto" />
            <div class="stats-skeleton__label skeleton-pulse rounded mx-auto mt-2" />
          </div>
        </div>
      </div>
      <div class="row g-3">
        <div
          v-for="n in 2"
          :key="`rev-${n}`"
          class="col-12 col-md-6"
        >
          <div class="card border-0 shadow-sm p-4">
            <div class="stats-skeleton__revenue skeleton-pulse rounded" />
          </div>
        </div>
      </div>
    </div>

    <!-- KPI grid -->
    <template v-else-if="statsStore.hasOverview">
      <!-- Count KPIs -->
      <div class="row g-3 mb-4">
        <div
          v-for="card in kpiCards"
          :key="card.label"
          class="col-6 col-md-3"
        >
          <div class="admin-stat-card h-100">
            <span class="material-symbols-outlined admin-stat-card__icon" aria-hidden="true">{{ card.icon }}</span>
            <div class="admin-stat-card__value">
              {{ card.value().toLocaleString('es-CO') }}
            </div>
            <div class="admin-stat-card__label">
              {{ card.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue KPIs -->
      <div class="row g-3">
        <div
          v-for="card in revenueCards"
          :key="card.label"
          class="col-12 col-md-6"
        >
          <div class="admin-stat-card p-4">
            <div class="d-flex align-items-center gap-3">
              <span class="material-symbols-outlined" style="font-size: 2rem; opacity: 0.6;" aria-hidden="true">{{ card.icon }}</span>
              <div>
                <div class="admin-stat-card__label mb-1">
                  {{ card.label }}
                </div>
                <div class="h4 fw-bold mb-0" :class="`text-${card.color}`">
                  {{ card.value }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Empty / error state — no overview and not loading -->
    <div
      v-else-if="!statsStore.isLoading"
      class="text-center py-5"
    >
      <span class="material-symbols-outlined" style="font-size: 2.5rem; opacity: 0.5;" aria-hidden="true">leaderboard</span>
      <h3 class="h5 fw-bold mt-4 mb-2">No se pudieron cargar las estadísticas</h3>
      <p class="text-muted mb-4">
        Verifica tu conexión e intenta de nuevo.
      </p>
      <button
        type="button"
        class="btn btn-primary"
        @click="fetchOverview"
      >
        Reintentar
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.stats-skeleton {
  &__icon {
    height: 2rem;
    width: 2rem;
    border-radius: 50% !important;
  }

  &__number {
    height: 2rem;
    width: 60%;
  }

  &__label {
    height: 0.75rem;
    width: 70%;
  }

  &__revenue {
    height: 3.5rem;
    width: 100%;
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
