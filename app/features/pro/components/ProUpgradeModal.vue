<script setup lang="ts">
// ProUpgradeModal — Bootstrap 5 modal for upgrading to PRO.
// Controlled externally via v-model (modelValue: boolean).
//
// Lifecycle:
//  - When modelValue flips to true → fetch plans if not loaded → show modal
//  - When modelValue flips to false → hide modal
//  - Bootstrap modal "hidden.bs.modal" event → emit update:modelValue(false)
//    so the parent v-model stays in sync when user closes via Esc / backdrop.
//
// All Bootstrap.Modal API calls are guarded by import.meta.client to prevent
// SSR errors. The modal DOM element is a standard Bootstrap 5 structure —
// no Teleport, modal JS handles focus trapping natively.

import type { ProPlan } from '../types'

const props = defineProps<{
  /** Controls visibility — bind with v-model. */
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const { fetchPlans, createCheckoutSession, error, proStore } = usePro()

// ── Plan selection ────────────────────────────────────────
const selectedPlanId = ref<string | null>(null)

const monthlyPlan = computed(() => proStore.getMonthlyPlan)
const annualPlan = computed(() => proStore.getAnnualPlan)

/**
 * Percentage discount of annual vs monthly (based on total annual cost vs 12 * monthly).
 * Shown as "Ahorra X%" badge on the annual plan card.
 */
const annualSavingsPercent = computed<number | null>(() => {
  const m = monthlyPlan.value
  const a = annualPlan.value
  if (!m || !a || m.price <= 0) return null
  const annualEquivalent = m.price * 12
  if (annualEquivalent <= a.price) return null
  return Math.round(((annualEquivalent - a.price) / annualEquivalent) * 100)
})

// Pre-select the popular plan (annual) or monthly as fallback
watch(
  () => proStore.plans,
  (plans) => {
    if (plans.length > 0 && !selectedPlanId.value) {
      const popular = plans.find(p => p.is_popular)
      selectedPlanId.value = popular?.id ?? plans[0]?.id ?? null
    }
  },
  { immediate: true },
)

// ── Bootstrap modal instance ──────────────────────────────
// Typed as unknown to avoid importing bootstrap types at module scope.
// The instance is created lazily on first open.
let modalInstance: unknown = null
const modalRef = useTemplateRef<HTMLElement>('modalEl')

async function openModal(): Promise<void> {
  // Fetch plans if the store has none yet
  if (!proStore.hasPlans) {
    await fetchPlans()
  }
  if (!import.meta.client) return
  // Lazy-import Bootstrap Modal — avoids including Bootstrap JS in SSR bundle.
  const { Modal } = await import('bootstrap')
  if (!modalRef.value) return
  if (!modalInstance) {
    modalInstance = new Modal(modalRef.value, { keyboard: true })
    // Keep v-model in sync when Bootstrap closes the modal (Esc / backdrop click)
    modalRef.value.addEventListener('hidden.bs.modal', () => {
      emit('update:modelValue', false)
    })
  }
  ;(modalInstance as { show(): void }).show()
}

function closeModal(): void {
  if (!import.meta.client || !modalInstance) return
  ;(modalInstance as { hide(): void }).hide()
}

// ── Watch modelValue to drive show/hide ───────────────────
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      openModal()
    }
    else {
      closeModal()
    }
  },
)

// ── Checkout ──────────────────────────────────────────────
const isCheckingOut = ref(false)
const checkoutError = ref<string | null>(null)

async function handleCheckout(): Promise<void> {
  if (!selectedPlanId.value || isCheckingOut.value) return
  isCheckingOut.value = true
  checkoutError.value = null
  error.value = null

  const session = await createCheckoutSession(selectedPlanId.value)
  isCheckingOut.value = false

  if (!session) {
    // createCheckoutSession sets error.value on failure
    checkoutError.value = error.value ?? 'No se pudo iniciar el proceso de pago.'
  }
  // On success, navigateTo inside createCheckoutSession has already redirected
  // the user to Stripe — no further action needed here.
}

function formatPrice(plan: ProPlan): string {
  // Use Intl.NumberFormat for locale-aware number formatting.
  // Currency label appended manually since the backend provides the currency
  // code and we want to avoid locale-currency mismatch.
  try {
    const formatted = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: plan.currency,
      maximumFractionDigits: 0,
    }).format(plan.price)
    return formatted
  }
  catch {
    return `${plan.currency} ${plan.price}`
  }
}
</script>

<template>
  <!-- Bootstrap 5 modal structure -->
  <div
    ref="modalEl"
    class="modal fade"
    tabindex="-1"
    role="dialog"
    aria-modal="true"
    aria-labelledby="pro-upgrade-modal-title"
  >
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content border-0 shadow-lg">
        <!-- Header -->
        <div class="modal-header border-0 pb-0">
          <h2
            id="pro-upgrade-modal-title"
            class="modal-title h5 fw-bold d-flex align-items-center gap-2"
          >
            <span class="badge bg-warning text-dark px-2 py-1" aria-hidden="true">PRO</span>
            Elige tu plan Mopetoo PRO
          </h2>
          <button
            type="button"
            class="btn-close"
            aria-label="Cerrar modal"
            @click="emit('update:modelValue', false)"
          />
        </div>

        <!-- Body -->
        <div class="modal-body pt-3 pb-2">
          <!-- Loading plans skeleton -->
          <div
            v-if="proStore.isLoading && !proStore.hasPlans"
            class="row g-3"
            aria-busy="true"
            aria-label="Cargando planes"
          >
            <div v-for="n in 2" :key="n" class="col-12 col-sm-6">
              <div class="card border-2 h-100 p-3" aria-hidden="true">
                <div class="skeleton-pulse rounded mb-2 pro-modal-skeleton__title" />
                <div class="skeleton-pulse rounded mb-3 pro-modal-skeleton__price" />
                <div
                  v-for="i in 4"
                  :key="i"
                  class="skeleton-pulse rounded mb-2 pro-modal-skeleton__line"
                />
              </div>
            </div>
          </div>

          <!-- Plan cards -->
          <div
            v-else-if="proStore.hasPlans"
            class="row g-3"
            role="group"
            aria-label="Selecciona un plan PRO"
          >
            <!-- Monthly plan -->
            <div v-if="monthlyPlan" class="col-12 col-sm-6">
              <button
                type="button"
                :class="[
                  'card border-2 h-100 w-100 text-start pro-modal__plan-card',
                  selectedPlanId === monthlyPlan.id
                    ? 'border-primary pro-modal__plan-card--selected'
                    : 'border-secondary-subtle',
                ]"
                :aria-pressed="selectedPlanId === monthlyPlan.id"
                :aria-label="`Seleccionar plan ${monthlyPlan.name}`"
                @click="selectedPlanId = monthlyPlan.id"
              >
                <div class="card-body p-4">
                  <h3 class="h6 fw-bold text-muted text-uppercase mb-1" style="letter-spacing: 0.06em;">
                    {{ monthlyPlan.name }}
                  </h3>
                  <p class="h3 fw-bold text-dark mb-1">
                    {{ formatPrice(monthlyPlan) }}
                    <span class="fs-6 text-muted fw-normal">/ mes</span>
                  </p>
                  <ul class="list-unstyled mt-3 mb-0 d-flex flex-column gap-1">
                    <li
                      v-for="(feat, idx) in monthlyPlan.features"
                      :key="idx"
                      class="d-flex align-items-start gap-2 small"
                    >
                      <span class="text-success fw-bold flex-shrink-0" aria-hidden="true">✓</span>
                      {{ feat }}
                    </li>
                  </ul>
                </div>
              </button>
            </div>

            <!-- Annual plan -->
            <div v-if="annualPlan" class="col-12 col-sm-6">
              <button
                type="button"
                :class="[
                  'card border-2 h-100 w-100 text-start pro-modal__plan-card position-relative',
                  selectedPlanId === annualPlan.id
                    ? 'border-primary pro-modal__plan-card--selected'
                    : 'border-secondary-subtle',
                ]"
                :aria-pressed="selectedPlanId === annualPlan.id"
                :aria-label="`Seleccionar plan ${annualPlan.name}`"
                @click="selectedPlanId = annualPlan.id"
              >
                <!-- "Más popular" badge -->
                <div
                  v-if="annualPlan.is_popular"
                  class="pro-modal__popular-badge position-absolute badge bg-primary"
                  aria-label="Plan más popular"
                >
                  Más popular
                </div>

                <!-- "Ahorra X%" badge -->
                <div
                  v-if="annualSavingsPercent"
                  class="pro-modal__savings-badge position-absolute badge bg-success"
                  aria-label="`Ahorra ${annualSavingsPercent}% respecto al plan mensual`"
                >
                  Ahorra {{ annualSavingsPercent }}%
                </div>

                <div class="card-body p-4">
                  <h3 class="h6 fw-bold text-muted text-uppercase mb-1" style="letter-spacing: 0.06em;">
                    {{ annualPlan.name }}
                  </h3>
                  <p class="h3 fw-bold text-dark mb-1">
                    {{ formatPrice(annualPlan) }}
                    <span class="fs-6 text-muted fw-normal">/ año</span>
                  </p>
                  <ul class="list-unstyled mt-3 mb-0 d-flex flex-column gap-1">
                    <li
                      v-for="(feat, idx) in annualPlan.features"
                      :key="idx"
                      class="d-flex align-items-start gap-2 small"
                    >
                      <span class="text-success fw-bold flex-shrink-0" aria-hidden="true">✓</span>
                      {{ feat }}
                    </li>
                  </ul>
                </div>
              </button>
            </div>
          </div>

          <!-- No plans (API error or empty catalogue) -->
          <div
            v-else-if="!proStore.isLoading"
            class="text-center py-4 text-muted"
          >
            <span class="fs-2" aria-hidden="true">📋</span>
            <p class="mt-2 mb-0 small">No se pudieron cargar los planes. Intenta de nuevo.</p>
          </div>

          <!-- Checkout error -->
          <div
            v-if="checkoutError"
            class="alert alert-danger d-flex align-items-center gap-2 mt-3 mb-0"
            role="alert"
          >
            <span aria-hidden="true">⚠</span>
            {{ checkoutError }}
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer border-0 pt-0">
          <button
            type="button"
            class="btn btn-outline-secondary"
            @click="emit('update:modelValue', false)"
          >
            Cancelar
          </button>
          <button
            type="button"
            class="btn btn-primary fw-semibold px-4"
            :disabled="!selectedPlanId || isCheckingOut || proStore.isLoading"
            :aria-busy="isCheckingOut"
            aria-label="Continuar al proceso de pago"
            @click="handleCheckout"
          >
            <span
              v-if="isCheckingOut"
              class="spinner-border spinner-border-sm me-2"
              role="status"
              aria-hidden="true"
            />
            {{ isCheckingOut ? 'Procesando...' : 'Continuar al pago' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.pro-modal {
  &__plan-card {
    cursor: pointer;
    border-radius: var(--bs-border-radius-lg);
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
    background: transparent;

    // Override default button styles — card appearance only
    padding: 0;
    appearance: none;

    &:hover {
      border-color: var(--bs-primary) !important;
      box-shadow: 0 0 0 0.15rem rgba(var(--bs-primary-rgb), 0.15);
    }

    &--selected {
      box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
    }
  }

  // Badge anchored to top-right of card
  &__popular-badge {
    top: -0.65rem;
    left: 50%;
    transform: translateX(-50%);
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    padding: 0.3em 0.6em;
  }

  &__savings-badge {
    top: -0.65rem;
    right: 1rem;
    font-size: 0.7rem;
    letter-spacing: 0.04em;
    padding: 0.3em 0.6em;
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

.pro-modal-skeleton {
  &__title {
    height: 0.85rem;
    width: 55%;
  }

  &__price {
    height: 2rem;
    width: 70%;
  }

  &__line {
    height: 0.75rem;
    width: 100%;

    &:last-child { width: 80%; }
  }
}
</style>
