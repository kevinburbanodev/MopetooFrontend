<script setup lang="ts">
// PricingTable — full 3-column pricing comparison table.
// Columns: Free (hardcoded) / PRO Mensual / PRO Anual (from store).
// Fetches plans on mount if not already loaded.
// Emits `select-plan` when a PRO CTA is clicked — the parent handles
// opening the ProUpgradeModal.

import type { ProPlan } from '../types'

const emit = defineEmits<{
  /** Emitted when the user clicks "Actualizar ahora" on a PRO plan. */
  'select-plan': [planId: string]
}>()

const { fetchPlans, proStore } = usePro()
const authStore = useAuthStore()

// Hardcoded free tier features — not managed via API
const FREE_FEATURES = [
  'Hasta 3 mascotas',
  'Recordatorios básicos',
  'Historial médico',
  'Adopciones',
] as const

onMounted(async () => {
  if (!proStore.hasPlans) {
    await fetchPlans()
  }
})

const monthlyPlan = computed(() => proStore.getMonthlyPlan)
const annualPlan = computed(() => proStore.getAnnualPlan)

/**
 * Percentage savings of annual plan vs. paying monthly for 12 months.
 */
const annualSavingsPercent = computed<number | null>(() => {
  const m = monthlyPlan.value
  const a = annualPlan.value
  if (!m || !a || m.price <= 0) return null
  const annualEquivalent = m.price * 12
  if (annualEquivalent <= a.price) return null
  return Math.round(((annualEquivalent - a.price) / annualEquivalent) * 100)
})

function formatPrice(plan: ProPlan): string {
  try {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: plan.currency,
      maximumFractionDigits: 0,
    }).format(plan.price)
  }
  catch {
    return `${plan.currency} ${plan.price}`
  }
}

/**
 * Returns whether the user's active subscription matches this plan.
 * Used to show the "Plan activo ✓" badge.
 */
function isActivePlan(planId: string): boolean {
  return (
    authStore.isPro
    && proStore.isSubscribed
    && proStore.subscription?.plan_id === planId
  )
}
</script>

<template>
  <section aria-label="Planes y precios de Mopetoo">
    <div class="text-center mb-5">
      <h2 class="h2 fw-bold mb-2">Planes y precios</h2>
      <p class="text-muted fs-5 mb-0">
        Elige el plan que mejor se adapta a ti y a tus mascotas
      </p>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="proStore.isLoading"
      class="row g-4 justify-content-center"
      aria-busy="true"
      aria-label="Cargando planes"
    >
      <div v-for="n in 3" :key="n" class="col-12 col-md-4">
        <div class="card border-0 shadow-sm h-100 p-4" aria-hidden="true">
          <div class="skeleton-pulse rounded mb-2 pricing-skeleton__title" />
          <div class="skeleton-pulse rounded mb-3 pricing-skeleton__price" />
          <div
            v-for="i in 5"
            :key="i"
            class="skeleton-pulse rounded mb-2 pricing-skeleton__line"
          />
          <div class="skeleton-pulse rounded mt-3 pricing-skeleton__btn" />
        </div>
      </div>
    </div>

    <!-- Pricing columns -->
    <div
      v-else
      class="row g-4 justify-content-center align-items-stretch"
    >
      <!-- ── Free tier ──────────────────────────────────────── -->
      <div class="col-12 col-md-4">
        <div class="card border-0 shadow-sm h-100 pricing-table__card">
          <div class="card-body p-4 d-flex flex-column">
            <div class="mb-3">
              <span class="badge bg-secondary-subtle text-secondary-emphasis mb-2">
                Gratis
              </span>
              <h3 class="h5 fw-bold mb-1">Plan Gratuito</h3>
              <p class="display-6 fw-bold mb-0">
                $0
                <span class="fs-6 text-muted fw-normal">/ siempre</span>
              </p>
            </div>

            <ul class="list-unstyled flex-grow-1 mb-4 d-flex flex-column gap-2">
              <li
                v-for="(feat, idx) in FREE_FEATURES"
                :key="idx"
                class="d-flex align-items-start gap-2 small"
              >
                <span class="text-success fw-bold flex-shrink-0" aria-hidden="true">✓</span>
                {{ feat }}
              </li>
            </ul>

            <NuxtLink
              to="/register"
              class="btn btn-outline-secondary w-100 mt-auto"
              aria-label="Comenzar gratis con Mopetoo"
            >
              Comenzar gratis
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- ── PRO Monthly ────────────────────────────────────── -->
      <div v-if="monthlyPlan" class="col-12 col-md-4">
        <div class="card border-0 shadow-sm h-100 pricing-table__card">
          <div class="card-body p-4 d-flex flex-column">
            <div class="mb-3">
              <span class="badge bg-warning text-dark mb-2">
                PRO
              </span>
              <h3 class="h5 fw-bold mb-1">{{ monthlyPlan.name }}</h3>
              <p class="display-6 fw-bold mb-0">
                {{ formatPrice(monthlyPlan) }}
                <span class="fs-6 text-muted fw-normal">/ mes</span>
              </p>
            </div>

            <ul class="list-unstyled flex-grow-1 mb-4 d-flex flex-column gap-2">
              <li
                v-for="(feat, idx) in monthlyPlan.features"
                :key="idx"
                class="d-flex align-items-start gap-2 small"
              >
                <span class="text-success fw-bold flex-shrink-0" aria-hidden="true">✓</span>
                {{ feat }}
              </li>
            </ul>

            <!-- Active plan badge (PRO users) -->
            <div v-if="isActivePlan(monthlyPlan.id)" class="mb-2">
              <span class="badge bg-success w-100 py-2 fs-6">
                Plan activo ✓
              </span>
            </div>

            <button
              v-else
              type="button"
              class="btn btn-outline-primary w-100 mt-auto fw-semibold"
              aria-label="`Actualizar al plan ${monthlyPlan.name}`"
              @click="emit('select-plan', monthlyPlan.id)"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
      </div>

      <!-- ── PRO Annual ─────────────────────────────────────── -->
      <div v-if="annualPlan" class="col-12 col-md-4">
        <div class="card border-2 border-primary shadow h-100 pricing-table__card pricing-table__card--featured position-relative">
          <!-- "Más popular" ribbon -->
          <div
            v-if="annualPlan.is_popular"
            class="pricing-table__popular-badge position-absolute badge bg-primary"
            aria-label="Plan más popular"
          >
            Más popular
          </div>

          <!-- Savings badge -->
          <div
            v-if="annualSavingsPercent"
            class="pricing-table__savings-badge position-absolute badge bg-success"
            :aria-label="`Ahorra ${annualSavingsPercent}% respecto al plan mensual`"
          >
            Ahorra {{ annualSavingsPercent }}%
          </div>

          <div class="card-body p-4 d-flex flex-column">
            <div class="mb-3">
              <span class="badge bg-warning text-dark mb-2">
                PRO
              </span>
              <h3 class="h5 fw-bold mb-1">{{ annualPlan.name }}</h3>
              <p class="display-6 fw-bold mb-0">
                {{ formatPrice(annualPlan) }}
                <span class="fs-6 text-muted fw-normal">/ año</span>
              </p>
            </div>

            <ul class="list-unstyled flex-grow-1 mb-4 d-flex flex-column gap-2">
              <li
                v-for="(feat, idx) in annualPlan.features"
                :key="idx"
                class="d-flex align-items-start gap-2 small"
              >
                <span class="text-success fw-bold flex-shrink-0" aria-hidden="true">✓</span>
                {{ feat }}
              </li>
            </ul>

            <!-- Active plan badge (PRO users) -->
            <div v-if="isActivePlan(annualPlan.id)" class="mb-2">
              <span class="badge bg-success w-100 py-2 fs-6">
                Plan activo ✓
              </span>
            </div>

            <button
              v-else
              type="button"
              class="btn btn-primary w-100 mt-auto fw-semibold"
              aria-label="`Actualizar al plan ${annualPlan.name}`"
              @click="emit('select-plan', annualPlan.id)"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
      </div>

      <!-- Fallback: API returned no plans (non-loading state) -->
      <div
        v-if="!proStore.isLoading && !monthlyPlan && !annualPlan"
        class="col-12 text-center py-5 text-muted"
      >
        <span class="fs-1" aria-hidden="true">📋</span>
        <p class="mt-3 mb-0">
          Los planes PRO no están disponibles en este momento. Intenta de nuevo más tarde.
        </p>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.pricing-table {
  &__card {
    border-radius: var(--bs-border-radius-xl);
    transition: transform 0.2s ease, box-shadow 0.2s ease;

    &:hover {
      transform: translateY(-4px);
      box-shadow: var(--bs-box-shadow-lg) !important;
    }

    &--featured {
      // Slightly scale up the featured (annual) card to give it visual prominence
      @media (min-width: 768px) {
        transform: scale(1.02);

        &:hover {
          transform: scale(1.02) translateY(-4px);
        }
      }
    }
  }

  &__popular-badge {
    top: -0.75rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    padding: 0.3em 0.75em;
    border-radius: var(--bs-border-radius-pill);
  }

  &__savings-badge {
    top: -0.75rem;
    right: 1.25rem;
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    padding: 0.3em 0.6em;
    border-radius: var(--bs-border-radius-pill);
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

.pricing-skeleton {
  &__title {
    height: 0.85rem;
    width: 45%;
  }

  &__price {
    height: 2.5rem;
    width: 65%;
  }

  &__line {
    height: 0.75rem;
    width: 100%;

    &:nth-child(odd) { width: 85%; }
  }

  &__btn {
    height: 2.5rem;
    width: 100%;
  }
}
</style>
