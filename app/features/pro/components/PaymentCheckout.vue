<script setup lang="ts">
// PaymentCheckout — pure display component for post-checkout status.
// Used inside /dashboard/subscription to render the result of a Stripe
// Checkout redirect. Contains no logic — status drives the UI.
//
// Statuses:
//  success  — subscription activated, show green confirmation
//  canceled — user abandoned checkout, show neutral notice
//  pending  — awaiting webhook confirmation, show spinner

defineProps<{
  status: 'success' | 'canceled' | 'pending'
}>()
</script>

<template>
  <!-- Success state -->
  <div
    v-if="status === 'success'"
    class="alert alert-success d-flex align-items-center gap-3"
    role="status"
    aria-live="polite"
  >
    <span class="fs-3 flex-shrink-0" aria-hidden="true">🎉</span>
    <div>
      <strong class="d-block">¡Suscripción activada!</strong>
      Bienvenido a Mopetoo PRO. Ya tienes acceso a todas las funciones premium.
    </div>
  </div>

  <!-- Canceled state -->
  <div
    v-else-if="status === 'canceled'"
    class="alert alert-warning d-flex align-items-center gap-3"
    role="note"
    aria-live="polite"
  >
    <span class="fs-3 flex-shrink-0" aria-hidden="true">↩</span>
    <div>
      <strong class="d-block">El pago fue cancelado.</strong>
      Puedes intentarlo nuevamente cuando quieras. Tus datos no han sido modificados.
    </div>
  </div>

  <!-- Pending state -->
  <div
    v-else-if="status === 'pending'"
    class="d-flex align-items-center gap-3 text-muted py-2"
    role="status"
    aria-live="polite"
    aria-label="Verificando suscripción"
  >
    <span
      class="spinner-border spinner-border-sm flex-shrink-0"
      role="status"
      aria-hidden="true"
    />
    Verificando tu suscripción...
  </div>
</template>
