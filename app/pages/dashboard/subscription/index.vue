<script setup lang="ts">
// Subscription management page — protected (auth middleware).
// Responsibilities:
//  1. Read ?checkout query param and show PaymentCheckout status display.
//  2. If checkout=success, re-fetch subscription to sync store.
//  3. Show current subscription details with next billing date.
//  4. "Cancelar suscripción" with 2-step inline confirm (no modal).
//  5. "Actualizar plan" → opens ProUpgradeModal.
//  6. If no subscription: show PricingTable directly.

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Mi Suscripción — Mopetoo Dashboard',
  description: 'Gestiona tu suscripción PRO de Mopetoo: consulta tu plan activo, fecha de renovación y opciones de cancelación.',
})

const route = useRoute()
const { fetchSubscription, cancelSubscription, error, proStore } = usePro()

// ── Checkout redirect status ──────────────────────────────
type CheckoutStatus = 'success' | 'canceled' | 'pending' | null

const checkoutStatus = ref<CheckoutStatus>(null)

// ── Modal ─────────────────────────────────────────────────
const showUpgradeModal = ref(false)

// ── Cancel confirmation ───────────────────────────────────
const showCancelConfirm = ref(false)
const isCanceling = ref(false)
const cancelError = ref<string | null>(null)
const cancelSuccess = ref(false)

// ── Lifecycle ─────────────────────────────────────────────
onMounted(async () => {
  const checkout = route.query.checkout as string | undefined

  if (checkout === 'success') {
    checkoutStatus.value = 'success'
    // Re-fetch subscription so the store reflects the newly active plan
    await fetchSubscription()
  }
  else if (checkout === 'canceled') {
    checkoutStatus.value = 'canceled'
    await fetchSubscription()
  }
  else {
    await fetchSubscription()
  }
})

// ── Subscription display helpers ──────────────────────────

const subscription = computed(() => proStore.subscription)

const STATUS_LABEL: Record<string, string> = {
  active: 'Activa',
  canceled: 'Cancelada',
  past_due: 'Pago pendiente',
  inactive: 'Inactiva',
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-success',
  canceled: 'bg-secondary',
  past_due: 'bg-danger',
  inactive: 'bg-secondary',
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(iso))
  }
  catch {
    return iso
  }
}

// ── Cancel subscription ───────────────────────────────────

async function handleCancelSubscription(): Promise<void> {
  if (isCanceling.value) return
  isCanceling.value = true
  cancelError.value = null

  const ok = await cancelSubscription()
  isCanceling.value = false

  if (ok) {
    cancelSuccess.value = true
    showCancelConfirm.value = false
  }
  else {
    cancelError.value = error.value ?? 'No se pudo cancelar la suscripción. Intenta de nuevo.'
  }
}
</script>

<template>
  <div class="container py-5">
    <!-- Page header -->
    <div class="mb-5">
      <h1 class="h3 fw-bold mb-1">Mi Suscripción</h1>
      <p class="text-muted mb-0">Gestiona tu plan PRO de Mopetoo</p>
    </div>

    <!-- ── Checkout redirect banner ─────────────────────────── -->
    <div v-if="checkoutStatus" class="mb-4">
      <PaymentCheckout :status="checkoutStatus" />
    </div>

    <!-- ── API error ─────────────────────────────────────────── -->
    <div
      v-if="error && !subscription"
      class="alert alert-danger d-flex align-items-center gap-2 mb-4"
      role="alert"
    >
      <span aria-hidden="true">⚠</span>
      {{ error }}
    </div>

    <!-- ── Loading state ─────────────────────────────────────── -->
    <div
      v-if="proStore.isLoading && !subscription"
      class="text-center py-5 text-muted"
      aria-busy="true"
      aria-label="Cargando suscripción"
    >
      <span class="spinner-border" role="status" aria-hidden="true" />
      <p class="mt-3 mb-0 small">Cargando información de suscripción...</p>
    </div>

    <!-- ── Active subscription ───────────────────────────────── -->
    <template v-else-if="subscription">
      <!-- Cancel success notice -->
      <div
        v-if="cancelSuccess"
        class="alert alert-info d-flex align-items-center gap-2 mb-4"
        role="status"
        aria-live="polite"
      >
        <span aria-hidden="true">ℹ</span>
        <div>
          <strong>Cancelación programada.</strong>
          Tu suscripción seguirá activa hasta el final del período actual.
        </div>
      </div>

      <!-- Subscription details card -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
            <div>
              <h2 class="h5 fw-bold mb-1">
                {{ subscription.plan?.name ?? 'Plan PRO' }}
              </h2>
              <span
                :class="['badge', STATUS_BADGE[subscription.status] ?? 'bg-secondary']"
                :aria-label="`Estado de suscripción: ${STATUS_LABEL[subscription.status] ?? subscription.status}`"
              >
                {{ STATUS_LABEL[subscription.status] ?? subscription.status }}
              </span>
            </div>

            <!-- Upgrade plan button -->
            <button
              type="button"
              class="btn btn-outline-primary btn-sm"
              aria-label="Cambiar plan PRO"
              @click="showUpgradeModal = true"
            >
              Actualizar plan
            </button>
          </div>

          <!-- Subscription detail rows -->
          <dl class="subscription-details mb-0">
            <div class="subscription-details__row">
              <dt class="subscription-details__label text-muted small">Inicio del período</dt>
              <dd class="subscription-details__value fw-semibold mb-0">
                {{ formatDate(subscription.current_period_start) }}
              </dd>
            </div>
            <div class="subscription-details__row border-top pt-3">
              <dt class="subscription-details__label text-muted small">
                {{ subscription.cancel_at_period_end ? 'Acceso hasta' : 'Próxima renovación' }}
              </dt>
              <dd class="subscription-details__value fw-semibold mb-0">
                {{ formatDate(subscription.current_period_end) }}
              </dd>
            </div>
          </dl>

          <!-- cancel_at_period_end notice -->
          <div
            v-if="subscription.cancel_at_period_end"
            class="alert alert-warning d-flex align-items-center gap-2 mt-4 mb-0"
            role="note"
          >
            <span aria-hidden="true">⚠</span>
            <div class="small">
              Tu suscripción está programada para cancelarse al final del período.
              Seguirás teniendo acceso PRO hasta el
              <strong>{{ formatDate(subscription.current_period_end) }}</strong>.
            </div>
          </div>
        </div>
      </div>

      <!-- ── Cancel subscription ─────────────────────────────── -->
      <div
        v-if="!subscription.cancel_at_period_end && subscription.status === 'active'"
        class="card border-0 shadow-sm"
      >
        <div class="card-body p-4">
          <h3 class="h6 fw-bold text-danger mb-1">Cancelar suscripción</h3>
          <p class="text-muted small mb-3">
            Tu suscripción seguirá activa hasta el final del período de facturación actual.
            No se realizarán cargos adicionales.
          </p>

          <!-- Cancel error -->
          <div
            v-if="cancelError"
            class="alert alert-danger d-flex align-items-center gap-2 mb-3"
            role="alert"
          >
            <span aria-hidden="true">⚠</span>
            {{ cancelError }}
          </div>

          <!-- Step 1: initial button -->
          <template v-if="!showCancelConfirm">
            <button
              type="button"
              class="btn btn-outline-danger btn-sm"
              aria-label="Iniciar proceso de cancelación de suscripción"
              @click="showCancelConfirm = true"
            >
              Cancelar suscripción
            </button>
          </template>

          <!-- Step 2: inline confirmation -->
          <template v-else>
            <div
              class="subscription-cancel-confirm p-3 rounded border border-danger-subtle bg-danger-subtle"
              role="alert"
            >
              <p class="fw-semibold mb-2 text-danger-emphasis">
                ¿Confirmas que deseas cancelar tu suscripción?
              </p>
              <p class="text-muted small mb-3">
                Esta acción no se puede deshacer. Tu plan seguirá activo hasta el final del período.
              </p>
              <div class="d-flex gap-2">
                <button
                  type="button"
                  class="btn btn-danger btn-sm fw-semibold"
                  :disabled="isCanceling"
                  :aria-busy="isCanceling"
                  aria-label="Confirmar cancelación de suscripción"
                  @click="handleCancelSubscription"
                >
                  <span
                    v-if="isCanceling"
                    class="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  />
                  {{ isCanceling ? 'Cancelando...' : 'Sí, cancelar' }}
                </button>
                <button
                  type="button"
                  class="btn btn-outline-secondary btn-sm"
                  :disabled="isCanceling"
                  @click="showCancelConfirm = false"
                >
                  Volver
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </template>

    <!-- ── No subscription — show pricing table ──────────────── -->
    <template v-else-if="!proStore.isLoading">
      <div class="alert alert-info d-flex align-items-center gap-3 mb-5" role="note">
        <span class="fs-3 flex-shrink-0" aria-hidden="true">⭐</span>
        <div>
          <strong>Aún no tienes un plan PRO activo.</strong>
          <p class="mb-0 small text-muted">
            Elige un plan a continuación para desbloquear todas las funciones premium de Mopetoo.
          </p>
        </div>
      </div>

      <PricingTable @select-plan="showUpgradeModal = true" />
    </template>

    <!-- ── Upgrade modal ─────────────────────────────────────── -->
    <ProUpgradeModal v-model="showUpgradeModal" />
  </div>
</template>

<style scoped lang="scss">
.subscription-details {
  &__row {
    display: flex;
    align-items: baseline;
    gap: 0.75rem;
    padding-bottom: 0.75rem;
    margin-bottom: 0.75rem;
  }

  &__label {
    min-width: 160px;
    flex-shrink: 0;
    font-size: 0.8125rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-weight: 600;
  }

  &__value {
    flex: 1;
  }
}

.subscription-cancel-confirm {
  border-radius: var(--bs-border-radius-lg);
}
</style>
