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
  { icon: '👥', label: 'Usuarios registrados', value: () => statsStore.overview?.users.total ?? 0, color: 'primary' },
  { icon: '🐾', label: 'Mascotas registradas', value: () => statsStore.overview?.content.total_pets ?? 0, color: 'success' },
  { icon: '🏠', label: 'Refugios activos', value: () => statsStore.overview?.shelters.active ?? 0, color: 'info' },
  { icon: '🏥', label: 'Clínicas registradas', value: () => statsStore.overview?.clinics.total ?? 0, color: 'warning' },
]

const kpiRow2: KpiCard[] = [
  { icon: '🛍️', label: 'Tiendas pet-friendly', value: () => statsStore.overview?.stores.total ?? 0, color: 'secondary' },
  { icon: '🐶', label: 'Adopciones procesadas', value: () => statsStore.overview?.content.active_adoption_listings ?? 0, color: 'success' },
  { icon: '⭐', label: 'Suscripciones PRO', value: () => statsStore.overview?.users.pro_active ?? 0, color: 'warning' },
  { icon: '💝', label: 'Donaciones realizadas', value: () => statsStore.overview?.donations_cop.total_count ?? 0, color: 'danger' },
]

// ── Quick navigation links ──────────────────────────────────

const quickNavLinks = [
  { label: 'Gestionar Usuarios', to: '/admin/users', icon: '👥' },
  { label: 'Gestionar Refugios', to: '/admin/shelters', icon: '🏠' },
  { label: 'Gestionar Tiendas', to: '/admin/stores', icon: '🛍️' },
  { label: 'Gestionar Clínicas', to: '/admin/clinics', icon: '🏥' },
  { label: 'Estadísticas del Sistema', to: '/admin/stats', icon: '📊' },
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
      <span aria-hidden="true">⚠</span>
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
          <div class="card border-0 shadow-sm p-3 admin-skeleton">
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
          <div
            class="card border-0 shadow-sm h-100 text-center p-3"
            :class="`border-top border-4 border-${card.color}`"
            style="border-top-width: 4px !important;"
          >
            <div class="fs-2 mb-1" aria-hidden="true">{{ card.icon }}</div>
            <div
              class="display-6 fw-bold"
              :class="`text-${card.color}`"
            >
              {{ card.value().toLocaleString('es-CO') }}
            </div>
            <div class="text-muted small mt-1 fw-semibold text-uppercase" style="letter-spacing: 0.04em;">
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
          <div
            class="card border-0 shadow-sm h-100 text-center p-3"
            :class="`border-top border-4 border-${card.color}`"
            style="border-top-width: 4px !important;"
          >
            <div class="fs-2 mb-1" aria-hidden="true">{{ card.icon }}</div>
            <div
              class="display-6 fw-bold"
              :class="`text-${card.color}`"
            >
              {{ card.value().toLocaleString('es-CO') }}
            </div>
            <div class="text-muted small mt-1 fw-semibold text-uppercase" style="letter-spacing: 0.04em;">
              {{ card.label }}
            </div>
          </div>
        </div>
      </div>

      <!-- Revenue section -->
      <div class="row g-4 mb-5">
        <div class="col-12 col-md-6">
          <div class="card border-0 shadow-sm p-4 admin-revenue-card">
            <div class="d-flex align-items-center gap-3">
              <div class="admin-revenue-card__icon fs-1" aria-hidden="true">📅</div>
              <div>
                <div class="text-muted small fw-semibold text-uppercase mb-1" style="letter-spacing: 0.04em;">
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
          <div class="card border-0 shadow-sm p-4 admin-revenue-card">
            <div class="d-flex align-items-center gap-3">
              <div class="admin-revenue-card__icon fs-1" aria-hidden="true">💰</div>
              <div>
                <div class="text-muted small fw-semibold text-uppercase mb-1" style="letter-spacing: 0.04em;">
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

      <!-- System status & maintenance toggle -->
      <div class="mb-4">
        <MaintenanceToggle />
      </div>

      <!-- Quick navigation -->
      <div class="card border-0 shadow-sm">
        <div class="card-header bg-transparent border-bottom">
          <h2 class="h6 fw-bold mb-0">
            <span aria-hidden="true">🗂️</span> Gestión rápida
          </h2>
        </div>
        <div class="list-group list-group-flush" role="list">
          <NuxtLink
            v-for="link in quickNavLinks"
            :key="link.to"
            :to="link.to"
            class="list-group-item list-group-item-action d-flex align-items-center gap-3 py-3"
            role="listitem"
          >
            <span class="fs-5" aria-hidden="true">{{ link.icon }}</span>
            <span class="fw-semibold">{{ link.label }}</span>
            <span class="ms-auto text-muted" aria-hidden="true">&rsaquo;</span>
          </NuxtLink>
        </div>
      </div>
    </template>

    <!-- Empty / error state — no stats yet and not loading -->
    <div
      v-else-if="!statsStore.isLoading"
      class="text-center py-5"
    >
      <div class="fs-1" aria-hidden="true">📊</div>
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
// ── Revenue cards ─────────────────────────────────────────────
.admin-revenue-card {
  border-left: 4px solid var(--bs-primary);

  &__icon {
    line-height: 1;
  }
}

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
