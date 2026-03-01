<script setup lang="ts">
// PricingTable — full 3-column pricing comparison table.
// Columns: Free (hardcoded) / PRO Mensual / PRO Anual (from PRO_PLANS constant).
// Plans are always available — no fetch, no loading skeleton.
// Emits `select-plan` when a PRO CTA is clicked — the parent handles
// opening the ProUpgradeModal.

import { PRO_PLANS, type ProPlanDef, type PlanValue } from '../types'

const emit = defineEmits<{
  /** Emitted when the user clicks "Actualizar ahora" on a PRO plan. */
  'select-plan': [planValue: PlanValue]
}>()

const { proStore } = usePro()
const authStore = useAuthStore()

// Hardcoded free tier features — not managed via API
const FREE_FEATURES = [
  'Hasta 3 mascotas',
  'Recordatorios básicos',
  'Historial médico',
  'Adopciones',
] as const

const monthlyPlan = computed(() => PRO_PLANS.find(p => p.interval === 'monthly'))
const annualPlan = computed(() => PRO_PLANS.find(p => p.interval === 'annual'))

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

function formatPrice(plan: ProPlanDef): string {
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
function isActivePlan(planValue: PlanValue): boolean {
  return (
    authStore.isPro
    && proStore.isSubscribed
    && proStore.subscription?.subscription_plan === planValue
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

    <!-- Pricing columns (always available — plans are hardcoded) -->
    <div class="row g-4 justify-content-center align-items-stretch">
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
            <div v-if="isActivePlan(monthlyPlan.value)" class="mb-2">
              <span class="badge bg-success w-100 py-2 fs-6">
                Plan activo ✓
              </span>
            </div>

            <button
              v-else
              type="button"
              class="btn btn-outline-primary w-100 mt-auto fw-semibold"
              aria-label="`Actualizar al plan ${monthlyPlan.name}`"
              @click="emit('select-plan', monthlyPlan.value)"
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
            <div v-if="isActivePlan(annualPlan.value)" class="mb-2">
              <span class="badge bg-success w-100 py-2 fs-6">
                Plan activo ✓
              </span>
            </div>

            <button
              v-else
              type="button"
              class="btn btn-primary w-100 mt-auto fw-semibold"
              aria-label="`Actualizar al plan ${annualPlan.name}`"
              @click="emit('select-plan', annualPlan.value)"
            >
              Actualizar ahora
            </button>
          </div>
        </div>
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
</style>
