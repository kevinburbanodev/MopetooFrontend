<script setup lang="ts">
// Subscription management page — protected (auth middleware).
// Responsibilities:
//  1. Read ?checkout query param and show PaymentCheckout status display.
//  2. If checkout=success, re-fetch subscription to sync store.
//  3. Show current subscription details (plan, expiry, days remaining).
//  4. "Actualizar plan" → opens ProUpgradeModal.
//  5. If no subscription: show PricingTable directly.
//
// Note: no cancel endpoint exists in the backend — cancel section removed.

import { PRO_PLANS } from '~/features/pro/types'

definePageMeta({
  middleware: 'auth',
})

useSeoMeta({
  title: 'Mi Suscripción — Mopetoo Dashboard',
  description: 'Gestiona tu suscripción PRO de Mopetoo: consulta tu plan activo, fecha de renovación y opciones.',
})

const route = useRoute()
const { fetchSubscription, error, proStore } = usePro()

// ── Checkout redirect status ──────────────────────────────
type CheckoutStatus = 'success' | 'canceled' | 'pending' | null

const checkoutStatus = ref<CheckoutStatus>(null)

// ── Modal ─────────────────────────────────────────────────
const showUpgradeModal = ref(false)

// ── Lifecycle ─────────────────────────────────────────────
onMounted(async () => {
  const checkout = route.query.checkout as string | undefined

  if (checkout === 'success') {
    checkoutStatus.value = 'success'
  }
  else if (checkout === 'canceled') {
    checkoutStatus.value = 'canceled'
  }

  await fetchSubscription()
})

// ── Subscription display helpers ──────────────────────────

const subscription = computed(() => proStore.subscription)

/** Resolve the plan display name from the PRO_PLANS constant. */
const planDisplayName = computed(() => {
  if (!subscription.value) return null
  const plan = PRO_PLANS.find(p => p.value === subscription.value!.subscription_plan)
  return plan?.name ?? subscription.value.subscription_plan
})

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
    <template v-else-if="subscription && subscription.is_pro">
      <!-- Subscription details card -->
      <div class="card border-0 shadow-sm mb-4">
        <div class="card-body p-4">
          <div class="d-flex flex-wrap align-items-start justify-content-between gap-3 mb-4">
            <div>
              <h2 class="h5 fw-bold mb-1">
                {{ planDisplayName ?? 'Plan PRO' }}
              </h2>
              <span
                :class="['badge', subscription.is_active ? 'bg-success' : 'bg-secondary']"
                :aria-label="`Estado de suscripción: ${subscription.is_active ? 'Activa' : 'Inactiva'}`"
              >
                {{ subscription.is_active ? 'Activa' : 'Inactiva' }}
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
            <div v-if="subscription.subscription_expires_at" class="subscription-details__row">
              <dt class="subscription-details__label text-muted small">Fecha de vencimiento</dt>
              <dd class="subscription-details__value fw-semibold mb-0">
                {{ formatDate(subscription.subscription_expires_at) }}
              </dd>
            </div>
            <div class="subscription-details__row" :class="{ 'border-top pt-3': subscription.subscription_expires_at }">
              <dt class="subscription-details__label text-muted small">Días restantes</dt>
              <dd class="subscription-details__value fw-semibold mb-0">
                {{ subscription.days_remaining }} {{ subscription.days_remaining === 1 ? 'día' : 'días' }}
              </dd>
            </div>
          </dl>
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
</style>
