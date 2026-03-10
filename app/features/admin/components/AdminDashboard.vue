<script setup lang="ts">
// AdminDashboard — KPI statistics overview for the admin panel.
// Fetches platform stats via useStats().fetchOverview() and renders
// them as a grid of KPI cards. Revenue is formatted as COP currency.
// Includes a quick-navigation list-group to all admin sub-sections.

const { fetchOverview, error, statsStore } = useStats()

// ── Currency / number formatters (SSR-safe — no window access) ─

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

function formatCOP(amount: number): string {
  return copFormatter.format(amount)
}

// ── KPI card definitions ────────────────────────────────────

interface KpiCard {
  icon: string
  label: string
  value: () => number
  color: string
}

const kpiRow1: KpiCard[] = [
  { icon: 'group', label: 'Usuarios registrados', value: () => statsStore.overview?.users.total ?? 0, color: 'primary' },
  { icon: 'pets', label: 'Mascotas registradas', value: () => statsStore.overview?.content.total_pets ?? 0, color: 'success' },
  { icon: 'home_health', label: 'Refugios activos', value: () => statsStore.overview?.shelters.active ?? 0, color: 'info' },
  { icon: 'medical_services', label: 'Clínicas registradas', value: () => statsStore.overview?.clinics.total ?? 0, color: 'warning' },
]

const kpiRow2: KpiCard[] = [
  { icon: 'storefront', label: 'Tiendas pet-friendly', value: () => statsStore.overview?.stores.total ?? 0, color: 'secondary' },
  { icon: 'volunteer_activism', label: 'Adopciones procesadas', value: () => statsStore.overview?.content.active_adoption_listings ?? 0, color: 'success' },
  { icon: 'star', label: 'Suscripciones PRO', value: () => statsStore.overview?.users.pro_active ?? 0, color: 'warning' },
  { icon: 'favorite', label: 'Donaciones realizadas', value: () => statsStore.overview?.donations_cop.total_count ?? 0, color: 'danger' },
]

// ── Lifecycle ──────────────────────────────────────────────

onMounted(async () => {
  await fetchOverview()
})
</script>

<template>
  <section aria-label="Panel de administración">
    <!-- Error alert -->
    <div
      v-if="error"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span class="material-symbols-outlined" aria-hidden="true">warning</span>
      {{ error }}
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="statsStore.isLoading && !statsStore.hasOverview"
      aria-busy="true"
      aria-label="Cargando estadísticas"
    >
      <div class="row g-4 mb-4" aria-hidden="true">
        <div
          v-for="n in 8"
          :key="n"
          class="col-6 col-md-3"
        >
          <div class="admin-stat-card">
            <div class="skeleton-pulse rounded mb-2 admin-skeleton__icon" />
            <div class="skeleton-pulse rounded admin-skeleton__number" />
            <div class="skeleton-pulse rounded mt-2 admin-skeleton__label" />
          </div>
        </div>
      </div>
    </div>

    <!-- KPI cards -->
    <template v-else-if="statsStore.hasOverview">
      <!-- Row 1: Usuarios, Mascotas, Refugios, Clínicas -->
      <div class="row g-4 mb-4">
        <div
          v-for="card in kpiRow1"
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

      <!-- Row 2: Tiendas, Adopciones, Suscripciones PRO, Donaciones -->
      <div class="row g-4 mb-5">
        <div
          v-for="card in kpiRow2"
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

      <!-- Revenue section -->
      <div class="row g-4 mb-5">
        <div class="col-12 col-md-6">
          <div class="admin-stat-card admin-revenue-card">
            <div class="d-flex align-items-center gap-3">
              <span class="material-symbols-outlined" style="font-size: 2rem; opacity: 0.6;" aria-hidden="true">date_range</span>
              <div>
                <div class="admin-stat-card__label mb-1">
                  Ingresos del periodo
                </div>
                <div class="h4 fw-bold text-success mb-0">
                  {{ formatCOP(statsStore.overview!.revenue_cop.in_period) }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 col-md-6">
          <div class="admin-stat-card admin-revenue-card">
            <div class="d-flex align-items-center gap-3">
              <span class="material-symbols-outlined" style="font-size: 2rem; opacity: 0.6;" aria-hidden="true">account_balance</span>
              <div>
                <div class="admin-stat-card__label mb-1">
                  Ingresos totales
                </div>
                <div class="h4 fw-bold text-primary mb-0">
                  {{ formatCOP(statsStore.overview!.revenue_cop.total_accumulated) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Event Stats -->
      <div class="mb-5">
        <AdminEventStats />
      </div>

      <!-- System status & maintenance toggle -->
      <div class="mb-4">
        <MaintenanceToggle />
      </div>
    </template>

    <!-- Empty / error state — no stats yet and not loading -->
    <div
      v-else-if="!statsStore.isLoading"
      class="text-center py-5"
    >
      <span class="material-symbols-outlined" style="font-size: 2.5rem; opacity: 0.5;" aria-hidden="true">leaderboard</span>
      <h2 class="h5 fw-bold mt-4 mb-2">No se pudieron cargar las estadísticas</h2>
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
// ── Skeleton shimmer ──────────────────────────────────────────
.admin-skeleton {
  &__icon {
    height: 2rem;
    width: 2rem;
    margin: 0 auto;
    border-radius: 50% !important;
  }

  &__number {
    height: 2rem;
    width: 60%;
    margin: 0 auto;
  }

  &__label {
    height: 0.75rem;
    width: 70%;
    margin: 0 auto;
  }
}
</style>
